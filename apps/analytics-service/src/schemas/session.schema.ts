import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SessionDocument = HydratedDocument<Session>;

@Schema()
export class Session {
  @Prop({ required: true, unique: true })
  sessionId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  startedAt: Date;

  @Prop()
  endedAt: Date;

  @Prop({ default: 0 })
  eventCount: number;

  @Prop()
  ipAddress: string;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
