import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type CreateTeamDto = {
  name: string;
  tag: string;
  logoUrl?: string;
  captainId: string;
};

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  async createTeam(dto: CreateTeamDto) {
    const captain = await this.prisma.user.findUnique({ where: { id: dto.captainId } });
    if (!captain) {
      throw new NotFoundException('Capitaine introuvable');
    }

    // un joueur ne peut appartenir qu'à une seule équipe
    const existingMembership = await this.prisma.teamMember.findFirst({
      where: { userId: dto.captainId },
    });
    if (existingMembership) {
      throw new BadRequestException("Tu fais déjà partie d'une équipe.");
    }

    const conflict = await this.prisma.team.findFirst({
      where: {
        OR: [{ name: dto.name }, { tag: dto.tag }],
      },
    });
    if (conflict) {
      throw new BadRequestException('Nom ou tag de team déjà utilisé');
    }

    // le capitaine rejoint l'équipe sans rôle (en attente d'assignation)
    const team = await this.prisma.team.create({
      data: {
        name: dto.name,
        tag: dto.tag,
        logoUrl: dto.logoUrl || null,
        captain: { connect: { id: dto.captainId } },
        members: {
          create: [{ user: { connect: { id: dto.captainId } }, role: null }],
        },
      },
      include: {
        captain: true,
        members: { include: { user: true } },
      },
    });

    return team;
  }

  async getAllTeams() {
    return this.prisma.team.findMany({
      include: {
        captain: true,
        members: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTeamByUser(userId: string) {
    const team = await this.prisma.team.findFirst({
      where: {
        OR: [
          { captainId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        captain: true,
        members: {
          include: {
            user: {
              include: {
                riotAccount: { select: { iconUrl: true, points: true } },
              },
            },
          },
        },
      },
    });
    return team;
  }

  async getTeamById(teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        captain: true,
        members: { include: { user: true } },
      },
    });
    if (!team) {
      throw new NotFoundException('Équipe introuvable');
    }
    return team;
  }

  async addMember(teamId: string, userId: string, role?: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT' | null) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId }, include: { members: true } });
    if (!team) {
      throw new NotFoundException('Équipe introuvable');
    }

    if (team.members.length >= 5) {
      throw new BadRequestException('L\'équipe est déjà complète (5 joueurs).');
    }

    const existing = await this.prisma.teamMember.findFirst({
      where: { userId },
    });
    if (existing) {
      throw new BadRequestException("Ce joueur fait déjà partie d'une équipe.");
    }

    if (role) {
      const roleSlot = await this.prisma.teamMember.findFirst({
        where: { teamId, role },
      });
      if (roleSlot) {
        throw new BadRequestException(`Le rôle ${role} est déjà attribué.`);
      }
    }

    return this.prisma.teamMember.create({
      data: {
        user: { connect: { id: userId } },
        team: { connect: { id: teamId } },
        role: role || null,
      },
    });
  }

  async assignMemberRole(
    teamId: string,
    requesterId: string,
    userId: string,
    role: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT',
  ) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId }, include: { members: true } });
    if (!team) {
      throw new NotFoundException('Équipe introuvable');
    }

    if (team.captainId !== requesterId) {
      throw new UnauthorizedException(
        'Seul le capitaine peut assigner les rôles.',
      );
    }

    const member = await this.prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId } },
    });
    if (!member) {
      throw new NotFoundException('Membre non trouvé dans l équipe');
    }

    const roleTaken = await this.prisma.teamMember.findFirst({
      where: { teamId, role },
    });
    if (roleTaken && roleTaken.userId !== userId) {
      throw new BadRequestException(`Le rôle ${role} est déjà attribué.`);
    }

    return this.prisma.teamMember.update({
      where: { userId_teamId: { userId, teamId } },
      data: { role },
    });
  }

  async unassignMemberRole(
    teamId: string,
    requesterId: string,
    userId: string,
  ) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException('Équipe introuvable');
    }

    if (team.captainId !== requesterId) {
      throw new UnauthorizedException(
        'Seul le capitaine peut modifier les rôles.',
      );
    }

    const member = await this.prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId } },
    });
    if (!member) {
      throw new NotFoundException('Membre non trouvé dans cette équipe');
    }

    return this.prisma.teamMember.update({
      where: { userId_teamId: { userId, teamId } },
      data: { role: null },
    });
  }

  async removeMember(teamId: string, userId: string) {
    const membership = await this.prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId } },
    });
    if (!membership) {
      throw new NotFoundException('Membre non trouvé dans l équipe');
    }
    return this.prisma.teamMember.delete({ where: { userId_teamId: { userId, teamId } } });
  }
}
