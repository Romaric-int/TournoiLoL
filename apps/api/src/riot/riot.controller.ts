import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { RiotService } from './riot.service';

@Controller('riot')
export class RiotController {
  constructor(private readonly riotService: RiotService) {}

  // vérifie le secret interne pour sécuriser les appels depuis Next.js
  private checkSecret(headers: Record<string, string>) {
    const secret = headers['x-internal-secret'];
    if (secret !== process.env.INTERNAL_API_SECRET) {
      throw new UnauthorizedException('Accès non autorisé');
    }
  }

  // GET /riot/me?userId=xxx
  @Get('me')
  async getMe(
    @Query('userId') userId: string,
    @Headers() headers: Record<string, string>,
  ) {
    this.checkSecret(headers);
    const riotAccount = await this.riotService.getLinkedAccount(userId);
    return { riotAccount };
  }

  // POST /riot/save
  @Post('save')
  async save(
    @Body() body: Parameters<RiotService['saveAccount']>[0],
    @Headers() headers: Record<string, string>,
  ) {
    this.checkSecret(headers);
    const riotAccount = await this.riotService.saveAccount(body);
    return { success: true, riotAccount };
  }

  // POST /riot/refresh
  @Post('refresh')
  async refresh(
    @Body('userId') userId: string,
    @Headers() headers: Record<string, string>,
  ) {
    this.checkSecret(headers);
    const riotAccount = await this.riotService.refreshAccount(userId);
    return { success: true, riotAccount };
  }

  // POST /riot/roles
  @Post('roles')
  async saveRoles(
    @Body('userId') userId: string,
    @Body('roles') roles: string[],
    @Headers() headers: Record<string, string>,
  ) {
    this.checkSecret(headers);
    const riotAccount = await this.riotService.saveRoles(userId, roles);
    return { success: true, riotAccount };
  }
}
