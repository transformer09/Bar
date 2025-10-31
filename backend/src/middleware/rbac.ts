import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

type UserRole = 'manager' | 'bartender' | 'chef' | 'waiter' | 'support' | 'cashier' | 'owner';

const PERMISSIONS: Record<UserRole, Record<string, boolean>> = {
  owner: {
    'inventory:read': true,
    'bar:read': true,
    'kitchen:read': true,
    'staff:read': true,
    'reports:read': true,
    'reports:export': true,
    'pos:read': true,
    'cashier:read': true,
    'owner:analytics': true,
    'owner:dashboard': true,
    'owner:activity': true,
    'owner:notifications': true,
    'dashboard:full': true,
  },
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
    'pos:create': true,
    'pos:read': true,
    'cashier:read': true,
    'cashier:confirm': true,
    'admin:write': true,
    'dashboard:full': true,
  },
  bartender: {
    'inventory:read': true,
    'bar:read': true,
    'bar:create': true,
    'kitchen:create': true,
    'kitchen:read': true,
    'pos:create': true,
    'pos:read': true,
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
    'pos:create': true,
    'pos:read': true,
    'dashboard:kitchen': true,
  },
  cashier: {
    'pos:read': true,
    'cashier:read': true,
    'cashier:confirm': true,
    'receipts:read': true,
    'receipts:generate': true,
    'dashboard:payments': true,
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
