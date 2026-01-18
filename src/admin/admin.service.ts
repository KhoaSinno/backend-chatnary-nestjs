import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, DocumentStatus } from '@prisma/client';

// ===== CONSTANTS =====
const BYTES_PER_GB = 1024 * 1024 * 1024;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

// ===== TYPES =====
type SortField = 'name' | 'email' | 'createdAt' | 'storageUsed';
type SortOrder = 'asc' | 'desc';

interface GetUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
  role?: Role;
  isActive?: boolean;
  sortBy?: SortField;
  sortOrder?: SortOrder;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) { }

  // ===== 1. DASHBOARD OVERVIEW (Enhanced) =====
  async getDashboardStats() {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      // User stats
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      newUsersLastMonth,
      roleDistribution,

      // Document stats
      totalDocs,
      storageStats,
      documentStatusBreakdown,

      // Project & Chat stats
      totalProjects,
      totalChats,
    ] = await Promise.all([
      // Total users (excluding banned)
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isDeleted: false } }),

      // New users this month
      this.prisma.user.count({
        where: { createdAt: { gte: startOfThisMonth } },
      }),

      // New users last month (for comparison)
      this.prisma.user.count({
        where: {
          createdAt: { gte: startOfLastMonth, lt: startOfThisMonth },
        },
      }),

      // Role distribution
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),

      // Document count
      this.prisma.document.count(),

      // Storage sum
      this.prisma.document.aggregate({ _sum: { size: true } }),

      // Document status breakdown
      this.prisma.document.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // Projects count
      this.prisma.project.count(),

      // Chats count
      this.prisma.chat.count(),
    ]);

    // Calculate growth percentage
    const userGrowth = newUsersLastMonth > 0
      ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth * 100).toFixed(1)
      : newUsersThisMonth > 0 ? '100' : '0';

    // Format role distribution
    const roles = roleDistribution.reduce((acc, item) => {
      acc[item.role] = item._count.role;
      return acc;
    }, {} as Record<Role, number>);

    // Format document status
    const documentStatus = documentStatusBreakdown.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<DocumentStatus, number>);

    const totalStorageBytes = storageStats._sum.size || 0;
    const totalStorageGB = (totalStorageBytes / BYTES_PER_GB).toFixed(2);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        banned: totalUsers - activeUsers,
        newThisMonth: newUsersThisMonth,
        newLastMonth: newUsersLastMonth,
        growthPercent: `${userGrowth}%`,
        byRole: {
          admin: roles.ADMIN || 0,
          user: roles.USER || 0,
          guest: roles.GUEST || 0,
          liberian: roles.LIBERIAN || 0,
        },
      },
      documents: {
        total: totalDocs,
        byStatus: {
          pending: documentStatus.PENDING || 0,
          processing: documentStatus.PROCESSING || 0,
          done: documentStatus.DONE || 0,
          error: documentStatus.ERROR || 0,
        },
      },
      storage: {
        usedBytes: totalStorageBytes,
        usedGB: `${totalStorageGB} GB`,
      },
      projects: {
        total: totalProjects,
      },
      chats: {
        total: totalChats,
      },
      serverStatus: 'HEALTHY',
      generatedAt: now.toISOString(),
    };
  }

  // ===== 2. USER MANAGEMENT (Enhanced with Sorting & Filtering) =====
  async getUsers(options: GetUsersOptions = {}) {
    const {
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      search,
      role,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    // Validate pagination
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(Math.max(1, limit), MAX_LIMIT);
    const skip = (validatedPage - 1) * validatedLimit;

    // Build where condition
    const whereCondition: any = {};

    // Search filter
    if (search?.trim()) {
      whereCondition.OR = [
        { email: { contains: search.trim(), mode: 'insensitive' } },
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { username: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    // Role filter
    if (role) {
      whereCondition.role = role;
    }

    // Active/Banned filter
    if (typeof isActive === 'boolean') {
      whereCondition.isDeleted = !isActive;
    }

    // Build orderBy
    const orderBy = { [sortBy]: sortOrder };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: whereCondition,
        skip,
        take: validatedLimit,
        orderBy,
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          isDeleted: true,
          storageUsed: true,
          storageLimit: true,
          _count: {
            select: {
              ownedDocuments: true,
              projects: true,
              chats: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where: whereCondition }),
    ]);

    // Transform response with calculated fields
    const transformedUsers = users.map((user) => ({
      ...user,
      storageUsed: Number(user.storageUsed),
      storageLimit: Number(user.storageLimit),
      storageUsedPercent: user.storageLimit > 0
        ? ((Number(user.storageUsed) / Number(user.storageLimit)) * 100).toFixed(1)
        : '0',
      documentsCount: user._count.ownedDocuments,
      projectsCount: user._count.projects,
      chatsCount: user._count.chats,
      _count: undefined, // Remove original _count
    }));

    const lastPage = Math.ceil(total / validatedLimit);

    return {
      data: transformedUsers,
      meta: {
        total,
        page: validatedPage,
        limit: validatedLimit,
        lastPage,
        hasNextPage: validatedPage < lastPage,
        hasPrevPage: validatedPage > 1,
      },
    };
  }

  // ===== 3. BAN / UNBAN USER (Enhanced with Validation & Logging) =====
  async toggleUserBan(userId: string, adminId?: string) {
    // Validate UUID format
    if (!this.isValidUUID(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    // Find user with current status
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isDeleted: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Prevent banning admin users (safety check)
    if (user.role === Role.ADMIN && !user.isDeleted) {
      throw new BadRequestException('Cannot ban admin users');
    }

    const newStatus = !user.isDeleted;

    // Update user status
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isDeleted: newStatus },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isDeleted: true,
        updatedAt: true,
      },
    });

    // Log the action
    this.logger.log(
      `User ${user.email} was ${newStatus ? 'BANNED' : 'UNBANNED'}${adminId ? ` by admin ${adminId}` : ''}`
    );

    return {
      success: true,
      action: newStatus ? 'BANNED' : 'UNBANNED',
      user: updatedUser,
      message: `User ${user.email} has been ${newStatus ? 'banned' : 'unbanned'} successfully`,
    };
  }

  // ===== HELPER METHODS =====
  private isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }
}

