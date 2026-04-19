import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Commission, CommissionDocument, AgentRole } from './schemas/commission.schema';
import { TransactionDocument } from '../transactions/schemas/transaction.schema';

@Injectable()
export class CommissionsService {
  constructor(
    // TR: Komisyon modelini veritabanından içeri alıyoruz.
    // EN: Injecting the commission model from the database.
    @InjectModel(Commission.name) private commissionModel: Model<CommissionDocument>,
  ) {}

  // TR: GÜVENLİK: Kuruş/Cent Mantığı ile Güvenli Yüzde Hesaplama
  // EN: SECURITY: Safe Percentage Calculation using Cents Logic
  private calculateSafePercentage(amount: number, percentage: number): number {
    const amountInCents = Math.round(amount * 100);
    const resultInCents = Math.round(amountInCents * (percentage / 100));
    return resultInCents / 100;
  }

  // TR: KOMİSYON DAĞITIM ALGORİTMASI (Projenin Kalbi)
  // EN: COMMISSION DISTRIBUTION ALGORITHM (The Heart of the Project)
  async calculateAndSaveCommission(transaction: TransactionDocument): Promise<Commission> {
    const txId = transaction._id as Types.ObjectId;

    // TR: Çifte işlem (Duplicate Key) koruması. Aynı ID ile daha önce hesaplanmış mı?
    // EN: Duplicate key protection. Has it been calculated before with the same ID?
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

  // TR: KULLANICIYA GÖRE KOMİSYONLARI GETİR
  // EN: FETCH COMMISSIONS BASED ON USER ROLE
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

  // 🚀 KESİN ÇÖZÜM: ROLLBACK FONKSİYONU
  // TR: İŞLEM GERİ ALINDIĞINDA DAĞITILAN KOMİSYONU KESİN OLARAK SİL
  // EN: SECURELY DELETE DISTRIBUTED COMMISSION WHEN TRANSACTION IS REVERTED
  async deleteCommissionByTransactionId(txId: string): Promise<void> {
    try {
      // TR: MongoDB katı eşleşme kuralları gereği, gelen String ID'yi ObjectId'ye çeviriyoruz.
      // EN: Converting the incoming String ID to ObjectId due to MongoDB's strict matching rules.
      const objectId = new Types.ObjectId(txId);
      
      // Mongoose'un sessizce hata vermesini engelleyen kesin silme komutu
      const result = await this.commissionModel.deleteMany({ transactionId: objectId }).exec();
      console.log(`[ROLLBACK] İşlem (${txId}) geri alındı, silinen komisyon kaydı sayısı: ${result.deletedCount}`);
    } catch (error) {
      console.error('[HATA] Komisyon silinirken kritik hata oluştu:', error);
    }
  }
}