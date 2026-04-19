import { Test, TestingModule } from '@nestjs/testing';
import { CommissionsService } from './commissions.service';
import { getModelToken } from '@nestjs/mongoose';
import { Commission, AgentRole } from './schemas/commission.schema';
import { Types } from 'mongoose';
import { BadRequestException } from '@nestjs/common';

// TR: MongoDB Modelinin sahtesini (mock) oluşturuyoruz. 
// EN: Creating a mock of the MongoDB Model.
class MockCommissionModel {
  constructor(dto: any) {
    Object.assign(this, dto);
  }
  save = jest.fn().mockResolvedValue(this);
  
  // TR: Jest ile veritabanı sorgularının dönüş değerlerini taklit ediyoruz.
  static findOne = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
  static deleteMany = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ deletedCount: 1 }) });
}

describe('CommissionsService (Unit Tests)', () => {
  let service: CommissionsService;

  beforeEach(async () => {
    // Her testten önce mock (sahte) veritabanı değerlerini sıfırlıyoruz
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionsService,
        {
          provide: getModelToken(Commission.name),
          useValue: MockCommissionModel,
        },
      ],
    }).compile();

    service = module.get<CommissionsService>(CommissionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Commission Calculation Algorithms', () => {
    // TR: Senaryo 1: Evi bulan ve satan danışman aynı kişi ise (%50 şirkete, %50 tek danışmana)
    it('Scenario 1: should give total agent pool to the same agent', async () => {
      const agentId = new Types.ObjectId();
      const mockTransaction: any = {
        _id: new Types.ObjectId(),
        totalFee: 10000,
        listingAgentId: agentId,
        sellingAgentId: agentId, // TR: Aynı kişi
      };

      const result = await service.calculateAndSaveCommission(mockTransaction);

      expect(result.agencyShare).toBe(5000);
      expect(result.agentShares).toHaveLength(1);
      expect(result.agentShares[0].amount).toBe(5000);
      expect(result.agentShares[0].role).toBe(AgentRole.BOTH);
    });

    // TR: Senaryo 2: Evi bulan ve satan danışmanlar farklı ise (%50 şirkete, %25 - %25 danışmanlara)
    it('Scenario 2: should split agent pool equally between different agents', async () => {
      const mockTransaction: any = {
        _id: new Types.ObjectId(),
        totalFee: 10000,
        listingAgentId: new Types.ObjectId(),
        sellingAgentId: new Types.ObjectId(), // TR: Farklı kişi
      };

      const result = await service.calculateAndSaveCommission(mockTransaction);

      expect(result.agencyShare).toBe(5000);
      expect(result.agentShares).toHaveLength(2);
      expect(result.agentShares[0].amount).toBe(2500); 
      expect(result.agentShares[1].amount).toBe(2500); 
    });

    // TR: Küsuratlı sayı (Float) problemi testi
    it('should calculate safe percentages for float numbers without JS math errors', async () => {
      const mockTransaction: any = {
        _id: new Types.ObjectId(),
        totalFee: 3333.33,
        listingAgentId: new Types.ObjectId(),
        sellingAgentId: new Types.ObjectId(), 
      };

      const result = await service.calculateAndSaveCommission(mockTransaction);

      expect(result.agencyShare).toBe(1666.67);
      expect(result.agentShares[0].amount).toBe(833.33);
      expect(result.agentShares[1].amount).toBe(833.33);
    });
  });

  describe('Security and Rollback Mechanisms', () => {
    // 🚀 YENİ TEST 1: Çifte Komisyon Koruması
    it('should throw BadRequestException if commission already exists (Duplicate Protection)', async () => {
      // Mock'u değiştir: Sanki veritabanında bu işlem için zaten bir komisyon varmış gibi davran
      MockCommissionModel.findOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue({ _id: 'existing-commission-id' })
      });

      const mockTransaction: any = {
        _id: new Types.ObjectId(),
        totalFee: 5000,
        listingAgentId: new Types.ObjectId(),
        sellingAgentId: new Types.ObjectId(),
      };

      // Sistemin hata fırlatmasını (rejects.toThrow) bekliyoruz
      await expect(service.calculateAndSaveCommission(mockTransaction))
        .rejects.toThrow(BadRequestException);
    });

    // 🚀 YENİ TEST 2: Geri Alma (Rollback) Mekanizması
    it('should call deleteMany with correct ObjectId when reverting a transaction (Rollback)', async () => {
      const stringId = new Types.ObjectId().toHexString();
      
      await service.deleteCommissionByTransactionId(stringId);

      // deleteMany fonksiyonunun çağrılıp çağrılmadığını kontrol ediyoruz
      expect(MockCommissionModel.deleteMany).toHaveBeenCalled();
      
      // Gönderilen ID'nin String'den ObjectId'ye çevrilip çevrilmediğini (bizim fix'imiz) kontrol edelim
      const callArgs = MockCommissionModel.deleteMany.mock.calls[0][0];
      expect(callArgs.transactionId).toBeInstanceOf(Types.ObjectId);
      expect(callArgs.transactionId.toString()).toBe(stringId);
    });
  });
});