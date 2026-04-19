import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreateTransactionDto } from './create-transaction.dto';

// EN: DTO for updating a transaction. We strictly pick specific fields to prevent malicious overwriting of 'history' or 'stage' arrays.
// TR: Bir işlemi düzenlerken kullanılacak DTO. Sadece belirli alanlara izin vererek 'history' veya 'stage' gibi sistem alanlarının ezilmesini engelleriz.
export class UpdateTransactionDto extends PartialType(
  PickType(CreateTransactionDto, ['title', 'totalFee', 'sellingAgentId'] as const)
) {}
