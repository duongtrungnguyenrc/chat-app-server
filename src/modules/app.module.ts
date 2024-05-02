import { Module } from '@nestjs/common';
import { UserModule, AuthModule, ChatModule } from '@/modules';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    AuthModule,
    UserModule,
    ChatModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    MongooseModule.forRoot(process.env.CONNECTION_STRING),
  ],
  exports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' })],
})
export class AppModule {}
