import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { FraudDetectionServiceController } from './fraud-detection-service.controller';
import { FraudDetectionService } from './fraud-detection-service.service';
import { FraudReport, FraudReportSchema } from './schemas/fraud-report.schema';

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
      { name: FraudReport.name, schema: FraudReportSchema },
    ]),
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_CLIENT', // For emitting actions (suspend/flag)
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              brokers: configService
                .get<string>('KAFKA_BROKERS', 'localhost:9092')
                .split(','),
            },
            consumer: {
              groupId: 'fraud-detection-producer', // Identity for emitting
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [FraudDetectionServiceController],
  providers: [FraudDetectionService],
})
export class FraudDetectionServiceModule {}
