import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommissionDocument = Commission & Document;

// TR: Danışman rolünü belirten katı kural (Enum).
// EN: Strict rule (Enum) specifying the agent role.
export enum AgentRole {
  LISTING = 'listing',
  SELLING = 'selling',
  BOTH = 'both',
}

@Schema({ timestamps: true })
export class Commission {
  // TR: Hangi satış işlemine ait olduğu. (unique: Aynı satışa iki komisyon yazılamaz)
  // EN: Which transaction this belongs to. (unique: Two commissions cannot be written for the same sale)
  @Prop({ type: Types.ObjectId, ref: 'Transaction', required: true, unique: true })
  transactionId!: Types.ObjectId;

  // TR: Şirketin %50'lik payı. (Eksi bakiye olamaz)
  // EN: The agency's 50% share. (Cannot be a negative balance)
  @Prop({ required: true, min: 0 })
  agencyShare!: number;

  // TR: Danışmanların paylarını tutan dizi.
  // EN: Array holding the agents' shares.
  @Prop([
    {
      agentId: { type: Types.ObjectId, ref: 'User', required: true },
      amount: { type: Number, required: true, min: 0 },
      role: { type: String, enum: AgentRole, required: true },
    },
  ])
  agentShares!: Array<{ agentId: Types.ObjectId; amount: number; role: AgentRole }>;
}

export const CommissionSchema = SchemaFactory.createForClass(Commission);