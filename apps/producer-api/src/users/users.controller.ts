import {
  Controller,
  Post,
  Body,
  Param,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(@Body() body: { email: string; password: string }) {
    try {
      const user = await this.usersService.createUser(
        body.email,
        body.password,
      ); // Plain text "hash" for playground
      return user;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Post('login')
  async login(
    @Body() body: { email: string; ip?: string; userAgent?: string },
  ) {
    // In real app, extract IP/UA from request headers. Here accepting from body for easy testing.
    const ip = body.ip || '127.0.0.1';
    const ua = body.userAgent || 'curl';

    const user = await this.usersService.login(body.email, ip, ua);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { message: 'Logged in', userId: user.id };
  }

  @Post(':id/logout')
  async logout(@Param('id') id: string) {
    await this.usersService.logout(id);
    return { message: 'Logged out' };
  }
}
