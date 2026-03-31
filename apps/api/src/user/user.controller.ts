import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  private checkSecret(headers: Record<string, string>) {
    const secret = headers['x-internal-secret'];
    if (secret !== process.env.INTERNAL_API_SECRET) {
      throw new UnauthorizedException('Accès non autorisé');
    }
  }

  // GET /user/preferences?userId=xxx
  @Get('preferences')
  async getPreferences(
    @Query('userId') userId: string,
    @Headers() headers: Record<string, string>,
  ) {
    this.checkSecret(headers);
    const preferences = await this.userService.getPreferences(userId);
    return { preferences };
  }

  // PATCH /user/preferences
  @Patch('preferences')
  async updatePreferences(
    @Body('userId') userId: string,
    @Body('lookingForTeam') lookingForTeam: boolean | undefined,
    @Body('acceptDm') acceptDm: boolean | undefined,
    @Headers() headers: Record<string, string>,
  ) {
    this.checkSecret(headers);
    const preferences = await this.userService.updatePreferences(userId, {
      lookingForTeam,
      acceptDm,
    });
    return { preferences };
  }
}
