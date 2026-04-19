import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';

export type UserDocument = User & Document;

// TR: Rolleri dışarıdan müdahaleye kapatmak için katı Enum yapısı.
// EN: Strict Enum structure to prevent external manipulation of roles.
export enum UserRole {
  ADMIN = 'admin',
  AGENT = 'agent',
  MARKETER = 'marketer',
}

// TR: Oluşturulma ve güncellenme tarihlerini otomatik tutar.
// EN: Automatically keeps track of creation and update dates.
@Schema({ timestamps: true }) 
export class User {
  // TR: trim: Başındaki ve sonundaki boşlukları (hack denemelerini) siler.
  // EN: trim: Removes leading and trailing spaces (hack attempts).
  @Prop({ required: true, trim: true }) 
  name!: string;

  // TR: unique: Aynı maille iki kişi kayıt olamaz.
  // EN: unique: Prevents two users from registering with the same email.
  @Prop({ required: true, unique: true, lowercase: true, trim: true }) 
  email!: string;

  // TR: select: false -> Veritabanından kullanıcı çekildiğinde şifre kazara frontend'e gitmesin diye gizler! (Kritik güvenlik)
  // EN: select: false -> Hides the password when fetching the user from the database to prevent accidental leaks to the frontend! (Critical security)
  @Prop({ required: true, minlength: 6, select: false }) 
  password!: string;

  // TR: Varsayılan olarak herkes danışmandır, dışarıdan kendini admin yapamaz.
  // EN: Everyone is an agent by default, cannot make themselves admin externally.
  @Prop({ required: true, enum: UserRole, default: UserRole.AGENT }) 
  role!: UserRole;
}

export const UserSchema = SchemaFactory.createForClass(User);

// TR: Şifreyi kaydetmeden önce hash'leme (Güvenlik Kalkanı)
// EN: Hashing password before saving (Security Shield)
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(this.password, salt);
    this.password = hash;
  } catch (err: any) {
    throw err;
  }
});