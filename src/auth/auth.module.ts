import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';

// TR: Yeni oluşturduğumuz Controller'ı içe aktarıyoruz
import { AuthController } from './auth.controller'; 

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: 'super-secret-key-for-assessment',
      signOptions: { expiresIn: '1d' }, 
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}