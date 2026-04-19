import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument, TransactionStage } from './schemas/transaction.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { validateStageTransition } from './stage-transition.util';
import { CommissionsService } from '../commissions/commissions.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    private commissionsService: CommissionsService, 
  ) {}

  async createTransaction(createDto: CreateTransactionDto): Promise<Transaction> {
    const newTransaction = new this.transactionModel({
      ...createDto,
      history: [{ stage: TransactionStage.AGREEMENT, date: new Date() }]
    });
    return await newTransaction.save();
  }

  async getAllTransactions(user: any): Promise<Transaction[]> {
    const query = (user?.role?.toLowerCase() !== 'admin') 
      ? { $or: [{ listingAgentId: user._id }, { sellingAgentId: user._id }] } : {};

    return await this.transactionModel
      .find(query)
      .populate('listingAgentId', 'name email role')
      .populate('sellingAgentId', 'name email role')
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateTransactionStage(id: string, updateDto: UpdateStageDto): Promise<Transaction> {
    const transaction = await this.transactionModel.findById(id).exec();
    if (!transaction) throw new NotFoundException('İşlem bulunamadı.');

    validateStageTransition(transaction.stage, updateDto.stage);
    transaction.stage = updateDto.stage;

    if (!transaction.history) transaction.history = [];
    transaction.history.push({ stage: updateDto.stage, date: new Date() } as any);

    const updatedTransaction = await transaction.save();

    if (updatedTransaction.stage?.toLowerCase() === 'completed') {
      await this.commissionsService.deleteCommissionByTransactionId(id);
      await this.commissionsService.calculateAndSaveCommission(updatedTransaction);
    }
    return updatedTransaction;
  }

  async revertStage(id: string): Promise<Transaction> {
    const transaction = await this.transactionModel.findById(id).exec();
    if (!transaction) throw new NotFoundException('İşlem bulunamadı.');

    const stages = ['agreement', 'earnest_money', 'title_deed', 'completed'];
    const currentStage = transaction.stage?.toLowerCase() || 'agreement';
    const currentIndex = stages.indexOf(currentStage);

    if (currentIndex <= 0) return transaction;
    const previousStage = stages[currentIndex - 1];

    if (currentStage === 'completed') {
      await this.commissionsService.deleteCommissionByTransactionId(id);
    }

    const updatedTx = await this.transactionModel.findByIdAndUpdate(
      id,
      { $set: { stage: previousStage }, $pop: { history: 1 } },
      { returnDocument: 'after' } 
    ).exec();

    return updatedTx as Transaction;
  }

  // EN: TRANSACTION UPDATE (EDIT) - Validating input strictly to prevent overwriting critical arrays (history etc).
  // TR: İŞLEM DÜZENLEME (EDIT) - 'history' gibi kritik dizilerin ezilmesini engellemek için sadece izin verilen verileri alır.
  async updateTransaction(id: string, updateData: UpdateTransactionDto): Promise<Transaction> {
    const transaction = await this.transactionModel.findById(id).exec();
    if (!transaction) throw new NotFoundException('İşlem bulunamadı.');

    // EN: ERP RULE: Completed transactions (where funds are distributed) cannot be modified. They must be reverted first.
    // TR: ERP KURALI: Tamamlanmış (Parası dağıtılmış) işlem değiştirilemez. Önce geri alınmalıdır.
    if (transaction.stage?.toLowerCase() === 'completed') {
      throw new BadRequestException('Tamamlanmış işlemler düzenlenemez. Lütfen önce aşamayı geri alınız.');
    }

    return await this.transactionModel.findByIdAndUpdate(id, updateData, { returnDocument: 'after' }).exec() as Transaction;
  }

  // EN: TRANSACTION DELETION - Critical Rule: Completed transactions cannot be deleted directly due to financial records.
  // TR: İŞLEM SİLME - Kritik Kural: Finansal kayıtlar nedeniyle tamamlanmış işlemler doğrudan silinemez.
  async deleteTransaction(id: string): Promise<void> {
    const transaction = await this.transactionModel.findById(id).exec();
    if (!transaction) throw new NotFoundException('İşlem bulunamadı.');

    if (transaction.stage?.toLowerCase() === 'completed') {
      throw new BadRequestException({
        en: 'Completed transactions cannot be deleted directly. You must first revert the stage to cancel financial records.',
        tr: 'Tamamlanmış işlemler doğrudan silinemez. Önce aşamayı geri alarak finansal kayıtları iptal etmelisiniz.'
      });
    }

    await this.transactionModel.findByIdAndDelete(id).exec();
  }
}