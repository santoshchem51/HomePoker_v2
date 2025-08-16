/**
 * Session State Management with Zustand
 * Provides centralized state management for session and player data
 * AC: 3, 6 - Session displays and status tracking
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Session } from '../types/session';
import { Player } from '../types/player';
import { Transaction, TransactionSummary, PlayerBalance } from '../types/transaction';
import { SessionService } from '../services/core/SessionService';
import TransactionService from '../services/core/TransactionService';
import { ServiceError } from '../services/core/ServiceError';
import { responsiveAsync } from '../utils/ui-responsiveness';

interface SessionStoreState {
  // Current session data
  currentSession: Session | null;
  players: Player[];
  loading: boolean;
  error: string | null;

  // Active sessions data (for navigation)
  activeSessions: Session[];
  activeSessionsLoading: boolean;

  // Transaction data - Story 1.3
  transactions: TransactionSummary[];
  playerBalances: { [playerId: string]: PlayerBalance };
  transactionLoading: boolean;
  mostRecentTransaction: Transaction | null;

  // UI state
  canStartGame: boolean;
  canCompleteGame: boolean;

  // Responsive UI state
  operationLoading: { [operation: string]: boolean };
  optimisticUpdates: { [key: string]: any };

  // Actions for session management
  actions: {
    createSession: (name: string, organizerId: string) => Promise<void>;
    addPlayer: (sessionId: string, playerName: string, isGuest?: boolean) => Promise<void>;
    removePlayer: (sessionId: string, playerId: string) => Promise<void>;
    loadSessionState: (sessionId: string) => Promise<void>;
    updateSessionStatus: (sessionId: string, status: 'active' | 'completed') => Promise<void>;
    clearSession: () => void;
    clearError: () => void;
    
    // Active sessions management
    loadActiveSessions: () => Promise<void>;
    
    // Transaction actions - Story 1.3
    recordBuyIn: (sessionId: string, playerId: string, amount: number) => Promise<void>;
    recordCashOut: (sessionId: string, playerId: string, amount: number, organizerConfirmed?: boolean) => Promise<void>;
    undoTransaction: (transactionId: string) => Promise<void>;
    loadTransactionHistory: (sessionId: string) => Promise<void>;
    refreshPlayerBalances: (sessionId: string) => Promise<void>;
    
    // Computed getters
    getPlayerCount: () => number;
    getPlayerById: (playerId: string) => Player | undefined;
    canAddMorePlayers: () => boolean;
    getTransactionById: (transactionId: string) => TransactionSummary | undefined;
    canUndoTransaction: (transactionId: string) => boolean;
    getRemainingUndoTime: (transactionId: string) => number;
  };
}

const sessionService = SessionService.getInstance();
const transactionService = TransactionService.getInstance();

export const useSessionStore = create<SessionStoreState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentSession: null,
      players: [],
      loading: false,
      error: null,
      
      // Active sessions state
      activeSessions: [],
      activeSessionsLoading: false,
      
      // Transaction state - Story 1.3
      transactions: [],
      playerBalances: {},
      transactionLoading: false,
      mostRecentTransaction: null,
      
      canStartGame: false,
      canCompleteGame: false,

      // Responsive UI state
      operationLoading: {},
      optimisticUpdates: {},

      actions: {
        /**
         * Create a new session
         * AC: 1, 4, 5, 6
         */
        createSession: async (name: string, organizerId: string) => {
          set({ loading: true, error: null });

          try {
            const session = await sessionService.createSession({ name, organizerId });
            
            set({
              currentSession: session,
              players: [],
              canStartGame: false,
              canCompleteGame: false,
              loading: false
            });
          } catch (error) {
            const errorMessage = error instanceof ServiceError 
              ? error.message 
              : 'Failed to create session';
            
            set({ error: errorMessage, loading: false });
            throw error;
          }
        },

        /**
         * Add a player to the current session
         * AC: 2, 3
         */
        addPlayer: async (sessionId: string, playerName: string, isGuest = true) => {
          const { currentSession, players } = get();
          if (!currentSession) {
            throw new Error('No active session');
          }

          set({ loading: true, error: null });

          try {
            const newPlayer = await sessionService.addPlayer(sessionId, {
              name: playerName,
              isGuest
            });

            const updatedPlayers = [...players, newPlayer];
            const canStartGame = updatedPlayers.length >= 4 && updatedPlayers.length <= 8;
            
            set({
              players: updatedPlayers,
              currentSession: {
                ...currentSession,
                playerCount: updatedPlayers.length
              },
              canStartGame: canStartGame && currentSession.status === 'created',
              loading: false
            });
          } catch (error) {
            const errorMessage = error instanceof ServiceError 
              ? error.message 
              : 'Failed to add player';
            
            set({ error: errorMessage, loading: false });
            throw error;
          }
        },

        /**
         * Remove a player from the current session
         * AC: 3
         */
        removePlayer: async (sessionId: string, playerId: string) => {
          const { currentSession, players } = get();
          if (!currentSession) {
            throw new Error('No active session');
          }

          set({ loading: true, error: null });

          try {
            await sessionService.removePlayer(sessionId, playerId);

            const updatedPlayers = players.filter(p => p.id !== playerId);
            const canStartGame = updatedPlayers.length >= 4 && updatedPlayers.length <= 8;
            
            set({
              players: updatedPlayers,
              currentSession: {
                ...currentSession,
                playerCount: updatedPlayers.length
              },
              canStartGame: canStartGame && currentSession.status === 'created',
              loading: false
            });
          } catch (error) {
            const errorMessage = error instanceof ServiceError 
              ? error.message 
              : 'Failed to remove player';
            
            set({ error: errorMessage, loading: false });
            throw error;
          }
        },

        /**
         * Load complete session state from database
         * AC: 3, 6
         */
        loadSessionState: async (sessionId: string) => {
          set({ loading: true, error: null });

          try {
            const sessionState = await sessionService.getSessionState(sessionId);
            
            if (!sessionState) {
              throw new Error('Session not found');
            }

            set({
              currentSession: sessionState.session,
              players: sessionState.players,
              canStartGame: sessionState.canStart,
              canCompleteGame: sessionState.canComplete,
              loading: false
            });
          } catch (error) {
            const errorMessage = error instanceof ServiceError 
              ? error.message 
              : 'Failed to load session';
            
            set({ error: errorMessage, loading: false });
            throw error;
          }
        },

        /**
         * Update session status (created -> active -> completed)
         * AC: 6
         */
        updateSessionStatus: async (sessionId: string, status: 'active' | 'completed') => {
          const { currentSession } = get();
          if (!currentSession) {
            throw new Error('No active session');
          }

          set({ loading: true, error: null });

          try {
            await sessionService.updateSessionStatus(sessionId, status);

            const now = new Date();
            const updatedSession: Session = {
              ...currentSession,
              status,
              ...(status === 'active' && { startedAt: now }),
              ...(status === 'completed' && { completedAt: now })
            };

            set({
              currentSession: updatedSession,
              canStartGame: false,
              canCompleteGame: status === 'active',
              loading: false
            });
          } catch (error) {
            const errorMessage = error instanceof ServiceError 
              ? error.message 
              : 'Failed to update session status';
            
            set({ error: errorMessage, loading: false });
            throw error;
          }
        },

        /**
         * Clear current session and reset state
         */
        clearSession: () => {
          set({
            currentSession: null,
            players: [],
            loading: false,
            error: null,
            // Clear transaction state
            transactions: [],
            playerBalances: {},
            transactionLoading: false,
            mostRecentTransaction: null,
            canStartGame: false,
            canCompleteGame: false,
            // Clear responsive UI state
            operationLoading: {},
            optimisticUpdates: {}
          });
        },

        /**
         * Clear current error state
         */
        clearError: () => {
          set({ error: null });
        },

        /**
         * Load active sessions for navigation
         */
        loadActiveSessions: async () => {
          set({ activeSessionsLoading: true });
          
          try {
            const activeSessions = await sessionService.getActiveSessions();
            set({ 
              activeSessions,
              activeSessionsLoading: false 
            });
          } catch (error) {
            console.error('Failed to load active sessions:', error);
            set({ 
              activeSessions: [],
              activeSessionsLoading: false 
            });
          }
        },

        /**
         * Get current player count
         */
        getPlayerCount: () => {
          return get().players.length;
        },

        /**
         * Find a player by ID
         */
        getPlayerById: (playerId: string) => {
          return get().players.find(p => p.id === playerId);
        },

        /**
         * Check if more players can be added (max 8)
         */
        canAddMorePlayers: () => {
          const { players, currentSession } = get();
          return currentSession?.status === 'created' && players.length < 8;
        },

        // Transaction Actions - Story 1.3

        /**
         * Record a buy-in transaction with responsive UI and optimistic updates
         * AC: 1, 2, 3 - Buy-in recording with immediate balance updates
         */
        recordBuyIn: async (sessionId: string, playerId: string, amount: number) => {
          const operationId = `recordBuyIn_${playerId}_${Date.now()}`;
          
          // Apply optimistic update immediately for UI responsiveness
          const optimisticTransactionId = `temp_${Date.now()}`;
          const playerName = get().players.find(p => p.id === playerId)?.name || 'Unknown';
          
          set((state) => {
            // Create optimistic transaction
            const optimisticTransaction = {
              id: optimisticTransactionId,
              playerId,
              playerName,
              type: 'buy_in' as const,
              amount,
              timestamp: new Date(),
              method: 'manual' as const,
              isVoided: false
            };

            // Apply optimistic updates
            const newTransactions = [optimisticTransaction, ...state.transactions];
            const updatedSession = state.currentSession ? {
              ...state.currentSession,
              totalPot: state.currentSession.totalPot + amount
            } : null;
            const updatedPlayers = state.players.map(player => 
              player.id === playerId 
                ? {
                    ...player,
                    currentBalance: player.currentBalance + amount,
                    totalBuyIns: player.totalBuyIns + amount
                  }
                : player
            );

            return {
              ...state,
              transactions: newTransactions,
              currentSession: updatedSession,
              players: updatedPlayers,
              operationLoading: { ...state.operationLoading, [operationId]: true },
              optimisticUpdates: { ...state.optimisticUpdates, [optimisticTransactionId]: true }
            };
          });

          // Perform actual database operation responsively
          return responsiveAsync(
            () => transactionService.recordBuyIn(sessionId, playerId, amount, 'manual', 'user'),
            {
              operationName: 'record_buy_in',
              loadingCallback: (loading) => {
                set((state) => ({
                  ...state,
                  operationLoading: { ...state.operationLoading, [operationId]: loading }
                }));
              },
              successCallback: (transaction) => {
                // Replace optimistic transaction with real one
                set((state) => {
                  const filteredTransactions = state.transactions.filter(t => t.id !== optimisticTransactionId);
                  const realTransaction = {
                    id: transaction.id,
                    playerId: transaction.playerId,
                    playerName,
                    type: 'buy_in' as const,
                    amount: transaction.amount,
                    timestamp: transaction.timestamp,
                    method: transaction.method,
                    isVoided: transaction.isVoided
                  };

                  const updatedOptimisticUpdates = { ...state.optimisticUpdates };
                  delete updatedOptimisticUpdates[optimisticTransactionId];

                  return {
                    ...state,
                    transactions: [realTransaction, ...filteredTransactions],
                    mostRecentTransaction: transaction,
                    optimisticUpdates: updatedOptimisticUpdates
                  };
                });
              },
              errorCallback: (error) => {
                // Rollback optimistic updates
                set((state) => {
                  const rollbackTransactions = state.transactions.filter(t => t.id !== optimisticTransactionId);
                  const updatedSession = state.currentSession ? {
                    ...state.currentSession,
                    totalPot: state.currentSession.totalPot - amount
                  } : null;
                  const rollbackPlayers = state.players.map(player => 
                    player.id === playerId 
                      ? {
                          ...player,
                          currentBalance: player.currentBalance - amount,
                          totalBuyIns: player.totalBuyIns - amount
                        }
                      : player
                  );

                  const updatedOptimisticUpdates = { ...state.optimisticUpdates };
                  delete updatedOptimisticUpdates[optimisticTransactionId];

                  return {
                    ...state,
                    transactions: rollbackTransactions,
                    currentSession: updatedSession,
                    players: rollbackPlayers,
                    optimisticUpdates: updatedOptimisticUpdates,
                    error: error instanceof ServiceError ? error.message : 'Failed to record buy-in'
                  };
                });
              }
            }
          );
        },

        /**
         * Record a cash-out transaction with optimistic updates
         * AC: 1, 4 - Cash-out transaction recording
         */
        recordCashOut: async (sessionId: string, playerId: string, amount: number, organizerConfirmed?: boolean) => {
          const operationId = `recordCashOut_${playerId}_${Date.now()}`;
          
          // Apply optimistic update immediately for UI responsiveness
          const optimisticTransactionId = `temp_cashout_${Date.now()}`;
          const playerName = get().players.find(p => p.id === playerId)?.name || 'Unknown';
          
          set((state) => {
            // Create optimistic transaction
            const optimisticTransaction = {
              id: optimisticTransactionId,
              playerId,
              playerName,
              type: 'cash_out' as const,
              amount,
              timestamp: new Date(),
              method: 'manual' as const,
              isVoided: false
            };

            // Apply optimistic updates
            const newTransactions = [optimisticTransaction, ...state.transactions];
            const updatedSession = state.currentSession ? {
              ...state.currentSession,
              totalPot: state.currentSession.totalPot - amount
            } : null;
            const updatedPlayers = state.players.map(player => 
              player.id === playerId 
                ? {
                    ...player,
                    currentBalance: player.currentBalance - amount,
                    totalCashOuts: player.totalCashOuts + amount,
                    status: 'cashed_out' as const // Mark as cashed out
                  }
                : player
            );

            return {
              ...state,
              transactions: newTransactions,
              currentSession: updatedSession,
              players: updatedPlayers,
              operationLoading: { ...state.operationLoading, [operationId]: true },
              optimisticUpdates: { ...state.optimisticUpdates, [optimisticTransactionId]: true }
            };
          });

          // Perform actual database operation responsively
          return responsiveAsync(
            () => transactionService.recordCashOut(sessionId, playerId, amount, 'manual', 'user', undefined, organizerConfirmed),
            {
              operationName: 'record_cash_out',
              loadingCallback: (loading) => {
                set((state) => ({
                  ...state,
                  operationLoading: { ...state.operationLoading, [operationId]: loading }
                }));
              },
              successCallback: (transaction) => {
                // Replace optimistic transaction with real one
                set((state) => {
                  const filteredTransactions = state.transactions.filter(t => t.id !== optimisticTransactionId);
                  const realTransaction = {
                    id: transaction.id,
                    playerId: transaction.playerId,
                    playerName,
                    type: 'cash_out' as const,
                    amount: transaction.amount,
                    timestamp: transaction.timestamp,
                    method: transaction.method,
                    isVoided: transaction.isVoided
                  };

                  const updatedOptimisticUpdates = { ...state.optimisticUpdates };
                  delete updatedOptimisticUpdates[optimisticTransactionId];

                  return {
                    ...state,
                    transactions: [realTransaction, ...filteredTransactions],
                    mostRecentTransaction: transaction,
                    optimisticUpdates: updatedOptimisticUpdates
                  };
                });
              },
              errorCallback: (error) => {
                // Rollback optimistic updates
                set((state) => {
                  const rollbackTransactions = state.transactions.filter(t => t.id !== optimisticTransactionId);
                  const updatedSession = state.currentSession ? {
                    ...state.currentSession,
                    totalPot: state.currentSession.totalPot + amount
                  } : null;
                  const rollbackPlayers = state.players.map(player => 
                    player.id === playerId 
                      ? {
                          ...player,
                          currentBalance: player.currentBalance + amount,
                          totalCashOuts: player.totalCashOuts - amount,
                          status: 'active' as const // Restore active status
                        }
                      : player
                  );

                  const updatedOptimisticUpdates = { ...state.optimisticUpdates };
                  delete updatedOptimisticUpdates[optimisticTransactionId];

                  return {
                    ...state,
                    transactions: rollbackTransactions,
                    currentSession: updatedSession,
                    players: rollbackPlayers,
                    optimisticUpdates: updatedOptimisticUpdates,
                    error: error instanceof ServiceError ? error.message : 'Failed to record cash-out'
                  };
                });
              }
            }
          );
        },

        /**
         * Undo a transaction
         * AC: 6 - Undo functionality within 30-second window
         */
        undoTransaction: async (transactionId: string) => {
          set({ transactionLoading: true, error: null });

          try {
            await transactionService.undoTransaction(transactionId, 'User undo request');

            // Update state after successful undo
            set((state) => {
              const transaction = state.transactions.find(t => t.id === transactionId);
              if (!transaction) {
                return { ...state, transactionLoading: false };
              }

              // Mark transaction as voided in UI
              const updatedTransactions = state.transactions.map(t =>
                t.id === transactionId ? { ...t, isVoided: true } : t
              );

              // Update current session total pot
              const updatedSession = state.currentSession ? {
                ...state.currentSession,
                totalPot: state.currentSession.totalPot - transaction.amount
              } : null;

              // Update player balance
              const player = state.players.find(p => p.name === transaction.playerName);
              const updatedPlayers = player ? state.players.map(p => 
                p.id === player.id 
                  ? {
                      ...p,
                      currentBalance: p.currentBalance - transaction.amount,
                      totalBuyIns: p.totalBuyIns - transaction.amount
                    }
                  : p
              ) : state.players;

              return {
                ...state,
                transactions: updatedTransactions,
                currentSession: updatedSession,
                players: updatedPlayers,
                transactionLoading: false
              };
            });
          } catch (error) {
            console.error('Failed to undo transaction:', error);
            set({ 
              transactionLoading: false, 
              error: error instanceof ServiceError ? error.message : 'Failed to undo transaction' 
            });
            throw error;
          }
        },

        /**
         * Load transaction history for a session
         * AC: 4 - Transaction history display
         */
        loadTransactionHistory: async (sessionId: string) => {
          set({ transactionLoading: true, error: null });

          try {
            const transactions = await transactionService.getTransactionHistory(sessionId);
            
            set({ 
              transactions, 
              transactionLoading: false 
            });
          } catch (error) {
            console.error('Failed to load transaction history:', error);
            set({ 
              transactionLoading: false, 
              error: error instanceof ServiceError ? error.message : 'Failed to load transaction history' 
            });
          }
        },

        /**
         * Refresh player balances
         * AC: 3 - Player running totals update
         */
        refreshPlayerBalances: async (_sessionId: string) => {
          try {
            const { players } = get();
            const balances: { [playerId: string]: PlayerBalance } = {};

            // Get updated balances for all players
            await Promise.all(
              players.map(async (player) => {
                try {
                  const balance = await transactionService.calculatePlayerBalance(player.id);
                  balances[player.id] = balance;
                } catch (error) {
                  console.error(`Failed to get balance for player ${player.id}:`, error);
                }
              })
            );

            set({ playerBalances: balances });
          } catch (error) {
            console.error('Failed to refresh player balances:', error);
          }
        },

        // Transaction Getters

        /**
         * Get transaction by ID
         */
        getTransactionById: (transactionId: string) => {
          const { transactions } = get();
          return transactions.find(t => t.id === transactionId);
        },

        /**
         * Check if transaction can be undone
         * AC: 6 - 30-second undo window
         */
        canUndoTransaction: (transactionId: string) => {
          return transactionService.canUndoTransaction(transactionId);
        },

        /**
         * Get remaining undo time in seconds
         */
        getRemainingUndoTime: (transactionId: string) => {
          return transactionService.getRemainingUndoTime(transactionId);
        }
      }
    }),
    {
      name: 'session-store',
      // Only log actions in development
      enabled: __DEV__
    }
  )
);

// Export actions for easier access
export const useSessionActions = () => useSessionStore(state => state.actions);

// Export selectors for performance optimization
export const sessionSelectors = {
  useCurrentSession: () => useSessionStore(state => state.currentSession),
  usePlayers: () => useSessionStore(state => state.players),
  useLoading: () => useSessionStore(state => state.loading),
  useError: () => useSessionStore(state => state.error),
  useCanStartGame: () => useSessionStore(state => state.canStartGame),
  useCanCompleteGame: () => useSessionStore(state => state.canCompleteGame),
  usePlayerCount: () => useSessionStore(state => state.players.length),
  useSessionStatus: () => useSessionStore(state => state.currentSession?.status),
  
  // Responsive UI selectors
  useOperationLoading: (operationId?: string) => useSessionStore(state => 
    operationId ? state.operationLoading[operationId] || false : Object.values(state.operationLoading).some(Boolean)
  ),
  useOptimisticUpdates: () => useSessionStore(state => state.optimisticUpdates),
  useTransactionLoading: () => useSessionStore(state => state.transactionLoading),
  useTransactions: () => useSessionStore(state => state.transactions),
  
  // Memoized computed selectors
  useIsAnyOperationLoading: () => useSessionStore(state => 
    state.loading || state.transactionLoading || Object.values(state.operationLoading).some(Boolean)
  ),
  useHasOptimisticUpdates: () => useSessionStore(state => 
    Object.keys(state.optimisticUpdates).length > 0
  ),
};