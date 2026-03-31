import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RiotModule } from './riot/riot.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [PrismaModule, RiotModule, UserModule],
})
export class AppModule {}
