import { Transport } from '@nestjs/microservices';

export const KAFKA_TOPIC_USER_EVENTS = 'user.events';
export const KAFKA_TOPIC_NOTIFICATIONS_DLQ = 'notifications.dlq';

export const KAFKA_CLIENT_ID = 'user-event-stream-client';
export const KAFKA_BROKER = 'localhost:9092';

export const KAFKA_GROUP_ANALYTICS = 'analytics-consumer-group';
export const KAFKA_GROUP_NOTIFICATIONS = 'notification-consumer-group';
export const KAFKA_GROUP_FRAUD_DETECTION = 'fraud-detection-group';

export const kafkaConfig = {
  transport: Transport.KAFKA,
  options: {
    client: {
      brokers: [KAFKA_BROKER],
      clientId: KAFKA_CLIENT_ID,
    },
    consumer: {
      groupId: 'default-group', // overridden per service
    },
  },
};
