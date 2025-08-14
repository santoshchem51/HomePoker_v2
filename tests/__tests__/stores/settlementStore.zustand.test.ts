/**
 * Settlement Store Tests - Native Zustand Patterns
 * Epic 3: Settlement Optimization with proper React 19 compatibility
 */

import { useSettlementStore } from '../../../src/stores/settlementStore';
import { SettlementService } from '../../../src/services/settlement/SettlementService';
import { createTestStore, testStoreAction, createStoreMocks } from '../../zustand-testing';

// Mock the SettlementService
jest.mock('../../../src/services/settlement/SettlementService');

describe('SettlementStore - Native Zustand Testing', () => {
  let testStore: any;
  let mocks: any;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create test store and mocks
    testStore = createTestStore(() => useSettlementStore);
    mocks = createStoreMocks();
    
    // Mock the SettlementService.getInstance
    (SettlementService.getInstance as jest.Mock).mockReturnValue(mocks.settlementService);
    
    // Reset store to clean state
    testStore.resetToInitialState();
  });

  describe('Basic Store Operations', () => {
    test('should initialize with default state', () => {
      const state = testStore.getState();
      
      expect(state.status).toBe('idle');
      expect(state.currentResult).toBeNull();
      expect(state.error).toBeNull();
      expect(state.isOptimizing).toBe(false);
    });

    test('should update optimization status', async () => {
      const store = testStore.getState();
      
      // Test status change
      store.setStatus('optimizing');
      
      expect(testStore.getState().status).toBe('optimizing');
      expect(testStore.getState().isOptimizing).toBe(true);
    });

    test('should handle errors properly', async () => {
      const store = testStore.getState();
      const testError = new Error('Test error');
      
      store.setError(testError);
      
      expect(testStore.getState().error).toEqual(testError);
      expect(testStore.getState().status).toBe('error');
    });
  });

  describe('Validation Operations', () => {
    test('should perform settlement validation', async () => {
      const mockValidation = {
        isValid: true,
        errors: [],
        warnings: [],
        auditTrail: []
      };
      
      mocks.settlementService.validateSettlement.mockResolvedValue(mockValidation);
      
      const store = testStore.getState();
      const mockSettlement = { sessionId: 'test-session', directPayments: [] };
      
      // Test the validation action
      const result = await store.validateSettlement(mockSettlement);
      
      expect(result).toEqual(mockValidation);
      expect(mocks.settlementService.validateSettlement).toHaveBeenCalledWith(mockSettlement);
    });

    test('should handle validation errors', async () => {
      const validationError = new Error('Validation failed');
      mocks.settlementService.validateSettlement.mockRejectedValue(validationError);
      
      const store = testStore.getState();
      const mockSettlement = { sessionId: 'test-session', directPayments: [] };
      
      await expect(store.validateSettlement(mockSettlement)).rejects.toThrow('Validation failed');
    });
  });

  describe('State Persistence', () => {
    test('should maintain state between operations', async () => {
      const store = testStore.getState();
      
      // Set some state
      store.setStatus('optimizing');
      store.setProgress(50);
      
      // Verify state persists
      expect(testStore.getState().status).toBe('optimizing');
      expect(testStore.getState().progress).toBe(50);
      
      // Perform another operation
      store.setProgress(100);
      store.setStatus('completed');
      
      expect(testStore.getState().status).toBe('completed');
      expect(testStore.getState().progress).toBe(100);
    });
  });

  describe('Store Subscriptions', () => {
    test('should notify subscribers of state changes', () => {
      const mockSubscriber = jest.fn();
      const unsubscribe = testStore.subscribe(mockSubscriber);
      
      const store = testStore.getState();
      store.setStatus('optimizing');
      
      expect(mockSubscriber).toHaveBeenCalled();
      
      unsubscribe();
    });
  });

  describe('Complex State Operations', () => {
    test('should handle optimization workflow', async () => {
      const store = testStore.getState();
      const mockSession = 'test-session';
      
      // Mock optimization result
      const mockOptimization = {
        sessionId: mockSession,
        directPayments: [],
        isValid: true,
        validationErrors: [],
        mathematicalProof: null
      };
      
      // Test the complete workflow
      store.setStatus('optimizing');
      store.setProgress(25);
      
      expect(testStore.getState().status).toBe('optimizing');
      expect(testStore.getState().progress).toBe(25);
      
      store.setProgress(100);
      store.setStatus('completed');
      store.setCurrentResult(mockOptimization);
      
      const finalState = testStore.getState();
      expect(finalState.status).toBe('completed');
      expect(finalState.progress).toBe(100);
      expect(finalState.currentResult).toEqual(mockOptimization);
    });
  });

  describe('Error Recovery', () => {
    test('should recover from error state', async () => {
      const store = testStore.getState();
      
      // Set error state
      store.setError(new Error('Test error'));
      expect(testStore.getState().status).toBe('error');
      
      // Clear error and resume
      store.clearError();
      store.setStatus('idle');
      
      expect(testStore.getState().error).toBeNull();
      expect(testStore.getState().status).toBe('idle');
    });
  });
});