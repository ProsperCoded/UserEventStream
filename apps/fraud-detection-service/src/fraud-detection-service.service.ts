import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClientKafka } from '@nestjs/microservices';
import {
  FraudReport,
  FraudReportDocument,
} from './schemas/fraud-report.schema';
import { UserEvent, UserEventType } from '@app/shared';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);

  // In-memory sliding window: Map<UserId, Event[]>
  private eventWindows = new Map<string, UserEvent[]>();

  constructor(
    @InjectModel(FraudReport.name)
    private fraudModel: Model<FraudReportDocument>,
    @Inject('KAFKA_CLIENT') private kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  async processEvent(event: UserEvent) {
    const { aggregateId, eventType } = event;

    // Ignore events that are outcomes of fraud detection
    if (
      eventType === UserEventType.USER_FLAGGED ||
      eventType === UserEventType.USER_SUSPENDED
    ) {
      return;
    }

    // Update window
    const window = this.updateWindow(aggregateId, event);

    // Run rules
    let riskScore = 0;
    const distinctRules = new Set<string>();

    // Rule 1: Password change -> IP change -> Login (5 mins)
    if (this.checkPasswordIpLoginPattern(window)) {
      riskScore += 30;
      distinctRules.add('Pattern: PasswordReset->IpChange->Login');
    }

    // Rule 2: Brute Force (5 failures in 2 mins)
    if (this.checkBruteForce(window)) {
      riskScore += 40;
      distinctRules.add('Pattern: Brute Force Login');
    }

    // Rule 3: IP Hopping (3 IPs in 10 mins)
    if (this.checkIpHopping(window)) {
      riskScore += 20;
      distinctRules.add('Pattern: IP Hopping');
    }

    if (riskScore > 0) {
      this.logger.log(
        `Risk detected for user ${aggregateId}: Score ${riskScore}`,
      );
    }

    // Take Action
    await this.evaluateRisk(
      aggregateId,
      riskScore,
      Array.from(distinctRules),
      window,
    );
  }

  private updateWindow(userId: string, event: UserEvent): UserEvent[] {
    let events = this.eventWindows.get(userId) || [];
    events.push(event);

    // Prune events older than 10 minutes (max window needed for our rules)
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    events = events.filter(
      (e) => new Date(e.occurredAt).getTime() > tenMinutesAgo,
    );

    // Sort by time (should be ordered by Kafka mostly, but ensures correctness)
    events.sort(
      (a, b) =>
        new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
    );

    this.eventWindows.set(userId, events);
    return events;
  }

  private checkPasswordIpLoginPattern(events: UserEvent[]): boolean {
    // Look for sequence: Password Changed -> ... -> IP Changed -> ... -> Login
    // All within 5 minutes (last 5 mins already filtered mostly, but strict check)
    // Actually filtering is 10 mins.

    // Simple regex-like check on sorted events
    // Indexes:
    const pwdIdx = events.findIndex(
      (e) => e.eventType === UserEventType.USER_PASSWORD_CHANGED,
    );
    if (pwdIdx === -1) return false;

    // Check events AFTER password change
    const afterPwd = events.slice(pwdIdx + 1);
    const ipIdx = afterPwd.findIndex(
      (e) => e.eventType === UserEventType.USER_IP_CHANGED,
    );
    if (ipIdx === -1) return false;

    // Check events AFTER IP change
    const afterIp = afterPwd.slice(ipIdx + 1);
    const loginIdx = afterIp.findIndex(
      (e) => e.eventType === UserEventType.USER_LOGGED_IN,
    );

    if (loginIdx !== -1) {
      // Validate time difference
      const start = new Date(events[pwdIdx].occurredAt).getTime();
      const end = new Date(afterIp[loginIdx].occurredAt).getTime();
      return end - start <= 5 * 60 * 1000;
    }
    return false;
  }

  private checkBruteForce(events: UserEvent[]): boolean {
    // 5 failures in 2 mins
    const failures = events.filter(
      (e) => e.eventType === UserEventType.USER_LOGIN_FAILED,
    );
    if (failures.length < 5) return false;

    // Check strictly the last 5 failures are within 2 mins
    // Or any window of 5 failures within 2 mins?
    // ">=5 login failures within 2 minutes"

    // Let's check sliding 2-min window
    for (let i = 0; i <= failures.length - 5; i++) {
      const start = new Date(failures[i].occurredAt).getTime();
      const end = new Date(failures[i + 4].occurredAt).getTime();
      if (end - start <= 2 * 60 * 1000) return true;
    }
    return false;
  }

  private checkIpHopping(events: UserEvent[]): boolean {
    // Multiple IP changes within short duration (3 distinct IPs in 10 mins)
    // Filter 10 mins already done.
    const ips = new Set<string>();
    for (const e of events) {
      if (e.payload.ip) ips.add(e.payload.ip);
      // Also check previousIp if available in USER_IP_CHANGED
      if (e.payload.previousIp) ips.add(e.payload.previousIp);
    }
    return ips.size >= 3;
  }

  private async evaluateRisk(
    userId: string,
    score: number,
    reasons: string[],
    evidence: UserEvent[],
  ) {
    if (score < 30) return;

    let action = 'flagged';
    let emitType = UserEventType.USER_FLAGGED;

    if (score >= 70) {
      action = 'suspended';
      emitType = UserEventType.USER_SUSPENDED;
    }

    // Store Report
    await this.fraudModel.create({
      userId,
      riskScore: score,
      reason: reasons.join(', '),
      evidence,
      actionTaken: action,
      detectedAt: new Date(),
    });

    // Emit Event
    this.kafkaClient.emit('user.events', {
      key: userId,
      value: {
        eventId: uuidv4(),
        eventType: emitType,
        aggregateId: userId,
        occurredAt: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
        payload: {
          reason: reasons.join(', '),
          riskScore: score,
        },
      },
    });
  }
}
