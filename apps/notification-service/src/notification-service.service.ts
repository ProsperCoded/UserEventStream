import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';
import { UserEvent, UserEventType } from '@app/shared';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private processedEvents = new Set<string>(); // Simple in-memory deduplication (LRU ideal)
  private loginFailures = new Map<
    string,
    { count: number; timestamp: number }
  >();

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  async processEvent(event: UserEvent) {
    if (this.processedEvents.has(event.eventId)) {
      this.logger.warn(`Duplicate event ignored: ${event.eventId}`);
      return;
    }
    this.processedEvents.add(event.eventId);

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
        await this.handleLoginFailure(aggregateId);
        break;
    }

    if (message) {
      await this.sendNotification(aggregateId, message);
    }
  }

  private async handleLoginFailure(userId: string) {
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
      await this.sendNotification(
        userId,
        `Warning: ${record.count} failed login attempts detected.`,
      );
    }
  }

  private async sendNotification(userId: string, message: string) {
    this.logger.log(`SENDING NOTIFICATION to [USER: ${userId}]: ${message}`);

    try {
      await this.notificationModel.create({
        userId,
        message,
        sentAt: new Date(),
      });
    } catch (e) {
      this.logger.error('Failed to save notification to DB', e);
    }
  }
}
