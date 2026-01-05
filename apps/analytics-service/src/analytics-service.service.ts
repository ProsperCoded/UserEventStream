import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DailyActivity,
  DailyActivityDocument,
} from './schemas/daily-activity.schema';
import {
  MonthlyActivity,
  MonthlyActivityDocument,
} from './schemas/monthly-activity.schema';
import { Session, SessionDocument } from './schemas/session.schema';
import { UserEvent, UserEventType } from '@app/shared';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel(DailyActivity.name)
    private dailyModel: Model<DailyActivityDocument>,
    @InjectModel(MonthlyActivity.name)
    private monthlyModel: Model<MonthlyActivityDocument>,
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
  ) {}

  async processEvent(event: UserEvent) {
    const { eventType, occurredAt, aggregateId, payload } = event;
    const date = occurredAt.split('T')[0]; // YYYY-MM-DD
    const month = date.substring(0, 7); // YYYY-MM

    this.logger.log(`Processing event: ${eventType} for user ${aggregateId}`);

    // Update DAU
    await this.updateActivity(this.dailyModel, { date }, aggregateId);

    // Update MAU
    await this.updateActivity(this.monthlyModel, { month }, aggregateId);

    // Handle Sessions
    if (eventType === UserEventType.USER_LOGGED_IN) {
      // payload.sessionId should be here if we tracked it, but we only have ip/userAgent.
      // We'll create a session ID or use one if provided. Given the previous code, we didn't generate explicit session IDs in Producer (just payload).
      // We can generate one or assume single session per user for simplicity?
      // Requirements: Session starts at logged_in, ends at logged_out.
      // We need to store session state.
      // For this playground, let's just log a new session.
      const sessionId = payload.sessionId || `${aggregateId}-${Date.now()}`;
      await this.sessionModel.create({
        sessionId,
        userId: aggregateId,
        startedAt: new Date(occurredAt),
        ipAddress: payload.ip,
        eventCount: 1,
      });
    } else if (eventType === UserEventType.USER_LOGGED_OUT) {
      // Find most recent active session?
      // Simple logic: find active session for user and close it.
      const session = await this.sessionModel
        .findOne({ userId: aggregateId, endedAt: { $exists: false } })
        .sort({ startedAt: -1 });
      if (session) {
        session.endedAt = new Date(occurredAt);
        session.eventCount += 1;
        await session.save();
      }
    } else {
      // Increment event count on active session
      const session = await this.sessionModel
        .findOne({ userId: aggregateId, endedAt: { $exists: false } })
        .sort({ startedAt: -1 });
      if (session) {
        session.eventCount += 1;
        await session.save();
      }
    }
  }

  private async updateActivity(model: Model<any>, filter: any, userId: string) {
    // Add userId to activeUserIds set if not present and increment count
    // Using $addToSet
    await model.updateOne(
      filter,
      {
        $addToSet: { activeUserIds: userId },
        $inc: { eventCount: 1 },
      },
      { upsert: true },
    );
  }
}
