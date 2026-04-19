import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async onModuleInit() {
    await this.seedUsers();
  }

  private async seedUsers() {
    const defaultUsers = [
      { 
        name: 'Sistem Yöneticisi', 
        email: 'admin@emlak.com', 
        password: 'password123', 
        role: UserRole.ADMIN 
      },
      { 
        name: 'Ahmet Danışman (Selling)', 
        email: 'ahmet@emlak.com', 
        password: 'password123', 
        role: UserRole.AGENT 
      },
      { 
        name: 'Mehmet Pazarlamacı (Listing)', 
        email: 'mehmet@emlak.com', 
        password: 'password123', 
        role: UserRole.MARKETER 
      },
    ];

    for (const user of defaultUsers) {
      const exists = await this.userModel.findOne({ email: user.email });
      if (!exists) {
        // TR: Şemadaki 'save' hook'u şifreyi otomatik hash'leyecektir.
        // EN: The 'save' hook in the schema will automatically hash the password.
        await this.userModel.create(user);
        this.logger.log(`Seed user created: ${user.email}`);
      }
    }
    
    this.logger.log('Database seeding process finished.');
  }
}
