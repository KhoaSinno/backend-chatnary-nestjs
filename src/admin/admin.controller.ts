import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

type SortField = 'name' | 'email' | 'createdAt' | 'storageUsed';
type SortOrder = 'asc' | 'desc';

@Controller('admin')
@Roles(Role.ADMIN)

export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: Role,
    @Query('isActive') isActive?: string,
    @Query('sortBy') sortBy?: SortField,
    @Query('sortOrder') sortOrder?: SortOrder,
  ) {
    return this.adminService.getUsers({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      role,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      sortBy,
      sortOrder,
    });
  }

  @Patch('users/:userId/ban')
  toggleBan(@Param('userId') userId: string) {
    return this.adminService.toggleUserBan(userId);
  }
}
