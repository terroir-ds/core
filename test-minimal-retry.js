import pRetry from 'p-retry';

// Test to understand p-retry behavior
const testShouldRetry = async () => {
  let callCount = 0;
  const fn = async () => {
    callCount++;
    console.log(`Function called, count: ${callCount}`);
    if (callCount === 1) {
      throw new Error('retryable');
    } else if (callCount === 2) {
      throw new Error('fatal');
    }
    return 'success';
  };

  try {
    const result = await pRetry(fn, {
      retries: 2,
      minTimeout: 0,
      maxTimeout: 0,
      shouldRetry: (error) => {
        console.log('shouldRetry called with:', error.message, 'attemptNumber:', error.attemptNumber);
        const shouldRetry = error.message === 'retryable';
        console.log('shouldRetry returning:', shouldRetry);
        return shouldRetry;
      }
    });
    console.log('Success:', result);
  } catch (error) {
    console.log('Final error:', error.message);
  }
  console.log('Total calls:', callCount);
};

console.log('Testing shouldRetry behavior...');
await testShouldRetry();

// Test zero delay
console.log('\n\nTesting zero delay...');
let callCount2 = 0;
const fn2 = async () => {
  callCount2++;
  console.log(`Function called, count: ${callCount2}`);
  if (callCount2 === 1) {
    throw new Error('fail');
  }
  return 'success';
};

try {
  const result = await pRetry(fn2, {
    retries: 1,
    minTimeout: 0,
    maxTimeout: 0
  });
  console.log('Success:', result);
  console.log('Total calls:', callCount2);
} catch (error) {
  console.log('Error:', error.message);
}