import { Controller, Get } from '@nestjs/common';
import {
  EventPattern,
  Payload,
  Ctx,
  KafkaContext,
} from '@nestjs/microservices';
import { NotificationService } from './notification-service.service';
import { UserEvent } from '@app/shared';

@Controller()
export class NotificationServiceController {
  constructor(private readonly notificationService: NotificationService) {}

  @EventPattern('user.events')
  async handleUserEvent(@Payload() message: any, @Ctx() context: KafkaContext) {
    const event = message as UserEvent;
    // Idempotency check could be here or service.
    // context.getMessage().offset could be logged.
    await this.notificationService.processEvent(event);
  }

  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
