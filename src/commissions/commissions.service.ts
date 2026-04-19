import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Commission, CommissionDocument, AgentRole } from './schemas/commission.schema';
import { TransactionDocument } from '../transactions/schemas/transaction.schema';

@Injectable()
export class CommissionsService {
  constructor(
    // EN: Inject Mongoose model to perform commission database operations.
    // TR: Komisyon veritabanı işlemleri (I/O) için Mongoose modelini içeri aktarırız.
    @InjectModel(Commission.name) private commissionModel: Model<CommissionDocument>,
  ) {}

  // EN: UTILITY: Safe float calculation for money values. Preventing JS float truncation errors.
  // TR: YARDIMCI: Para değerleri için güvenli (kuruş bazlı) yüzdelik hesaplama, JS ondalık sayı hatalarını engeller.
  private calculateSafePercentage(amount: number, percentage: number): number {
    const amountInCents = Math.round(amount * 100);
    const resultInCents = Math.round(amountInCents * (percentage / 100));
    return resultInCents / 100;
  }

  // EN: CORE ALGORITHM: Automates the financial distribution based on specific case rules.
  // TR: TEMEL ALGORİTMA: Kurallara bağlı kalarak finansal dağıtımı otomatik olarak gerçeklestirir.
  async calculateAndSaveCommission(transaction: TransactionDocument): Promise<Commission> {
    const txId = transaction._id as Types.ObjectId;

    // EN: Idempotency check. Ensures commission is not double-calculated for the same transaction.
    // TR: Idempotency (tekrarlanabilirlik) koruması. Aynı işlem için iki kere komisyon hesaplanmasını engeller.
    const existingCommission = await this.commissionModel.findOne({ transactionId: txId }).exec();
    if (existingCommission) {
      throw new BadRequestException({
        en: 'Commission already calculated for this transaction.',
        tr: 'Bu işlem için komisyon zaten hesaplanmış.',
        code: 'COMMISSION_ALREADY_EXISTS'
      });
    }

    const totalFee = transaction.totalFee;
    const listingAgentId = transaction.listingAgentId;
    const sellingAgentId = transaction.sellingAgentId;

    const agencyShare = this.calculateSafePercentage(totalFee, 50);
    const agentsTotalPool = this.calculateSafePercentage(totalFee, 50);

    const agentShares: Array<{ agentId: Types.ObjectId; amount: number; role: AgentRole }> = [];
    const isSameAgent = listingAgentId.toString() === sellingAgentId.toString();

    if (isSameAgent) {
      agentShares.push({
        agentId: listingAgentId as Types.ObjectId,
        amount: agentsTotalPool,
        role: AgentRole.BOTH,
      });
    } else {
      const eachAgentAmount = this.calculateSafePercentage(totalFee, 25);
      agentShares.push({ agentId: listingAgentId as Types.ObjectId, amount: eachAgentAmount, role: AgentRole.LISTING });
      agentShares.push({ agentId: sellingAgentId as Types.ObjectId, amount: eachAgentAmount, role: AgentRole.SELLING });
    }

    const newCommission = new this.commissionModel({
      transactionId: txId,
      agencyShare,
      agentShares,
    });

    return await newCommission.save();
  }

  // EN: QUERY: Retrieve all distributions. Admins see all, assigned agents see only theirs.
  // TR: SORGULAMA: Tüm dağıtımları çeker. Yöneticiler tümünü, atanmış danışmanlar sadece kendi dağıtımlarını görür.
  async getAllCommissions(user: any): Promise<Commission[]> {
    const query = (user?.role?.toLowerCase() !== 'admin') 
      ? { 'agentShares.agentId': user._id }
      : {};

    return await this.commissionModel
      .find(query)
      .populate('transactionId', 'title totalFee stage')
      .populate('agentShares.agentId', 'name email role')
      .exec();
  }

  // EN: AUTOMATION: Deletes distributed commission securely when a transaction is reverted.
  // TR: OTOMASYON: Bir işlem geri alındığında dağıtılan komisyon yapısını güvenlice sistemden siler.
  async deleteCommissionByTransactionId(txId: string): Promise<void> {
    try {
      // EN: Strict Typeasting for MongoDB matching queries.
      // TR: MongoDB eşleşme sorguları için katı tip dönüşümü.
      const objectId = new Types.ObjectId(txId);
      
      const result = await this.commissionModel.deleteMany({ transactionId: objectId }).exec();
      console.log(`[ROLLBACK] İşlem (${txId}) geri alındı, silinen komisyon kaydı sayısı: ${result.deletedCount}`);
    } catch (error) {
      console.error('[HATA] Komisyon silinirken kritik hata oluştu:', error);
    }
  }
}