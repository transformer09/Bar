import { EventEmitter } from 'events';
import { eventSystem, EventData } from '../events/eventSystem';

export interface DatabaseConnection {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  pool_size: number;
  connection_timeout: number;
  acquire_timeout: number;
  idle_timeout: number;
}

export interface DatabaseConfig {
  development: DatabaseConnection;
  staging: DatabaseConnection;
  production: DatabaseConnection;
  current_environment: 'development' | 'staging' | 'production';
  logging: boolean;
  backup_settings: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    retention_days: number;
    backup_path: string;
  };
  migration_settings: {
    auto_migrate: boolean;
    migration_table: string;
    migrations_path: string;
  };
}

export interface Migration {
  id: string;
  name: string;
  version: string;
  description: string;
  up_sql: string;
  down_sql: string;
  created_at: Date;
  applied_at?: Date;
  is_applied: boolean;
}

export interface DatabaseBackup {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
  backup_type: 'full' | 'incremental' | 'differential';
  created_at: Date;
  environment: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error_message?: string;
}

export interface DatabaseStats {
  total_connections: number;
  active_connections: number;
  idle_connections: number;
  query_count: number;
  slow_queries: number;
  average_query_time: number;
  database_size: number;
  table_count: number;
  index_count: number;
  last_backup?: Date;
  uptime: number;
}

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  query: string;
  executionTime: number;
  affectedRows?: number;
  insertId?: string;
}

export class DatabaseService {
  private eventEmitter: EventEmitter;
  private config: DatabaseConfig;
  private connection: any = null; // This would be actual database connection
  private migrations: Map<string, Migration> = new Map();
  private backups: Map<string, DatabaseBackup> = new Map();
  private queryStats: Array<{ query: string; time: number; timestamp: Date }> = [];

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.config = this.loadConfig();
    this.initializeDatabase();
    this.loadMigrations();
    this.initializeEventHandlers();
  }

  private loadConfig(): DatabaseConfig {
    return {
      development: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'restaurant_dev',
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        ssl: false,
        pool_size: 10,
        connection_timeout: 10000,
        acquire_timeout: 60000,
        idle_timeout: 30000
      },
      staging: {
        host: process.env.STAGING_DB_HOST || 'staging-db.example.com',
        port: parseInt(process.env.STAGING_DB_PORT || '5432'),
        database: process.env.STAGING_DB_NAME || 'restaurant_staging',
        username: process.env.STAGING_DB_USER || 'postgres',
        password: process.env.STAGING_DB_PASSWORD || '',
        ssl: true,
        pool_size: 20,
        connection_timeout: 10000,
        acquire_timeout: 60000,
        idle_timeout: 30000
      },
      production: {
        host: process.env.PROD_DB_HOST || 'prod-db.example.com',
        port: parseInt(process.env.PROD_DB_PORT || '5432'),
        database: process.env.PROD_DB_NAME || 'restaurant_prod',
        username: process.env.PROD_DB_USER || 'postgres',
        password: process.env.PROD_DB_PASSWORD || '',
        ssl: true,
        pool_size: 50,
        connection_timeout: 15000,
        acquire_timeout: 90000,
        idle_timeout: 45000
      },
      current_environment: (process.env.NODE_ENV as any) || 'development',
      logging: process.env.DB_LOGGING === 'true',
      backup_settings: {
        enabled: true,
        frequency: 'daily',
        retention_days: 30,
        backup_path: process.env.BACKUP_PATH || './backups'
      },
      migration_settings: {
        auto_migrate: true,
        migration_table: 'schema_migrations',
        migrations_path: './migrations'
      }
    };
  }

  private initializeDatabase(): void {
    // This would establish actual database connection
    console.log(`Initializing database connection to ${this.config.current_environment} environment`);

    // Simulate successful connection
    setTimeout(() => {
      eventSystem.emit('database_connected', {
        environment: this.config.current_environment,
        host: this.getCurrentConfig().host,
        database: this.getCurrentConfig().database
      }, 'database_service');
    }, 1000);
  }

  private getCurrentConfig(): DatabaseConnection {
    return this.config[this.config.current_environment];
  }

  private loadMigrations(): void {
    // Core tables migration
    const coreTablesMigration: Migration = {
      id: 'migration_001',
      name: 'create_core_tables',
      version: '1.0.0',
      description: 'Create core system tables for users, roles, permissions',
      up_sql: `
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          phone VARCHAR(20),
          role_id UUID REFERENCES roles(id),
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          is_active BOOLEAN DEFAULT true,
          last_login TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Roles table
        CREATE TABLE IF NOT EXISTS roles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) UNIQUE NOT NULL,
          display_name VARCHAR(200) NOT NULL,
          description TEXT,
          permissions TEXT[],
          is_system BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Permissions table
        CREATE TABLE IF NOT EXISTS permissions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) UNIQUE NOT NULL,
          description TEXT,
          resource VARCHAR(100),
          action VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- User sessions table
        CREATE TABLE IF NOT EXISTS user_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          session_token VARCHAR(255) UNIQUE NOT NULL,
          app_id VARCHAR(100),
          device_info JSONB,
          started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP,
          is_active BOOLEAN DEFAULT true
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
      `,
      down_sql: `
        DROP TABLE IF EXISTS user_sessions;
        DROP TABLE IF EXISTS permissions;
        DROP TABLE IF EXISTS roles;
        DROP TABLE IF EXISTS users;
      `,
      created_at: new Date('2024-01-01')
    };

    // Business tables migration
    const businessTablesMigration: Migration = {
      id: 'migration_002',
      name: 'create_business_tables',
      version: '1.0.0',
      description: 'Create business tables for orders, inventory, receipts',
      up_sql: `
        -- Orders table
        CREATE TABLE IF NOT EXISTS orders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_number VARCHAR(50) UNIQUE NOT NULL,
          business_type VARCHAR(20) NOT NULL CHECK (business_type IN ('restaurant', 'bar', 'lodge')),
          customer_name VARCHAR(200),
          customer_phone VARCHAR(20),
          table_id VARCHAR(100),
          room_id VARCHAR(100),
          status VARCHAR(50) DEFAULT 'new',
          payment_status VARCHAR(50) DEFAULT 'pending',
          payment_method VARCHAR(50),
          subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
          tax DECIMAL(10,2) NOT NULL DEFAULT 0,
          service_charge DECIMAL(10,2) NOT NULL DEFAULT 0,
          discount DECIMAL(10,2) NOT NULL DEFAULT 0,
          total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          staff_id UUID REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          notes TEXT
        );

        -- Order items table
        CREATE TABLE IF NOT EXISTS order_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
          product_id VARCHAR(100) NOT NULL,
          product_name VARCHAR(200) NOT NULL,
          category VARCHAR(100),
          quantity INTEGER NOT NULL DEFAULT 1,
          unit_price DECIMAL(10,2) NOT NULL,
          total_price DECIMAL(10,2) NOT NULL,
          notes TEXT,
          customizations JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Inventory items table
        CREATE TABLE IF NOT EXISTS inventory_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(200) NOT NULL,
          description TEXT,
          category VARCHAR(100) NOT NULL,
          unit VARCHAR(50) NOT NULL,
          current_stock DECIMAL(10,3) NOT NULL DEFAULT 0,
          minimum_threshold DECIMAL(10,3) DEFAULT 0,
          maximum_capacity DECIMAL(10,3),
          unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
          selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
          supplier_id UUID,
          business_type VARCHAR(20) NOT NULL DEFAULT 'all',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_restocked_at TIMESTAMP
        );

        -- Inventory batches table
        CREATE TABLE IF NOT EXISTS inventory_batches (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
          batch_number VARCHAR(100) NOT NULL,
          quantity DECIMAL(10,3) NOT NULL,
          quantity_remaining DECIMAL(10,3) NOT NULL,
          unit_cost DECIMAL(10,2) NOT NULL,
          unit_selling_price DECIMAL(10,2),
          received_date DATE NOT NULL,
          expiration_date DATE,
          supplier_id UUID,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Inventory movements table
        CREATE TABLE IF NOT EXISTS inventory_movements (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
          batch_id UUID REFERENCES inventory_batches(id),
          movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'waste', 'transfer')),
          quantity_change DECIMAL(10,3) NOT NULL,
          unit_cost DECIMAL(10,2) NOT NULL,
          total_cost DECIMAL(10,2) NOT NULL,
          reference_type VARCHAR(50) NOT NULL,
          reference_id VARCHAR(100),
          notes TEXT,
          recorded_by UUID REFERENCES users(id),
          business_type VARCHAR(20) NOT NULL,
          recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Receipts table
        CREATE TABLE IF NOT EXISTS receipts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          receipt_number VARCHAR(50) UNIQUE NOT NULL,
          template_id VARCHAR(100),
          order_id UUID REFERENCES orders(id),
          reservation_id VARCHAR(100),
          payment_id VARCHAR(100),
          business_type VARCHAR(20) NOT NULL,
          receipt_type VARCHAR(20) NOT NULL DEFAULT 'receipt',
          customer_name VARCHAR(200),
          customer_details JSONB,
          items JSONB NOT NULL,
          summary JSONB NOT NULL,
          payments JSONB DEFAULT '[]',
          totals JSONB NOT NULL,
          generated_by UUID REFERENCES users(id),
          generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          printed_at TIMESTAMP,
          emailed_to VARCHAR(255),
          status VARCHAR(20) DEFAULT 'generated',
          notes TEXT
        );

        -- Notifications table
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(200) NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(20) NOT NULL,
          priority VARCHAR(20) DEFAULT 'medium',
          category VARCHAR(50) NOT NULL,
          target_users UUID[],
          target_roles VARCHAR[],
          target_modules VARCHAR[],
          action_url VARCHAR(500),
          action_text VARCHAR(100),
          is_read BOOLEAN DEFAULT false,
          is_push_sent BOOLEAN DEFAULT false,
          is_email_sent BOOLEAN DEFAULT false,
          is_sms_sent BOOLEAN DEFAULT false,
          data JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          read_at TIMESTAMP,
          expires_at TIMESTAMP
        );

        -- User notifications junction table
        CREATE TABLE IF NOT EXISTS user_notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
          is_read BOOLEAN DEFAULT false,
          read_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, notification_id)
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
        CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
        CREATE INDEX IF NOT EXISTS idx_orders_business_type ON orders(business_type);
        CREATE INDEX IF NOT EXISTS idx_orders_staff_id ON orders(staff_id);
        CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
        CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
        CREATE INDEX IF NOT EXISTS idx_inventory_items_business_type ON inventory_items(business_type);
        CREATE INDEX IF NOT EXISTS idx_inventory_batches_item_id ON inventory_batches(inventory_item_id);
        CREATE INDEX IF NOT EXISTS idx_inventory_movements_item_id ON inventory_movements(inventory_item_id);
        CREATE INDEX IF NOT EXISTS idx_receipts_order_id ON receipts(order_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
        CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
        CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
      `,
      down_sql: `
        DROP TABLE IF EXISTS user_notifications;
        DROP TABLE IF EXISTS notifications;
        DROP TABLE IF EXISTS receipts;
        DROP TABLE IF EXISTS inventory_movements;
        DROP TABLE IF EXISTS inventory_batches;
        DROP TABLE IF EXISTS inventory_items;
        DROP TABLE IF EXISTS order_items;
        DROP TABLE IF EXISTS orders;
      `,
      created_at: new Date('2024-01-01')
    };

    // Schema migrations tracking table
    const schemaMigration: Migration = {
      id: 'migration_000',
      name: 'create_migrations_table',
      version: '1.0.0',
      description: 'Create table to track applied migrations',
      up_sql: `
        CREATE TABLE IF NOT EXISTS ${this.config.migration_settings.migration_table} (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          migration_id VARCHAR(100) UNIQUE NOT NULL,
          name VARCHAR(200) NOT NULL,
          version VARCHAR(50) NOT NULL,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_schema_migrations_id ON ${this.config.migration_settings.migration_table}(migration_id);
      `,
      down_sql: `
        DROP TABLE IF EXISTS ${this.config.migration_settings.migration_table};
      `,
      created_at: new Date('2024-01-01')
    };

    this.migrations.set(schemaMigration.id, schemaMigration);
    this.migrations.set(coreTablesMigration.id, coreTablesMigration);
    this.migrations.set(businessTablesMigration.id, businessTablesMigration);

    // Auto-migrate if enabled
    if (this.config.migration_settings.auto_migrate) {
      this.runMigrations();
    }
  }

  private initializeEventHandlers(): void {
    // Listen to system events that might need database operations
    this.eventEmitter.on('order_created', (data) => {
      this.insertOrder(data);
    });

    this.eventEmitter.on('inventory_movement', (data) => {
      this.insertInventoryMovement(data);
    });

    this.eventEmitter.on('user_login', (data) => {
      this.updateUserLastLogin(data.user_id);
    });
  }

  // Execute query
  async query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    const startTime = Date.now();

    try {
      // Simulate database query execution
      console.log(`Executing query: ${sql}`, params);

      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));

      const executionTime = Date.now() - startTime;

      // Track query statistics
      this.queryStats.push({
        query: sql,
        time: executionTime,
        timestamp: new Date()
      });

      // Keep only last 1000 queries
      if (this.queryStats.length > 1000) {
        this.queryStats = this.queryStats.slice(-1000);
      }

      // Simulate query result
      const result: QueryResult<T> = {
        rows: [],
        rowCount: 0,
        query: sql,
        executionTime
      };

      if (this.config.logging) {
        console.log(`Query executed in ${executionTime}ms: ${sql.substring(0, 100)}...`);
      }

      // Emit query executed event
      eventSystem.emit('database_query_executed', {
        sql: sql.substring(0, 100),
        execution_time: executionTime,
        row_count: result.rowCount
      }, 'database_service');

      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;

      // Emit query error event
      eventSystem.emit('database_query_error', {
        sql: sql.substring(0, 100),
        error: error instanceof Error ? error.message : 'Unknown error',
        execution_time: executionTime
      }, 'database_service');

      throw error;
    }
  }

  // Execute transaction
  async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    console.log('Starting database transaction');

    try {
      // Simulate transaction
      const result = await callback(null); // Pass database client

      console.log('Transaction completed successfully');

      // Emit transaction completed event
      eventSystem.emit('database_transaction_completed', {}, 'database_service');

      return result;

    } catch (error) {
      console.log('Transaction rolled back due to error:', error);

      // Emit transaction failed event
      eventSystem.emit('database_transaction_failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'database_service');

      throw error;
    }
  }

  // Run migrations
  async runMigrations(): Promise<void> {
    console.log('Running database migrations...');

    try {
      // Get applied migrations
      const appliedMigrations = await this.getAppliedMigrations();

      // Sort migrations by creation date
      const sortedMigrations = Array.from(this.migrations.values())
        .sort((a, b) => a.created_at.getTime() - b.created_at.getTime());

      for (const migration of sortedMigrations) {
        if (!appliedMigrations.includes(migration.id)) {
          console.log(`Applying migration: ${migration.name}`);

          await this.query(migration.up_sql);

          // Record migration as applied
          await this.query(
            `INSERT INTO ${this.config.migration_settings.migration_table} (migration_id, name, version) VALUES ($1, $2, $3)`,
            [migration.id, migration.name, migration.version]
          );

          migration.is_applied = true;
          migration.applied_at = new Date();

          // Emit migration applied event
          eventSystem.emit('migration_applied', {
            migration_id: migration.id,
            migration_name: migration.name
          }, 'database_service');
        }
      }

      console.log('All migrations applied successfully');

    } catch (error) {
      console.error('Migration failed:', error);

      // Emit migration failed event
      eventSystem.emit('migration_failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'database_service');

      throw error;
    }
  }

  // Get applied migrations
  private async getAppliedMigrations(): Promise<string[]> {
    // Simulate getting applied migrations from database
    return [];
  }

  // Create backup
  async createBackup(backupType: 'full' | 'incremental' | 'differential' = 'full'): Promise<DatabaseBackup> {
    const backup: DatabaseBackup = {
      id: `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      filename: `backup_${backupType}_${Date.now()}.sql`,
      file_path: `${this.config.backup_settings.backup_path}/backup_${backupType}_${Date.now()}.sql`,
      file_size: 0,
      backup_type: backupType,
      created_at: new Date(),
      environment: this.config.current_environment,
      status: 'in_progress'
    };

    this.backups.set(backup.id, backup);

    try {
      // Simulate backup process
      console.log(`Creating ${backupType} backup...`);

      // Simulate backup duration
      await new Promise(resolve => setTimeout(resolve, 2000));

      backup.status = 'completed';
      backup.file_size = Math.floor(Math.random() * 100000000); // Random file size

      // Update backup
      this.backups.set(backup.id, backup);

      // Emit backup completed event
      eventSystem.emit('database_backup_completed', {
        backup_id: backup.id,
        backup_type: backupType,
        file_size: backup.file_size
      }, 'database_service');

      console.log(`Backup completed: ${backup.filename}`);

    } catch (error) {
      backup.status = 'failed';
      backup.error_message = error instanceof Error ? error.message : 'Unknown error';

      this.backups.set(backup.id, backup);

      // Emit backup failed event
      eventSystem.emit('database_backup_failed', {
        backup_id: backup.id,
        error: backup.error_message
      }, 'database_service');
    }

    return backup;
  }

  // Get database statistics
  async getDatabaseStats(): Promise<DatabaseStats> {
    // Simulate database statistics
    return {
      total_connections: 25,
      active_connections: 12,
      idle_connections: 13,
      query_count: this.queryStats.length,
      slow_queries: this.queryStats.filter(q => q.time > 1000).length,
      average_query_time: this.queryStats.length > 0
        ? this.queryStats.reduce((sum, q) => sum + q.time, 0) / this.queryStats.length
        : 0,
      database_size: 2500000000, // 2.5GB
      table_count: 15,
      index_count: 45,
      last_backup: new Date(Date.now() - 86400000), // 24 hours ago
      uptime: Date.now() - 1000000 // Since start
    };
  }

  // Database operations for specific entities
  private async insertOrder(orderData: any): Promise<void> {
    await this.query(`
      INSERT INTO orders (order_number, business_type, customer_name, total_amount, staff_id)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      orderData.order_number,
      orderData.business_type,
      orderData.customer_name,
      orderData.total_amount,
      orderData.staff_id
    ]);
  }

  private async insertInventoryMovement(movementData: any): Promise<void> {
    await this.query(`
      INSERT INTO inventory_movements (inventory_item_id, movement_type, quantity_change, recorded_by)
      VALUES ($1, $2, $3, $4)
    `, [
      movementData.inventory_item_id,
      movementData.movement_type,
      movementData.quantity_change,
      movementData.recorded_by
    ]);
  }

  private async updateUserLastLogin(userId: string): Promise<void> {
    await this.query(`
      UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1
    `, [userId]);
  }

  // Health check
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      // Test database connection
      await this.query('SELECT 1');

      const stats = await this.getDatabaseStats();

      return {
        status: 'healthy',
        details: {
          environment: this.config.current_environment,
          connections: stats.active_connections,
          database_size: stats.database_size,
          uptime: stats.uptime,
          last_backup: stats.last_backup
        }
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          environment: this.config.current_environment
        }
      };
    }
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
const databaseService = new DatabaseService();
export default databaseService;