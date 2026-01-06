import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // -- ALL USERS: ADMIN ONLY --
  findAllUsers() {
    return this.prisma.users.findMany();
  }

  // -- FIND USER BY ID --
  findUserById(id: string) {
    return this.prisma.users.findUnique({
      where: { id },
    });
  }

  // -- CREATE USER --
  createNewUser(createUserDto: CreateUserDto) {
    return this.prisma.users.create({
      data: createUserDto,
    });
  }

  // -- UPDATE USER --
  updateUser(id: string, updateUserDto: UpdateUserDto) {
    // TODO: logic update password
    return this.prisma.users.update({
      where: { id },
      data: updateUserDto,
    });
  }

  // -- DELETE USER --
  removeUser(id: string) {
    // TODO: Projected logic del
    return this.prisma.users.delete({ where: { id } });
  }
}
