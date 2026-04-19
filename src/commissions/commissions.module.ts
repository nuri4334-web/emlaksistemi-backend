import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommissionsService } from './commissions.service';
import { CommissionsController } from './commissions.controller';
import { Commission, CommissionSchema } from './schemas/commission.schema';

@Module({
  imports: [
    // TR: Şemayı MongoDB'ye tablo olarak kaydetmesi için modüle bildiriyoruz
    // EN: Notifying the module to register the schema as a table in MongoDB
    MongooseModule.forFeature([{ name: Commission.name, schema: CommissionSchema }])
  ],
  controllers: [CommissionsController],
  providers: [CommissionsService],
  // TR: Bu servisi Transactions modülünde kullanabilmek için dışa aktarıyoruz (Çok Önemli!)
  // EN: Exporting this service so it can be used in the Transactions module (Very Important!)
  exports: [CommissionsService] 
})
export class CommissionsModule {}