/**
 * Comprehensive User Flow Integration Tests
 * Story 5.3: Comprehensive Testing Suite - Task 2
 * Tests complete poker session lifecycle from start to settlement
 */

import { DatabaseService } from '@/services/infrastructure/DatabaseService';
import { SessionService } from '@/services/core/SessionService';
import { TransactionService } from '@/services/core/TransactionService';
import { SettlementService } from '@/services/core/SettlementService';
import { ProfileService } from '@/services/core/ProfileService';
import { 
  ServiceMocks, 
  DataFactories 
} from '../../mock-factories';
import { Player, Session, Transaction, PlayerProfile } from '@/types/poker';

describe('Comprehensive User Flow Integration', () => {
  let databaseService: DatabaseService;
  let sessionService: SessionService;
  let transactionService: TransactionService;
  let settlementService: SettlementService;
  let profileService: ProfileService;

  beforeEach(async () => {
    // Initialize services with mocked dependencies
    databaseService = ServiceMocks.createDatabaseService();
    sessionService = new SessionService(databaseService);
    transactionService = new TransactionService(databaseService);
    settlementService = new SettlementService();
    profileService = new ProfileService(databaseService);

    await databaseService.initialize();
  });

  afterEach(async () => {
    await databaseService.close();
  });

  describe('Complete Poker Session Lifecycle', () => {
    it('should handle complete session from creation to settlement', async () => {
      // Step 1: Create player profiles
      const playerProfiles: PlayerProfile[] = [
        DataFactories.createPlayerProfile('Alice', 'alice@example.com'),
        DataFactories.createPlayerProfile('Bob', 'bob@example.com'),
        DataFactories.createPlayerProfile('Charlie', 'charlie@example.com'),
        DataFactories.createPlayerProfile('Dana', 'dana@example.com'),
      ];

      // Save profiles
      for (const profile of playerProfiles) {
        await profileService.saveProfile(profile);
      }

      // Step 2: Create session
      const sessionData = DataFactories.createSessionData({
        playerCount: 4,
        buyInAmount: 100.00,
        gameType: 'cash',
      });

      const session = await sessionService.createSession(sessionData);
      expect(session.id).toBeDefined();
      expect(session.status).toBe('created');
      expect(session.players).toHaveLength(0);

      // Step 3: Add players to session
      const players: Player[] = [];
      for (const profile of playerProfiles) {
        const player = DataFactories.createPlayer({
          name: profile.name,
          profileId: profile.id,
        });
        
        const addedPlayer = await sessionService.addPlayer(session.id, player);
        players.push(addedPlayer);
      }

      // Verify all players added
      const updatedSession = await sessionService.getSession(session.id);
      expect(updatedSession?.players).toHaveLength(4);
      expect(updatedSession?.status).toBe('created');

      // Step 4: Start session
      await sessionService.startSession(session.id);
      const activeSession = await sessionService.getSession(session.id);
      expect(activeSession?.status).toBe('active');

      // Step 5: Process buy-in transactions
      const buyInTransactions: Transaction[] = [];
      for (const player of players) {
        const buyInAmount = 100.00;
        const transaction = await transactionService.recordBuyIn({
          sessionId: session.id,
          playerId: player.id,
          amount: buyInAmount,
          type: 'buy-in' as const,
          timestamp: new Date(),
        });
        
        buyInTransactions.push(transaction);
        expect(transaction.amount).toBe(buyInAmount);
        expect(transaction.type).toBe('buy-in');
      }

      // Verify total buy-ins
      const sessionAfterBuyIns = await sessionService.getSession(session.id);
      expect(sessionAfterBuyIns?.totalBuyIns).toBe(400.00);

      // Step 6: Process additional transactions during game
      const additionalTransactions: Transaction[] = [];
      
      // Alice adds on $50
      const aliceAddOn = await transactionService.recordBuyIn({
        sessionId: session.id,
        playerId: players[0].id,
        amount: 50.00,
        type: 'buy-in',
        timestamp: new Date(),
      });
      additionalTransactions.push(aliceAddOn);

      // Bob adds on $25
      const bobAddOn = await transactionService.recordBuyIn({
        sessionId: session.id,
        playerId: players[1].id,
        amount: 25.00,
        type: 'buy-in',
        timestamp: new Date(),
      });
      additionalTransactions.push(bobAddOn);

      // Verify updated totals
      const sessionAfterAddOns = await sessionService.getSession(session.id);
      expect(sessionAfterAddOns?.totalBuyIns).toBe(475.00);

      // Step 7: Process cash-out transactions
      const cashOutData = [
        { playerId: players[0].id, amount: 175.00 }, // Alice: +$25 profit
        { playerId: players[1].id, amount: 100.00 }, // Bob: -$25 loss
        { playerId: players[2].id, amount: 80.00 },  // Charlie: -$20 loss
        { playerId: players[3].id, amount: 120.00 }, // Dana: +$20 profit
      ];

      const cashOutTransactions: Transaction[] = [];
      for (const cashOut of cashOutData) {
        const transaction = await transactionService.recordCashOut({
          sessionId: session.id,
          playerId: cashOut.playerId,
          amount: cashOut.amount,
          type: 'cash-out' as const,
          timestamp: new Date(),
        });
        
        cashOutTransactions.push(transaction);
        expect(transaction.amount).toBe(cashOut.amount);
        expect(transaction.type).toBe('cash-out');
      }

      // Step 8: Generate settlement
      const allTransactions = [
        ...buyInTransactions,
        ...additionalTransactions,
        ...cashOutTransactions,
      ];

      const settlement = settlementService.calculateSettlement(allTransactions);
      
      // Verify settlement balance (zero-sum game)
      const totalProfit = settlement.reduce((sum, playerSettlement) => 
        sum + playerSettlement.profit, 0);
      expect(Math.abs(totalProfit)).toBeLessThan(0.01); // Should be zero within rounding

      // Verify individual settlements
      expect(settlement).toHaveLength(4);
      
      // Find settlements by player
      const aliceSettlement = settlement.find(s => s.playerId === players[0].id);
      const bobSettlement = settlement.find(s => s.playerId === players[1].id);
      const charlieSettlement = settlement.find(s => s.playerId === players[2].id);
      const danaSettlement = settlement.find(s => s.playerId === players[3].id);

      // Alice: $150 buy-in, $175 cash-out = $25 profit
      expect(aliceSettlement?.totalBuyIn).toBe(150.00);
      expect(aliceSettlement?.totalCashOut).toBe(175.00);
      expect(aliceSettlement?.profit).toBe(25.00);

      // Bob: $125 buy-in, $100 cash-out = -$25 loss
      expect(bobSettlement?.totalBuyIn).toBe(125.00);
      expect(bobSettlement?.totalCashOut).toBe(100.00);
      expect(bobSettlement?.profit).toBe(-25.00);

      // Charlie: $100 buy-in, $80 cash-out = -$20 loss
      expect(charlieSettlement?.totalBuyIn).toBe(100.00);
      expect(charlieSettlement?.totalCashOut).toBe(80.00);
      expect(charlieSettlement?.profit).toBe(-20.00);

      // Dana: $100 buy-in, $120 cash-out = $20 profit
      expect(danaSettlement?.totalBuyIn).toBe(100.00);
      expect(danaSettlement?.totalCashOut).toBe(120.00);
      expect(danaSettlement?.profit).toBe(20.00);

      // Step 9: Complete session
      await sessionService.completeSession(session.id);
      const completedSession = await sessionService.getSession(session.id);
      expect(completedSession?.status).toBe('completed');
      expect(completedSession?.endTime).toBeDefined();

      // Step 10: Verify final session state
      const finalSession = await sessionService.getSession(session.id);
      expect(finalSession?.totalBuyIns).toBe(475.00);
      expect(finalSession?.totalCashOuts).toBe(475.00);
      expect(finalSession?.players).toHaveLength(4);

      // Verify transaction history
      const sessionTransactions = await transactionService.getSessionTransactions(session.id);
      expect(sessionTransactions).toHaveLength(10); // 4 initial buy-ins + 2 add-ons + 4 cash-outs

      // Verify buy-in transactions
      const buyIns = sessionTransactions.filter(t => t.type === 'buy-in');
      expect(buyIns).toHaveLength(6);
      const totalBuyIns = buyIns.reduce((sum, t) => sum + t.amount, 0);
      expect(totalBuyIns).toBe(475.00);

      // Verify cash-out transactions
      const cashOuts = sessionTransactions.filter(t => t.type === 'cash-out');
      expect(cashOuts).toHaveLength(4);
      const totalCashOuts = cashOuts.reduce((sum, t) => sum + t.amount, 0);
      expect(totalCashOuts).toBe(475.00);
    });

    it('should handle undo operations during session', async () => {
      // Create session and players
      const sessionData = DataFactories.createSessionData({
        playerCount: 2,
        buyInAmount: 100.00,
      });
      const session = await sessionService.createSession(sessionData);
      
      const players = [
        DataFactories.createPlayer({ name: 'Player1' }),
        DataFactories.createPlayer({ name: 'Player2' }),
      ];

      for (const player of players) {
        await sessionService.addPlayer(session.id, player);
      }

      await sessionService.startSession(session.id);

      // Record buy-in
      const buyInTransaction = await transactionService.recordBuyIn({
        sessionId: session.id,
        playerId: players[0].id,
        amount: 100.00,
        type: 'buy-in',
        timestamp: new Date(),
      });

      expect(buyInTransaction).toBeDefined();

      // Verify transaction exists
      let transactions = await transactionService.getSessionTransactions(session.id);
      expect(transactions).toHaveLength(1);

      // Undo the transaction
      const undoResult = await transactionService.undoTransaction(buyInTransaction.id);
      expect(undoResult.success).toBe(true);

      // Verify transaction is voided
      transactions = await transactionService.getSessionTransactions(session.id);
      const voidedTransaction = transactions.find(t => t.id === buyInTransaction.id);
      expect(voidedTransaction?.isVoid).toBe(true);

      // Verify session totals updated
      const updatedSession = await sessionService.getSession(session.id);
      expect(updatedSession?.totalBuyIns).toBe(0);
    });

    it('should handle error scenarios gracefully', async () => {
      // Test invalid session operations
      await expect(sessionService.getSession('invalid-id')).resolves.toBeNull();
      
      await expect(sessionService.addPlayer('invalid-id', DataFactories.createPlayer()))
        .rejects.toThrow();

      await expect(transactionService.recordBuyIn({
        sessionId: 'invalid-id',
        playerId: 'invalid-player',
        amount: 100,
        type: 'buy-in',
        timestamp: new Date(),
      })).rejects.toThrow();

      // Test invalid amounts
      const session = await sessionService.createSession(DataFactories.createSessionData());
      const player = DataFactories.createPlayer();
      await sessionService.addPlayer(session.id, player);

      await expect(transactionService.recordBuyIn({
        sessionId: session.id,
        playerId: player.id,
        amount: -100, // Negative amount
        type: 'buy-in',
        timestamp: new Date(),
      })).rejects.toThrow();

      await expect(transactionService.recordBuyIn({
        sessionId: session.id,
        playerId: player.id,
        amount: 10000, // Exceeds limits
        type: 'buy-in',
        timestamp: new Date(),
      })).rejects.toThrow();
    });
  });

  describe('Multi-Session User Flows', () => {
    it('should handle multiple concurrent sessions', async () => {
      // Create multiple sessions
      const sessions: Session[] = [];
      for (let i = 0; i < 3; i++) {
        const sessionData = DataFactories.createSessionData({
          sessionName: `Session ${i + 1}`,
          playerCount: 4,
        });
        const session = await sessionService.createSession(sessionData);
        sessions.push(session);
      }

      // Add different players to each session
      for (let i = 0; i < sessions.length; i++) {
        for (let j = 0; j < 2; j++) {
          const player = DataFactories.createPlayer({
            name: `Player${i}_${j}`,
          });
          await sessionService.addPlayer(sessions[i].id, player);
        }
      }

      // Verify sessions are independent
      for (const session of sessions) {
        const retrievedSession = await sessionService.getSession(session.id);
        expect(retrievedSession?.players).toHaveLength(2);
        expect(retrievedSession?.status).toBe('created');
      }

      // Start one session
      await sessionService.startSession(sessions[0].id);
      
      // Verify other sessions unaffected
      const session1 = await sessionService.getSession(sessions[0].id);
      const session2 = await sessionService.getSession(sessions[1].id);
      const session3 = await sessionService.getSession(sessions[2].id);

      expect(session1?.status).toBe('active');
      expect(session2?.status).toBe('created');
      expect(session3?.status).toBe('created');
    });

    it('should handle player profile reuse across sessions', async () => {
      // Create player profile
      const profile = DataFactories.createPlayerProfile('RegularPlayer', 'regular@example.com');
      await profileService.saveProfile(profile);

      // Create multiple sessions with same player
      const sessions: Session[] = [];
      for (let i = 0; i < 2; i++) {
        const session = await sessionService.createSession(
          DataFactories.createSessionData({ sessionName: `Session ${i + 1}` })
        );
        
        const player = DataFactories.createPlayer({
          name: profile.name,
          profileId: profile.id,
        });
        
        await sessionService.addPlayer(session.id, player);
        sessions.push(session);
      }

      // Verify profile is correctly linked in both sessions
      for (const session of sessions) {
        const retrievedSession = await sessionService.getSession(session.id);
        expect(retrievedSession?.players[0].profileId).toBe(profile.id);
        expect(retrievedSession?.players[0].name).toBe(profile.name);
      }

      // Update profile
      const updatedProfile = {
        ...profile,
        email: 'updated@example.com',
        preferredBuyIn: 150.00,
      };
      await profileService.saveProfile(updatedProfile);

      // Verify profile updates are available for new sessions
      const retrievedProfile = await profileService.getProfile(profile.id);
      expect(retrievedProfile?.email).toBe('updated@example.com');
      expect(retrievedProfile?.preferredBuyIn).toBe(150.00);
    });
  });

  describe('Complex Transaction Scenarios', () => {
    it('should handle rapid transaction sequences', async () => {
      // Set up session
      const session = await sessionService.createSession(DataFactories.createSessionData());
      const player = DataFactories.createPlayer();
      await sessionService.addPlayer(session.id, player);
      await sessionService.startSession(session.id);

      // Rapid transaction sequence
      const transactions: Promise<Transaction>[] = [];
      
      // Multiple buy-ins in quick succession
      for (let i = 0; i < 5; i++) {
        transactions.push(
          transactionService.recordBuyIn({
            sessionId: session.id,
            playerId: player.id,
            amount: 20.00,
            type: 'buy-in',
            timestamp: new Date(Date.now() + i * 100), // Slight time differences
          })
        );
      }

      // Wait for all transactions to complete
      const completedTransactions = await Promise.all(transactions);
      expect(completedTransactions).toHaveLength(5);

      // Verify session totals
      const updatedSession = await sessionService.getSession(session.id);
      expect(updatedSession?.totalBuyIns).toBe(100.00);

      // Verify transaction ordering
      const sessionTransactions = await transactionService.getSessionTransactions(session.id);
      expect(sessionTransactions).toHaveLength(5);
      
      // Check timestamps are in order
      for (let i = 1; i < sessionTransactions.length; i++) {
        const prevTime = new Date(sessionTransactions[i - 1].timestamp);
        const currTime = new Date(sessionTransactions[i].timestamp);
        expect(currTime.getTime()).toBeGreaterThanOrEqual(prevTime.getTime());
      }
    });

    it('should handle mixed transaction types with complex settlement', async () => {
      // Complex scenario with multiple buy-ins and cash-outs
      const session = await sessionService.createSession(DataFactories.createSessionData());
      const players = [
        DataFactories.createPlayer({ name: 'Alice' }),
        DataFactories.createPlayer({ name: 'Bob' }),
        DataFactories.createPlayer({ name: 'Charlie' }),
      ];

      for (const player of players) {
        await sessionService.addPlayer(session.id, player);
      }
      await sessionService.startSession(session.id);

      // Complex transaction sequence
      const transactionSequence = [
        // Initial buy-ins
        { playerId: players[0].id, type: 'buy-in' as const, amount: 100.00 },
        { playerId: players[1].id, type: 'buy-in' as const, amount: 100.00 },
        { playerId: players[2].id, type: 'buy-in' as const, amount: 100.00 },
        
        // Mid-game add-ons
        { playerId: players[0].id, type: 'buy-in' as const, amount: 50.00 },
        { playerId: players[1].id, type: 'buy-in' as const, amount: 25.00 },
        
        // Early cash-out
        { playerId: players[2].id, type: 'cash-out' as const, amount: 80.00 },
        
        // More add-ons
        { playerId: players[0].id, type: 'buy-in' as const, amount: 75.00 },
        { playerId: players[2].id, type: 'buy-in' as const, amount: 60.00 }, // Re-buy
        
        // Final cash-outs
        { playerId: players[0].id, type: 'cash-out' as const, amount: 200.00 },
        { playerId: players[1].id, type: 'cash-out' as const, amount: 100.00 },
        { playerId: players[2].id, type: 'cash-out' as const, amount: 110.00 },
      ];

      const allTransactions: Transaction[] = [];
      for (const txn of transactionSequence) {
        let transaction: Transaction;
        
        if (txn.type === 'buy-in') {
          transaction = await transactionService.recordBuyIn({
            sessionId: session.id,
            playerId: txn.playerId,
            amount: txn.amount,
            type: 'buy-in',
            timestamp: new Date(),
          });
        } else {
          transaction = await transactionService.recordCashOut({
            sessionId: session.id,
            playerId: txn.playerId,
            amount: txn.amount,
            type: 'cash-out',
            timestamp: new Date(),
          });
        }
        
        allTransactions.push(transaction);
      }

      // Calculate complex settlement
      const settlement = settlementService.calculateSettlement(allTransactions);
      
      // Verify settlement math
      const totalBuyIns = allTransactions
        .filter(t => t.type === 'buy-in')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalCashOuts = allTransactions
        .filter(t => t.type === 'cash-out')
        .reduce((sum, t) => sum + t.amount, 0);
      
      expect(totalBuyIns).toBe(510.00); // Sum of all buy-ins
      expect(totalCashOuts).toBe(510.00); // Sum of all cash-outs
      
      // Verify zero-sum
      const totalProfit = settlement.reduce((sum, s) => sum + s.profit, 0);
      expect(Math.abs(totalProfit)).toBeLessThan(0.01);

      // Verify individual player calculations
      const aliceSettlement = settlement.find(s => s.playerId === players[0].id);
      const bobSettlement = settlement.find(s => s.playerId === players[1].id);
      const charlieSettlement = settlement.find(s => s.playerId === players[2].id);

      // Alice: 100 + 50 + 75 = 225 buy-in, 200 cash-out = -25
      expect(aliceSettlement?.totalBuyIn).toBe(225.00);
      expect(aliceSettlement?.totalCashOut).toBe(200.00);
      expect(aliceSettlement?.profit).toBe(-25.00);

      // Bob: 100 + 25 = 125 buy-in, 100 cash-out = -25
      expect(bobSettlement?.totalBuyIn).toBe(125.00);
      expect(bobSettlement?.totalCashOut).toBe(100.00);
      expect(bobSettlement?.profit).toBe(-25.00);

      // Charlie: 100 + 60 = 160 buy-in, 80 + 110 = 190 cash-out = +30
      expect(charlieSettlement?.totalBuyIn).toBe(160.00);
      expect(charlieSettlement?.totalCashOut).toBe(190.00);
      expect(charlieSettlement?.profit).toBe(30.00);
    });
  });

  describe('Error Recovery and Data Integrity', () => {
    it('should maintain data integrity during service failures', async () => {
      // Create session with transactions
      const session = await sessionService.createSession(DataFactories.createSessionData());
      const player = DataFactories.createPlayer();
      await sessionService.addPlayer(session.id, player);
      await sessionService.startSession(session.id);

      // Record initial transaction
      const transaction1 = await transactionService.recordBuyIn({
        sessionId: session.id,
        playerId: player.id,
        amount: 100.00,
        type: 'buy-in',
        timestamp: new Date(),
      });

      // Verify initial state
      const session1 = await sessionService.getSession(session.id);
      expect(session1?.totalBuyIns).toBe(100.00);

      // Simulate partial failure scenario by attempting invalid transaction
      try {
        await transactionService.recordBuyIn({
          sessionId: session.id,
          playerId: 'invalid-player', // Invalid player
          amount: 50.00,
          type: 'buy-in',
          timestamp: new Date(),
        });
      } catch (error) {
        // Expected to fail
        expect(error).toBeDefined();
      }

      // Verify session state unchanged
      const session2 = await sessionService.getSession(session.id);
      expect(session2?.totalBuyIns).toBe(100.00);

      // Verify original transaction still exists
      const transactions = await transactionService.getSessionTransactions(session.id);
      expect(transactions).toHaveLength(1);
      expect(transactions[0].id).toBe(transaction1.id);

      // Verify system can continue normal operations
      const transaction2 = await transactionService.recordBuyIn({
        sessionId: session.id,
        playerId: player.id,
        amount: 50.00,
        type: 'buy-in',
        timestamp: new Date(),
      });

      const finalSession = await sessionService.getSession(session.id);
      expect(finalSession?.totalBuyIns).toBe(150.00);
    });

    it('should handle concurrent session modifications', async () => {
      const session = await sessionService.createSession(DataFactories.createSessionData());
      const player = DataFactories.createPlayer();
      await sessionService.addPlayer(session.id, player);
      await sessionService.startSession(session.id);

      // Simulate concurrent transaction recording
      const concurrentTransactions = Array.from({ length: 10 }, (_, i) => 
        transactionService.recordBuyIn({
          sessionId: session.id,
          playerId: player.id,
          amount: 10.00,
          type: 'buy-in' as const,
          timestamp: new Date(Date.now() + i),
        })
      );

      // Wait for all transactions to complete
      const results = await Promise.allSettled(concurrentTransactions);
      
      // Count successful transactions
      const successful = results.filter(r => r.status === 'fulfilled').length;
      expect(successful).toBeGreaterThan(0); // At least some should succeed

      // Verify final session state consistency
      const finalSession = await sessionService.getSession(session.id);
      const transactions = await transactionService.getSessionTransactions(session.id);
      
      const expectedTotal = successful * 10.00;
      expect(finalSession?.totalBuyIns).toBe(expectedTotal);
      expect(transactions).toHaveLength(successful);
    });
  });
});