import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  // récupère les préférences d'un utilisateur
  async getPreferences(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { lookingForTeam: true, acceptDm: true },
    });

    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  // met à jour les préférences d'un utilisateur
  async updatePreferences(
    userId: string,
    data: { lookingForTeam?: boolean; acceptDm?: boolean },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { lookingForTeam: true, acceptDm: true },
    });
  }
}
