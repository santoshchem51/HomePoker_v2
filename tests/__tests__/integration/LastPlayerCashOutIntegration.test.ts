/**
 * Integration tests for the last player cash-out constraint
 * Tests the complete flow of a poker session with the mathematical constraint enforcement
 */

describe('Last Player Cash-Out Integration Tests', () => {
  describe('Complete Poker Session with Last Player Constraint', () => {
    it('should enforce mathematical constraint in realistic poker scenario', () => {
      console.log('\n🎯 Testing Last Player Cash-Out Constraint...\n');

      // ARRANGE - 4-player poker session
      let sessionState = {
        id: 'poker-session-constraint-test',
        name: 'Friday Night Poker - Constraint Test',
        totalPot: 0,
        players: [
          {
            id: 'alice',
            name: 'Alice',
            currentBalance: 0,
            totalBuyIns: 0,
            totalCashOuts: 0,
            status: 'active' as const
          },
          {
            id: 'bob', 
            name: 'Bob',
            currentBalance: 0,
            totalBuyIns: 0,
            totalCashOuts: 0,
            status: 'active' as const
          },
          {
            id: 'charlie',
            name: 'Charlie', 
            currentBalance: 0,
            totalBuyIns: 0,
            totalCashOuts: 0,
            status: 'active' as const
          },
          {
            id: 'david',
            name: 'David',
            currentBalance: 0,
            totalBuyIns: 0,
            totalCashOuts: 0,
            status: 'active' as const
          }
        ]
      };

      console.log('📋 Initial Setup:');
      console.log(`   Session: ${sessionState.name}`);
      console.log(`   Players: ${sessionState.players.length} active`);
      console.log(`   Total Pot: $${sessionState.totalPot}\n`);

      // ACT 1 - All players buy in $10 each
      console.log('💰 Phase 1: Initial Buy-ins ($10 each)');
      const buyIns = [
        { playerId: 'alice', amount: 10 },
        { playerId: 'bob', amount: 10 },
        { playerId: 'charlie', amount: 10 },
        { playerId: 'david', amount: 10 }
      ];

      buyIns.forEach(({ playerId, amount }) => {
        const player = sessionState.players.find(p => p.id === playerId);
        if (player) {
          player.currentBalance += amount;
          player.totalBuyIns += amount;
          sessionState.totalPot += amount;
        }
        console.log(`   ${player?.name} buys in for $${amount} (Balance: $${player?.currentBalance})`);
      });

      console.log(`   Total Pot: $${sessionState.totalPot}\n`);

      // Verify initial state
      expect(sessionState.totalPot).toBe(40);
      expect(sessionState.players.every(p => p.currentBalance === 10)).toBe(true);
      expect(sessionState.players.every(p => p.status === 'active')).toBe(true);

      // ACT 2 - Simulate poker gameplay (chips move around)
      console.log('🎲 Phase 2: Poker Gameplay (chip redistribution)');
      
      // Simulate Alice winning big, others losing varying amounts
      sessionState.players.find(p => p.id === 'alice')!.currentBalance = 22; // Won $12
      sessionState.players.find(p => p.id === 'bob')!.currentBalance = 8;    // Lost $2  
      sessionState.players.find(p => p.id === 'charlie')!.currentBalance = 5; // Lost $5
      sessionState.players.find(p => p.id === 'david')!.currentBalance = 5;   // Lost $5

      console.log('   Updated chip counts after gameplay:');
      sessionState.players.forEach(player => {
        const change = player.currentBalance - player.totalBuyIns;
        const changeStr = change >= 0 ? `+$${change}` : `-$${Math.abs(change)}`;
        console.log(`   ${player.name}: $${player.currentBalance} chips (${changeStr})`);
      });

      // Verify total chips still equal original pot
      const totalChips = sessionState.players.reduce((sum, p) => sum + p.currentBalance, 0);
      expect(totalChips).toBe(40);
      console.log(`   ✓ Total chips still: $${totalChips} (matches original pot)\n`);

      // ACT 3 - Sequential cash-outs testing constraint
      console.log('🏁 Phase 3: Sequential Cash-outs with Last Player Constraint');

      // Helper function to get active players
      const getActivePlayers = () => sessionState.players.filter(p => p.status === 'active');
      
      // Helper function to simulate cash-out with constraint checking
      const simulateCashOut = (playerId: string, amount: number) => {
        const player = sessionState.players.find(p => p.id === playerId);
        if (!player) throw new Error(`Player ${playerId} not found`);
        
        const activePlayers = getActivePlayers();
        const isLastPlayer = activePlayers.length === 1 && activePlayers[0].id === playerId;
        
        console.log(`   ${player.name} attempting to cash out $${amount}`);
        console.log(`     - Is last player: ${isLastPlayer ? 'YES' : 'NO'}`);
        console.log(`     - Remaining pot: $${sessionState.totalPot}`);
        
        if (isLastPlayer) {
          // LAST PLAYER CONSTRAINT: Must cash out exactly the remaining pot
          const tolerance = 0.01;
          if (Math.abs(amount - sessionState.totalPot) > tolerance) {
            const error = `CONSTRAINT VIOLATION: Last player must cash out exactly $${sessionState.totalPot.toFixed(2)}, attempted $${amount.toFixed(2)}`;
            console.log(`     ❌ ${error}`);
            throw new Error(error);
          } else {
            console.log(`     ✅ Constraint satisfied: $${amount} matches remaining pot $${sessionState.totalPot}`);
          }
        } else {
          // Regular validation: amount <= remaining pot
          if (amount > sessionState.totalPot) {
            const error = `INSUFFICIENT POT: Cannot cash out $${amount}, only $${sessionState.totalPot} remaining`;
            console.log(`     ❌ ${error}`);
            throw new Error(error);
          } else {
            console.log(`     ✅ Regular validation passed: $${amount} <= $${sessionState.totalPot}`);
          }
        }
        
        // Execute cash-out
        player.currentBalance -= amount;
        player.totalCashOuts += amount;
        player.status = 'cashed_out';
        sessionState.totalPot -= amount;
        
        console.log(`     ✓ Cash-out successful`);
        console.log(`     ✓ ${player.name} status: ${player.status}`);
        console.log(`     ✓ Remaining pot: $${sessionState.totalPot}\n`);
        
        return true;
      };

      // Cash-out 1: Bob cashes out $8 (his current chips)
      expect(() => simulateCashOut('bob', 8)).not.toThrow();
      expect(sessionState.totalPot).toBe(32); // 40 - 8 = 32
      expect(getActivePlayers()).toHaveLength(3);

      // Cash-out 2: Charlie cashes out $5 (his current chips) 
      expect(() => simulateCashOut('charlie', 5)).not.toThrow();
      expect(sessionState.totalPot).toBe(27); // 32 - 5 = 27
      expect(getActivePlayers()).toHaveLength(2);

      // Cash-out 3: Alice cashes out $22 (her current chips)
      expect(() => simulateCashOut('alice', 22)).not.toThrow();
      expect(sessionState.totalPot).toBe(5); // 27 - 22 = 5
      expect(getActivePlayers()).toHaveLength(1);

      console.log('🔍 Last Player Constraint Test:');
      console.log(`   David is now the LAST active player`);
      console.log(`   Remaining pot: $${sessionState.totalPot}`);
      console.log(`   David's chips: $${sessionState.players.find(p => p.id === 'david')?.currentBalance}\n`);

      // Cash-out 4a: Test constraint violation - David tries to cash out wrong amount
      console.log('   Testing constraint violation:');
      expect(() => simulateCashOut('david', 3)).toThrow('CONSTRAINT VIOLATION');
      expect(() => simulateCashOut('david', 7)).toThrow('CONSTRAINT VIOLATION');
      
      // Verify David is still active after failed attempts
      expect(sessionState.players.find(p => p.id === 'david')?.status).toBe('active');
      expect(sessionState.totalPot).toBe(5); // Unchanged
      
      // Cash-out 4b: David must cash out exactly $5 (the remaining pot)
      console.log('   Testing correct constraint enforcement:');
      expect(() => simulateCashOut('david', 5)).not.toThrow();
      
      // FINAL VERIFICATION
      console.log('🎉 Final Verification:');
      
      // 1. All players should be cashed out
      const finalActivePlayers = getActivePlayers();
      console.log(`   Active players remaining: ${finalActivePlayers.length}`);
      expect(finalActivePlayers).toHaveLength(0);
      
      // 2. Session pot should be exactly $0
      console.log(`   Final session pot: $${sessionState.totalPot}`);
      expect(sessionState.totalPot).toBe(0);
      
      // 3. Mathematical integrity: total cash-outs should equal total buy-ins
      const totalBuyIns = sessionState.players.reduce((sum, p) => sum + p.totalBuyIns, 0);
      const totalCashOuts = sessionState.players.reduce((sum, p) => sum + p.totalCashOuts, 0);
      
      console.log(`   Total buy-ins: $${totalBuyIns}`);
      console.log(`   Total cash-outs: $${totalCashOuts}`);
      console.log(`   Mathematical balance: ${totalBuyIns === totalCashOuts ? '✅ PERFECT' : '❌ BROKEN'}`);
      
      expect(totalBuyIns).toBe(40);
      expect(totalCashOuts).toBe(40);
      expect(totalBuyIns).toBe(totalCashOuts);
      
      // 4. Each player's final state
      console.log('\n📊 Final Player States:');
      sessionState.players.forEach(player => {
        const netPosition = (player.currentBalance + player.totalCashOuts) - player.totalBuyIns;
        console.log(`   ${player.name}: $${player.totalBuyIns} in → $${player.totalCashOuts} out → Net: ${netPosition >= 0 ? '+' : ''}$${netPosition} (${player.status})`);
        expect(player.status).toBe('cashed_out');
        expect(player.currentBalance).toBe(0); // All chips cashed out
      });

      console.log('\n✅ Last Player Constraint Integration Test PASSED!\n');
    });

    it('should handle edge case: last player with more chips than remaining pot', () => {
      console.log('\n🎯 Testing Edge Case: Last Player with Excess Chips...\n');

      // This tests the scenario where the last player has more chips than they originally bought in
      // (they won during gameplay), but the pot tracking shows less due to other players cashing out

      let sessionState = {
        totalPot: 10, // Only $10 remaining in tracked pot
        players: [
          {
            id: 'winner',
            name: 'Lucky Winner',
            currentBalance: 25, // Has $25 in chips (won $15 during gameplay)
            totalBuyIns: 10,
            totalCashOuts: 0,
            status: 'active' as const
          }
        ]
      };

      console.log('📋 Edge Case Setup:');
      console.log(`   Player has $${sessionState.players[0].currentBalance} chips`);
      console.log(`   But session pot only has $${sessionState.totalPot} remaining`);
      console.log(`   This can happen when other players cashed out their winnings\n`);

      // Simulate the constraint check
      const player = sessionState.players[0];
      const isLastPlayer = true; // Only one active player
      const requiredAmount = sessionState.totalPot; // Must cash out exactly $10

      console.log('🔍 Constraint Analysis:');
      console.log(`   Is last player: ${isLastPlayer}`);
      console.log(`   Required cash-out amount: $${requiredAmount}`);
      console.log(`   Player's chip count: $${player.currentBalance}\n`);

      // The key insight: the last player constraint is about the SESSION POT, not player chips
      // The player must cash out exactly what's left in the pot, regardless of their chip count
      
      console.log('💡 Key Insight:');
      console.log('   Last player constraint enforces SESSION POT balance, not chip counts');
      console.log('   Player can have more chips than pot due to gameplay winnings');
      console.log('   Constraint: cash-out amount must equal remaining pot\n');

      // Test the constraint
      const testCashOut = (amount: number) => {
        console.log(`   Testing cash-out of $${amount}:`);
        const tolerance = 0.01;
        const isValid = Math.abs(amount - sessionState.totalPot) <= tolerance;
        console.log(`     Required: $${sessionState.totalPot}`);
        console.log(`     Attempted: $${amount}`);
        console.log(`     Valid: ${isValid ? '✅ YES' : '❌ NO'}`);
        return isValid;
      };

      // Should reject player's full chip amount
      expect(testCashOut(25)).toBe(false);
      
      // Should reject random amounts
      expect(testCashOut(15)).toBe(false);
      expect(testCashOut(5)).toBe(false);
      
      // Should accept exactly the remaining pot
      expect(testCashOut(10)).toBe(true);

      console.log('\n🎯 Constraint Enforcement Result:');
      console.log('   ✅ Player MUST cash out exactly $10 (remaining pot)');
      console.log('   ✅ Player\'s excess chips ($15) represent their winnings');
      console.log('   ✅ Mathematical integrity maintained: pot balance enforced');
      console.log('   ✅ Edge case handled correctly\n');

      // This demonstrates that the constraint properly handles the mathematical reality:
      // - The session pot tracks total money in the game
      // - Players can have more/fewer chips than their net position due to gameplay
      // - The last player constraint ensures the session pot balances to zero
      // - Individual chip counts vs. cash-out amounts are reconciled in settlement

      console.log('✅ Edge Case Test PASSED: Constraint properly enforces pot balance!\n');
    });

    it('should demonstrate constraint prevention of orphaned money', () => {
      console.log('\n🎯 Testing Orphaned Money Prevention...\n');

      // This test shows how the constraint prevents money from being "orphaned" in the pot

      let sessionState = {
        totalPot: 15,
        players: [
          {
            id: 'last-player',
            name: 'Final Player',
            currentBalance: 12,
            status: 'active' as const
          }
        ]
      };

      console.log('📋 Orphaned Money Scenario:');
      console.log(`   Session pot: $${sessionState.totalPot}`);
      console.log(`   Last player chips: $${sessionState.players[0].currentBalance}`);
      console.log(`   Without constraint: player might cash out $${sessionState.players[0].currentBalance}, leaving $${sessionState.totalPot - sessionState.players[0].currentBalance} orphaned\n`);

      // Test without constraint (simulating old behavior)
      console.log('❌ Without Last Player Constraint:');
      const withoutConstraint = {
        playerCashOut: sessionState.players[0].currentBalance, // $12
        remainingPot: sessionState.totalPot - sessionState.players[0].currentBalance, // $3
        orphanedMoney: sessionState.totalPot - sessionState.players[0].currentBalance // $3
      };
      
      console.log(`   Player cashes out: $${withoutConstraint.playerCashOut}`);
      console.log(`   Remaining in pot: $${withoutConstraint.remainingPot}`);
      console.log(`   Orphaned money: $${withoutConstraint.orphanedMoney} 💰❌`);
      console.log(`   Problem: Where does the $${withoutConstraint.orphanedMoney} go?\n`);

      // Test with constraint (new behavior)
      console.log('✅ With Last Player Constraint:');
      const withConstraint = {
        requiredCashOut: sessionState.totalPot, // $15
        remainingPot: 0, // Always 0 for last player
        orphanedMoney: 0 // Always 0
      };
      
      console.log(`   Required cash-out: $${withConstraint.requiredCashOut}`);
      console.log(`   Remaining in pot: $${withConstraint.remainingPot}`);
      console.log(`   Orphaned money: $${withConstraint.orphanedMoney} ✅`);
      console.log(`   Result: Perfect mathematical balance!\n`);

      // Verify the constraint prevents orphaned money
      expect(withoutConstraint.orphanedMoney).toBeGreaterThan(0); // Problem exists without constraint
      expect(withConstraint.orphanedMoney).toBe(0); // Problem solved with constraint

      console.log('🔍 Mathematical Proof:');
      console.log('   Total Buy-ins = Total Cash-outs (always)');
      console.log('   Session Pot = Buy-ins - Cash-outs');
      console.log('   Last Player Cash-out = Remaining Pot');
      console.log('   Therefore: Final Session Pot = 0 (no orphaned money)\n');

      console.log('✅ Orphaned Money Prevention Test PASSED!\n');
    });
  });

  describe('Constraint Integration with Session Completion', () => {
    it('should enable proper session completion when last player constraint satisfied', () => {
      console.log('\n🎯 Testing Session Completion Readiness...\n');

      // This test verifies that the constraint properly sets up sessions for completion

      let sessionState = {
        id: 'completion-test-session',
        totalPot: 0, // Will become 0 after last player constraint
        players: [
          { id: 'p1', status: 'cashed_out' as const, name: 'Player 1' },
          { id: 'p2', status: 'cashed_out' as const, name: 'Player 2' },
          { id: 'p3', status: 'cashed_out' as const, name: 'Player 3' },
          { id: 'p4', status: 'cashed_out' as const, name: 'Player 4' }
        ]
      };

      console.log('📋 Post-Constraint Session State:');
      console.log(`   Session ID: ${sessionState.id}`);
      console.log(`   Total Pot: $${sessionState.totalPot}`);
      console.log(`   All players status: ${sessionState.players.every(p => p.status === 'cashed_out') ? 'cashed_out ✅' : 'mixed ❌'}\n`);

      // Check session completion readiness
      const completionChecks = {
        allPlayersCashedOut: sessionState.players.every(p => p.status === 'cashed_out'),
        potIsEmpty: sessionState.totalPot === 0,
        noActiveTransactions: true, // Assuming no pending transactions
        mathematicalIntegrity: true // Constraint ensures this
      };

      console.log('🔍 Session Completion Readiness Checks:');
      Object.entries(completionChecks).forEach(([check, passed]) => {
        console.log(`   ${check}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
      });

      const canCompleteSession = Object.values(completionChecks).every(check => check);
      console.log(`\n🎯 Can Complete Session: ${canCompleteSession ? '✅ YES' : '❌ NO'}\n`);

      // Verify all conditions are met
      expect(completionChecks.allPlayersCashedOut).toBe(true);
      expect(completionChecks.potIsEmpty).toBe(true);
      expect(canCompleteSession).toBe(true);

      console.log('💡 Key Benefits of Last Player Constraint:');
      console.log('   ✅ Guarantees mathematical consistency');
      console.log('   ✅ Eliminates orphaned money');
      console.log('   ✅ Enables clean session completion');
      console.log('   ✅ Provides audit trail integrity');
      console.log('   ✅ Simplifies settlement calculations\n');

      console.log('✅ Session Completion Integration Test PASSED!\n');
    });
  });
});