import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsServiceController } from './analytics-service.controller';
import { AnalyticsService } from './analytics-service.service';
import {
  DailyActivity,
  DailyActivitySchema,
} from './schemas/daily-activity.schema';
import {
  MonthlyActivity,
  MonthlyActivitySchema,
} from './schemas/monthly-activity.schema';
import { Session, SessionSchema } from './schemas/session.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>(
          'MONGODB_URI',
          'mongodb://localhost/user_event_stream',
        ),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: DailyActivity.name, schema: DailyActivitySchema },
      { name: MonthlyActivity.name, schema: MonthlyActivitySchema },
      { name: Session.name, schema: SessionSchema },
    ]),
  ],
  controllers: [AnalyticsServiceController],
  providers: [AnalyticsService],
})
export class AnalyticsServiceModule {}
