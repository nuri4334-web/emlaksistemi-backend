import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // TR: Token'ı HTTP Header'ından (Bearer) alır.
      // EN: Extracts the token from the HTTP Header (Bearer).
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // TR: Süresi dolan token'ları reddet / EN: Reject expired tokens
      secretOrKey: 'super-secret-key-for-assessment',
    });
  }

  // TR: Token geçerliyse, içindeki veriyi (payload) isteğe (request.user) ekler.
  // EN: If token is valid, attaches the payload to the request (request.user).
  async validate(payload: any) {
    return { _id: payload.sub, email: payload.email, role: payload.role };
  }
}