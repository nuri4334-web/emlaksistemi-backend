import { IsString, IsNumber, IsEnum, IsNotEmpty, Min, MaxLength } from 'class-validator';
import { TransactionStage } from '../schemas/transaction.schema';

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  // TR: GÜVENLİK: Buffer overflow veya DB şişirme saldırılarını engeller.
  // EN: SECURITY: Prevents buffer overflow or DB bloat attacks.
  @MaxLength(150) 
  title!: string;

  @IsNumber()
  // TR: GÜVENLİK: Negatif para girişiyle sistemi sabote etmeyi engeller.
  // EN: SECURITY: Prevents sabotaging the system with negative money input.
  @Min(0) 
  totalFee!: number;

  // TR: GÜVENLİK: Sadece belirlediğimiz 4 aşama kabul edilir.
  // EN: SECURITY: Only the 4 defined stages are accepted.
  @IsEnum(TransactionStage) 
  stage!: TransactionStage;

  @IsString()
  @IsNotEmpty()
  listingAgentId!: string;

  @IsString()
  @IsNotEmpty()
  sellingAgentId!: string;
}