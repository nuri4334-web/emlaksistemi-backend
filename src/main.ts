import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // GÜVENLİK KALKANI: Global Doğrulama Filtresi
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // DTO'da olmayan fazladan verileri (hack amaçlı yollananları) siler atar
    forbidNonWhitelisted: true, // Eğer fazladan veri yollanırsa isteği tamamen reddeder ve hata fırlatır
    transform: true, // Gelen veriyi (örneğin string gelen rakamı) otomatik olarak sayı tipine dönüştürür
  }));

  // TR: Tüm Frontend isteklerine ve başlıklarına (Header) izin veriyoruz.
  app.enableCors({
    origin: ['http://localhost:3000', 'https://lumina-estates-eight.vercel.app'],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization', 
  });

  // .env dosyasındaki portu al, bulamazsa 3001'i kullan
  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`🚀 Sistem başarıyla ${port} portunda ayağa kalktı!`);
}
bootstrap();