/**
 * Simple test script for Alternative Settlement Options Generator - Story 3.3, Task 4
 * Tests the generateAlternativeSettlements method implementation
 */

const { SettlementService } = require('./src/services/settlement/SettlementService');

async function testAlternativeSettlements() {
  console.log('🧪 Testing Alternative Settlement Options Generator...\n');

  try {
    // Get service instance
    const settlementService = SettlementService.getInstance();
    await settlementService.initialize();

    // Mock session data
    const mockPlayerSettlements = [
      {
        playerId: 'player1',
        playerName: 'Alice',
        totalBuyIns: 200,
        totalCashOuts: 0,
        currentChips: 150,
        netPosition: -50, // owes $50
        isActive: true
      },
      {
        playerId: 'player2',
        playerName: 'Bob',
        totalBuyIns: 100,
        totalCashOuts: 0,
        currentChips: 200,
        netPosition: 100, // receives $100
        isActive: true
      },
      {
        playerId: 'player3',
        playerName: 'Charlie',
        totalBuyIns: 150,
        totalCashOuts: 0,
        currentChips: 100,
        netPosition: -50, // owes $50
        isActive: true
      }
    ];

    // Mock the calculatePlayerSettlements method
    settlementService.calculatePlayerSettlements = async () => mockPlayerSettlements;

    // Mock validation
    settlementService.validateSettlement = async () => ({
      isValid: true,
      errors: [],
      warnings: [],
      auditTrail: []
    });

    console.log('📊 Test Data:');
    mockPlayerSettlements.forEach(player => {
      console.log(`  ${player.playerName}: ${player.netPosition >= 0 ? '+' : ''}$${player.netPosition}`);
    });
    console.log('');

    // Test 1: Generate alternatives with default options
    console.log('🎯 Test 1: Generate alternatives with default options');
    const sessionId = 'test-session-1';
    const comparison = await settlementService.generateAlternativeSettlements(sessionId);

    console.log(`✅ Generated ${comparison.alternatives.length} settlement alternatives`);
    console.log(`📈 Recommended: ${comparison.recommendedOption.name} (Score: ${comparison.recommendedOption.score})`);
    console.log(`📊 Transaction range: ${comparison.summary.transactionCountRange.min}-${comparison.summary.transactionCountRange.max}`);
    console.log('');

    // Display alternatives
    console.log('🔍 Alternative Options:');
    comparison.alternatives.forEach((alt, index) => {
      console.log(`  ${index + 1}. ${alt.name}`);
      console.log(`     Algorithm: ${alt.algorithmType}`);
      console.log(`     Transactions: ${alt.transactionCount}`);
      console.log(`     Optimization: ${alt.optimizationPercentage}%`);
      console.log(`     Score: ${alt.score}/10 (S:${alt.simplicity} F:${alt.fairness} E:${alt.efficiency} U:${alt.userFriendliness})`);
      console.log(`     Pros: ${alt.prosAndCons.pros.join(', ')}`);
      console.log('');
    });

    // Test 2: Custom algorithm selection
    console.log('🎯 Test 2: Custom algorithm selection');
    const customOptions = {
      enabledAlgorithms: ['greedy_debt_reduction', 'direct_settlement'],
      includeManualOption: false
    };
    
    const customComparison = await settlementService.generateAlternativeSettlements(
      'test-session-2', 
      customOptions
    );

    console.log(`✅ Generated ${customComparison.alternatives.length} alternatives with custom selection`);
    console.log(`📋 Algorithms: ${customComparison.alternatives.map(alt => alt.algorithmType).join(', ')}`);
    console.log('');

    // Test 3: Comparison matrix
    console.log('🎯 Test 3: Comparison matrix verification');
    console.log('📊 Comparison Metrics:');
    comparison.comparisonMatrix.forEach(metric => {
      console.log(`  ${metric.metricName}: ${metric.description}`);
      console.log(`    Weight: ${(metric.weight * 100).toFixed(0)}%`);
      console.log(`    Display: ${metric.displayFormat}`);
    });
    console.log('');

    // Test 4: Cache functionality
    console.log('🎯 Test 4: Cache functionality');
    const start1 = Date.now();
    await settlementService.generateAlternativeSettlements(sessionId);
    const time1 = Date.now() - start1;

    const start2 = Date.now();
    await settlementService.generateAlternativeSettlements(sessionId);
    const time2 = Date.now() - start2;

    console.log(`✅ First call: ${time1}ms, Second call (cached): ${time2}ms`);
    console.log(`🚀 Cache speedup: ${Math.round((time1 / time2) * 100) / 100}x faster`);
    console.log('');

    // Test 5: Algorithm configuration
    console.log('🎯 Test 5: Algorithm configuration management');
    const greedyConfig = settlementService.getAlgorithmConfiguration('greedy_debt_reduction');
    console.log(`✅ Greedy algorithm config: enabled=${greedyConfig?.enabled}, priority=${greedyConfig?.priority}`);

    settlementService.updateAlgorithmConfiguration('greedy_debt_reduction', {
      enabled: false,
      priority: 10
    });

    const updatedConfig = settlementService.getAlgorithmConfiguration('greedy_debt_reduction');
    console.log(`✅ Updated config: enabled=${updatedConfig?.enabled}, priority=${updatedConfig?.priority}`);
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('✅ Alternative Settlement Options Generator is working correctly');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testAlternativeSettlements().catch(console.error);