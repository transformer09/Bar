export interface Permission {
  resource: string;
  actions: string[];
  conditions?: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  is_active: boolean;
  modules: string[];
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: Date;
  preferences: Record<string, any>;
}

export interface RolePermission {
  role_id: string;
  role_name: string;
  display_name: string;
  description: string;
  permissions: string[];
  route_access: string[];
  module_access: string[];
  is_system: boolean;
  is_active: boolean;
  created_by: string;
  updated_at: Date;
}

interface PermissionConfig {
  [key: string]: {
    read: string[];
    write: string[];
    delete: string[];
    conditions?: Record<string, any>;
  };
}

export class RolePermissionService {
  private roles: Map<string, Role> = new Map();
  private permissions: PermissionConfig = {};

  constructor() {
    this.initializeDefaultRoles();
    this.loadPermissions();
  }

  private initializeDefaultRoles(): void {
    const defaultRoles: Role[] = [
      {
        id: 'admin',
        name: 'Administrator',
        display_name: 'System Administrator',
        description: 'Full system access and configuration',
        permissions: ['*'], // Wildcard permission
        is_active: true,
        modules: ['*'], // All modules
        route_access: ['*'], // All routes
        is_system: true,
        created_at: new Date('2024-01-01T00:00:00.000Z'),
        updated_at: new Date('2024-01-01T00:00.000Z')
      },
      {
        id: 'owner',
        name: 'Business Owner',
        display_name: 'Business Owner',
        description: 'Complete business oversight and analytics',
        permissions: [
          'view_all_data',
          'view_reports',
          'manage_staff',
          'configure_system',
          'access_all_apps'
        ],
        is_active: true,
        modules: ['pos', 'inventory', 'receipts', 'notifications'],
        route_access: ['owner', 'dashboard', 'reports', 'settings'],
        is_system: false,
        created_at: new Date('2024-01-01T00:00.000Z'),
        updated_at: new Date('2024-01-01T00:00.000Z')
      },
      {
        id: 'manager',
        name: 'Manager',
        display_name: 'Restaurant Manager',
        description: 'Daily operations and staff management',
        permissions: [
          'view_pos_data',
          'manage_inventory',
          'view_reports',
          'manage_staff',
          'process_payments',
          'view_analytics',
          'access_pos',
          'access_cashier',
          'access_bar',
          'access_kitchen',
          'access_reports'
        ],
        is_active: true,
        modules: ['pos', 'inventory', 'receipts', 'notifications'],
        route_access: ['manager', 'dashboard', 'reports', 'settings'],
        is_system: false,
        created_at: new Date('2024-01-01T00:00.000Z'),
        updated_at: new Date('2024-01-01T00:00.000Z')
      },
      {
        id: 'cashier',
        name: 'Cashier',
        display_name: 'Cashier',
        description: 'Payment processing and receipt generation',
        permissions: [
          'process_payments',
          'generate_receipts',
          'view_pos_data',
          'access_cashier_app',
          'view_analytics'
        ],
        is_active: true,
        modules: ['pos', 'receipts'],
        route_access: ['cashier', 'pos'],
        is_system: false,
        created_at: new Date('2024-01-01T00:00.000Z'),
        updated_at: new Date('2024-01-01T00:00.000Z')
      },
      {
        id: 'bartender',
        name: 'Bartender',
        display_name: 'Bartender',
        description: 'Bar operations and drink preparation',
        permissions: [
          'view_bar_orders',
          'prepare_drinks',
          'update_order_status',
          'update_stock',
          'access_bar_app',
          'access_barman_app'
        ],
        is_active: true,
        modules: ['pos', 'inventory', 'notifications'],
        route_access: ['bartender', 'bar_app'],
        is_system: false,
        created_at: new Date('2024-01-01T00:00.000Z'),
        updated_at: new Date('2024-01-01T00:00.000Z')
      },
      {
        id: 'waiter',
        name: 'Waiter',
        display_name: 'Waiter',
        description: 'Table service and order management',
        permissions: [
          'take_orders',
          'view_kitchen_orders',
          'update_order_status',
          'manage_tables',
          'view_analytics',
          'access_waiter_app'
        ],
        is_active: true,
        modules: ['pos', 'inventory', 'notifications'],
        route_access: ['waiter', 'waiter_app'],
        is_system: false,
        created_at: new Date('2024-01-01T00:00.000Z'),
        updated_at: new Date('2024-01-01T00:00.000Z')
      },
      {
        id: 'kitchen_chef',
        name: 'Chef',
        display_name: 'Kitchen Chef',
        description: 'Kitchen operations and food preparation',
        permissions: [
          'view_kitchen_orders',
          'update_order_status',
          'mark_item_ready',
          'manage_kitchen_app',
          'update_inventory'
        ],
        is_active: true,
        modules: ['pos', 'inventory', 'notifications'],
        route_access: ['kitchen_chef', 'kitchen_app'],
        is_system: false,
        created_at: new Date('2024-01-01T00:00.000Z'),
        updated_at: new Date('2024-01-01T00:00.000Z')
      },
      {
        id: 'receptionist',
        name: 'Receptionist',
        display_name: 'Receptionist',
        description: 'Guest check-in/out and reservations',
        permissions: [
          'manage_reservations',
          'manage_rooms',
          'check_guests',
          'notify_cashier',
          'access_receptionist_app',
          view_analytics'
        ],
        is_active: true,
        modules: ['pos', 'reservations', 'notifications'],
        route_access: ['receptionist_app'],
        is_system: false,
        created_at: new Date('2024-01-01T00:00.000Z'),
        updated_at: new Date('2024-01-01T00:00.000Z')
      },
      {
        id: 'lodge_manager',
        name: 'Lodge Manager',
        display_name: 'Lodge Manager',
        description: 'Hotel room and booking management',
        permissions: [
          'manage_reservations',
          'manage_rooms',
          'set_room_rates',
          'view_analytics',
          'manage_lodge_app',
          'access_receptionist_app'
        ],
        is_active: true,
        modules: ['reservations', 'analytics'],
        route_access: ['lodge_manager'],
        is_system: false,
        created_at: new Date('2024-01-01T00:00.000Z'),
        updated_at: new Date('2024-01-01T00:00.000Z')
      },
      {
        id: 'credit_manager',
        name: 'Credit Manager',
        display_name: 'Credit Manager',
        description: 'Loan and credit management',
        permissions: [
          'create_loans',
          'manage_loans',
          'view_analytics',
          'send_reminders',
          'access_credit_app',
          view_analytics'
        ],
        is_active: true,
        modules: ['credit', 'notifications'],
        route_access: ['credit_manager'],
        is_system: false,
        created_at: new Date('2024-01-01T00:00.000Z'),
        updated_at: new Date('2024-01-01T00:00.000Z')
      }
    ];

    // Store roles in the roles map
    defaultRoles.forEach(role => {
      this.roles.set(role.id, role);
    });

    // Load custom permissions if any
    this.loadPermissions();
  }

  private loadPermissions(): void {
    // Load permissions configuration from database
    // For now, use default permissions
    this.permissions = {
      '*': {
        read: ['*'],
        write: ['*'],
        delete: ['*']
      },
      'manager': {
        read: ['pos.*', 'inventory.*', 'reports.*', 'staff.*', 'analytics.*'],
        write: ['pos.*', 'inventory.*', 'staff.*', 'reports.*'],
        delete: []
      },
      'cashier': {
        read: ['pos.*', 'receipts.*', 'analytics.*'],
        write: ['pos.*', 'receipts.*', 'analytics.*'],
        delete: []
      },
      'bartender': {
        read: ['pos.*', 'bar.*', 'inventory.*'],
        write: ['pos.*', 'bar.*', 'inventory.*'],
        delete: []
      },
      'waiter': {
        read: ['pos.*', 'orders.*', 'tables.*', 'kitchen.*'],
        write: ['pos.*', 'orders.*', 'tables.*'],
        delete: []
      },
      'kitchen_chef': {
        read: ['orders.*', 'kitchen.*'],
        write: ['orders.*', 'inventory.*'],
        delete: []
      },
      'receptionist': {
        read: ['reservations.*', 'rooms.*', 'guests.*'],
        write: ['reservations.*', 'rooms.*', 'guests.*'],
        delete: []
      },
      'lodge_manager': {
        read: ['reservations.*', 'rooms.*', 'rates.*', 'analytics.*'],
        write: ['reservations.*', 'rooms.*', 'rates.*', 'analytics.*'],
        delete: []
      }
    };
  }

  // Get user permissions
  getUserPermissions(userId: string[]): string[] {
    const user = this.getUserById(userId);
    if (!user) return [];

    // Get role permissions
    const role = this.roles.get(user.role);
    if (!role) return [];

    // Get all permissions for this role
    const roleConfig = this.permissions[role] || {};
    return Object.keys(roleConfig).filter(perm => roleConfig[perm].includes('read') || roleConfig[perm].includes('write') || roleConfig[perm].includes('delete')));
  }

  // Check if user has specific permission
  hasPermission(userId: string, permission: string): boolean {
    const user = this.getUserById(userId);
    if (!user) return false;

    const permissions = this.getUserPermissions(userId);
    return permissions.includes(permission) || this.getUserPermissions(userId).includes('*');
  }

  // Check if user can access route
  canAccessRoute(userId: string, route: string): boolean {
    const user = this.getUserById(userId);
    if (!user) return false;

    const role = this.roles.get(user.role);
    if (!role) return false;

    // Check route access for role
    const routeConfig = role.route_access || [];
    return routeConfig.includes('*') || routeConfig.includes(route);
  }

  // Get user by ID
  private getUserById(userId: string): User | null {
    // This would typically call a userService
    // For now, return null as placeholder
    return null;
  }

  // Get all available roles
  getAllRoles(): Role[] {
    return Array.from(this.roles.values());
  }

  // Get permissions for role
  getRolePermissions(roleId: string): string[] {
    const role = this.roles.get(roleId);
    const roleConfig = this.permissions[roleId] || {};
    return Object.keys(roleConfig).filter(perm => roleConfig[perm].includes('read') || roleConfig[perm].includes('write') || roleConfig[perm].includes('delete')));
  }

  // Create new role
  createRole(roleData: Partial<Role>): Role {
    const role: Role = {
      id: roleData.id || `role_${Date.now()}`,
      name: roleData.name || 'New Role',
      display_name: roleData.display_name || roleData.name,
      description: roleData.description || 'Custom role description',
      permissions: roleData.permissions || [],
      is_active: roleData.is_active ?? true,
      modules: roleData.modules || [],
      route_access: roleData.route_access || [],
      is_system: roleData.is_system || false,
      created_at: new Date(),
      updated_at: Date()
    };

    this.roles.set(role.id, role);
    return role;
  }

  // Update existing role
  updateRole(roleId: string, updates: Partial<Role>): void {
    const existing = this.roles.get(roleId);
    if (!existing) return;

    const updated = { ...existing, ...updates, updated_at: new Date() };
    this.roles.set(roleId, updated);
  }

  // Update multiple roles
  updateRoles(updates: Array<{id: string; updates: Partial<Role>}>): void {
    updates.forEach(({ id, updates }) => {
      const existing = this.roles.get(id);
      if (existing) {
        const updated = { ...existing, ...updates, updated_at: new Date() };
        this.roles.set(id, updated);
      }
    });
  }

  // Delete role
  deleteRole(roleId: string): void {
    const existing = this.roles.get(roleId);
    if (existing && !existing.is_system) {
      this.roles.delete(roleId);
    }
  }

  // Validate permission
  validatePermission(userId: string, action: string, resource?: string): boolean {
    return this.hasPermission(userId, `${action}:${resource}`) || this.hasPermission(userId, '*');
  }

  // Get all permissions for a user
  getAllPermissionsForUser(userId: string): string[] {
    return this.getUserPermissions(userId);
  }
}