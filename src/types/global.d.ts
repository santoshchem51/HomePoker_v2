/**
 * Global type declarations for runtime environment variables
 * Story 5.3: Comprehensive Testing Suite - Error Logging Support
 */

declare global {
  // Browser environment globals
  var navigator: Navigator | undefined;
  var window: Window | undefined;
  var performance: Performance | undefined;
  
  // Node.js environment globals
  var process: NodeJS.Process | undefined;
  var global: typeof globalThis | undefined;
  
  // Jest testing globals
  var gc: (() => void) | undefined;
}

export {};