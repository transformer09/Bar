import { EventEmitter } from 'events';
import { eventSystem, EventData } from '../../events/eventSystem';
import { rolePermissionService } from '../../services/rolePermissionService';

export interface AppConfiguration {
  id: string;
  name: string;
  display_name: string;
  description: string;
  icon: string;
  color: string;
  target_role: string;
  module_type: 'pos' | 'kitchen' | 'bar' | 'management' | 'lodge' | 'admin';
  is_enabled: boolean;
  is_default: boolean;
  permissions: string[];
  navigation: AppNavigation[];
  widgets: AppWidget[];
  settings: AppSettings;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface AppNavigation {
  id: string;
  label: string;
  icon: string;
  route: string;
  permissions: string[];
  order: number;
  is_visible: boolean;
  children?: AppNavigation[];
}

export interface AppWidget {
  id: string;
  name: string;
  type: 'chart' | 'table' | 'metric' | 'activity' | 'quick_action' | 'custom';
  title: string;
  size: { width: number; height: number };
  position: { x: number; y: number };
  data_source: string;
  refresh_interval: number;
  config: Record<string, any>;
  permissions: string[];
  is_visible: boolean;
}

export interface AppSettings {
  theme: {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    background_color: string;
    text_color: string;
    font_family: string;
    font_size: number;
  };
  layout: {
    sidebar_collapsed: boolean;
    show_metrics: boolean;
    compact_mode: boolean;
    show_quick_actions: boolean;
  };
  functionality: {
    auto_refresh: boolean;
    refresh_interval: number;
    sound_enabled: boolean;
    vibration_enabled: boolean;
    notification_sound: string;
  };
  display: {
    currency_symbol: string;
    date_format: string;
    time_format: string;
    number_format: string;
    language: string;
  };
}

export interface AppSession {
  id: string;
  user_id: string;
  app_id: string;
  session_token: string;
  started_at: Date;
  last_activity: Date;
  is_active: boolean;
  device_info: {
    device_type: 'mobile' | 'tablet' | 'desktop';
    user_agent: string;
    screen_resolution: string;
  };
  location_info?: {
    table_id?: string;
    room_id?: string;
    station_id?: string;
  };
}

export class AppServices {
  private eventEmitter: EventEmitter;
  private apps: Map<string, AppConfiguration> = new Map();
  private sessions: Map<string, AppSession> = new Map();
  private userSessions: Map<string, string[]> = new Map(); // userId -> sessionIds

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.initializeEventHandlers();
    this.loadDefaultApps();
  }

  private initializeEventHandlers(): void {
    // Listen to role changes to update app availability
    this.eventEmitter.on('user_role_changed', (data) => {
      this.updateUserAppAccess(data.user_id, data.new_role);
    });

    // Listen to login events to create sessions
    this.eventEmitter.on('user_login', (data) => {
      this.createAppSession(data.user_id, data.role, data.device_info);
    });

    // Listen to logout events to clean sessions
    this.eventEmitter.on('user_logout', (data) => {
      this.endUserSessions(data.user_id);
    });
  }

  private loadDefaultApps(): void {
    // Manager App
    const managerApp: AppConfiguration = {
      id: 'app_manager',
      name: 'manager',
      display_name: 'Manager Dashboard',
      description: 'Complete business oversight and management',
      icon: 'briefcase',
      color: '#4a90e2',
      target_role: 'manager',
      module_type: 'management',
      is_enabled: true,
      is_default: true,
      permissions: ['view_dashboard', 'manage_staff', 'view_reports', 'manage_inventory', 'view_analytics'],
      navigation: [
        {
          id: 'nav_dashboard',
          label: 'Dashboard',
          icon: 'dashboard',
          route: '/manager/dashboard',
          permissions: ['view_dashboard'],
          order: 1,
          is_visible: true
        },
        {
          id: 'nav_orders',
          label: 'Orders',
          icon: 'shopping_cart',
          route: '/manager/orders',
          permissions: ['view_orders'],
          order: 2,
          is_visible: true
        },
        {
          id: 'nav_staff',
          label: 'Staff',
          icon: 'people',
          route: '/manager/staff',
          permissions: ['manage_staff'],
          order: 3,
          is_visible: true,
          children: [
            {
              id: 'nav_staff_schedule',
              label: 'Schedule',
              icon: 'calendar',
              route: '/manager/staff/schedule',
              permissions: ['manage_schedule'],
              order: 1,
              is_visible: true
            },
            {
              id: 'nav_staff_performance',
              label: 'Performance',
              icon: 'assessment',
              route: '/manager/staff/performance',
              permissions: ['view_performance'],
              order: 2,
              is_visible: true
            }
          ]
        },
        {
          id: 'nav_inventory',
          label: 'Inventory',
          icon: 'inventory',
          route: '/manager/inventory',
          permissions: ['manage_inventory'],
          order: 4,
          is_visible: true
        },
        {
          id: 'nav_reports',
          label: 'Reports',
          icon: 'bar_chart',
          route: '/manager/reports',
          permissions: ['view_reports'],
          order: 5,
          is_visible: true
        },
        {
          id: 'nav_settings',
          label: 'Settings',
          icon: 'settings',
          route: '/manager/settings',
          permissions: ['manage_settings'],
          order: 6,
          is_visible: true
        }
      ],
      widgets: [
        {
          id: 'widget_daily_revenue',
          name: 'Daily Revenue',
          type: 'metric',
          title: 'Daily Revenue',
          size: { width: 3, height: 2 },
          position: { x: 0, y: 0 },
          data_source: 'boss_analytics:daily_revenue',
          refresh_interval: 30000,
          config: {
            currency: '$',
            format: 'currency',
            show_trend: true
          },
          permissions: ['view_dashboard'],
          is_visible: true
        },
        {
          id: 'widget_active_orders',
          name: 'Active Orders',
          type: 'table',
          title: 'Active Orders',
          size: { width: 6, height: 4 },
          position: { x: 3, y: 0 },
          data_source: 'pos:active_orders',
          refresh_interval: 10000,
          config: {
            max_items: 10,
            columns: ['order_number', 'customer', 'amount', 'status', 'time']
          },
          permissions: ['view_orders'],
          is_visible: true
        },
        {
          id: 'widget_staff_activity',
          name: 'Staff Activity',
          type: 'activity',
          title: 'Recent Staff Activity',
          size: { width: 3, height: 4 },
          position: { x: 0, y: 2 },
          data_source: 'boss_analytics:staff_activity',
          refresh_interval: 15000,
          config: {
            max_items: 15,
            show_avatars: true
          },
          permissions: ['manage_staff'],
          is_visible: true
        }
      ],
      settings: {
        theme: {
          primary_color: '#4a90e2',
          secondary_color: '#f5f7fa',
          accent_color: '#5cb85c',
          background_color: '#ffffff',
          text_color: '#333333',
          font_family: 'Inter',
          font_size: 14
        },
        layout: {
          sidebar_collapsed: false,
          show_metrics: true,
          compact_mode: false,
          show_quick_actions: true
        },
        functionality: {
          auto_refresh: true,
          refresh_interval: 30000,
          sound_enabled: true,
          vibration_enabled: false,
          notification_sound: 'default'
        },
        display: {
          currency_symbol: '$',
          date_format: 'MM/DD/YYYY',
          time_format: '12h',
          number_format: 'en-US',
          language: 'en'
        }
      },
      created_by: 'system',
      created_at: new Date(),
      updated_at: new Date()
    };

    // Waiter App
    const waiterApp: AppConfiguration = {
      id: 'app_waiter',
      name: 'waiter',
      display_name: 'Waiter Assistant',
      description: 'Mobile-optimized order taking and table management',
      icon: 'restaurant',
      color: '#5cb85c',
      target_role: 'waiter',
      module_type: 'pos',
      is_enabled: true,
      is_default: true,
      permissions: ['take_orders', 'view_menu', 'manage_tables', 'view_order_status'],
      navigation: [
        {
          id: 'nav_tables',
          label: 'Tables',
          icon: 'table_restaurant',
          route: '/waiter/tables',
          permissions: ['manage_tables'],
          order: 1,
          is_visible: true
        },
        {
          id: 'nav_menu',
          label: 'Menu',
          icon: 'menu_book',
          route: '/waiter/menu',
          permissions: ['view_menu'],
          order: 2,
          is_visible: true
        },
        {
          id: 'nav_orders',
          label: 'My Orders',
          icon: 'receipt_long',
          route: '/waiter/orders',
          permissions: ['view_my_orders'],
          order: 3,
          is_visible: true
        },
        {
          id: 'nav_profile',
          label: 'Profile',
          icon: 'person',
          route: '/waiter/profile',
          permissions: ['view_profile'],
          order: 4,
          is_visible: true
        }
      ],
      widgets: [
        {
          id: 'widget_my_tables',
          name: 'My Tables',
          type: 'table',
          title: 'Assigned Tables',
          size: { width: 4, height: 3 },
          position: { x: 0, y: 0 },
          data_source: 'tables:assigned_tables',
          refresh_interval: 10000,
          config: {
            show_status: true,
            show_order_count: true
          },
          permissions: ['manage_tables'],
          is_visible: true
        },
        {
          id: 'widget_quick_actions',
          name: 'Quick Actions',
          type: 'quick_action',
          title: 'Quick Actions',
          size: { width: 2, height: 3 },
          position: { x: 4, y: 0 },
          data_source: 'actions:waiter_quick_actions',
          refresh_interval: 0,
          config: {
            actions: [
              { label: 'New Order', icon: 'add_shopping_cart', action: 'new_order' },
              { label: 'Take Payment', icon: 'payments', action: 'take_payment' },
              { label: 'Table Status', icon: 'event_seat', action: 'table_status' }
            ]
          },
          permissions: ['take_orders'],
          is_visible: true
        }
      ],
      settings: {
        theme: {
          primary_color: '#5cb85c',
          secondary_color: '#f8f9fa',
          accent_color: '#ff6b6b',
          background_color: '#ffffff',
          text_color: '#333333',
          font_family: 'Roboto',
          font_size: 16 // Larger for mobile
        },
        layout: {
          sidebar_collapsed: true,
          show_metrics: false,
          compact_mode: true,
          show_quick_actions: true
        },
        functionality: {
          auto_refresh: true,
          refresh_interval: 10000,
          sound_enabled: true,
          vibration_enabled: true,
          notification_sound: 'bell'
        },
        display: {
          currency_symbol: '$',
          date_format: 'MMM DD',
          time_format: '12h',
          number_format: 'en-US',
          language: 'en'
        }
      },
      created_by: 'system',
      created_at: new Date(),
      updated_at: new Date()
    };

    // Cashier App
    const cashierApp: AppConfiguration = {
      id: 'app_cashier',
      name: 'cashier',
      display_name: 'Cashier Terminal',
      description: 'Payment processing and receipt management',
      icon: 'payments',
      color: '#f39c12',
      target_role: 'cashier',
      module_type: 'pos',
      is_enabled: true,
      is_default: true,
      permissions: ['process_payments', 'view_orders', 'print_receipts', 'manage_cash_drawer'],
      navigation: [
        {
          id: 'nav_dashboard',
          label: 'Dashboard',
          icon: 'dashboard',
          route: '/cashier/dashboard',
          permissions: ['view_dashboard'],
          order: 1,
          is_visible: true
        },
        {
          id: 'nav_payments',
          label: 'Payments',
          icon: 'payment',
          route: '/cashier/payments',
          permissions: ['process_payments'],
          order: 2,
          is_visible: true
        },
        {
          id: 'nav_cash_drawer',
          label: 'Cash Drawer',
          icon: 'account_balance_wallet',
          route: '/cashier/cash-drawer',
          permissions: ['manage_cash_drawer'],
          order: 3,
          is_visible: true
        },
        {
          id: 'nav_reports',
          label: 'Reports',
          icon: 'summarize',
          route: '/cashier/reports',
          permissions: ['view_reports'],
          order: 4,
          is_visible: true
        }
      ],
      widgets: [
        {
          id: 'widget_payment_queue',
          name: 'Payment Queue',
          type: 'table',
          title: 'Payments to Process',
          size: { width: 6, height: 4 },
          position: { x: 0, y: 0 },
          data_source: 'payments:pending_payments',
          refresh_interval: 5000,
          config: {
            auto_refresh: true,
            sound_alert: true
          },
          permissions: ['process_payments'],
          is_visible: true
        },
        {
          id: 'widget_cash_summary',
          name: 'Cash Summary',
          type: 'metric',
          title: 'Today\'s Cash',
          size: { width: 3, height: 2 },
          position: { x: 6, y: 0 },
          data_source: 'cash_drawer:daily_summary',
          refresh_interval: 60000,
          config: {
            show_breakdown: true
          },
          permissions: ['manage_cash_drawer'],
          is_visible: true
        }
      ],
      settings: {
        theme: {
          primary_color: '#f39c12',
          secondary_color: '#fef9e7',
          accent_color: '#27ae60',
          background_color: '#ffffff',
          text_color: '#2c3e50',
          font_family: 'Montserrat',
          font_size: 14
        },
        layout: {
          sidebar_collapsed: false,
          show_metrics: true,
          compact_mode: false,
          show_quick_actions: true
        },
        functionality: {
          auto_refresh: true,
          refresh_interval: 5000,
          sound_enabled: true,
          vibration_enabled: false,
          notification_sound: 'cash_register'
        },
        display: {
          currency_symbol: '$',
          date_format: 'MM/DD/YYYY',
          time_format: '12h',
          number_format: 'en-US',
          language: 'en'
        }
      },
      created_by: 'system',
      created_at: new Date(),
      updated_at: new Date()
    };

    // Bartender App
    const bartenderApp: AppConfiguration = {
      id: 'app_bartender',
      name: 'bartender',
      display_name: 'Bar Manager',
      description: 'Bar operations and drink preparation',
      icon: 'local_bar',
      color: '#9b59b6',
      target_role: 'bartender',
      module_type: 'bar',
      is_enabled: true,
      is_default: true,
      permissions: ['view_bar_orders', 'prepare_drinks', 'manage_bar_inventory', 'process_bar_payments'],
      navigation: [
        {
          id: 'nav_orders',
          label: 'Bar Orders',
          icon: 'liquor',
          route: '/bartender/orders',
          permissions: ['view_bar_orders'],
          order: 1,
          is_visible: true
        },
        {
          id: 'nav_recipes',
          label: 'Recipes',
          icon: 'menu_book',
          route: '/bartender/recipes',
          permissions: ['view_recipes'],
          order: 2,
          is_visible: true
        },
        {
          id: 'nav_inventory',
          label: 'Bar Inventory',
          icon: 'inventory_2',
          route: '/bartender/inventory',
          permissions: ['manage_bar_inventory'],
          order: 3,
          is_visible: true
        },
        {
          id: 'nav_performance',
          label: 'Performance',
          icon: 'trending_up',
          route: '/bartender/performance',
          permissions: ['view_performance'],
          order: 4,
          is_visible: true
        }
      ],
      widgets: [
        {
          id: 'widget_drink_queue',
          name: 'Drink Queue',
          type: 'table',
          title: 'Drinks to Prepare',
          size: { width: 4, height: 5 },
          position: { x: 0, y: 0 },
          data_source: 'bar:drink_queue',
          refresh_interval: 3000,
          config: {
            show_priority: true,
            show_time_remaining: true
          },
          permissions: ['view_bar_orders'],
          is_visible: true
        },
        {
          id: 'widget_popular_drinks',
          name: 'Popular Drinks',
          type: 'chart',
          title: 'Top Drinks Today',
          size: { width: 4, height: 3 },
          position: { x: 4, y: 0 },
          data_source: 'bar:popular_drinks',
          refresh_interval: 300000,
          config: {
            chart_type: 'bar',
            max_items: 10
          },
          permissions: ['view_performance'],
          is_visible: true
        }
      ],
      settings: {
        theme: {
          primary_color: '#9b59b6',
          secondary_color: '#f4ecf7',
          accent_color: '#e74c3c',
          background_color: '#ffffff',
          text_color: '#2c3e50',
          font_family: 'Poppins',
          font_size: 14
        },
        layout: {
          sidebar_collapsed: false,
          show_metrics: true,
          compact_mode: false,
          show_quick_actions: true
        },
        functionality: {
          auto_refresh: true,
          refresh_interval: 3000,
          sound_enabled: true,
          vibration_enabled: false,
          notification_sound: 'bell'
        },
        display: {
          currency_symbol: '$',
          date_format: 'MM/DD/YYYY',
          time_format: '12h',
          number_format: 'en-US',
          language: 'en'
        }
      },
      created_by: 'system',
      created_at: new Date(),
      updated_at: new Date()
    };

    this.apps.set(managerApp.id, managerApp);
    this.apps.set(waiterApp.id, waiterApp);
    this.apps.set(cashierApp.id, cashierApp);
    this.apps.set(bartenderApp.id, bartenderApp);
  }

  // Create app session for user
  createAppSession(userId: string, userRole: string, deviceInfo: any): AppSession | null {
    const app = this.getAppForRole(userRole);
    if (!app || !app.is_enabled) return null;

    const session: AppSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      app_id: app.id,
      session_token: this.generateSessionToken(),
      started_at: new Date(),
      last_activity: new Date(),
      is_active: true,
      device_info: {
        device_type: deviceInfo.device_type || 'desktop',
        user_agent: deviceInfo.user_agent || '',
        screen_resolution: deviceInfo.screen_resolution || ''
      }
    };

    this.sessions.set(session.id, session);

    // Track user sessions
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, []);
    }
    this.userSessions.get(userId)!.push(session.id);

    // Emit session created event
    eventSystem.emit('app_session_created', {
      session_id: session.id,
      user_id: userId,
      app_id: app.id,
      device_type: session.device_info.device_type
    }, 'app_services');

    return session;
  }

  // Get app for role
  getAppForRole(role: string): AppConfiguration | null {
    return Array.from(this.apps.values()).find(app => app.target_role === role && app.is_enabled) || null;
  }

  // Get all apps user has access to
  getUserApps(userId: string, userRole: string): AppConfiguration[] {
    return Array.from(this.apps.values()).filter(app => {
      if (!app.is_enabled) return false;
      if (app.target_role === userRole) return true;
      return rolePermissionService.hasPermission(userId, 'access_all_apps');
    });
  }

  // Get app configuration
  getApp(appId: string): AppConfiguration | null {
    return this.apps.get(appId) || null;
  }

  // Update app configuration
  updateApp(appId: string, updates: Partial<AppConfiguration>): boolean {
    const app = this.apps.get(appId);
    if (!app) return false;

    const updatedApp = { ...app, ...updates, updated_at: new Date() };
    this.apps.set(appId, updatedApp);

    // Emit app updated event
    eventSystem.emit('app_updated', {
      app_id: appId,
      updates: updates,
      updated_by: 'system'
    }, 'app_services');

    return true;
  }

  // Create custom app
  createApp(appData: Partial<AppConfiguration>, createdBy: string): AppConfiguration {
    const app: AppConfiguration = {
      id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: appData.name || 'custom_app',
      display_name: appData.display_name || 'Custom App',
      description: appData.description || 'Custom application',
      icon: appData.icon || 'apps',
      color: appData.color || '#4a90e2',
      target_role: appData.target_role || 'manager',
      module_type: appData.module_type || 'management',
      is_enabled: appData.is_enabled ?? true,
      is_default: false,
      permissions: appData.permissions || [],
      navigation: appData.navigation || [],
      widgets: appData.widgets || [],
      settings: appData.settings || this.getDefaultAppSettings(),
      created_by: createdBy,
      created_at: new Date(),
      updated_at: new Date()
    };

    this.apps.set(app.id, app);

    // Emit app created event
    eventSystem.emit('app_created', {
      app_id: app.id,
      app_name: app.display_name,
      target_role: app.target_role,
      created_by: createdBy
    }, 'app_services');

    return app;
  }

  private getDefaultAppSettings(): AppSettings {
    return {
      theme: {
        primary_color: '#4a90e2',
        secondary_color: '#f5f7fa',
        accent_color: '#5cb85c',
        background_color: '#ffffff',
        text_color: '#333333',
        font_family: 'Inter',
        font_size: 14
      },
      layout: {
        sidebar_collapsed: false,
        show_metrics: true,
        compact_mode: false,
        show_quick_actions: true
      },
      functionality: {
        auto_refresh: true,
        refresh_interval: 30000,
        sound_enabled: true,
        vibration_enabled: false,
        notification_sound: 'default'
      },
      display: {
        currency_symbol: '$',
        date_format: 'MM/DD/YYYY',
        time_format: '12h',
        number_format: 'en-US',
        language: 'en'
      }
    };
  }

  // Get session by token
  getSessionByToken(token: string): AppSession | null {
    return Array.from(this.sessions.values()).find(session => session.session_token === token && session.is_active) || null;
  }

  // Update session activity
  updateSessionActivity(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.is_active) return false;

    session.last_activity = new Date();
    return true;
  }

  // End session
  endSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.is_active = false;

    // Remove from user sessions
    const userSessions = this.userSessions.get(session.user_id);
    if (userSessions) {
      const index = userSessions.indexOf(sessionId);
      if (index > -1) {
        userSessions.splice(index, 1);
      }
    }

    // Emit session ended event
    eventSystem.emit('app_session_ended', {
      session_id: sessionId,
      user_id: session.user_id,
      app_id: session.app_id,
      duration: Date.now() - session.started_at.getTime()
    }, 'app_services');

    return true;
  }

  // End all user sessions
  endUserSessions(userId: string): number {
    const userSessionIds = this.userSessions.get(userId) || [];
    let endedCount = 0;

    userSessionIds.forEach(sessionId => {
      if (this.endSession(sessionId)) {
        endedCount++;
      }
    });

    return endedCount;
  }

  // Get active sessions for app
  getActiveSessions(appId: string): AppSession[] {
    return Array.from(this.sessions.values()).filter(session =>
      session.app_id === appId && session.is_active
    );
  }

  // Get user session statistics
  getSessionStats(): {
    total_sessions: number;
    active_sessions: number;
    sessions_by_app: Record<string, number>;
    sessions_by_device: Record<string, number>;
    average_session_duration: number;
  } {
    const sessions = Array.from(this.sessions.values());
    const activeSessions = sessions.filter(s => s.is_active);

    const sessionsByApp: Record<string, number> = {};
    const sessionsByDevice: Record<string, number> = {};

    sessions.forEach(session => {
      // Count by app
      if (!sessionsByApp[session.app_id]) {
        sessionsByApp[session.app_id] = 0;
      }
      sessionsByApp[session.app_id]++;

      // Count by device
      if (!sessionsByDevice[session.device_info.device_type]) {
        sessionsByDevice[session.device_info.device_type] = 0;
      }
      sessionsByDevice[session.device_info.device_type]++;
    });

    // Calculate average session duration for ended sessions
    const endedSessions = sessions.filter(s => !s.is_active);
    const averageDuration = endedSessions.length > 0
      ? endedSessions.reduce((sum, s) => sum + (s.last_activity.getTime() - s.started_at.getTime()), 0) / endedSessions.length
      : 0;

    return {
      total_sessions: sessions.length,
      active_sessions: activeSessions.length,
      sessions_by_app: sessionsByApp,
      sessions_by_device: sessionsByDevice,
      average_session_duration: averageDuration
    };
  }

  // Generate session token
  private generateSessionToken(): string {
    return Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2) + Date.now().toString(36);
  }

  // Update user app access when role changes
  private updateUserAppAccess(userId: string, newRole: string): void {
    // End current sessions
    this.endUserSessions(userId);

    // Create new session for new role app
    this.createAppSession(userId, newRole, {
      device_type: 'desktop',
      user_agent: '',
      screen_resolution: ''
    });

    // Emit app access updated event
    eventSystem.emit('user_app_access_updated', {
      user_id: userId,
      new_role: newRole
    }, 'app_services');
  }

  // Event emitter methods
  on(eventType: string, callback: (data: any) => void): void {
    this.eventEmitter.on(eventType, callback);
  }

  emit(eventType: string, data: any): void {
    this.eventEmitter.emit(eventType, data);
  }
}

// Singleton instance
const appServices = new AppServices();
export default appServices;