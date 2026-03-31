import { Module } from '@nestjs/common';
import { RiotController } from './riot.controller';
import { RiotService } from './riot.service';

@Module({
  controllers: [RiotController],
  providers: [RiotService],
})
export class RiotModule {}
