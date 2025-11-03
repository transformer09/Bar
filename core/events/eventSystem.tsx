import { EventEmitter } from 'events';

export interface EventData {
  type: string;
  data: any;
  source: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
  role?: string;
  metadata?: any;
}

export class EventSystem {
  private eventEmitter: EventEmitter;
  private eventHistory: EventData[] = [];

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.eventHistory = [];
  }

  // Emit event to all modules
  emit(eventType: string, data: any, source: string, options?: { broadcast?: boolean } = {}): void {
    const event_data: EventData = {
      type: eventType,
      data,
      source,
      timestamp: new Date(),
      userId: data?.userId || '',
      userName: data?.userName || '',
      role: data?.role || '',
      metadata: options?.metadata || {}
    };

    this.eventHistory.push(event_data);

    // Log event for debugging
    console.log(`🔥 Event: ${eventType} from ${source}`, event_data);

    // Broadcast to specific roles based on event type
    if (options?.broadcast) {
      this.broadcastEvent(event_data);
    }

    // Emit for listening components to consume
    this.eventEmitter.emit(eventType, event_data);
  }

  // Broadcast event to specific roles
  private broadcastEvent(event_data: EventData): void {
    // Get user roles for specific event types
    const roles_for_event = {
      order_created: ['manager', 'cashier'],
      stock_movement: ['manager', 'inventory_manager', 'barman'],
      payment_received: ['manager', 'cashier'],
      staff_activity: ['manager', 'owner']
    };

    const target_roles = roles_for_event[event_data.type as keyof typeof roles_for_event] || [];

    target_roles.forEach(role => {
      // Emit event to role dashboard
      this.emit(`${role}_dashboard`, {
        type: event_data.type,
        data: event_data,
        timestamp: event_data.timestamp
      });
    });
  }

  // Listen for events from other modules
  public on(eventType: string, callback: (event_data: EventData) => {
    this.eventEmitter.on(eventType, callback);
  }

  // Broadcast to all roles that have access to event_type
  broadcastEvent(event_data: EventData): void {
    // Create event for all target roles
    this.emit('broadcast', {
      type: event_type,
      data: event_data,
      timestamp: event_data.timestamp
    });
  }

  // Create specific role-based event emitters for modules
  public getEventEmitterForRole(role: string): EventEmitter {
    return this.eventEmitter;
  }

  // Get events for specific type
  public getEvents(eventType?: string): EventData[] {
    return this.eventHistory.filter(event => event.type === eventType);
  }

  // Get all events for analysis
  public getAllEvents(): EventData[] {
    return this.eventHistory;
  }

  // Clear event history
  public clearEventHistory(): void {
    this.eventHistory = [];
  }

  // Get event history by type
  public getEventHistoryByType(eventType?: string): EventData[] {
    return eventHistory.filter(event => event.type === eventType);
  }

  // Get recent events (last N events)
  public getRecentEvents(count: number = 20): EventData[] {
    return eventHistory.slice(-count);
  }

  // Clear event history
  public clearEventHistory(): void {
    this.eventHistory = [];
  }
}

// Singleton instance
export const eventSystem = new EventSystem();
export default eventSystem;