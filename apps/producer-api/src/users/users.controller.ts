import {
  Controller,
  Post,
  Body,
  Param,
  NotFoundException,
  InternalServerErrorException,
  Patch,
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
    @Body()
    body: {
      email: string;
      password?: string;
      ip?: string;
      userAgent?: string;
    },
  ) {
    // In real app, extract IP/UA from request headers. Here accepting from body for easy testing.
    const ip = body.ip || '127.0.0.1';
    const ua = body.userAgent || 'curl';
    const password = body.password || '';

    const user = await this.usersService.login(body.email, password, ip, ua);
    if (!user) {
      throw new NotFoundException('Invalid credentials');
    }
    return { message: 'Logged in', userId: user.id };
  }

  @Patch(':id/password')
  async changePassword(
    @Param('id') id: string,
    @Body() body: { password: string },
  ) {
    await this.usersService.changePassword(id, body.password);
    return { message: 'Password changed' };
  }

  @Post(':id/logout')
  async logout(@Param('id') id: string) {
    await this.usersService.logout(id);
    return { message: 'Logged out' };
  }
}
