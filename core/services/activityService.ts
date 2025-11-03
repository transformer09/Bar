import { supabase } from './supabase';

export interface ActivityLogEntry {
  user_id: string;
  activity_type: string;
  description: string;
  metadata?: any;
  severity?: 'info' | 'warning' | 'critical';
  location?: string;
}

export interface UnusualActivityFlag {
  activity_log_id: string;
  flag_reason: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}

export const activityService = {
  // Log any activity
  async logActivity(entry: ActivityLogEntry) {
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .insert([
          {
            user_id: entry.user_id,
            activity_type: entry.activity_type,
            description: entry.description,
            metadata: entry.metadata || null,
            severity: entry.severity || 'info',
            location: entry.location || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error logging activity:', error);
      throw error;
    }
  },

  // Log order activity
  async logOrderActivity(
    orderId: string,
    waiterId: string,
    activityType: 'order_created' | 'order_confirmed' | 'order_served' | 'order_completed',
    metadata?: any
  ) {
    return this.logActivity({
      user_id: waiterId,
      activity_type: activityType,
      description: `Order ${orderId.substring(0, 8)} - ${activityType.replace(/_/g, ' ')}`,
      metadata: { order_id: orderId, ...metadata },
      severity: 'info',
    });
  },

  // Log payment activity
  async logPaymentActivity(
    orderId: string,
    cashierId: string,
    amount: number,
    paymentMethod: string
  ) {
    return this.logActivity({
      user_id: cashierId,
      activity_type: 'payment_received',
      description: `Payment of $${amount.toFixed(2)} received via ${paymentMethod}`,
      metadata: {
        order_id: orderId,
        amount,
        payment_method: paymentMethod,
      },
      severity: 'info',
    });
  },

  // Log inventory activity
  async logInventoryActivity(
    itemId: string,
    movementType: string,
    quantityChange: number,
    staffId: string,
    notes?: string
  ) {
    return this.logActivity({
      user_id: staffId,
      activity_type: 'inventory_adjustment',
      description: `Inventory ${movementType}: ${Math.abs(quantityChange)} units`,
      metadata: {
        inventory_item_id: itemId,
        movement_type: movementType,
        quantity_change: quantityChange,
        notes,
      },
      severity: 'info',
    });
  },

  // Log staff activity
  async logStaffActivity(
    staffId: string,
    activityType: 'staff_clock_in' | 'staff_clock_out',
    location?: string
  ) {
    return this.logActivity({
      user_id: staffId,
      activity_type: activityType,
      description: `Staff ${activityType.replace(/_/g, ' ')}`,
      severity: 'info',
      location: location || 'Main',
    });
  },

  // Flag unusual activity
  async flagUnusualActivity(flag: UnusualActivityFlag, ownerId: string) {
    try {
      const { data, error } = await supabase
        .from('unusual_activity_flags')
        .insert([
          {
            activity_log_id: flag.activity_log_id,
            flag_reason: flag.flag_reason,
            risk_level: flag.risk_level,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Create notification for owner
      await this.createNotification(ownerId, {
        notification_type: flag.risk_level === 'critical' ? 'critical' : 'warning',
        title: 'Unusual Activity Detected',
        message: flag.flag_reason,
        reference_type: 'unusual_activity',
        reference_id: flag.activity_log_id,
      });

      return data;
    } catch (error) {
      console.error('Error flagging unusual activity:', error);
      throw error;
    }
  },

  // Detect unusual activities (heuristics)
  async detectUnusualActivities(ownerId: string) {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get activities from last hour
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

      const { data: recentActivities, error: activitiesError } = await supabase
        .from('activity_log')
        .select('*, users(first_name, last_name, role)')
        .gte('timestamp', oneHourAgo)
        .order('timestamp', { ascending: false });

      if (activitiesError) throw activitiesError;

      const detectedFlags = [];

      // Check for excessive refunds
      const refundCount = recentActivities?.filter(
        (a) => a.activity_type === 'refund_issued'
      ).length || 0;
      if (refundCount > 5) {
        detectedFlags.push({
          activity_log_id: recentActivities?.[0]?.id,
          flag_reason: `Unusual: ${refundCount} refunds in 1 hour (average is 2-3)`,
          risk_level: 'medium' as const,
        });
      }

      // Check for rapid order creation (potential fraudulent activity)
      const orderCreations = recentActivities?.filter(
        (a) => a.activity_type === 'order_created'
      ) || [];
      const userOrderCounts: Record<string, number> = {};
      orderCreations.forEach((activity) => {
        userOrderCounts[activity.user_id] = (userOrderCounts[activity.user_id] || 0) + 1;
      });

      Object.entries(userOrderCounts).forEach(([userId, count]) => {
        if (count > 20) {
          detectedFlags.push({
            activity_log_id: orderCreations[0].id,
            flag_reason: `High-velocity orders: User created ${count} orders in 1 hour`,
            risk_level: 'high' as const,
          });
        }
      });

      // Check for off-hours activity
      const now = new Date();
      const hour = now.getHours();
      if (hour < 6 || hour > 23) {
        const offHoursCount = recentActivities?.filter(
          (a) => ['order_created', 'payment_received'].includes(a.activity_type)
        ).length || 0;
        if (offHoursCount > 3) {
          detectedFlags.push({
            activity_log_id: recentActivities?.[0]?.id,
            flag_reason: `Off-hours activity: ${offHoursCount} transactions between ${hour}:00 and ${hour + 1}:00`,
            risk_level: 'low' as const,
          });
        }
      }

      // Flag all detected unusual activities
      for (const flag of detectedFlags) {
        await this.flagUnusualActivity(flag, ownerId);
      }

      return detectedFlags;
    } catch (error) {
      console.error('Error detecting unusual activities:', error);
    }
  },

  // Get activity summary for a user/date
  async getUserActivitySummary(userId: string, date: string) {
    try {
      const startOfDay = `${date}T00:00:00Z`;
      const endOfDay = `${date}T23:59:59Z`;

      const { data, error } = await supabase
        .from('activity_log')
        .select('activity_type, COUNT(*) as count')
        .eq('user_id', userId)
        .gte('timestamp', startOfDay)
        .lte('timestamp', endOfDay)
        .group('activity_type');

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error getting user activity summary:', error);
      throw error;
    }
  },

  // Create notification
  async createNotification(
    ownerId: string,
    notification: {
      notification_type: string;
      title: string;
      message: string;
      reference_type?: string;
      reference_id?: string;
      action_url?: string;
    }
  ) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([
          {
            owner_id: ownerId,
            notification_type: notification.notification_type,
            title: notification.title,
            message: notification.message,
            reference_type: notification.reference_type || null,
            reference_id: notification.reference_id || null,
            action_url: notification.action_url || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  // Get recent notifications
  async getNotifications(ownerId: string, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  },

  // Mark notification as read
  async markNotificationAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Update table occupancy
  async updateTableOccupancy(tableNumber: string, isOccupied: boolean, orderId?: string, waiterId?: string, guestCount?: number) {
    try {
      if (isOccupied) {
        // Occupy table
        const { error } = await supabase.from('table_occupancy').insert([
          {
            table_number: tableNumber,
            is_occupied: true,
            order_id: orderId || null,
            waiter_id: waiterId || null,
            guest_count: guestCount || null,
            occupied_at: new Date().toISOString(),
          },
        ]);

        if (error) throw error;
      } else {
        // Clear table
        const { data: occupancy } = await supabase
          .from('table_occupancy')
          .select('*')
          .eq('table_number', tableNumber)
          .eq('is_occupied', true)
          .order('occupied_at', { ascending: false })
          .limit(1)
          .single();

        if (occupancy) {
          const clearedAt = new Date();
          const occupiedAt = new Date(occupancy.occupied_at);
          const durationMinutes = Math.floor(
            (clearedAt.getTime() - occupiedAt.getTime()) / 60000
          );

          await supabase
            .from('table_occupancy')
            .update({
              is_occupied: false,
              cleared_at: clearedAt.toISOString(),
              duration_minutes: durationMinutes,
            })
            .eq('id', occupancy.id);
        }
      }
    } catch (error) {
      console.error('Error updating table occupancy:', error);
      throw error;
    }
  },
};
