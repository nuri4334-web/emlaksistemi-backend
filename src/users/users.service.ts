import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // TR: Sisteme yeni bir kullanıcı kaydeder (Şifre şemada otomatik hash'lenir)
  // EN: Registers a new user to the system (Password is auto-hashed in schema)
  async create(userData: any): Promise<UserDocument> {
    const newUser = new this.userModel(userData);
    return newUser.save();
  }

  // TR: Auth için özel: Gizli olan şifreyi zorla (+password) getirerek DB'den çeker.
  // EN: Special for Auth: Fetches from DB by forcing the hidden password (+password) to be included.
  async findOneWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  // TR: Tüm kullanıcıları parola olmadan listeler (Dropdown için gereklidir)
  // EN: Lists all users without passwords (needed for the dropdown)
  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }
}