/**
 * Zustand Store Testing Utilities
 * Native testing patterns without React hooks dependency
 */

/**
 * Creates a clean store instance for testing
 * @param {Function} storeFactory - The store creation function
 * @returns {Object} Store instance with reset capability
 */
export const createTestStore = (storeFactory) => {
  const store = storeFactory();
  const initialState = store.getState();
  
  return {
    ...store,
    resetToInitialState: () => {
      store.setState(initialState, true); // Replace entire state
    },
    getState: store.getState,
    setState: store.setState,
    subscribe: store.subscribe
  };
};

/**
 * Test a store action and verify state changes
 * @param {Object} store - Zustand store instance
 * @param {Function} action - Action function to test
 * @param {Object} expectedStateChanges - Expected state changes
 * @param {Array} actionArgs - Arguments to pass to action
 */
export const testStoreAction = async (store, action, expectedStateChanges, actionArgs = []) => {
  const initialState = store.getState();
  
  // Execute action
  await action(...actionArgs);
  
  const finalState = store.getState();
  
  // Verify expected changes
  Object.keys(expectedStateChanges).forEach(key => {
    expect(finalState[key]).toEqual(expectedStateChanges[key]);
  });
  
  return { initialState, finalState };
};

/**
 * Test store state transitions
 * @param {Object} store - Zustand store instance
 * @param {Array} stateTransitions - Array of {action, expectedState} objects
 */
export const testStateTransitions = async (store, stateTransitions) => {
  const results = [];
  
  for (const { action, expectedState, args = [] } of stateTransitions) {
    const initialState = store.getState();
    await action(...args);
    const finalState = store.getState();
    
    // Verify expected state
    Object.keys(expectedState).forEach(key => {
      expect(finalState[key]).toEqual(expectedState[key]);
    });
    
    results.push({ initialState, finalState });
  }
  
  return results;
};

/**
 * Mock external dependencies for store testing
 * @param {Object} dependencies - Object with dependency mocks
 */
export const createStoreMocks = (dependencies = {}) => {
  const defaultMocks = {
    // Database service mock
    databaseService: {
      executeQuery: jest.fn(() => Promise.resolve([])),
      executeTransaction: jest.fn(() => Promise.resolve()),
      getPlayers: jest.fn(() => Promise.resolve([])),
      getSession: jest.fn(() => Promise.resolve(null)),
      getTransactions: jest.fn(() => Promise.resolve([])),
    },
    
    // Settlement service mock
    settlementService: {
      validateSettlement: jest.fn(() => Promise.resolve({ isValid: true, errors: [], warnings: [] })),
      generateMathematicalProof: jest.fn(() => Promise.resolve({ id: 'proof-1', isValid: true })),
      exportMathematicalProof: jest.fn(() => Promise.resolve({ exportId: 'export-1', status: 'completed' })),
      generateAlternativeSettlements: jest.fn(() => Promise.resolve([])),
    },
    
    // Session service mock
    sessionService: {
      getSession: jest.fn(() => Promise.resolve(null)),
      createSession: jest.fn(() => Promise.resolve({ id: 'session-1' })),
    }
  };
  
  return { ...defaultMocks, ...dependencies };
};

/**
 * Verify store subscription behavior
 * @param {Object} store - Zustand store instance
 * @param {Function} triggerAction - Action that should trigger subscription
 * @param {Function} subscriptionCallback - Callback to test
 */
export const testStoreSubscription = async (store, triggerAction, subscriptionCallback) => {
  const mockCallback = jest.fn(subscriptionCallback);
  const unsubscribe = store.subscribe(mockCallback);
  
  await triggerAction();
  
  expect(mockCallback).toHaveBeenCalled();
  
  unsubscribe();
  return mockCallback;
};

/**
 * Test store error handling
 * @param {Object} store - Zustand store instance
 * @param {Function} failingAction - Action that should fail
 * @param {String} expectedErrorMessage - Expected error message pattern
 */
export const testStoreErrorHandling = async (store, failingAction, expectedErrorMessage) => {
  const initialState = store.getState();
  
  try {
    await failingAction();
    throw new Error('Expected action to fail but it succeeded');
  } catch (error) {
    expect(error.message).toContain(expectedErrorMessage);
  }
  
  const finalState = store.getState();
  return { initialState, finalState };
};