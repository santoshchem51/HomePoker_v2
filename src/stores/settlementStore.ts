/**
 * Settlement Store - Epic 3: Settlement Optimization (Scope Rollback Version)
 * Story 3.1: Early Cash-out Calculator Implementation
 * Story 3.2: Settlement Optimization Algorithm
 * Story 3.3: Basic Settlement Validation (Simplified)
 * 
 * SIMPLIFIED VERSION: Core settlement state management only, scope creep eliminated.
 * Zustand store for basic settlement calculations and state management
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { SettlementService } from '../services/settlement/SettlementService';
import { ServiceError } from '../services/core/ServiceError';
import {
  EarlyCashOutRequest,
  EarlyCashOutResult,
  OptimizedSettlement,
  SettlementValidation,
  BankBalance
} from '../types/settlement';

interface SettlementState {
  // Story 3.1: Early cash-out state
  currentCashOutResult: EarlyCashOutResult | null;
  
  // Story 3.2: Settlement optimization state
  currentOptimizedSettlement: OptimizedSettlement | null;
  
  // Story 3.3: Basic settlement validation state  
  currentValidation: SettlementValidation | null;
  
  // Bank balance tracking
  currentBankBalance: BankBalance | null;
  
  // Loading states
  isCalculatingCashOut: boolean;
  isOptimizing: boolean;
  isValidating: boolean;
  
  // Error states
  cashOutError: ServiceError | null;
  optimizationError: ServiceError | null;
  validationError: ServiceError | null;

  // Story 3.1: Early cash-out actions
  calculateEarlyCashOut: (request: EarlyCashOutRequest) => Promise<void>;
  clearCurrentResult: () => void;
  
  // Story 3.2: Settlement optimization actions  
  optimizeSettlement: (sessionId: string) => Promise<void>;
  clearOptimizedSettlement: () => void;
  
  // Story 3.3: Basic settlement validation actions
  validateSettlement: (settlement: OptimizedSettlement) => Promise<void>;
  clearValidation: () => void;
  
  // Bank balance actions
  calculateBankBalance: (sessionId: string) => Promise<void>;
  
  // General actions
  reset: () => void;
  clearErrors: () => void;
}

const useSettlementStore = create<SettlementState>()(
  devtools(
    (set) => ({
      // Initial state
      currentCashOutResult: null,
      currentOptimizedSettlement: null,
      currentValidation: null,
      currentBankBalance: null,
      isCalculatingCashOut: false,
      isOptimizing: false,
      isValidating: false,
      cashOutError: null,
      optimizationError: null,
      validationError: null,

      // Story 3.1: Early cash-out actions
      calculateEarlyCashOut: async (request: EarlyCashOutRequest) => {
        const service = SettlementService.getInstance();
        
        set({ 
          isCalculatingCashOut: true, 
          cashOutError: null 
        });

        try {
          const result = await service.calculateEarlyCashOut(request);
          set({ 
            currentCashOutResult: result,
            isCalculatingCashOut: false 
          });
        } catch (error) {
          set({ 
            cashOutError: error as ServiceError,
            isCalculatingCashOut: false 
          });
        }
      },

      clearCurrentResult: () => {
        set({ currentCashOutResult: null });
      },

      // Story 3.2: Settlement optimization actions
      optimizeSettlement: async (sessionId: string) => {
        const service = SettlementService.getInstance();
        
        set({ 
          isOptimizing: true, 
          optimizationError: null 
        });

        try {
          const result = await service.optimizeSettlement(sessionId);
          set({ 
            currentOptimizedSettlement: result,
            isOptimizing: false 
          });
        } catch (error) {
          set({ 
            optimizationError: error as ServiceError,
            isOptimizing: false 
          });
        }
      },

      clearOptimizedSettlement: () => {
        set({ currentOptimizedSettlement: null });
      },

      // Story 3.3: Basic settlement validation actions
      validateSettlement: async (settlement: OptimizedSettlement) => {
        const service = SettlementService.getInstance();
        
        set({ 
          isValidating: true, 
          validationError: null 
        });

        try {
          const result = await service.validateSettlement(settlement);
          set({ 
            currentValidation: result,
            isValidating: false 
          });
        } catch (error) {
          set({ 
            validationError: error as ServiceError,
            isValidating: false 
          });
        }
      },

      clearValidation: () => {
        set({ currentValidation: null });
      },

      // Bank balance actions
      calculateBankBalance: async (sessionId: string) => {
        const service = SettlementService.getInstance();

        try {
          const result = await service.calculateBankBalance(sessionId);
          set({ currentBankBalance: result });
        } catch (error) {
          // Bank balance errors are typically non-critical, just clear the balance
          set({ currentBankBalance: null });
        }
      },

      // General actions
      reset: () => {
        set({
          currentCashOutResult: null,
          currentOptimizedSettlement: null,
          currentValidation: null,
          currentBankBalance: null,
          isCalculatingCashOut: false,
          isOptimizing: false,
          isValidating: false,
          cashOutError: null,
          optimizationError: null,
          validationError: null
        });
      },

      clearErrors: () => {
        set({
          cashOutError: null,
          optimizationError: null,
          validationError: null
        });
      }
    }),
    {
      name: 'settlement-store'
    }
  )
);

export { useSettlementStore };