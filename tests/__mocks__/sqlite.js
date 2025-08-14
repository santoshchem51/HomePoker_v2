module.exports = {
  DEBUG: jest.fn(),
  enablePromise: jest.fn(),
  openDatabase: jest.fn(() => Promise.resolve({
    transaction: jest.fn(),
    close: jest.fn(),
  })),
};