import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// global pour que PrismaService soit disponible dans tous les modules sans réimport
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
