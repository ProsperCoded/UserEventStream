import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProducerApiController } from './producer-api.controller';
import { ProducerApiService } from './producer-api.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    UsersModule,
  ],
  controllers: [ProducerApiController],
  providers: [ProducerApiService],
})
export class ProducerApiModule {}
