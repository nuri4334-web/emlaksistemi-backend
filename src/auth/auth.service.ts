import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
// TR: Kullanıcı servisini bağlayacağız / EN: We'll link the users service
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, pass: string) {
    const user = await this.usersService.findOneWithPassword(email);
    if (!user) throw new UnauthorizedException('Geçersiz kimlik bilgileri');

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) throw new UnauthorizedException('Geçersiz kimlik bilgileri');

    const payload = { sub: user._id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        fullName: user.name,
      }
    };
  }
}