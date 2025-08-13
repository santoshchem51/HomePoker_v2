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

interface SessionStoreState {
  // Current session data
  currentSession: Session | null;
  players: Player[];
  loading: boolean;
  error: string | null;

  // Transaction data - Story 1.3
  transactions: TransactionSummary[];
  playerBalances: { [playerId: string]: PlayerBalance };
  transactionLoading: boolean;
  mostRecentTransaction: Transaction | null;

  // UI state
  canStartGame: boolean;
  canCompleteGame: boolean;

  // Actions for session management
  actions: {
    createSession: (name: string, organizerId: string) => Promise<void>;
    addPlayer: (sessionId: string, playerName: string, isGuest?: boolean) => Promise<void>;
    removePlayer: (sessionId: string, playerId: string) => Promise<void>;
    loadSessionState: (sessionId: string) => Promise<void>;
    updateSessionStatus: (sessionId: string, status: 'active' | 'completed') => Promise<void>;
    clearSession: () => void;
    clearError: () => void;
    
    // Transaction actions - Story 1.3
    recordBuyIn: (sessionId: string, playerId: string, amount: number) => Promise<void>;
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
      
      // Transaction state - Story 1.3
      transactions: [],
      playerBalances: {},
      transactionLoading: false,
      mostRecentTransaction: null,
      
      canStartGame: false,
      canCompleteGame: false,

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
            canCompleteGame: false
          });
        },

        /**
         * Clear current error state
         */
        clearError: () => {
          set({ error: null });
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
         * Record a buy-in transaction
         * AC: 1, 2, 3 - Buy-in recording with immediate balance updates
         */
        recordBuyIn: async (sessionId: string, playerId: string, amount: number) => {
          set({ transactionLoading: true, error: null });

          try {
            const transaction = await transactionService.recordBuyIn(
              sessionId,
              playerId,
              amount,
              'manual',
              'user'
            );

            // Update state with optimistic updates
            set((state) => {
              // Update transaction list
              const newTransactions = [
                {
                  id: transaction.id,
                  playerId: transaction.playerId,
                  playerName: state.players.find(p => p.id === playerId)?.name || 'Unknown',
                  type: 'buy_in' as const,
                  amount: transaction.amount,
                  timestamp: transaction.timestamp,
                  method: transaction.method,
                  isVoided: transaction.isVoided
                },
                ...state.transactions
              ];

              // Update current session total pot
              const updatedSession = state.currentSession ? {
                ...state.currentSession,
                totalPot: state.currentSession.totalPot + amount
              } : null;

              // Update player balance
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
                mostRecentTransaction: transaction,
                transactionLoading: false
              };
            });
          } catch (error) {
            console.error('Failed to record buy-in:', error);
            set({ 
              transactionLoading: false, 
              error: error instanceof ServiceError ? error.message : 'Failed to record buy-in' 
            });
            throw error;
          }
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
};