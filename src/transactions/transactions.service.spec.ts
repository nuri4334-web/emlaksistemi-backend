import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { getModelToken } from '@nestjs/mongoose';
import { Transaction, TransactionStage } from './schemas/transaction.schema';
import { CommissionsService } from '../commissions/commissions.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

// TR: validateStageTransition fonksiyonunu sahte (mock) olarak tanımlıyoruz.
// EN: Mocking the validateStageTransition function.
jest.mock('./stage-transition.util', () => ({
  validateStageTransition: jest.fn(),
}));

// TR: MongoDB Modelinin sahtesini (mock) oluşturuyoruz.
class MockTransactionModel {
  constructor(dto: any) {
    Object.assign(this, dto);
  }
  save = jest.fn().mockResolvedValue(this);

  static find = jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  });
  static findById = jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(null),
  });
  static findByIdAndUpdate = jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(null),
  });
  static findByIdAndDelete = jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(null),
  });
}

// TR: CommissionsService'in sahtesini (mock) oluşturuyoruz.
const mockCommissionsService = {
  deleteCommissionByTransactionId: jest.fn(),
  calculateAndSaveCommission: jest.fn(),
};

describe('TransactionsService (Unit Tests)', () => {
  let service: TransactionsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getModelToken(Transaction.name),
          useValue: MockTransactionModel,
        },
        {
          provide: CommissionsService,
          useValue: mockCommissionsService,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Core Transaction Operations', () => {
    // TR: 1. Yeni Kayıt: İşlem oluşturulurken tarihe ilk mühür (AGREEMENT) vurulmalı
    it('should create a transaction and initialize history with AGREEMENT stage', async () => {
      const dto: any = { title: 'Test Property', totalFee: 10000 };
      const result = await service.createTransaction(dto);

      expect(result.history).toBeDefined();
      expect(result.history[0].stage).toBe(TransactionStage.AGREEMENT);
      
      // 🚀 ÇÖZÜM BURADA: TypeScript'in 'save yok' hatasını (as any) ile eziyoruz
      expect((result as any).save).toHaveBeenCalled();
    });

    // TR: 2. Rol Tabanlı Erişim: Admin tüm kayıtları görmeli, Danışman sadece kendi kayıtlarını görmeli
    it('should fetch all transactions for Admin, but only involved transactions for Agent', async () => {
      const adminUser = { role: 'admin', _id: new Types.ObjectId() };
      const agentUser = { role: 'agent', _id: new Types.ObjectId() };

      await service.getAllTransactions(adminUser);
      expect(MockTransactionModel.find).toHaveBeenCalledWith({});

      await service.getAllTransactions(agentUser);
      expect(MockTransactionModel.find).toHaveBeenCalledWith({
        $or: [
          { listingAgentId: agentUser._id },
          { sellingAgentId: agentUser._id },
        ],
      });
    });
  });

  describe('Stage Transitions and Automations', () => {
    // TR: 3. Aşama Güncelleme ve Otomatik Komisyon
    it('should calculate commission when transaction stage is updated to COMPLETED', async () => {
      const mockTx: any = {
        _id: 'tx-123',
        stage: 'title_deed',
        history: [],
        save: jest.fn().mockResolvedValue({ stage: 'completed', history: [{}] }),
      };
      MockTransactionModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(mockTx),
      });

      await service.updateTransactionStage('tx-123', { stage: TransactionStage.COMPLETED });

      expect(mockCommissionsService.deleteCommissionByTransactionId).toHaveBeenCalledWith('tx-123');
      expect(mockCommissionsService.calculateAndSaveCommission).toHaveBeenCalled();
    });

    // TR: 4. Geri Alma (Rollback) ve Finansal Temizlik
    it('should pop history and delete commissions when reverting from COMPLETED stage', async () => {
      const mockTx: any = {
        _id: 'tx-123',
        stage: 'completed',
      };
      MockTransactionModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(mockTx),
      });

      await service.revertStage('tx-123');

      // Paranın silindiğini doğrula
      expect(mockCommissionsService.deleteCommissionByTransactionId).toHaveBeenCalledWith('tx-123');
      // Mongoose'un findByIdAndUpdate ile history'den pop yapıp yapmadığını doğrula
      expect(MockTransactionModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'tx-123',
        { $set: { stage: 'title_deed' }, $pop: { history: 1 } },
        { returnDocument: 'after' }
      );
    });
  });

  describe('Advanced Security and Denials (Audit)', () => {
    // 🚀 YENİ TEST: Tamamlanmış işlemin düzenlenmesini (Edit) engelle
    it('should throw BadRequestException if trying to EDIT a COMPLETED transaction', async () => {
      const mockTx: any = { _id: 'tx-123', stage: 'completed' };
      MockTransactionModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(mockTx),
      });

      await expect(service.updateTransaction('tx-123', { totalFee: 20000 }))
        .rejects.toThrow(BadRequestException);
    });

    // 🚀 YENİ TEST: Tamamlanmış işlemin doğrudan silinmesini (Delete) engelle
    it('should throw BadRequestException if trying to DELETE a COMPLETED transaction', async () => {
      const mockTx: any = { _id: 'tx-123', stage: 'completed' };
      MockTransactionModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(mockTx),
      });

      await expect(service.deleteTransaction('tx-123'))
        .rejects.toThrow(BadRequestException);
        
      // Silme işleminin kesinlikle ÇAĞRILMADIĞINDAN emin ol
      expect(MockTransactionModel.findByIdAndDelete).not.toHaveBeenCalled();
    });

    // TR: TamamlanMAMIŞ normal bir işlemin sorunsuz silinebilmesi
    it('should successfully delete a NON-COMPLETED transaction', async () => {
      const mockTx: any = { _id: 'tx-123', stage: 'agreement' };
      MockTransactionModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(mockTx),
      });

      await service.deleteTransaction('tx-123');

      expect(MockTransactionModel.findByIdAndDelete).toHaveBeenCalledWith('tx-123');
    });
  });
});