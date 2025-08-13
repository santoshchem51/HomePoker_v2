import { DatabaseService } from './infrastructure/DatabaseService';
import { APP_CONFIG } from '../constants/AppConstants';

export interface HealthStatus {
  app: {
    name: string;
    version: string;
    status: 'healthy' | 'unhealthy';
    uptime: number;
  };
  database: {
    connected: boolean;
    version: string;
    tablesCount: number;
    status: 'healthy' | 'unhealthy';
  };
  system: {
    platform: string;
    timestamp: string;
  };
  overall: 'healthy' | 'unhealthy';
}

/**
 * HealthCheckService provides app status and database connectivity verification
 */
export class HealthCheckService {
  private static instance: HealthCheckService | null = null;
  private startTime: number;

  private constructor() {
    this.startTime = Date.now();
  }

  public static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService();
    }
    return HealthCheckService.instance;
  }

  /**
   * Perform comprehensive health check of app and database
   */
  public async checkHealth(): Promise<HealthStatus> {
    try {
      // Get app information
      const appInfo = this.getAppInfo();
      
      // Check database connectivity
      const databaseInfo = await this.checkDatabaseHealth();
      
      // Get system information
      const systemInfo = this.getSystemInfo();
      
      // Determine overall health status
      const overall = this.determineOverallHealth(appInfo.status, databaseInfo.status);
      
      return {
        app: appInfo,
        database: databaseInfo,
        system: systemInfo,
        overall,
      };
    } catch (error) {
      console.error('Health check failed:', error);
      
      // Return unhealthy status on error
      return {
        app: {
          name: 'PokePot',
          version: '0.0.1',
          status: 'unhealthy',
          uptime: this.getUptime(),
        },
        database: {
          connected: false,
          version: '',
          tablesCount: 0,
          status: 'unhealthy',
        },
        system: {
          platform: require('react-native').Platform.OS,
          timestamp: new Date().toISOString(),
        },
        overall: 'unhealthy',
      };
    }
  }

  /**
   * Get application information and status
   */
  private getAppInfo(): HealthStatus['app'] {
    try {
      // Load version from package.json instead of hardcoding
      const packageInfo = require('../../package.json');
      
      return {
        name: packageInfo.name || APP_CONFIG.name,
        version: packageInfo.version || APP_CONFIG.version,
        status: 'healthy',
        uptime: this.getUptime(),
      };
    } catch (error) {
      console.error('Failed to get app info:', error);
      return {
        name: APP_CONFIG.name,
        version: 'unknown',
        status: 'unhealthy',
        uptime: 0,
      };
    }
  }

  /**
   * Check database connectivity and health
   */
  private async checkDatabaseHealth(): Promise<HealthStatus['database']> {
    try {
      const dbService = DatabaseService.getInstance();
      const dbHealth = await dbService.getHealthStatus();
      
      return {
        connected: dbHealth.connected,
        version: dbHealth.version,
        tablesCount: dbHealth.tablesCount,
        status: dbHealth.connected && dbHealth.tablesCount > 0 ? 'healthy' : 'unhealthy',
      };
    } catch (error) {
      console.error('Database health check failed:', error);
      return {
        connected: false,
        version: '',
        tablesCount: 0,
        status: 'unhealthy',
      };
    }
  }

  /**
   * Get system information
   */
  private getSystemInfo(): HealthStatus['system'] {
    try {
      const Platform = require('react-native').Platform;
      
      return {
        platform: Platform.OS,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to get system info:', error);
      return {
        platform: 'unknown',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Calculate app uptime in seconds
   */
  private getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  /**
   * Determine overall health based on component statuses
   */
  private determineOverallHealth(
    appStatus: 'healthy' | 'unhealthy',
    dbStatus: 'healthy' | 'unhealthy'
  ): 'healthy' | 'unhealthy' {
    return appStatus === 'healthy' && dbStatus === 'healthy' ? 'healthy' : 'unhealthy';
  }

  /**
   * Simple ping method for quick health verification
   */
  public async ping(): Promise<{ status: 'ok' | 'error'; timestamp: string }> {
    try {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export default HealthCheckService.getInstance();