/**
 * Service Isolation Setup - For limited parallel service tests
 * Ensures external dependencies are properly mocked
 */

beforeAll(async () => {
  console.log(`[Services] Service isolation setup started`);
  
  // Mock all external service dependencies
  mockVoiceService();
  mockNotificationService();
  mockWhatsAppService();
  mockFileSystem();
});

afterEach(() => {
  // Clear all mocks after each test to prevent cross-test contamination
  jest.clearAllMocks();
});

function mockVoiceService() {
  // Mock React Native Voice
  jest.mock('@react-native-voice/voice', () => ({
    start: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    destroy: jest.fn(() => Promise.resolve()),
    removeAllListeners: jest.fn(),
    isAvailable: jest.fn(() => Promise.resolve(true)),
    getSpeechRecognitionServices: jest.fn(() => Promise.resolve(['mock-service'])),
  }));
}

function mockNotificationService() {
  // Mock system notifications
  global.mockNotificationSend = jest.fn(() => Promise.resolve());
  
  // Mock sound playing
  global.mockPlaySound = jest.fn(() => Promise.resolve());
}

function mockWhatsAppService() {
  // Mock external WhatsApp integration
  global.mockWhatsAppShare = jest.fn(() => Promise.resolve({ success: true }));
  
  // Mock URL scheme handling
  global.mockOpenURL = jest.fn(() => Promise.resolve());
}

function mockFileSystem() {
  // Mock react-native-fs
  jest.mock('react-native-fs', () => ({
    DocumentDirectoryPath: '/mock/documents',
    writeFile: jest.fn(() => Promise.resolve()),
    readFile: jest.fn(() => Promise.resolve('')),
    exists: jest.fn(() => Promise.resolve(true)),
    unlink: jest.fn(() => Promise.resolve()),
    mkdir: jest.fn(() => Promise.resolve()),
  }));
}