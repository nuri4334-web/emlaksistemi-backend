import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt'; // Şifreleme kütüphanesini buraya ekledik

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  async register(@Body() body: any) {
    // 1. Şifreyi burada manuel olarak şifreliyoruz!
    const hashedPassword = await bcrypt.hash(body.password, 10);
    
    // 2. Şifrelenmiş halini veritabanına gönderiyoruz
    const newUser = {
      ...body,
      password: hashedPassword,
    };
    
    return this.usersService.create(newUser);
  }

  @Post('login')
  async login(@Body() body: any) {
    return this.authService.login(body.email, body.password);
  }
}