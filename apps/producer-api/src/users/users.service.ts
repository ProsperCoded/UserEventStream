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

  async login(email: string, password: string, ip: string, userAgent: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      // User not found, generally silent or generic failure
      return null;
    }

    // Verify Password (Mock hash check)
    if (user.passwordHash !== password) {
      this.emitEvent(UserEventType.USER_LOGIN_FAILED, user.id, {
        ip,
        userAgent,
        reason: 'Invalid password',
      });
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

  async changePassword(userId: string, newPasswordHash: string) {
    await this.db
      .update(users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(users.id, userId));
    this.emitEvent(UserEventType.USER_PASSWORD_CHANGED, userId, {});
  }
}
