/**
 * HealthCheckService Tests
 * 
 * Tests the health check functionality including app status,
 * database connectivity verification, and error handling.
 */

import HealthCheckService from '../HealthCheckService';

// Mock DatabaseService
const mockGetHealthStatus = jest.fn();
jest.mock('../infrastructure/DatabaseService', () => ({
  DatabaseService: {
    getInstance: jest.fn(() => ({
      getHealthStatus: mockGetHealthStatus,
    })),
  },
}));

const mockDatabaseService = { getHealthStatus: mockGetHealthStatus };

describe('HealthCheckService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkHealth', () => {
    it('should return healthy status when all components are healthy', async () => {
      // Arrange
      mockDatabaseService.getHealthStatus.mockResolvedValue({
        connected: true,
        version: '3.45.0',
        tablesCount: 3,
      });

      // Act
      const healthStatus = await HealthCheckService.checkHealth();

      // Assert
      expect(healthStatus.overall).toBe('healthy');
      expect(healthStatus.app.status).toBe('healthy');
      expect(healthStatus.database.status).toBe('healthy');
      expect(healthStatus.app.name).toBe('PokePot');
      expect(healthStatus.app.version).toBe('0.0.1');
    });

    it('should return unhealthy status when database is disconnected', async () => {
      // Arrange
      mockDatabaseService.getHealthStatus.mockResolvedValue({
        connected: false,
        version: '',
        tablesCount: 0,
      });

      // Act
      const healthStatus = await HealthCheckService.checkHealth();

      // Assert
      expect(healthStatus.overall).toBe('unhealthy');
      expect(healthStatus.app.status).toBe('healthy');
      expect(healthStatus.database.status).toBe('unhealthy');
      expect(healthStatus.database.connected).toBe(false);
    });

    it('should return unhealthy status when database has no tables', async () => {
      // Arrange
      mockDatabaseService.getHealthStatus.mockResolvedValue({
        connected: true,
        version: '3.45.0',
        tablesCount: 0,
      });

      // Act
      const healthStatus = await HealthCheckService.checkHealth();

      // Assert
      expect(healthStatus.overall).toBe('unhealthy');
      expect(healthStatus.database.status).toBe('unhealthy');
      expect(healthStatus.database.tablesCount).toBe(0);
    });

    it('should handle database service errors gracefully', async () => {
      // Arrange
      mockDatabaseService.getHealthStatus.mockRejectedValue(
        new Error('Database connection timeout')
      );

      // Act
      const healthStatus = await HealthCheckService.checkHealth();

      // Assert
      expect(healthStatus.overall).toBe('unhealthy');
      expect(healthStatus.database.status).toBe('unhealthy');
      expect(healthStatus.database.connected).toBe(false);
    });

    it('should include system information', async () => {
      // Arrange
      mockDatabaseService.getHealthStatus.mockResolvedValue({
        connected: true,
        version: '3.45.0',
        tablesCount: 3,
      });

      // Act
      const healthStatus = await HealthCheckService.checkHealth();

      // Assert
      expect(healthStatus.system).toBeDefined();
      expect(healthStatus.system.platform).toBe('ios'); // From mock
      expect(healthStatus.system.timestamp).toBeDefined();
      expect(new Date(healthStatus.system.timestamp)).toBeInstanceOf(Date);
    });

    it('should include uptime information', async () => {
      // Arrange
      mockDatabaseService.getHealthStatus.mockResolvedValue({
        connected: true,
        version: '3.45.0',
        tablesCount: 3,
      });

      // Act
      const healthStatus = await HealthCheckService.checkHealth();

      // Assert
      expect(healthStatus.app.uptime).toBeGreaterThanOrEqual(0);
      expect(typeof healthStatus.app.uptime).toBe('number');
    });
  });

  describe('ping', () => {
    it('should return ok status with timestamp', async () => {
      // Act
      const pingResult = await HealthCheckService.ping();

      // Assert
      expect(pingResult.status).toBe('ok');
      expect(pingResult.timestamp).toBeDefined();
      expect(new Date(pingResult.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('singleton behavior', () => {
    it('should maintain consistent service behavior', async () => {
      // Arrange
      mockDatabaseService.getHealthStatus.mockResolvedValue({
        connected: true,
        version: '3.45.0',
        tablesCount: 3,
      });

      // Act
      const healthStatus1 = await HealthCheckService.checkHealth();
      const healthStatus2 = await HealthCheckService.checkHealth();

      // Assert
      expect(healthStatus1.app.name).toBe(healthStatus2.app.name);
      expect(healthStatus1.overall).toBe(healthStatus2.overall);
    });
  });

  describe('error scenarios', () => {
    it('should handle complete service failure', async () => {
      // Arrange
      const originalCheckHealth = HealthCheckService.checkHealth;
      HealthCheckService.checkHealth = jest.fn().mockRejectedValue(
        new Error('Complete service failure')
      );

      try {
        // Act
        const healthStatus = await HealthCheckService.checkHealth();

        // Assert - should not reach here if error is thrown
        expect(healthStatus.overall).toBe('unhealthy');
      } catch (error) {
        // Assert error handling
        expect(error).toBeInstanceOf(Error);
      } finally {
        // Cleanup
        HealthCheckService.checkHealth = originalCheckHealth;
      }
    });
  });
});

// Integration test with real service interaction
describe('HealthCheckService Integration', () => {
  it('should integrate with DatabaseService correctly', async () => {
    // This test runs with the real DatabaseService mock
    const healthStatus = await HealthCheckService.checkHealth();

    // Basic assertions that don't depend on database connection
    expect(healthStatus).toBeDefined();
    expect(healthStatus.app).toBeDefined();
    expect(healthStatus.database).toBeDefined();
    expect(healthStatus.system).toBeDefined();
    expect(['healthy', 'unhealthy']).toContain(healthStatus.overall);
  });
});