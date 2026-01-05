import { Controller } from '@nestjs/common';
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
    // We should ignore events emitted by ourselves if they don't contribute to risk aggregation logic (e.g. user.flagged is an outcome).
    await this.fraudService.processEvent(event);
  }
}
