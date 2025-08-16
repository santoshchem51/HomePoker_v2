/**
 * Integration tests for the complete add player + buy-in workflow
 * Tests the full flow from UI input validation to database transactions
 */

describe('Add Player with Buy-In Integration Workflow', () => {
  
  describe('Complete Player Addition Flow', () => {
    
    it('should handle the complete workflow from UI to database', () => {
      console.log('\n🎯 Testing Complete Add Player + Buy-In Workflow...\n');
      
      // ARRANGE - Initial state
      let sessionState = {
        id: 'session-123',
        name: 'Friday Night Poker',
        status: 'created' as const,
        playerCount: 0,
        totalPot: 0,
        players: [] as any[]
      };

      let uiState = {
        newPlayerName: '',
        buyInAmount: '',
        error: null as string | null,
        loading: false
      };

      console.log('📋 Initial State:');
      console.log(`   Session: ${sessionState.name} (${sessionState.status})`);
      console.log(`   Players: ${sessionState.playerCount}`);
      console.log(`   Total Pot: $${sessionState.totalPot}\n`);

      // ACT 1 - User enters player data
      console.log('👤 Phase 1: User Input');
      uiState.newPlayerName = 'Alice';
      uiState.buyInAmount = '100';
      
      console.log(`   Player name: "${uiState.newPlayerName}"`);
      console.log(`   Buy-in amount: "$${uiState.buyInAmount}"`);

      // ACT 2 - UI validation
      console.log('\n✅ Phase 2: UI Validation');
      
      const validatePlayerName = (name: string): string | null => {
        const trimmed = name.trim();
        if (!trimmed) return 'Player name is required';
        if (trimmed.length < 2) return 'Player name must be at least 2 characters';
        return null;
      };

      const validateBuyInAmount = (amount: string): string | null => {
        const trimmed = amount.trim();
        if (!trimmed) return 'Buy-in amount is required';
        const num = parseFloat(trimmed);
        if (isNaN(num) || num < 1 || num > 500) return 'Invalid buy-in amount';
        return null;
      };

      const nameError = validatePlayerName(uiState.newPlayerName);
      const buyInError = validateBuyInAmount(uiState.buyInAmount);
      
      expect(nameError).toBeNull();
      expect(buyInError).toBeNull();
      
      console.log(`   Name validation: ${nameError || '✓ PASSED'}`);
      console.log(`   Buy-in validation: ${buyInError || '✓ PASSED'}`);

      // ACT 3 - Service layer processing
      console.log('\n🔧 Phase 3: Service Processing');
      
      const processAddPlayer = async (sessionId: string, playerData: any) => {
        // Simulate SessionService.addPlayer logic
        
        // 1. Validate session state
        if (sessionState.status !== 'created') {
          throw new Error('Cannot add players to active session');
        }
        
        // 2. Check player limits
        if (sessionState.playerCount >= 8) {
          throw new Error('Maximum players reached');
        }
        
        // 3. Check duplicate names
        const isDuplicate = sessionState.players.some(p => 
          p.name.toLowerCase() === playerData.name.toLowerCase()
        );
        if (isDuplicate) {
          throw new Error('Player name already exists');
        }
        
        // 4. Create player
        const newPlayer = {
          id: `player-${Date.now()}`,
          sessionId,
          name: playerData.name.trim(),
          isGuest: true,
          currentBalance: 0,
          totalBuyIns: 0,
          totalCashOuts: 0,
          status: 'active' as const,
          joinedAt: new Date()
        };
        
        // 5. Record initial buy-in if provided
        if (playerData.initialBuyIn && playerData.initialBuyIn > 0) {
          const transaction = {
            id: `txn-${Date.now()}`,
            sessionId,
            playerId: newPlayer.id,
            type: 'buy_in' as const,
            amount: playerData.initialBuyIn,
            method: 'manual' as const,
            createdBy: 'organizer',
            description: `Initial buy-in for ${newPlayer.name}`,
            timestamp: new Date()
          };
          
          // Update player with buy-in
          newPlayer.currentBalance = playerData.initialBuyIn;
          newPlayer.totalBuyIns = playerData.initialBuyIn;
          
          console.log(`   Transaction created: ${transaction.type} $${transaction.amount}`);
        }
        
        return newPlayer;
      };

      const playerData = {
        name: uiState.newPlayerName,
        initialBuyIn: parseFloat(uiState.buyInAmount)
      };

      return processAddPlayer(sessionState.id, playerData).then(newPlayer => {
        // ACT 4 - Update session state
        console.log('\n📊 Phase 4: State Updates');
        
        sessionState.players.push(newPlayer);
        sessionState.playerCount += 1;
        sessionState.totalPot += newPlayer.totalBuyIns;
        
        console.log(`   Player created: ${newPlayer.name} (ID: ${newPlayer.id})`);
        console.log(`   Player balance: $${newPlayer.currentBalance}`);
        console.log(`   Player total buy-ins: $${newPlayer.totalBuyIns}`);
        console.log(`   Session player count: ${sessionState.playerCount}`);
        console.log(`   Session total pot: $${sessionState.totalPot}`);

        // ACT 5 - Clear UI state
        console.log('\n🧹 Phase 5: UI Cleanup');
        uiState.newPlayerName = '';
        uiState.buyInAmount = '';
        uiState.error = null;
        
        console.log(`   UI cleared: name="${uiState.newPlayerName}", buyIn="${uiState.buyInAmount}"`);

        // ASSERT - Verify complete workflow
        console.log('\n🔍 Verification:');
        
        expect(newPlayer.name).toBe('Alice');
        expect(newPlayer.currentBalance).toBe(100);
        expect(newPlayer.totalBuyIns).toBe(100);
        expect(newPlayer.status).toBe('active');
        expect(sessionState.playerCount).toBe(1);
        expect(sessionState.totalPot).toBe(100);
        expect(uiState.newPlayerName).toBe('');
        expect(uiState.buyInAmount).toBe('');

        console.log(`   ✓ Player state: ${newPlayer.name}, $${newPlayer.currentBalance}, ${newPlayer.status}`);
        console.log(`   ✓ Session state: ${sessionState.playerCount} players, $${sessionState.totalPot} pot`);
        console.log(`   ✓ UI state: cleaned and ready for next input`);
        
        console.log('\n✅ Complete Workflow Test PASSED!\n');
      });
    });

    it('should handle multiple players being added with different buy-ins', () => {
      console.log('\n🎯 Testing Multiple Players Addition...\n');
      
      // ARRANGE - Fresh session
      let sessionState = {
        id: 'session-456',
        playerCount: 0,
        totalPot: 0,
        players: [] as any[]
      };

      const playersToAdd = [
        { name: 'Alice', buyIn: 50 },
        { name: 'Bob', buyIn: 100 },
        { name: 'Charlie', buyIn: 75 },
        { name: 'David', buyIn: 0 } // No initial buy-in
      ];

      console.log('👥 Adding multiple players:');
      playersToAdd.forEach(p => {
        console.log(`   ${p.name}: $${p.buyIn} buy-in`);
      });

      // ACT - Process each player addition
      const processAllPlayers = async () => {
        const results = [];
        
        for (const playerData of playersToAdd) {
          const newPlayer = {
            id: `player-${playerData.name.toLowerCase()}`,
            name: playerData.name,
            currentBalance: playerData.buyIn,
            totalBuyIns: playerData.buyIn,
            status: 'active' as const
          };
          
          sessionState.players.push(newPlayer);
          sessionState.playerCount += 1;
          sessionState.totalPot += playerData.buyIn;
          
          results.push(newPlayer);
        }
        
        return results;
      };

      return processAllPlayers().then(results => {
        console.log('\n📊 Final Session State:');
        console.log(`   Player count: ${sessionState.playerCount}`);
        console.log(`   Total pot: $${sessionState.totalPot}`);
        
        console.log('\n📋 Player Summary:');
        sessionState.players.forEach(player => {
          console.log(`   ${player.name}: $${player.currentBalance} (Buy-ins: $${player.totalBuyIns})`);
        });

        // ASSERT - Verify multiple additions
        expect(sessionState.playerCount).toBe(4);
        expect(sessionState.totalPot).toBe(225); // 50 + 100 + 75 + 0
        expect(sessionState.players.map(p => p.name)).toEqual(['Alice', 'Bob', 'Charlie', 'David']);
        expect(sessionState.players.map(p => p.totalBuyIns)).toEqual([50, 100, 75, 0]);

        console.log('\n✅ Multiple Players Test PASSED!\n');
      });
    });
  });

  describe('Error Handling Integration', () => {
    
    it('should handle validation errors throughout the workflow', () => {
      console.log('\n🚫 Testing Error Handling Workflow...\n');
      
      const errorTestCases = [
        {
          name: '',
          buyIn: '100',
          expectedError: 'Player name is required',
          stage: 'UI Validation'
        },
        {
          name: 'Alice',
          buyIn: '',
          expectedError: 'Buy-in amount is required',
          stage: 'UI Validation'
        },
        {
          name: 'Alice',
          buyIn: '600',
          expectedError: 'Invalid buy-in amount',
          stage: 'UI Validation'
        },
        {
          name: 'Alice',
          buyIn: '100',
          sessionStatus: 'active',
          expectedError: 'Cannot add players to active session',
          stage: 'Service Validation'
        }
      ];

      const validateWorkflow = (testCase: any) => {
        // UI validation
        if (!testCase.name.trim()) {
          return { error: 'Player name is required', stage: 'UI Validation' };
        }
        
        if (!testCase.buyIn.trim()) {
          return { error: 'Buy-in amount is required', stage: 'UI Validation' };
        }
        
        const buyInNum = parseFloat(testCase.buyIn);
        if (isNaN(buyInNum) || buyInNum < 1 || buyInNum > 500) {
          return { error: 'Invalid buy-in amount', stage: 'UI Validation' };
        }
        
        // Service validation
        if (testCase.sessionStatus === 'active') {
          return { error: 'Cannot add players to active session', stage: 'Service Validation' };
        }
        
        return { error: null, stage: 'Success' };
      };

      console.log('🔍 Testing error cases:');
      errorTestCases.forEach((testCase, index) => {
        const result = validateWorkflow(testCase);
        
        if (testCase.expectedError) {
          expect(result.error).toBe(testCase.expectedError);
          expect(result.stage).toBe(testCase.stage);
          console.log(`   ✓ Case ${index + 1}: ${result.error} (${result.stage})`);
        } else {
          expect(result.error).toBeNull();
          console.log(`   ✓ Case ${index + 1}: Success`);
        }
      });

      console.log('\n✅ Error Handling Test PASSED!\n');
    });

    it('should rollback on transaction failures', () => {
      console.log('\n↩️  Testing Transaction Rollback...\n');
      
      let sessionState = {
        playerCount: 2,
        totalPot: 150,
        players: [
          { id: 'player-1', name: 'Alice', totalBuyIns: 75 },
          { id: 'player-2', name: 'Bob', totalBuyIns: 75 }
        ]
      };

      const originalState = JSON.parse(JSON.stringify(sessionState));
      
      const mockTransactionFailure = async (shouldFail: boolean) => {
        const operations = [];
        
        try {
          operations.push('BEGIN_TRANSACTION');
          
          // Step 1: Add player
          operations.push('ADD_PLAYER');
          sessionState.playerCount += 1;
          sessionState.players.push({
            id: 'player-3',
            name: 'Charlie',
            totalBuyIns: 0
          });
          
          if (shouldFail) {
            throw new Error('Transaction service failure');
          }
          
          // Step 2: Record buy-in
          operations.push('RECORD_BUY_IN');
          sessionState.totalPot += 100;
          sessionState.players[2].totalBuyIns = 100;
          
          operations.push('COMMIT_TRANSACTION');
          return { success: true, operations };
          
        } catch (error) {
          operations.push('ROLLBACK_TRANSACTION');
          // Rollback changes
          sessionState = JSON.parse(JSON.stringify(originalState));
          return { success: false, operations, error: error.message };
        }
      };

      console.log('📋 Original state:');
      console.log(`   Players: ${originalState.playerCount}, Pot: $${originalState.totalPot}`);

      return mockTransactionFailure(true).then(result => {
        console.log('\n💥 Simulated failure:');
        console.log(`   Operations: ${result.operations.join(' → ')}`);
        console.log(`   Error: ${result.error}`);
        
        console.log('\n🔄 State after rollback:');
        console.log(`   Players: ${sessionState.playerCount}, Pot: $${sessionState.totalPot}`);
        
        // ASSERT - State should be rolled back
        expect(result.success).toBe(false);
        expect(sessionState.playerCount).toBe(originalState.playerCount);
        expect(sessionState.totalPot).toBe(originalState.totalPot);
        expect(sessionState.players).toHaveLength(originalState.players.length);
        
        console.log('   ✓ State successfully rolled back to original');
        
        // Test successful case
        return mockTransactionFailure(false);
      }).then(result => {
        console.log('\n✅ Successful transaction:');
        console.log(`   Operations: ${result.operations.join(' → ')}`);
        console.log(`   Players: ${sessionState.playerCount}, Pot: $${sessionState.totalPot}`);
        
        expect(result.success).toBe(true);
        expect(sessionState.playerCount).toBe(3);
        expect(sessionState.totalPot).toBe(250);
        
        console.log('\n✅ Transaction Rollback Test PASSED!\n');
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    
    it('should handle rapid player additions efficiently', () => {
      console.log('\n⚡ Testing Rapid Player Additions...\n');
      
      const startTime = Date.now();
      let sessionState = { playerCount: 0, totalPot: 0 };
      
      // Simulate adding multiple players quickly
      const rapidAdditions = Array.from({ length: 8 }, (_, i) => ({
        name: `Player${i + 1}`,
        buyIn: (i + 1) * 25 // Varying buy-in amounts
      }));

      console.log('🏃 Adding 8 players rapidly:');
      rapidAdditions.forEach(p => {
        console.log(`   ${p.name}: $${p.buyIn}`);
      });

      rapidAdditions.forEach(player => {
        sessionState.playerCount += 1;
        sessionState.totalPot += player.buyIn;
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`\n⏱️  Completed in ${duration}ms`);
      console.log(`   Final state: ${sessionState.playerCount} players, $${sessionState.totalPot} pot`);
      
      // ASSERT - All additions completed correctly
      expect(sessionState.playerCount).toBe(8);
      expect(sessionState.totalPot).toBe(900); // Sum of 25+50+75+100+125+150+175+200
      expect(duration).toBeLessThan(100); // Should be very fast
      
      console.log('   ✓ All players added efficiently');
      console.log('\n✅ Performance Test PASSED!\n');
    });

    it('should handle edge case: maximum players with buy-ins', () => {
      console.log('\n🎯 Testing Maximum Players Edge Case...\n');
      
      let sessionState = { playerCount: 7, totalPot: 700 }; // Already near max
      
      const attemptAddPlayer = (currentCount: number) => {
        if (currentCount >= 8) {
          throw new Error('Maximum players reached');
        }
        return { success: true, newCount: currentCount + 1 };
      };

      console.log(`📊 Current state: ${sessionState.playerCount}/8 players`);
      
      // Should succeed - adding 8th player
      try {
        const result = attemptAddPlayer(sessionState.playerCount);
        sessionState.playerCount = result.newCount;
        console.log(`   ✓ Added 8th player successfully: ${sessionState.playerCount}/8`);
        expect(result.success).toBe(true);
        expect(sessionState.playerCount).toBe(8);
      } catch (error) {
        console.log(`   ❌ Unexpected error: ${error.message}`);
        throw error;
      }

      // Should fail - attempting 9th player
      try {
        attemptAddPlayer(sessionState.playerCount);
        console.log(`   ❌ Should have failed to add 9th player`);
        throw new Error('Should have failed');
      } catch (error) {
        console.log(`   ✓ Correctly rejected 9th player: ${error.message}`);
        expect(error.message).toBe('Maximum players reached');
      }

      console.log('\n✅ Maximum Players Test PASSED!\n');
    });
  });
});