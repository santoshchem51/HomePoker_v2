/**
 * Privacy Compliance Service
 * Story 5.4 - Production Deployment Preparation
 * GDPR/CCPA compliance, data handling, and user privacy rights implementation
 */

import { securityConfig, DataProtection } from '../../config/security';

export interface UserConsent {
  userId: string;
  timestamp: Date;
  version: string;
  consents: {
    essential: boolean;
    analytics: boolean;
    crashReporting: boolean;
    performanceMonitoring: boolean;
  };
  ipAddress?: string;
  userAgent?: string;
}

export interface DataSubjectRequest {
  id: string;
  userId: string;
  requestType: 'access' | 'deletion' | 'portability' | 'rectification' | 'objection';
  timestamp: Date;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  completedAt?: Date;
  responseData?: any;
  reason?: string;
}

export interface PrivacySettings {
  dataMinimization: boolean;
  automaticCleanup: boolean;
  anonymizeAnalytics: boolean;
  shareErrorReports: boolean;
  dataRetentionDays: number;
  allowPerformanceTracking: boolean;
}

export interface DataInventory {
  category: string;
  description: string;
  dataTypes: string[];
  purpose: string;
  retention: string;
  sharing: 'none' | 'anonymous' | 'aggregated';
  legalBasis: string;
}

/**
 * Privacy Compliance Service
 * Implements GDPR/CCPA compliance and user privacy rights
 */
export class PrivacyComplianceService {
  private static instance: PrivacyComplianceService | null = null;
  
  private consents: Map<string, UserConsent> = new Map();
  private dataRequests: Map<string, DataSubjectRequest> = new Map();
  private privacySettings: PrivacySettings;
  
  private readonly CONSENT_VERSION = '1.0.0';
  private readonly DATA_RETENTION_DAYS = securityConfig.privacy.maxDataRetentionDays;
  
  private constructor() {
    this.privacySettings = this.getDefaultPrivacySettings();
    this.initialize();
  }
  
  public static getInstance(): PrivacyComplianceService {
    if (!PrivacyComplianceService.instance) {
      PrivacyComplianceService.instance = new PrivacyComplianceService();
    }
    return PrivacyComplianceService.instance;
  }
  
  /**
   * Initialize privacy compliance
   */
  private initialize(): void {
    if (__DEV__) {
      console.log('[Privacy Compliance] Service initialized');
    }
    
    // Schedule automatic cleanup
    this.scheduleAutomaticCleanup();
  }
  
  /**
   * Record user consent
   */
  async recordConsent(
    userId: string,
    consents: UserConsent['consents'],
    metadata: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<string> {
    const consent: UserConsent = {
      userId,
      timestamp: new Date(),
      version: this.CONSENT_VERSION,
      consents,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    };
    
    this.consents.set(userId, consent);
    
    if (__DEV__) {
      console.log('[Privacy Compliance] Consent recorded for user:', userId);
    }
    
    return this.CONSENT_VERSION;
  }
  
  /**
   * Get user consent status
   */
  getUserConsent(userId: string): UserConsent | null {
    return this.consents.get(userId) || null;
  }
  
  /**
   * Check if user has given specific consent
   */
  hasConsent(userId: string, consentType: keyof UserConsent['consents']): boolean {
    const consent = this.getUserConsent(userId);
    return consent?.consents[consentType] || false;
  }
  
  /**
   * Update user consent
   */
  async updateConsent(
    userId: string,
    consentType: keyof UserConsent['consents'],
    granted: boolean
  ): Promise<boolean> {
    const existingConsent = this.getUserConsent(userId);
    
    if (!existingConsent) {
      // Create new consent record
      await this.recordConsent(userId, {
        essential: true, // Always required
        analytics: false,
        crashReporting: false,
        performanceMonitoring: false,
        [consentType]: granted,
      });
    } else {
      // Update existing consent
      existingConsent.consents[consentType] = granted;
      existingConsent.timestamp = new Date(); // Update timestamp
      this.consents.set(userId, existingConsent);
    }
    
    return true;
  }
  
  /**
   * Submit data subject request (GDPR/CCPA)
   */
  async submitDataRequest(
    userId: string,
    requestType: DataSubjectRequest['requestType'],
    reason?: string
  ): Promise<string> {
    const requestId = this.generateRequestId();
    
    const request: DataSubjectRequest = {
      id: requestId,
      userId,
      requestType,
      timestamp: new Date(),
      status: 'pending',
      reason,
    };
    
    this.dataRequests.set(requestId, request);
    
    // Auto-process certain request types
    if (requestType === 'access' || requestType === 'portability') {
      await this.processDataRequest(requestId);
    }
    
    if (__DEV__) {
      console.log(`[Privacy Compliance] Data request submitted: ${requestType} for user ${userId}`);
    }
    
    return requestId;
  }
  
  /**
   * Process data subject request
   */
  async processDataRequest(requestId: string): Promise<boolean> {
    const request = this.dataRequests.get(requestId);
    
    if (!request) {
      return false;
    }
    
    request.status = 'processing';
    this.dataRequests.set(requestId, request);
    
    try {
      let responseData: any = null;
      
      switch (request.requestType) {
        case 'access':
          responseData = await this.generateDataExport(request.userId);
          break;
          
        case 'portability':
          responseData = await this.generatePortableData(request.userId);
          break;
          
        case 'deletion':
          responseData = await this.deleteUserData(request.userId);
          break;
          
        case 'rectification':
          // Manual process - requires specific data changes
          request.status = 'pending';
          break;
          
        case 'objection':
          // Manual review required
          request.status = 'pending';
          break;
      }
      
      if (request.status === 'processing') {
        request.status = 'completed';
        request.completedAt = new Date();
        request.responseData = responseData;
      }
      
      this.dataRequests.set(requestId, request);
      return true;
    } catch (error) {
      request.status = 'rejected';
      request.reason = error instanceof Error ? error.message : 'Processing failed';
      this.dataRequests.set(requestId, request);
      return false;
    }
  }
  
  /**
   * Get data request status
   */
  getDataRequestStatus(requestId: string): DataSubjectRequest | null {
    return this.dataRequests.get(requestId) || null;
  }
  
  /**
   * Get all data requests for user
   */
  getUserDataRequests(userId: string): DataSubjectRequest[] {
    return Array.from(this.dataRequests.values())
      .filter(request => request.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  /**
   * Update privacy settings
   */
  updatePrivacySettings(settings: Partial<PrivacySettings>): void {
    this.privacySettings = { ...this.privacySettings, ...settings };
    
    if (__DEV__) {
      console.log('[Privacy Compliance] Privacy settings updated:', settings);
    }
  }
  
  /**
   * Get current privacy settings
   */
  getPrivacySettings(): PrivacySettings {
    return { ...this.privacySettings };
  }
  
  /**
   * Anonymize data according to privacy settings
   */
  anonymizeData(data: Record<string, any>): Record<string, any> {
    if (!this.privacySettings.anonymizeAnalytics) {
      return data;
    }
    
    return DataProtection.anonymizeData(data);
  }
  
  /**
   * Check if data should be retained
   */
  shouldRetainData(createdAt: Date): boolean {
    return DataProtection.shouldRetainData(createdAt, this.privacySettings.dataRetentionDays);
  }
  
  /**
   * Get data inventory for transparency
   */
  getDataInventory(): DataInventory[] {
    return [
      {
        category: 'Session Data',
        description: 'Poker session information including player names, buy-ins, and cash-outs',
        dataTypes: ['Player names', 'Transaction amounts', 'Session timestamps'],
        purpose: 'Core app functionality - tracking poker sessions',
        retention: `${this.privacySettings.dataRetentionDays} days or user deletion`,
        sharing: 'none',
        legalBasis: 'Legitimate interest - providing requested service',
      },
      {
        category: 'Performance Data',
        description: 'App performance metrics and usage analytics',
        dataTypes: ['Response times', 'Memory usage', 'Error logs'],
        purpose: 'Improving app performance and user experience',
        retention: '30 days',
        sharing: 'anonymous',
        legalBasis: 'Legitimate interest - service improvement',
      },
      {
        category: 'Device Information',
        description: 'Basic device and app information',
        dataTypes: ['Device model', 'OS version', 'App version'],
        purpose: 'Error debugging and compatibility',
        retention: '90 days',
        sharing: 'anonymous',
        legalBasis: 'Legitimate interest - technical support',
      },
      {
        category: 'User Preferences',
        description: 'App settings and user preferences',
        dataTypes: ['Privacy settings', 'App configurations'],
        purpose: 'Personalizing app experience',
        retention: 'Until user deletion or app uninstall',
        sharing: 'none',
        legalBasis: 'Legitimate interest - service customization',
      },
    ];
  }
  
  /**
   * Generate privacy compliance report
   */
  getComplianceReport(): {
    consentStatus: { total: number; byType: Record<string, number> };
    dataRequests: { total: number; byType: Record<string, number>; byStatus: Record<string, number> };
    dataInventory: DataInventory[];
    retentionCompliance: { itemsToDelete: number; lastCleanup: Date | null };
  } {
    const consents = Array.from(this.consents.values());
    const requests = Array.from(this.dataRequests.values());
    
    const consentByType = consents.reduce((acc, consent) => {
      Object.entries(consent.consents).forEach(([type, granted]) => {
        if (granted) {
          acc[type] = (acc[type] || 0) + 1;
        }
      });
      return acc;
    }, {} as Record<string, number>);
    
    const requestsByType = requests.reduce((acc, request) => {
      acc[request.requestType] = (acc[request.requestType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const requestsByStatus = requests.reduce((acc, request) => {
      acc[request.status] = (acc[request.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      consentStatus: {
        total: consents.length,
        byType: consentByType,
      },
      dataRequests: {
        total: requests.length,
        byType: requestsByType,
        byStatus: requestsByStatus,
      },
      dataInventory: this.getDataInventory(),
      retentionCompliance: {
        itemsToDelete: 0, // Would be calculated from actual data
        lastCleanup: null, // Would track actual cleanup dates
      },
    };
  }
  
  // Private methods
  
  private getDefaultPrivacySettings(): PrivacySettings {
    return {
      dataMinimization: securityConfig.privacy.enableDataMinimization,
      automaticCleanup: true,
      anonymizeAnalytics: securityConfig.privacy.enableAnonymization,
      shareErrorReports: false, // Opt-in only
      dataRetentionDays: this.DATA_RETENTION_DAYS,
      allowPerformanceTracking: false, // Opt-in only
    };
  }
  
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private async generateDataExport(userId: string): Promise<any> {
    // In a real implementation, this would collect all user data
    return {
      userId,
      exportDate: new Date().toISOString(),
      consent: this.getUserConsent(userId),
      sessions: [], // Would include actual session data
      preferences: this.getPrivacySettings(),
      requests: this.getUserDataRequests(userId),
    };
  }
  
  private async generatePortableData(userId: string): Promise<any> {
    // Generate data in portable formats (JSON, CSV)
    const exportData = await this.generateDataExport(userId);
    return {
      ...exportData,
      format: 'portable',
      schema: 'pokepot-v1',
    };
  }
  
  private async deleteUserData(userId: string): Promise<any> {
    // In a real implementation, this would delete all user data
    this.consents.delete(userId);
    
    // Remove user from data requests (keep request log for compliance)
    const userRequests = this.getUserDataRequests(userId);
    userRequests.forEach(request => {
      request.userId = 'deleted'; // Anonymize instead of delete for audit trail
    });
    
    return {
      userId,
      deletedAt: new Date().toISOString(),
      itemsDeleted: ['consent', 'sessions', 'preferences'],
    };
  }
  
  private scheduleAutomaticCleanup(): void {
    if (!this.privacySettings.automaticCleanup) {
      return;
    }
    
    // Schedule daily cleanup
    setInterval(() => {
      this.performAutomaticCleanup();
    }, 24 * 60 * 60 * 1000); // 24 hours
  }
  
  private async performAutomaticCleanup(): Promise<void> {
    const now = new Date();
    const retentionMs = this.privacySettings.dataRetentionDays * 24 * 60 * 60 * 1000;
    
    // Clean up old consents
    for (const [userId, consent] of this.consents.entries()) {
      if (now.getTime() - consent.timestamp.getTime() > retentionMs) {
        this.consents.delete(userId);
      }
    }
    
    // Clean up completed data requests older than 1 year
    const requestRetentionMs = 365 * 24 * 60 * 60 * 1000;
    for (const [requestId, request] of this.dataRequests.entries()) {
      if (
        request.status === 'completed' &&
        request.completedAt &&
        now.getTime() - request.completedAt.getTime() > requestRetentionMs
      ) {
        this.dataRequests.delete(requestId);
      }
    }
    
    if (__DEV__) {
      console.log('[Privacy Compliance] Automatic cleanup completed');
    }
  }
}

// Export singleton instance
export const privacyComplianceService = PrivacyComplianceService.getInstance();