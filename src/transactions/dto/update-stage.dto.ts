import { IsEnum } from 'class-validator';
import { TransactionStage } from '../schemas/transaction.schema';

export class UpdateStageDto {
  @IsEnum(TransactionStage)
  stage!: TransactionStage;
}