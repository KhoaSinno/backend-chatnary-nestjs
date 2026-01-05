// Prevent out side admin role access
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Role } from '@prisma/client';

@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(private readonly getOwnerIdFn: (req) => Promise<string>) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const userId = req.user.userId;
    const ownerId = await this.getOwnerIdFn(req);

    if (ownerId !== userId && req.user.role !== Role.ADMIN) {
      throw new ForbiddenException('Not allowed: not owner');
    }

    return true;
  }
}

// Usage example: restrict to use global
// @UseGuards(new OwnerGuard(async (req) => {
//   const doc = await this.documentService.findOne(req.params.id);
//   return doc.ownerId;
// }))
