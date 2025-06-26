# Circuit Breaker API Reference

## CircuitBreaker Class

The `CircuitBreaker` class implements the circuit breaker pattern to prevent cascading failures in distributed systems.

### Constructor

```typescript
constructor(options?: CircuitBreakerOptions)
```typescript
**CircuitBreakerOptions Interface**:

```typescript
interface CircuitBreakerOptions {
  failureThreshold?: number; // Default: 5
  successThreshold?: number; // Default: 2
  timeWindow?: number; // Default: 60000ms (1 minute)
  cooldownPeriod?: number; // Default: 30000ms (30 seconds)
  name?: string; // Default: 'CircuitBreaker'
}
```typescript
**Parameters**:

- `failureThreshold`: Number of failures before opening circuit
- `successThreshold`: Number of successes in half-open state to close circuit
- `timeWindow`: Time window for counting failures (milliseconds)
- `cooldownPeriod`: Wait time before trying half-open state (milliseconds)
- `name`: Circuit breaker name for logging

**Example**:

```typescript
const apiBreaker = new CircuitBreaker({
  failureThreshold: 5,
  successThreshold: 2,
  timeWindow: 60000, // 1 minute
  cooldownPeriod: 30000, // 30 seconds
  name: 'ExternalAPI',
});
```typescript
## Circuit States

### States Enum

```typescript
enum CircuitState {
  CLOSED = 'closed', // Normal operation
  OPEN = 'open', // Rejecting requests
  HALF_OPEN = 'half-open', // Testing recovery
}
```typescript
### State Transitions

```typescript
CLOSED → OPEN: After failureThreshold failures within timeWindow
OPEN → HALF_OPEN: After cooldownPeriod expires
HALF_OPEN → CLOSED: After successThreshold consecutive successes
HALF_OPEN → OPEN: After any failure
```typescript
## Methods

### execute()

Execute a function with circuit breaker protection.

```typescript
async execute<T>(fn: () => Promise<T>): Promise<T>
```typescript
**Parameters**:

- `fn`: The async function to execute

**Returns**: The function's result if successful

**Throws**:

- `NetworkError` with code `CIRCUIT_OPEN` if circuit is open
- The original error if function fails

**Example**:

```typescript
try {
  const data = await apiBreaker.execute(async () => {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  });
} catch (error) {
  if (error.code === 'CIRCUIT_OPEN') {
    // Circuit is open, use fallback
    return getCachedData();
  }
  throw error;
}
```typescript
### getState()

Get the current circuit state.

```typescript
getState(): CircuitState
```typescript
**Returns**: Current state (CLOSED, OPEN, or HALF_OPEN)

**Example**:

```typescript
const state = breaker.getState();
console.log(`Circuit is ${state}`);

if (state === CircuitState.OPEN) {
  console.log('Service is currently unavailable');
}
```typescript
### getStats()

Get circuit breaker statistics.

```typescript
getStats(): Record<string, unknown>
```typescript
**Returns**: Object containing:

- `name`: Circuit breaker name
- `state`: Current state
- `failures`: Number of recent failures
- `lastFailureTime`: Timestamp of last failure
- `timeWindow`: Failure counting window
- `failureThreshold`: Configured threshold

**Example**:

```typescript
const stats = breaker.getStats();
console.log(JSON.stringify(stats, null, 2));
// {
//   "name": "ExternalAPI",
//   "state": "open",
//   "failures": 5,
//   "lastFailureTime": 1645564800000,
//   "timeWindow": 60000,
//   "failureThreshold": 5
// }
```typescript
### reset()

Manually reset the circuit to closed state.

```typescript
reset(): void
```typescript
**Effects**:

- Sets state to CLOSED
- Clears failure history
- Resets success counter
- Logs reset action

**Example**:

```typescript
// Manual reset after fixing issue
breaker.reset();
console.log('Circuit manually reset');
```typescript
## Helper Functions

### retryWithCircuitBreaker()

Combine retry logic with circuit breaker protection.

```typescript
async function retryWithCircuitBreaker<T>(
  fn: () => Promise<T>,
  circuitBreaker: CircuitBreaker<T>,
  retryOptions?: RetryOptions
): Promise<T>;
```typescript
**Parameters**:

- `fn`: Function to execute
- `circuitBreaker`: Circuit breaker instance
- `retryOptions`: Retry configuration

**Example**:

```typescript
const result = await retryWithCircuitBreaker(
  async () => {
    return await apiClient.getData();
  },
  apiBreaker,
  {
    maxAttempts: 3,
    initialDelay: 100,
  }
);
```typescript
## Usage Patterns

### Basic Protection

```typescript
const dbBreaker = new CircuitBreaker({
  name: 'Database',
  failureThreshold: 3,
  cooldownPeriod: 60000, // 1 minute
});

async function queryDatabase(sql: string) {
  return await dbBreaker.execute(async () => {
    const connection = await pool.getConnection();
    try {
      return await connection.query(sql);
    } finally {
      connection.release();
    }
  });
}
```typescript
### Multiple Services

```typescript
// Create breakers for each service
const breakers = new Map<string, CircuitBreaker>();

function getBreaker(service: string): CircuitBreaker {
  if (!breakers.has(service)) {
    breakers.set(
      service,
      new CircuitBreaker({
        name: service,
        failureThreshold: 5,
        cooldownPeriod: 30000,
      })
    );
  }
  return breakers.get(service)!;
}

// Use appropriate breaker
async function callService(service: string, request: Request) {
  const breaker = getBreaker(service);
  return await breaker.execute(() => serviceClient.call(service, request));
}
```typescript
### Fallback Strategies

```typescript
async function fetchDataWithFallback(): Promise<Data> {
  // Try primary service
  try {
    return await primaryBreaker.execute(() => primaryService.getData());
  } catch (error) {
    logger.warn('Primary service failed, trying secondary');

    // Try secondary service
    try {
      return await secondaryBreaker.execute(() => secondaryService.getData());
    } catch (secondaryError) {
      logger.warn('Secondary service failed, using cache');

      // Fall back to cache
      const cached = await cache.get('data');
      if (cached) {
        return cached;
      }

      // Final fallback
      return getDefaultData();
    }
  }
}
```typescript
### Health Monitoring

```typescript
// Monitor circuit breaker health
function getSystemHealth(): HealthStatus {
  const breakers = [apiBreaker, dbBreaker, cacheBreaker];
  const stats = breakers.map((b) => ({
    name: b.getStats().name,
    state: b.getState(),
    failures: b.getStats().failures,
  }));

  const openCircuits = stats.filter((s) => s.state === 'open');

  if (openCircuits.length === 0) {
    return { status: 'healthy', circuits: stats };
  } else if (openCircuits.length < breakers.length / 2) {
    return { status: 'degraded', circuits: stats };
  } else {
    return { status: 'unhealthy', circuits: stats };
  }
}
```typescript
### Gradual Recovery

```typescript
class GradualRecoveryBreaker extends CircuitBreaker {
  private recoveryRate = 0.1; // Start with 10% of traffic

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.getState() === CircuitState.HALF_OPEN) {
      // Gradually increase traffic
      if (Math.random() > this.recoveryRate) {
        throw new NetworkError('Circuit breaker limiting traffic', {
          code: 'CIRCUIT_LIMITING',
        });
      }
    }

    try {
      const result = await super.execute(fn);
      // Increase recovery rate on success
      if (this.getState() === CircuitState.HALF_OPEN) {
        this.recoveryRate = Math.min(1, this.recoveryRate * 1.5);
      }
      return result;
    } catch (error) {
      // Reset recovery rate on failure
      this.recoveryRate = 0.1;
      throw error;
    }
  }
}
```typescript
## Configuration Examples

### Aggressive Protection

For critical services that need fast failure detection:

```typescript
const criticalBreaker = new CircuitBreaker({
  failureThreshold: 3, // Open quickly
  successThreshold: 5, // Require more successes
  timeWindow: 30000, // 30 second window
  cooldownPeriod: 60000, // 1 minute cooldown
  name: 'CriticalService',
});
```typescript
### Tolerant Configuration

For services with occasional hiccups:

```typescript
const tolerantBreaker = new CircuitBreaker({
  failureThreshold: 10, // Allow more failures
  successThreshold: 1, // Quick recovery
  timeWindow: 120000, // 2 minute window
  cooldownPeriod: 15000, // 15 second cooldown
  name: 'TolerantService',
});
```typescript
### Rate Limiting Aware

Handle rate-limited APIs:

```typescript
const rateLimitedBreaker = new CircuitBreaker({
  failureThreshold: 3,
  cooldownPeriod: 60000, // Match API rate limit window
  name: 'RateLimitedAPI',
});

// Custom execution with rate limit handling
async function callRateLimitedAPI() {
  return await rateLimitedBreaker.execute(async () => {
    try {
      return await apiClient.call();
    } catch (error) {
      if (error.statusCode === 429) {
        // Don't count rate limits as failures
        const retryAfter = error.headers['retry-after'];
        await sleep(retryAfter * 1000);
        throw error; // Let retry logic handle it
      }
      throw error;
    }
  });
}
```typescript
## Testing Circuit Breakers

Example test scenarios:

```typescript
describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({
      failureThreshold: 3,
      cooldownPeriod: 100, // Short for tests
    });
  });

  it('should open after threshold failures', async () => {
    const failingFn = jest.fn().mockRejectedValue(new Error('Fail'));

    // Fail 3 times
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(failingFn)).rejects.toThrow('Fail');
    }

    // Circuit should be open
    expect(breaker.getState()).toBe('open');

    // Next call should fail immediately
    await expect(breaker.execute(failingFn)).rejects.toThrow('Circuit breaker is open');
    expect(failingFn).toHaveBeenCalledTimes(3); // Not called again
  });

  it('should recover through half-open state', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('Fail'))
      .mockRejectedValueOnce(new Error('Fail'))
      .mockRejectedValueOnce(new Error('Fail'))
      .mockResolvedValue('Success');

    // Open the circuit
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(fn)).rejects.toThrow();
    }

    // Wait for cooldown
    await sleep(150);

    // Should be half-open and succeed
    const result = await breaker.execute(fn);
    expect(result).toBe('Success');
    expect(breaker.getState()).toBe('half-open');

    // Another success should close it
    await breaker.execute(fn);
    expect(breaker.getState()).toBe('closed');
  });
});
```typescript
## Monitoring and Metrics

### Prometheus Metrics

```typescript
// Track circuit breaker metrics
const circuitStateGauge = new Gauge({
  name: 'circuit_breaker_state',
  help: 'Circuit breaker state (0=closed, 1=open, 2=half-open)',
  labelNames: ['circuit_name'],
});

const circuitFailuresCounter = new Counter({
  name: 'circuit_breaker_failures_total',
  help: 'Total circuit breaker failures',
  labelNames: ['circuit_name'],
});

// Update metrics on state changes
class MonitoredCircuitBreaker extends CircuitBreaker {
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    try {
      const result = await super.execute(fn);
      this.updateMetrics();
      return result;
    } catch (error) {
      circuitFailuresCounter.labels(this.options.name).inc();
      this.updateMetrics();
      throw error;
    }
  }

  private updateMetrics() {
    const state = this.getState();
    const value = state === 'closed' ? 0 : state === 'open' ? 1 : 2;
    circuitStateGauge.labels(this.options.name).set(value);
  }
}
```typescript
### Logging

Circuit breaker state changes are automatically logged:

```typescript
// When circuit opens
logger.warn(
  {
    circuit: 'ExternalAPI',
    state: 'open',
    failures: 5,
    threshold: 5,
  },
  'Circuit breaker opened'
);

// When circuit enters half-open
logger.info(
  {
    circuit: 'ExternalAPI',
    state: 'half-open',
  },
  'Circuit breaker half-open'
);

// When circuit closes
logger.info(
  {
    circuit: 'ExternalAPI',
    state: 'closed',
  },
  'Circuit breaker closed'
);
```
