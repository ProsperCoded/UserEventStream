import { Controller, Get } from '@nestjs/common';
import { ProducerApiService } from './producer-api.service';

@Controller()
export class ProducerApiController {
  constructor(private readonly producerApiService: ProducerApiService) {}

  @Get()
  getHello(): string {
    return this.producerApiService.getHello();
  }
}
