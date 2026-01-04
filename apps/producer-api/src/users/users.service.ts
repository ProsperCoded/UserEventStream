import { Injectable, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../database/database.module';
import { users } from '../database/schema';
import { eq } from 'drizzle-orm';
import { UserEventType, UserEvent } from '@app/shared';
import * as schema from '../database/schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
    @Inject('KAFKA_CLIENT') private kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    this.kafkaClient.subscribeToResponseOf('user.events'); // Not needed for producer only, but good practice
    await this.kafkaClient.connect();
  }

  private emitEvent(
    eventType: UserEventType,
    aggregateId: string,
    payload: any,
  ) {
    const event: UserEvent = {
      eventId: uuidv4(),
      eventType,
      aggregateId,
      occurredAt: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      payload,
    };

    // Emit to 'user.events' topic
    this.kafkaClient.emit('user.events', {
      key: aggregateId, // Partition key
      value: event, // Payload
    });
  }

  async createUser(email: string, passwordHash: string) {
    const [newUser] = await this.db
      .insert(users)
      .values({
        email,
        passwordHash,
        status: 'active',
      })
      .returning();

    this.emitEvent(UserEventType.USER_CREATED, newUser.id, { email });
    return newUser;
  }

  async login(email: string, ip: string, userAgent: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      // Potentially emit login failed with unknown user? Or just return
      // Security: don't reveal user existence. But for events:
      // Can't emit user.login_failed with valid aggregateId if user doesn't exist.
      // Could allow email as aggregateID for failures? PRD says aggregateID is userId.
      // If user not found, maybe skip event or use a placeholder?
      // "user.login_failed" usually implies we found the user but password wrong.
      return null;
    }

    // Update IP
    if (user.lastIpAddress !== ip) {
      await this.db
        .update(users)
        .set({ lastIpAddress: ip })
        .where(eq(users.id, user.id));
      this.emitEvent(UserEventType.USER_IP_CHANGED, user.id, {
        ip,
        previousIp: user.lastIpAddress,
      });
    }

    // Emit Logged In
    this.emitEvent(UserEventType.USER_LOGGED_IN, user.id, { ip, userAgent });
    return user;
  }

  async logout(userId: string) {
    this.emitEvent(UserEventType.USER_LOGGED_OUT, userId, {});
  }
}
