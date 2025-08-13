/**
 * useSimpleWebView - Hook for managing mobile web view balance display
 * Implements Story 2.4 requirements for simple web interface
 */
import { useState, useEffect, useCallback } from 'react';
import { SessionUrlService, RefreshResponse } from '../services/integration/SessionUrlService';
import { ServiceError } from '../services/core/ServiceError';

export interface WebViewState {
  balanceData: RefreshResponse | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastRefresh: Date;
  sessionActive: boolean;
}

export interface UseSimpleWebViewOptions {
  sessionId: string;
  playerId: string;
  autoRefreshInterval?: number; // in milliseconds, default 300000 (5 minutes)
  onSessionExpired?: () => void;
  onError?: (error: string) => void;
}

export function useSimpleWebView({
  sessionId,
  playerId,
  autoRefreshInterval = 300000, // 5 minutes
  onSessionExpired,
  onError
}: UseSimpleWebViewOptions) {
  const [state, setState] = useState<WebViewState>({
    balanceData: null,
    loading: true,
    refreshing: false,
    error: null,
    lastRefresh: new Date(),
    sessionActive: true
  });

  const sessionUrlService = SessionUrlService.getInstance();

  /**
   * Load player balance data
   * AC: 2 - Mobile-optimized web page showing player's current balance
   */
  const loadBalanceData = useCallback(async (showLoading: boolean = true) => {
    try {
      if (showLoading) {
        setState(prev => ({ ...prev, loading: true, error: null }));
      }

      const response = await sessionUrlService.getPlayerBalance(sessionId, playerId);
      
      setState(prev => ({
        ...prev,
        balanceData: response,
        loading: false,
        error: null,
        lastRefresh: new Date(),
        sessionActive: response.sessionActive
      }));

      // Check for session expiration
      if (!response.sessionActive) {
        onSessionExpired?.();
      }
    } catch (error) {
      const errorMessage = error instanceof ServiceError 
        ? error.message 
        : 'Failed to load balance data';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        sessionActive: false
      }));

      // Handle specific error conditions
      if (errorMessage.includes('Session has ended') || 
          errorMessage.includes('not found') ||
          errorMessage.includes('Maximum number of viewers')) {
        onSessionExpired?.();
      }
      
      onError?.(errorMessage);
    }
  }, [sessionId, playerId, sessionUrlService, onSessionExpired, onError]);

  /**
   * Manual refresh functionality
   * AC: 3 - Balance updates when organizer manually refreshes (no real-time updates)
   */
  const handleManualRefresh = useCallback(async () => {
    if (state.refreshing || !state.sessionActive) return;

    try {
      setState(prev => ({ ...prev, refreshing: true }));
      await loadBalanceData(false);
    } finally {
      setState(prev => ({ ...prev, refreshing: false }));
    }
  }, [loadBalanceData, state.refreshing, state.sessionActive]);

  /**
   * Validate session URL and check if still active
   * AC: 5 - Session URL expires when organizer ends session
   */
  const validateSession = useCallback(async () => {
    try {
      const isValid = await sessionUrlService.validateSessionUrl(sessionId, playerId);
      
      if (!isValid && state.sessionActive) {
        setState(prev => ({
          ...prev,
          sessionActive: false,
          error: 'Session has ended or is no longer valid'
        }));
        onSessionExpired?.();
      }
      
      return isValid;
    } catch (error) {
      console.warn('Session validation failed:', error);
      return false;
    }
  }, [sessionId, playerId, sessionUrlService, state.sessionActive, onSessionExpired]);

  /**
   * Format currency amount
   */
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(Math.abs(amount));
  }, []);

  /**
   * Get balance color based on positive/negative value
   */
  const getBalanceColor = useCallback((balance: number): string => {
    if (balance > 0) return '#2e7d32'; // Green for positive
    if (balance < 0) return '#d32f2f'; // Red for negative
    return '#666'; // Gray for zero
  }, []);

  /**
   * Format last update time
   */
  const formatLastUpdate = useCallback((): string => {
    const now = new Date();
    const diffMs = now.getTime() - state.lastRefresh.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return state.lastRefresh.toLocaleDateString();
  }, [state.lastRefresh]);

  // Load initial data
  useEffect(() => {
    loadBalanceData();
  }, [loadBalanceData]);

  // Set up auto-refresh interval
  useEffect(() => {
    if (!state.sessionActive || autoRefreshInterval <= 0) return;

    const interval = setInterval(() => {
      if (!state.refreshing) {
        loadBalanceData(false);
      }
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [state.sessionActive, state.refreshing, autoRefreshInterval, loadBalanceData]);

  // Set up session validation checks
  useEffect(() => {
    if (!state.sessionActive) return;

    const interval = setInterval(() => {
      validateSession();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [state.sessionActive, validateSession]);

  return {
    ...state,
    loadBalanceData,
    handleManualRefresh,
    validateSession,
    formatCurrency,
    getBalanceColor,
    formatLastUpdate,
    canRefresh: state.sessionActive && !state.refreshing
  };
}