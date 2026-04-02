import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import { TeamService } from './team.service';
import type { CreateTeamDto } from './team.service';

@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  private checkSecret(headers: Record<string, string>) {
    const secret = headers['x-internal-secret'];
    if (secret !== process.env.INTERNAL_API_SECRET) {
      throw new UnauthorizedException('Accès non autorisé');
    }
  }

  @Post('create')
  async createTeam(
    @Body() body: CreateTeamDto,
    @Headers() headers: Record<string, string>,
  ) {
    this.checkSecret(headers);
    const team = await this.teamService.createTeam(body);
    return { success: true, team };
  }

  @Get('all')
  async getAllTeams(@Headers() headers: Record<string, string>) {
    this.checkSecret(headers);
    const teams = await this.teamService.getAllTeams();
    return { teams };
  }

  @Get('recruiting')
  async getRecruitingTeams(@Headers() headers: Record<string, string>) {
    this.checkSecret(headers);
    const teams = await this.teamService.getAllTeams();
    return { teams };
  }

  @Get('me/:userId')
  async getMyTeam(
    @Param('userId') userId: string,
    @Headers() headers: Record<string, string>,
  ) {
    this.checkSecret(headers);
    const team = await this.teamService.getTeamByUser(userId);
    return { team };
  }

  @Post('add-member')
  async addMember(
    @Body('teamId') teamId: string,
    @Body('userId') userId: string,
    @Headers() headers: Record<string, string>,
    @Body('role') role?: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT',
  ) {
    this.checkSecret(headers);
    const membership = await this.teamService.addMember(teamId, userId, role);
    return { success: true, membership };
  }

  @Post('assign-role')
  async assignRole(
    @Body('teamId') teamId: string,
    @Body('requesterId') requesterId: string,
    @Body('userId') userId: string,
    @Body('role') role: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT',
    @Headers() headers: Record<string, string>,
  ) {
    this.checkSecret(headers);
    const membership = await this.teamService.assignMemberRole(
      teamId,
      requesterId,
      userId,
      role,
    );
    return { success: true, membership };
  }

  @Post('unassign-role')
  async unassignRole(
    @Body('teamId') teamId: string,
    @Body('requesterId') requesterId: string,
    @Body('userId') userId: string,
    @Headers() headers: Record<string, string>,
  ) {
    this.checkSecret(headers);
    const membership = await this.teamService.unassignMemberRole(
      teamId,
      requesterId,
      userId,
    );
    return { success: true, membership };
  }

  @Post('remove-member')
  async removeMember(
    @Body('teamId') teamId: string,
    @Body('userId') userId: string,
    @Headers() headers: Record<string, string>,
  ) {
    this.checkSecret(headers);
    const membership = await this.teamService.removeMember(teamId, userId);
    return { success: true, membership };
  }
}
