import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../constant/index.constant';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiBearerAuth()
  createNewUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createNewUser(createUserDto);
  }

  @Get()
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  findAllUsers() {
    return this.userService.findAllUsers();
  }

  @Get(':userId')
  @ApiBearerAuth()
  findUserById(@Param('userId') id: string) {
    return this.userService.findUserById(id);
  }

  @Patch(':userId')
  @ApiBearerAuth()
  updateUser(
    @Param('userId') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Delete(':userId')
  @ApiBearerAuth()
  removeUser(@Param('userId') id: string) {
    return this.userService.removeUser(id);
  }
}
