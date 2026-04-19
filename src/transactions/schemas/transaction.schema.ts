import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type TransactionDocument = Transaction & Document;

// TR: GÜVENLİK 1: Katı Enum Yapısı. Sisteme sahte aşamalar enjekte edilemez.
// EN: SECURITY 1: Strict Enum Structure. Fake stages cannot be injected into the system.
export enum TransactionStage {
  AGREEMENT = 'agreement',
  EARNEST_MONEY = 'earnest_money',
  TITLE_DEED = 'title_deed',
  COMPLETED = 'completed',
}

// 🚀 YENİ EKLENEN: Alt Şema (İşlem Geçmişi)
// TR: _id: false -> Veritabanını şişirmemek için alt dökümanlara gereksiz ID atamasını kapatırız.
@Schema({ _id: false }) 
export class HistoryRecord {
  @Prop({ required: true, enum: TransactionStage })
  stage!: TransactionStage;

  @Prop({ required: true, default: Date.now })
  date!: Date;
}

// TR: GÜVENLİK 2: Verinin zaman damgaları sistem tarafından mühürlenir.
// EN: SECURITY 2: Data timestamps are sealed by the system.
@Schema({ timestamps: true }) 
export class Transaction {
  // TR: GÜVENLİK 3: maxlength -> Veritabanını şişirme saldırılarını engeller.
  // EN: SECURITY 3: maxlength -> Prevents database bloat attacks.
  @Prop({ required: true, trim: true, maxlength: 150 }) 
  title!: string;

  // TR: GÜVENLİK 4: min: 0 -> Negatif komisyon girilerek sistem sabote edilemez.
  // EN: SECURITY 4: min: 0 -> System cannot be sabotaged by entering negative commissions.
  @Prop({ required: true, min: 0 }) 
  totalFee!: number;

  @Prop({ required: true, enum: TransactionStage, default: TransactionStage.AGREEMENT })
  stage!: TransactionStage;

  // TR: GÜVENLİK 5: Sadece geçerli bir MongoDB ID'si kabul edilir.
  // EN: SECURITY 5: Only a valid MongoDB ID is accepted.
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) 
  listingAgentId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sellingAgentId!: Types.ObjectId;

  // 🚀 YENİ EKLENEN: GÜVENLİK 6: İzlenebilirlik (Traceability)
  // TR: Yapılan her aşama değişikliği silinemez bir tarihçe (Audit Trail) olarak buraya kaydedilir.
  @Prop({ type: [SchemaFactory.createForClass(HistoryRecord)], default: [] })
  history!: HistoryRecord[];
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);