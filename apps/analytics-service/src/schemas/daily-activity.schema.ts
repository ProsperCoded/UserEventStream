import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DailyActivityDocument = HydratedDocument<DailyActivity>;

@Schema()
export class DailyActivity {
  @Prop({ required: true, unique: true })
  date: string; // YYYY-MM-DD

  @Prop({ type: [String], default: [] })
  activeUserIds: string[];

  @Prop({ default: 0 })
  eventCount: number;

  @Prop({ default: -1 })
  lastProcessedOffset: number;
}

export const DailyActivitySchema = SchemaFactory.createForClass(DailyActivity);
