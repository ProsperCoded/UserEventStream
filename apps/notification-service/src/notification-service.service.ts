import { Injectable, Logger } from '@nestjs/common';
import { UserEvent, UserEventType } from '@app/shared';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private processedEvents = new Set<string>(); // Simple in-memory deduplication (LRU ideal)
  private loginFailures = new Map<
    string,
    { count: number; timestamp: number }
  >();
  private readonly LOG_FILE_PATH = path.join(
    process.cwd(),
    'notifications.log',
  );

  async processEvent(event: UserEvent) {
    if (this.processedEvents.has(event.eventId)) {
      this.logger.warn(`Duplicate event ignored: ${event.eventId}`);
      return;
    }
    this.processedEvents.add(event.eventId);
    // Prune set to avoid memory leak? For demo, okay.

    const { eventType, payload, aggregateId } = event;
    let message = '';

    switch (eventType) {
      case UserEventType.USER_CREATED:
        message = `Welcome to our platform, ${payload.email}!`;
        break;
      case UserEventType.USER_PASSWORD_CHANGED:
        message = `Security Alert: User ${aggregateId} password changed.`;
        break;
      case UserEventType.USER_IP_CHANGED:
        message = `Security Alert: User ${aggregateId} logged in from new IP ${payload.ip}.`;
        break;
      case UserEventType.USER_LOGIN_FAILED:
        this.handleLoginFailure(aggregateId);
        break;
    }

    if (message) {
      this.sendNotification(aggregateId, message);
    }
  }

  private handleLoginFailure(userId: string) {
    const now = Date.now();
    const record = this.loginFailures.get(userId) || {
      count: 0,
      timestamp: now,
    };

    // Reset if older than 5 minutes
    if (now - record.timestamp > 300000) {
      record.count = 0;
      record.timestamp = now;
    }

    record.count++;
    this.loginFailures.set(userId, record);

    if (record.count >= 3) {
      // Threshold
      this.sendNotification(
        userId,
        `Warning: ${record.count} failed login attempts detected.`,
      );
      // Reset or keep alerting?
    }
  }

  private sendNotification(userId: string, message: string) {
    const logEntry = `[${new Date().toISOString()}] [USER:${userId}] ${message}\n`;
    this.logger.log(`SENDING NOTIFICATION to [USER: ${userId}]: ${message}`);

    // Append to log file
    try {
      fs.appendFileSync(this.LOG_FILE_PATH, logEntry);
    } catch (e) {
      this.logger.error('Failed to write to notification log', e);
    }
  }
}
