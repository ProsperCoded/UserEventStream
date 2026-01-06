import { Controller, Get } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { FraudDetectionService } from './fraud-detection-service.service';
import { UserEvent } from '@app/shared';

@Controller()
export class FraudDetectionServiceController {
  constructor(private readonly fraudService: FraudDetectionService) {}

  @EventPattern('user.events')
  async handleUserEvent(@Payload() message: any) {
    const event = message as UserEvent;
    // Prevent fraud loops: don't process our own emitted events (user.flagged/suspended) usually?
    // But producer-api emits user events.
    // We emit user.flagged/suspended.
    // If we process user.flagged, we might loop? No, our logic tracks PATTERNS.
    await this.fraudService.processEvent(event);
  }

  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
