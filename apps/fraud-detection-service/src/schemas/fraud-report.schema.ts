import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FraudReportDocument = HydratedDocument<FraudReport>;

@Schema()
export class FraudReport {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  reason: string;

  @Prop({ required: true })
  riskScore: number;

  @Prop({ type: [Object] })
  evidence: any[]; // List of events

  @Prop({ default: Date.now })
  detectedAt: Date;

  @Prop()
  actionTaken: string; // 'flagged', 'suspended'
}

export const FraudReportSchema = SchemaFactory.createForClass(FraudReport);
