import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MonthlyActivityDocument = HydratedDocument<MonthlyActivity>;

@Schema()
export class MonthlyActivity {
  @Prop({ required: true, unique: true })
  month: string; // YYYY-MM

  @Prop({ type: [String], default: [] })
  activeUserIds: string[];

  @Prop({ default: 0 })
  eventCount: number;
}

export const MonthlyActivitySchema =
  SchemaFactory.createForClass(MonthlyActivity);
