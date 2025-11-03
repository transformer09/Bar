import { EventEmitter } from 'events';
import { eventSystem, EventData } from '../../events/eventSystem';
import { rolePermissionService } from '../../services/rolePermissionService';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'order' | 'payment' | 'inventory' | 'staff' | 'system' | 'reservation' | 'kitchen' | 'bar' | 'lodge';
  target_users?: string[]; // Specific user IDs
  target_roles?: string[]; // Role-based targeting
  target_modules?: string[]; // Module-based targeting
  action_url?: string;
  action_text?: string;
  is_read: boolean;
  is_push_sent: boolean;
  is_email_sent: boolean;
  is_sms_sent: boolean;
  created_at: Date;
  read_at?: Date;
  expires_at?: Date;
  data?: any; // Additional data payload
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'in_app' | 'email' | 'sms' | 'push' | 'webhook';
  is_enabled: boolean;
  config: NotificationChannelConfig;
  created_at: Date;
  updated_at: Date;
}

export interface NotificationChannelConfig {
  // Email config
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  from_email?: string;
  from_name?: string;

  // SMS config
  sms_provider?: 'twilio' | 'aws_sns' | 'custom';
  api_key?: string;
  api_secret?: string;
  from_number?: string;

  // Push config
  firebase_server_key?: string;
  apns_key?: string;

  // Webhook config
  webhook_url?: string;
  webhook_method?: 'POST' | 'PUT';
  webhook_headers?: Record<string, string>;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  event_trigger: string;
  category: Notification['category'];
  type: Notification['type'];
  title_template: string;
  message_template: string;
  variables: string[];
  channels: string[];
  target_roles?: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface NotificationRule {
  id: string;
  name: string;
  description?: string;
  condition: string; // JSON logic for when to trigger
  template_id: string;
  is_active: boolean;
  priority: Notification['priority'];
  throttle_minutes?: number; // Minimum time between same notifications
  created_at: Date;
  updated_at: Date;
}

export interface NotificationConfig {
  enable_notifications: boolean;
  default_channels: string[];
  auto_cleanup_days: number;
  max_notifications_per_user: number;
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  quiet_hours: {
    enabled: boolean;
    start_time: string; // HH:mm
    end_time: string;   // HH:mm
    timezone: string;
  };
  rate_limits: {
    per_minute: number;
    per_hour: number;
    per_day: number;
  };
}

export class NotificationService {
  private eventEmitter: EventEmitter;
  private notifications: Map<string, Notification> = new Map();
  private channels: Map<string, NotificationChannel> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();
  private rules: Map<string, NotificationRule> = new Map();
  private userNotifications: Map<string, string[]> = new Map(); // userId -> notificationIds
  private config: NotificationConfig;
  private rateLimitTracker: Map<string, number[]> = new Map();

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.config = this.loadConfig();
    this.initializeEventHandlers();
    this.loadDefaultChannels();
    this.loadDefaultTemplates();
    this.startCleanupTimer();
  }

  private loadConfig(): NotificationConfig {
    return {
      enable_notifications: true,
      default_channels: ['in_app', 'push'],
      auto_cleanup_days: 30,
      max_notifications_per_user: 1000,
      push_enabled: true,
      email_enabled: true,
      sms_enabled: false,
      quiet_hours: {
        enabled: true,
        start_time: '22:00',
        end_time: '07:00',
        timezone: 'UTC'
      },
      rate_limits: {
        per_minute: 10,
        per_hour: 100,
        per_day: 1000
      }
    };
  }

  private initializeEventHandlers(): void {
    // Listen to all system events and trigger notifications based on templates
    this.eventEmitter.on('*', (eventType, data) => {
      this.processEventNotification(eventType, data);
    });

    // Listen to specific business events
    this.eventEmitter.on('order_created', (data) => {
      this.notifyOrderCreated(data);
    });

    this.eventEmitter.on('payment_completed', (data) => {
      this.notifyPaymentCompleted(data);
    });

    this.eventEmitter.on('low_stock_alert', (data) => {
      this.notifyLowStock(data);
    });

    this.eventEmitter.on('staff_activity', (data) => {
      this.notifyStaffActivity(data);
    });

    this.eventEmitter.on('reservation_confirmed', (data) => {
      this.notifyReservationConfirmed(data);
    });

    this.eventEmitter.on('kitchen_order_ready', (data) => {
      this.notifyKitchenOrderReady(data);
    });
  }

  private loadDefaultChannels(): void {
    // In-App Channel
    const inAppChannel: NotificationChannel = {
      id: 'channel_in_app',
      name: 'In-App Notifications',
      type: 'in_app',
      is_enabled: true,
      config: {},
      created_at: new Date(),
      updated_at: new Date()
    };

    // Email Channel
    const emailChannel: NotificationChannel = {
      id: 'channel_email',
      name: 'Email Notifications',
      type: 'email',
      is_enabled: true,
      config: {
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        from_email: 'notifications@restaurant.com',
        from_name: 'Restaurant System'
      },
      created_at: new Date(),
      updated_at: new Date()
    };

    // SMS Channel
    const smsChannel: NotificationChannel = {
      id: 'channel_sms',
      name: 'SMS Notifications',
      type: 'sms',
      is_enabled: false,
      config: {
        sms_provider: 'twilio',
        from_number: '+1234567890'
      },
      created_at: new Date(),
      updated_at: new Date()
    };

    // Push Channel
    const pushChannel: NotificationChannel = {
      id: 'channel_push',
      name: 'Push Notifications',
      type: 'push',
      is_enabled: true,
      config: {
        firebase_server_key: 'your-firebase-key'
      },
      created_at: new Date(),
      updated_at: new Date()
    };

    [inAppChannel, emailChannel, smsChannel, pushChannel].forEach(channel => {
      this.channels.set(channel.id, channel);
    });
  }

  private loadDefaultTemplates(): void {
    // Order Created Template
    const orderCreatedTemplate: NotificationTemplate = {
      id: 'template_order_created',
      name: 'Order Created',
      event_trigger: 'order_created',
      category: 'order',
      type: 'info',
      title_template: 'New Order #{{order_number}}',
      message_template: '{{staff_name}} created a new order for {{customer_name}} at {{table_number}} - Amount: {{total_amount}}',
      variables: ['order_number', 'staff_name', 'customer_name', 'table_number', 'total_amount'],
      channels: ['channel_in_app', 'channel_push'],
      target_roles: ['manager', 'cashier'],
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Payment Completed Template
    const paymentCompletedTemplate: NotificationTemplate = {
      id: 'template_payment_completed',
      name: 'Payment Completed',
      event_trigger: 'payment_completed',
      category: 'payment',
      type: 'success',
      title_template: 'Payment Received',
      message_template: 'Payment of {{amount}} received for Order #{{order_number}} via {{payment_method}}',
      variables: ['amount', 'order_number', 'payment_method'],
      channels: ['channel_in_app'],
      target_roles: ['manager', 'cashier'],
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Low Stock Template
    const lowStockTemplate: NotificationTemplate = {
      id: 'template_low_stock',
      name: 'Low Stock Alert',
      event_trigger: 'low_stock_alert',
      category: 'inventory',
      type: 'warning',
      title_template: 'Low Stock Alert',
      message_template: '{{item_name}} is running low. Current stock: {{current_stock}} {{unit}}',
      variables: ['item_name', 'current_stock', 'unit'],
      channels: ['channel_in_app', 'channel_email', 'channel_push'],
      target_roles: ['manager', 'inventory_manager'],
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Kitchen Order Ready Template
    const kitchenOrderReadyTemplate: NotificationTemplate = {
      id: 'template_kitchen_ready',
      name: 'Kitchen Order Ready',
      event_trigger: 'kitchen_order_ready',
      category: 'kitchen',
      type: 'info',
      title_template: 'Order Ready for Pickup',
      message_template: 'Order #{{order_number}} is ready for pickup from {{table_number}}',
      variables: ['order_number', 'table_number'],
      channels: ['channel_in_app', 'channel_push'],
      target_roles: ['waiter', 'cashier'],
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    [orderCreatedTemplate, paymentCompletedTemplate, lowStockTemplate, kitchenOrderReadyTemplate].forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  // Create notification
  createNotification(notificationData: {
    title: string;
    message: string;
    type: Notification['type'];
    priority: Notification['priority'];
    category: Notification['category'];
    target_users?: string[];
    target_roles?: string[];
    target_modules?: string[];
    action_url?: string;
    action_text?: string;
    data?: any;
    expires_at?: Date;
  }): Notification | null {
    if (!this.config.enable_notifications) return null;

    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type,
      priority: notificationData.priority,
      category: notificationData.category,
      target_users: notificationData.target_users,
      target_roles: notificationData.target_roles,
      target_modules: notificationData.target_modules,
      action_url: notificationData.action_url,
      action_text: notificationData.action_text,
      is_read: false,
      is_push_sent: false,
      is_email_sent: false,
      is_sms_sent: false,
      created_at: new Date(),
      expires_at: notificationData.expires_at,
      data: notificationData.data
    };

    this.notifications.set(notification.id, notification);

    // Determine target users
    const targetUsers = this.resolveTargetUsers(notification);

    // Associate notifications with users
    targetUsers.forEach(userId => {
      if (!this.userNotifications.has(userId)) {
        this.userNotifications.set(userId, []);
      }
      const userNotifs = this.userNotifications.get(userId)!;
      userNotifs.push(notification.id);

      // Limit notifications per user
      if (userNotifs.length > this.config.max_notifications_per_user) {
        const oldestNotifId = userNotifs.shift();
        if (oldestNotifId) {
          this.notifications.delete(oldestNotifId);
        }
      }
    });

    // Send notifications through channels
    this.sendNotificationThroughChannels(notification, targetUsers);

    // Emit notification created event
    eventSystem.emit('notification_created', {
      notification_id: notification.id,
      title: notification.title,
      type: notification.type,
      priority: notification.priority,
      target_users_count: targetUsers.length
    }, 'notification_service');

    return notification;
  }

  // Resolve target users based on roles and modules
  private resolveTargetUsers(notification: Notification): string[] {
    let targetUsers: string[] = [];

    // Direct user targets
    if (notification.target_users && notification.target_users.length > 0) {
      targetUsers = [...notification.target_users];
    }

    // Role-based targets
    if (notification.target_roles && notification.target_roles.length > 0) {
      // This would integrate with user service to get users by role
      // For now, simulate with sample data
      const roleUsers: Record<string, string[]> = {
        manager: ['user_manager_1', 'user_manager_2'],
        cashier: ['user_cashier_1', 'user_cashier_2'],
        waiter: ['user_waiter_1', 'user_waiter_2', 'user_waiter_3'],
        bartender: ['user_bartender_1'],
        chef: ['user_chef_1', 'user_chef_2'],
        receptionist: ['user_receptionist_1'],
        inventory_manager: ['user_inventory_1']
      };

      notification.target_roles.forEach(role => {
        if (roleUsers[role]) {
          targetUsers = [...targetUsers, ...roleUsers[role]];
        }
      });
    }

    // Remove duplicates
    return [...new Set(targetUsers)];
  }

  // Send notification through configured channels
  private sendNotificationThroughChannels(notification: Notification, targetUsers: string[]): void {
    const channelsToSend = this.config.default_channels.map(id => this.channels.get(id)).filter(Boolean) as NotificationChannel[];

    channelsToSend.forEach(channel => {
      if (!channel.is_enabled) return;

      switch (channel.type) {
        case 'in_app':
          // In-app notifications are stored by default
          this.sendInAppNotification(notification, targetUsers);
          break;
        case 'push':
          if (this.config.push_enabled) {
            this.sendPushNotification(notification, targetUsers, channel);
          }
          break;
        case 'email':
          if (this.config.email_enabled) {
            this.sendEmailNotification(notification, targetUsers, channel);
          }
          break;
        case 'sms':
          if (this.config.sms_enabled) {
            this.sendSMSNotification(notification, targetUsers, channel);
          }
          break;
      }
    });
  }

  private sendInAppNotification(notification: Notification, targetUsers: string[]): void {
    // In-app notifications are already stored
    console.log(`In-app notification sent to ${targetUsers.length} users: ${notification.title}`);
  }

  private sendPushNotification(notification: Notification, targetUsers: string[], channel: NotificationChannel): void {
    if (!this.isWithinQuietHours() || notification.priority === 'urgent') {
      // This would integrate with Firebase Cloud Messaging or similar
      console.log(`Push notification sent to ${targetUsers.length} users: ${notification.title}`);
      notification.is_push_sent = true;
    }
  }

  private sendEmailNotification(notification: Notification, targetUsers: string[], channel: NotificationChannel): void {
    if (!this.isWithinQuietHours() || notification.priority === 'urgent') {
      // This would integrate with email service
      console.log(`Email notification sent to ${targetUsers.length} users: ${notification.title}`);
      notification.is_email_sent = true;
    }
  }

  private sendSMSNotification(notification: Notification, targetUsers: string[], channel: NotificationChannel): void {
    if (notification.priority === 'urgent') {
      // Only send SMS for urgent notifications
      console.log(`SMS notification sent to ${targetUsers.length} users: ${notification.title}`);
      notification.is_sms_sent = true;
    }
  }

  // Check if current time is within quiet hours
  private isWithinQuietHours(): boolean {
    if (!this.config.quiet_hours.enabled) return true;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = this.config.quiet_hours.start_time.split(':').map(Number);
    const [endHour, endMin] = this.config.quiet_hours.end_time.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight quiet hours (e.g., 22:00 to 07:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // Process event-based notifications
  private processEventNotification(eventType: string, data: any): void {
    // Find templates that match this event
    const matchingTemplates = Array.from(this.templates.values())
      .filter(template => template.event_trigger === eventType && template.is_active);

    matchingTemplates.forEach(template => {
      this.createNotificationFromTemplate(template, data);
    });
  }

  // Create notification from template
  private createNotificationFromTemplate(template: NotificationTemplate, data: any): void {
    try {
      const title = this.renderTemplate(template.title_template, data);
      const message = this.renderTemplate(template.message_template, data);

      this.createNotification({
        title,
        message,
        type: template.type,
        priority: 'medium',
        category: template.category,
        target_roles: template.target_roles,
        data: data
      });
    } catch (error) {
      console.error(`Error creating notification from template ${template.id}:`, error);
    }
  }

  // Render template with variables
  private renderTemplate(template: string, data: any): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  // Specific notification handlers
  private notifyOrderCreated(orderData: any): void {
    this.createNotification({
      title: `New Order #${orderData.order_number}`,
      message: `${orderData.staff_name} created a new order for ${orderData.customer_name || 'Guest'} - Amount: $${orderData.total_amount}`,
      type: 'info',
      priority: 'medium',
      category: 'order',
      target_roles: ['manager', 'cashier'],
      action_url: `/orders/${orderData.order_id}`,
      action_text: 'View Order',
      data: orderData
    });
  }

  private notifyPaymentCompleted(paymentData: any): void {
    this.createNotification({
      title: 'Payment Received',
      message: `Payment of $${paymentData.amount} received for Order #${paymentData.order_number} via ${paymentData.payment_method}`,
      type: 'success',
      priority: 'low',
      category: 'payment',
      target_roles: ['manager', 'cashier'],
      data: paymentData
    });
  }

  private notifyLowStock(inventoryData: any): void {
    this.createNotification({
      title: 'Low Stock Alert',
      message: `${inventoryData.item_name} is running low. Current stock: ${inventoryData.current_stock} ${inventoryData.unit}`,
      type: 'warning',
      priority: 'high',
      category: 'inventory',
      target_roles: ['manager', 'inventory_manager'],
      action_url: `/inventory/${inventoryData.item_id}`,
      action_text: 'View Item',
      data: inventoryData
    });
  }

  private notifyStaffActivity(staffData: any): void {
    this.createNotification({
      title: 'Staff Activity',
      message: `${staffData.staff_name} ${staffData.activity} at ${staffData.location}`,
      type: 'info',
      priority: 'low',
      category: 'staff',
      target_roles: ['manager'],
      data: staffData
    });
  }

  private notifyReservationConfirmed(reservationData: any): void {
    this.createNotification({
      title: 'New Reservation',
      message: `Reservation confirmed for ${reservationData.guest_name} - Room ${reservationData.room_number} from ${reservationData.check_in_date} to ${reservationData.check_out_date}`,
      type: 'info',
      priority: 'medium',
      category: 'reservation',
      target_roles: ['receptionist', 'lodge_manager'],
      action_url: `/reservations/${reservationData.reservation_id}`,
      action_text: 'View Reservation',
      data: reservationData
    });
  }

  private notifyKitchenOrderReady(kitchenData: any): void {
    this.createNotification({
      title: 'Order Ready for Pickup',
      message: `Order #${kitchenData.order_number} is ready for pickup from ${kitchenData.table_number}`,
      type: 'info',
      priority: 'medium',
      category: 'kitchen',
      target_roles: ['waiter', 'cashier'],
      action_url: `/kitchen/orders/${kitchenData.order_id}`,
      action_text: 'View Order',
      data: kitchenData
    });
  }

  // Get notifications for user
  getUserNotifications(userId: string, unreadOnly: boolean = false, limit: number = 50): Notification[] {
    const userNotifIds = this.userNotifications.get(userId) || [];

    return userNotifIds
      .map(id => this.notifications.get(id))
      .filter(Boolean) as Notification[]
      .filter(notif => !unreadOnly || !notif.is_read)
      .filter(notif => !notif.expires_at || notif.expires_at > new Date())
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, limit);
  }

  // Mark notification as read
  markNotificationAsRead(notificationId: string, userId: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (!notification) return false;

    const userNotifs = this.userNotifications.get(userId);
    if (!userNotifs?.includes(notificationId)) return false;

    notification.is_read = true;
    notification.read_at = new Date();

    // Emit notification read event
    eventSystem.emit('notification_read', {
      notification_id: notificationId,
      user_id: userId,
      read_at: notification.read_at
    }, 'notification_service');

    return true;
  }

  // Mark all notifications as read for user
  markAllNotificationsAsRead(userId: string): number {
    const userNotifIds = this.userNotifications.get(userId) || [];
    let markedCount = 0;

    userNotifIds.forEach(notifId => {
      if (this.markNotificationAsRead(notifId, userId)) {
        markedCount++;
      }
    });

    return markedCount;
  }

  // Delete notification
  deleteNotification(notificationId: string, userId?: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (!notification) return false;

    // If userId is provided, check if user owns this notification
    if (userId) {
      const userNotifs = this.userNotifications.get(userId);
      if (!userNotifs?.includes(notificationId)) return false;

      // Remove from user's notifications
      const index = userNotifs.indexOf(notificationId);
      userNotifs.splice(index, 1);
    }

    // Delete notification
    this.notifications.delete(notificationId);

    // Emit notification deleted event
    eventSystem.emit('notification_deleted', {
      notification_id: notificationId,
      deleted_by: userId || 'system'
    }, 'notification_service');

    return true;
  }

  // Get notification statistics
  getNotificationStats(userId?: string): {
    total: number;
    unread: number;
    by_type: Record<Notification['type'], number>;
    by_category: Record<Notification['category'], number>;
    by_priority: Record<Notification['priority'], number>;
  } {
    let notifications: Notification[];

    if (userId) {
      const userNotifIds = this.userNotifications.get(userId) || [];
      notifications = userNotifIds.map(id => this.notifications.get(id)).filter(Boolean) as Notification[];
    } else {
      notifications = Array.from(this.notifications.values());
    }

    return {
      total: notifications.length,
      unread: notifications.filter(n => !n.is_read).length,
      by_type: {
        info: notifications.filter(n => n.type === 'info').length,
        success: notifications.filter(n => n.type === 'success').length,
        warning: notifications.filter(n => n.type === 'warning').length,
        error: notifications.filter(n => n.type === 'error').length,
        alert: notifications.filter(n => n.type === 'alert').length
      },
      by_category: {
        order: notifications.filter(n => n.category === 'order').length,
        payment: notifications.filter(n => n.category === 'payment').length,
        inventory: notifications.filter(n => n.category === 'inventory').length,
        staff: notifications.filter(n => n.category === 'staff').length,
        system: notifications.filter(n => n.category === 'system').length,
        reservation: notifications.filter(n => n.category === 'reservation').length,
        kitchen: notifications.filter(n => n.category === 'kitchen').length,
        bar: notifications.filter(n => n.category === 'bar').length,
        lodge: notifications.filter(n => n.category === 'lodge').length
      },
      by_priority: {
        low: notifications.filter(n => n.priority === 'low').length,
        medium: notifications.filter(n => n.priority === 'medium').length,
        high: notifications.filter(n => n.priority === 'high').length,
        urgent: notifications.filter(n => n.priority === 'urgent').length
      }
    };
  }

  // Cleanup old notifications
  private cleanupOldNotifications(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.auto_cleanup_days);

    let deletedCount = 0;

    this.notifications.forEach((notification, id) => {
      if (notification.created_at < cutoffDate || (notification.expires_at && notification.expires_at < new Date())) {
        this.notifications.delete(id);

        // Remove from all user notification lists
        this.userNotifications.forEach((userNotifs, userId) => {
          const index = userNotifs.indexOf(id);
          if (index > -1) {
            userNotifs.splice(index, 1);
          }
        });

        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} old notifications`);
    }
  }

  // Start cleanup timer
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupOldNotifications();
    }, 24 * 60 * 60 * 1000); // Run daily
  }

  // Update configuration
  updateConfig(newConfig: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...newConfig };

    eventSystem.emit('notification_config_updated', {
      updated_config: newConfig
    }, 'notification_service');
  }

  // Get current configuration
  getConfig(): NotificationConfig {
    return { ...this.config };
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
const notificationService = new NotificationService();
export default notificationService;