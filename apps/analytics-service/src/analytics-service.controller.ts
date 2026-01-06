import { Controller, Get } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AnalyticsService } from './analytics-service.service';
import { UserEvent } from '@app/shared';

@Controller()
export class AnalyticsServiceController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @EventPattern('user.events')
  async handleUserEvent(@Payload() message: any) {
    // message is typically the value object if using standard serializer, or full object.
    // With NestJS Kafka, the payload behaves differently depending on deserializer.
    // Usually message.value is the payload.
    // But @Payload() decorator might extract it if configured.
    // Let's assume message is the event for now and we'll log to debug if needed.
    // Standard NestJS Kafka deserializer returns the message value.
    const event = message as UserEvent;
    await this.analyticsService.processEvent(event);
  }

  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
