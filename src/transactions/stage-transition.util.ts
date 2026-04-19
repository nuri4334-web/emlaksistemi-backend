import { BadRequestException } from '@nestjs/common';
import { TransactionStage } from './schemas/transaction.schema';

// TR: GÜVENLİK KURALI: Hangi aşamadan, hangi aşamalara geçilebileceğinin kesin haritası.
// EN: SECURITY RULE: The strict map of which stages can transition to which.
const ALLOWED_TRANSITIONS: Record<TransactionStage, TransactionStage[]> = {
  [TransactionStage.AGREEMENT]: [TransactionStage.EARNEST_MONEY], // TR: Sadece Kaporaya / EN: Only to Earnest Money
  [TransactionStage.EARNEST_MONEY]: [TransactionStage.TITLE_DEED], // TR: Sadece Tapuya / EN: Only to Title Deed
  [TransactionStage.TITLE_DEED]: [TransactionStage.COMPLETED],     // TR: Sadece Tamamlandıya / EN: Only to Completed
  [TransactionStage.COMPLETED]: [],                                // TR: İşlem bitti, geçiş yok / EN: Process over, no transition
};

// TR: Aşama geçişini doğrulayan fonksiyon
// EN: Function to validate stage transition
export function validateStageTransition(currentStage: TransactionStage, nextStage: TransactionStage): void {
  if (currentStage === nextStage) {
    // TR: Hem İngilizce hem Türkçe hata mesajı içeren obje fırlatıyoruz.
    // EN: Throwing an object containing both English and Turkish error messages.
    throw new BadRequestException({
      en: `Transaction is already in '${currentStage}' stage.`,
      tr: `İşlem zaten '${currentStage}' aşamasında.`,
      code: 'SAME_STAGE_ERROR'
    });
  }
  
  const validNextStages = ALLOWED_TRANSITIONS[currentStage];
  
  if (!validNextStages.includes(nextStage)) {
    throw new BadRequestException({
      en: `LOGIC ERROR: Cannot transition directly from '${currentStage}' to '${nextStage}'!`,
      tr: `MANTIK HATASI: '${currentStage}' aşamasından doğrudan '${nextStage}' aşamasına geçiş yapamazsınız!`,
      code: 'INVALID_TRANSITION_ERROR'
    });
  }
}