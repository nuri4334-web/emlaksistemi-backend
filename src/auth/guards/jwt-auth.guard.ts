import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// TR: Tüm rotaları Passport.js JWT stratejisi ile korur.
// EN: Protects all routes with Passport.js JWT strategy.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}