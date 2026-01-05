import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from '../types';
import { Role } from '../types';

/**
 * Guard to ensure users can only access resources within their school (tenant).
 * SuperAdmin can access all schools.
 */
@Injectable()
export class SchoolGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user as AuthenticatedUser;

        if (!user) {
            return false;
        }

        // SuperAdmin can access any school
        if (user.role === Role.SUPER_ADMIN) {
            return true;
        }

        // Get schoolId from request params or body
        const schoolIdFromParams = request.params?.schoolId;
        const schoolIdFromBody = request.body?.schoolId;
        const schoolIdFromQuery = request.query?.schoolId;

        const requestedSchoolId = schoolIdFromParams || schoolIdFromBody || schoolIdFromQuery;

        // If no specific school is requested, allow (controller will use user's school)
        if (!requestedSchoolId) {
            return true;
        }

        // Check if user belongs to the requested school
        if (user.schoolId !== requestedSchoolId) {
            throw new ForbiddenException('You do not have access to this school');
        }

        return true;
    }
}
