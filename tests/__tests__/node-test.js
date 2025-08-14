const test = require('node:test');
const assert = require('node:assert');

test('simple addition', () => {
  assert.strictEqual(1 + 1, 2);
});

console.log('Test file loaded successfully');