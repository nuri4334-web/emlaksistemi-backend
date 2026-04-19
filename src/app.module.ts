import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TransactionsModule } from './transactions/transactions.module';
import { CommissionsModule } from './commissions/commissions.module';

// TR: Yeni eklenen güvenlik ve kullanıcı modüllerini içe aktarıyoruz
// EN: Importing the newly added security and user modules
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    // ... (Config and Mongoose remain same)
    ConfigModule.forRoot({
      isGlobal: true, 
    }),
    
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),

    TransactionsModule,
    CommissionsModule,
    UsersModule,
    AuthModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}