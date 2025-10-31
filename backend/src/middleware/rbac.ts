import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

type UserRole = 'manager' | 'bartender' | 'chef' | 'waiter' | 'support';

const PERMISSIONS: Record<UserRole, Record<string, boolean>> = {
  manager: {
    'inventory:read': true,
    'inventory:create': true,
    'inventory:update': true,
    'inventory:delete': true,
    'purchaseorders:read': true,
    'purchaseorders:create': true,
    'purchaseorders:update': true,
    'purchaseorders:delete': true,
    'bar:read': true,
    'bar:create': true,
    'bar:update': true,
    'bar:delete': true,
    'kitchen:read': true,
    'kitchen:assign': true,
    'staff:read': true,
    'staff:create': true,
    'staff:update': true,
    'staff:delete': true,
    'reports:read': true,
    'reports:export': true,
    'dashboard:full': true,
  },
  bartender: {
    'inventory:read': true,
    'bar:read': true,
    'bar:create': true,
    'kitchen:create': true,
    'kitchen:read': true,
    'dashboard:sales': true,
  },
  chef: {
    'inventory:read': true,
    'inventory:update': true,
    'kitchen:read': true,
    'kitchen:update': true,
    'dashboard:kitchen': true,
  },
  waiter: {
    'inventory:read': true,
    'kitchen:create': true,
    'kitchen:read': true,
    'dashboard:kitchen': true,
  },
  support: {
    'inventory:read': true,
    'dashboard:limited': true,
  },
};

export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRole = req.user.role as UserRole;
    const hasPermission = PERMISSIONS[userRole]?.[permission];

    if (!hasPermission) {
      return res.status(403).json({
        error: 'You do not have permission to perform this action',
      });
    }

    next();
  };
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role as UserRole)) {
      return res.status(403).json({
        error: 'You do not have permission to perform this action',
      });
    }

    next();
  };
};
