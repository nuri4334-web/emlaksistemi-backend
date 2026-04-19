import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

// EN: DTO for updating a transaction. We strictly pick specific fields to prevent malicious overwriting of 'history' or 'stage' arrays.
// TR: Bir işlemi düzenlerken kullanılacak DTO. Sadece belirli alanlara izin vererek 'history' veya 'stage' gibi sistem alanlarının ezilmesini engelleriz.
export class UpdateTransactionDto {
  @IsOptional() @IsString() @MaxLength(150)
  title?: string;
  
  @IsOptional() @IsNumber() @Min(0)
  totalFee?: number;
  
  @IsOptional() @IsString()
  sellingAgentId?: string;
}
