import { Module } from '@nestjs/common';
import { ProducerApiController } from './producer-api.controller';
import { ProducerApiService } from './producer-api.service';

@Module({
  imports: [],
  controllers: [ProducerApiController],
  providers: [ProducerApiService],
})
export class ProducerApiModule {}
