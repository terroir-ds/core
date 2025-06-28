# Infrastructure Implementation Guide

## Overview

This guide provides best practices and patterns for implementing infrastructure components in the Terroir Core Design System. Follow these guidelines to ensure consistency, quality, and maintainability.

## General Principles

### 1. Start Small, Iterate Often
- Implement MVP first
- Get feedback early
- Enhance incrementally
- Avoid over-engineering

### 2. Automate Everything
- No manual processes
- Reproducible builds
- Self-documenting systems
- Automated testing

### 3. Measure First, Optimize Later
- Establish baselines
- Track metrics
- Data-driven decisions
- Continuous improvement

### 4. Security by Design
- Threat model early
- Principle of least privilege
- Defense in depth
- Regular audits

## Implementation Process

### Phase 1: Research & Planning

#### 1. Requirements Gathering
```markdown
## Component: [Name]

### Requirements
- Functional: What it must do
- Non-functional: Performance, security, etc.
- Constraints: Technical, business, legal
- Dependencies: What it needs, what needs it

### Success Criteria
- Measurable outcomes
- Acceptance tests
- Performance targets
- Security requirements
```

#### 2. Technical Design
```markdown
## Technical Design

### Architecture
- Component diagram
- Data flow
- Integration points
- Security boundaries

### Technology Choices
- Option 1: Pros/cons
- Option 2: Pros/cons
- Recommendation: Reasoning

### Risk Assessment
- Technical risks
- Mitigation strategies
- Fallback plans
```

### Phase 2: Proof of Concept

#### 1. Minimal Implementation
```typescript
// Start with the simplest thing that could work
export class SecurityScanner {
  async scan(): Promise<ScanResult> {
    // Basic implementation
    const results = await runNpmAudit();
    return formatResults(results);
  }
}
```

#### 2. Validation
```typescript
// Validate the approach works
describe('SecurityScanner POC', () => {
  it('should detect known vulnerabilities', async () => {
    const scanner = new SecurityScanner();
    const results = await scanner.scan();
    
    expect(results.vulnerabilities).toContain(
      expect.objectContaining({
        severity: 'high',
        package: 'vulnerable-package'
      })
    );
  });
});
```

### Phase 3: Production Implementation

#### 1. Error Handling
```typescript
import { InfrastructureError } from '@errors';
import { logger } from '@utils/logger';

export class SecurityScanner {
  async scan(options: ScanOptions): Promise<ScanResult> {
    try {
      // Validate inputs
      const validated = validateOptions(options);
      
      // Execute with timeout
      const results = await withTimeout(
        this.performScan(validated),
        options.timeout ?? 30000
      );
      
      // Log success
      logger.info({
        component: 'SecurityScanner',
        action: 'scan',
        duration: results.duration,
        vulnerabilityCount: results.vulnerabilities.length
      });
      
      return results;
      
    } catch (error) {
      // Proper error handling
      logger.error({
        component: 'SecurityScanner',
        action: 'scan',
        error: error instanceof Error ? error.message : 'Unknown error',
        options
      });
      
      throw new InfrastructureError(
        'Security scan failed',
        'SECURITY_SCAN_FAILED',
        { cause: error, context: { options } }
      );
    }
  }
}
```

#### 2. Configuration
```typescript
// Use environment-based configuration
import { z } from 'zod';

const SecurityConfigSchema = z.object({
  enableScanning: z.boolean().default(true),
  scanOnCommit: z.boolean().default(true),
  severityThreshold: z.enum(['low', 'medium', 'high', 'critical']).default('high'),
  ignorePaths: z.array(z.string()).default([]),
  timeout: z.number().positive().default(30000),
  retries: z.number().min(0).max(5).default(3)
});

export type SecurityConfig = z.infer<typeof SecurityConfigSchema>;

export function loadSecurityConfig(): SecurityConfig {
  return SecurityConfigSchema.parse({
    enableScanning: process.env.SECURITY_ENABLE_SCANNING !== 'false',
    scanOnCommit: process.env.SECURITY_SCAN_ON_COMMIT !== 'false',
    severityThreshold: process.env.SECURITY_SEVERITY_THRESHOLD,
    ignorePaths: process.env.SECURITY_IGNORE_PATHS?.split(',') ?? [],
    timeout: Number(process.env.SECURITY_TIMEOUT) || undefined,
    retries: Number(process.env.SECURITY_RETRIES) || undefined
  });
}
```

#### 3. Monitoring
```typescript
// Add comprehensive monitoring
import { metrics } from '@monitoring';

export class SecurityScanner {
  private readonly scanDuration = metrics.createHistogram({
    name: 'security_scan_duration_seconds',
    help: 'Duration of security scans',
    labelNames: ['status', 'severity']
  });
  
  private readonly vulnerabilityCount = metrics.createGauge({
    name: 'security_vulnerabilities_total',
    help: 'Total number of vulnerabilities',
    labelNames: ['severity']
  });
  
  async scan(options: ScanOptions): Promise<ScanResult> {
    const timer = this.scanDuration.startTimer();
    
    try {
      const results = await this.performScan(options);
      
      // Record metrics
      timer({ status: 'success' });
      
      for (const severity of ['low', 'medium', 'high', 'critical']) {
        const count = results.vulnerabilities.filter(
          v => v.severity === severity
        ).length;
        this.vulnerabilityCount.set({ severity }, count);
      }
      
      return results;
      
    } catch (error) {
      timer({ status: 'error' });
      throw error;
    }
  }
}
```

### Phase 4: Testing Strategy

#### 1. Unit Tests
```typescript
describe('SecurityScanner', () => {
  let scanner: SecurityScanner;
  let mockAudit: Mock;
  
  beforeEach(() => {
    mockAudit = vi.fn();
    scanner = new SecurityScanner({ audit: mockAudit });
  });
  
  describe('scan', () => {
    it('should handle successful scan', async () => {
      mockAudit.mockResolvedValue({
        vulnerabilities: [{
          severity: 'high',
          package: 'test-package'
        }]
      });
      
      const result = await scanner.scan({});
      
      expect(result.vulnerabilities).toHaveLength(1);
      expect(mockAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          production: true
        })
      );
    });
    
    it('should handle scan timeout', async () => {
      mockAudit.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 5000))
      );
      
      await expect(
        scanner.scan({ timeout: 100 })
      ).rejects.toThrow('Operation timed out');
    });
  });
});
```

#### 2. Integration Tests
```typescript
describe('SecurityScanner Integration', () => {
  it('should detect real vulnerabilities', async () => {
    // Use real npm audit
    const scanner = new SecurityScanner();
    
    // Create test package with known vulnerability
    const testDir = await createTestPackage({
      dependencies: {
        'lodash': '4.17.20' // Known vulnerability
      }
    });
    
    const results = await scanner.scan({ path: testDir });
    
    expect(results.vulnerabilities).toContainEqual(
      expect.objectContaining({
        package: 'lodash',
        severity: expect.stringMatching(/high|critical/)
      })
    );
  });
});
```

#### 3. Performance Tests
```typescript
describe('SecurityScanner Performance', () => {
  it('should complete scan within performance budget', async () => {
    const scanner = new SecurityScanner();
    const largeProject = await createLargeTestProject();
    
    const start = performance.now();
    await scanner.scan({ path: largeProject });
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(30000); // 30 second budget
  });
  
  it('should handle concurrent scans efficiently', async () => {
    const scanner = new SecurityScanner();
    const projects = await Promise.all(
      Array(10).fill(0).map(() => createTestProject())
    );
    
    const start = performance.now();
    await Promise.all(
      projects.map(project => scanner.scan({ path: project }))
    );
    const duration = performance.now() - start;
    
    // Should be faster than sequential
    expect(duration).toBeLessThan(50000); // 5s per scan average
  });
});
```

### Phase 5: Documentation

#### 1. API Documentation
```typescript
/**
 * Security scanner for detecting vulnerabilities in dependencies
 * 
 * @example
 * ```typescript
 * const scanner = new SecurityScanner();
 * const results = await scanner.scan({
 *   severity: 'high',
 *   production: true
 * });
 * 
 * if (results.vulnerabilities.length > 0) {
 *   console.error('Vulnerabilities found:', results);
 *   process.exit(1);
 * }
 * ```
 */
export class SecurityScanner {
  /**
   * Scan for security vulnerabilities
   * 
   * @param options - Scan configuration options
   * @param options.severity - Minimum severity to report
   * @param options.production - Only scan production dependencies
   * @param options.timeout - Maximum scan duration in milliseconds
   * @returns Scan results with vulnerability details
   * @throws {InfrastructureError} If scan fails
   */
  async scan(options: ScanOptions = {}): Promise<ScanResult> {
    // Implementation
  }
}
```

#### 2. Usage Guide
```markdown
# Security Scanner Usage Guide

## Quick Start

```bash
npm install @terroir/security
```

```typescript
import { SecurityScanner } from '@terroir/security';

const scanner = new SecurityScanner();
const results = await scanner.scan();
```

## Configuration

Set environment variables:
- `SECURITY_ENABLE_SCANNING`: Enable/disable scanning
- `SECURITY_SEVERITY_THRESHOLD`: Minimum severity to report
- `SECURITY_TIMEOUT`: Scan timeout in milliseconds

## CI/CD Integration

```yaml
# .github/workflows/security.yml
- name: Security Scan
  run: |
    npm run security:scan
  env:
    SECURITY_SEVERITY_THRESHOLD: high
```

## Troubleshooting

### Scan Timeouts
Increase timeout:
```typescript
await scanner.scan({ timeout: 60000 });
```

### False Positives
Add to ignore list:
```typescript
await scanner.scan({
  ignore: ['package-name']
});
```
```

### Phase 6: Deployment

#### 1. Gradual Rollout
```typescript
// Feature flag for gradual rollout
export class SecurityScanner {
  async scan(options: ScanOptions): Promise<ScanResult> {
    const config = loadSecurityConfig();
    
    if (!config.enableScanning) {
      logger.info('Security scanning disabled');
      return { vulnerabilities: [], duration: 0 };
    }
    
    // Percentage-based rollout
    if (config.rolloutPercentage < 100) {
      const random = Math.random() * 100;
      if (random > config.rolloutPercentage) {
        logger.info('Security scan skipped due to rollout percentage');
        return { vulnerabilities: [], duration: 0 };
      }
    }
    
    return this.performScan(options);
  }
}
```

#### 2. Monitoring & Alerts
```typescript
// Set up alerts for critical issues
export function setupSecurityAlerts() {
  metrics.on('security_vulnerabilities_total', (value, labels) => {
    if (labels.severity === 'critical' && value > 0) {
      alerting.send({
        severity: 'critical',
        title: 'Critical vulnerabilities detected',
        description: `Found ${value} critical vulnerabilities`,
        runbook: 'https://docs.terroir.dev/runbooks/security'
      });
    }
  });
}
```

## Common Patterns

### 1. Retry with Backoff
```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxAttempts = 3, backoff = 1000 } = options;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      
      const delay = backoff * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Unreachable');
}
```

### 2. Circuit Breaker
```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure < this.cooldown) {
        throw new Error('Circuit breaker is open');
      }
      this.state = 'half-open';
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

### 3. Resource Pooling
```typescript
class ResourcePool<T> {
  private available: T[] = [];
  private inUse = new Set<T>();
  
  async acquire(): Promise<T> {
    // Wait for available resource
    while (this.available.length === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const resource = this.available.pop()!;
    this.inUse.add(resource);
    return resource;
  }
  
  release(resource: T): void {
    this.inUse.delete(resource);
    this.available.push(resource);
  }
}
```

## Checklist for New Infrastructure

### Planning
- [ ] Requirements documented
- [ ] Architecture designed
- [ ] Security review completed
- [ ] Performance targets set

### Implementation
- [ ] Error handling comprehensive
- [ ] Configuration flexible
- [ ] Monitoring in place
- [ ] Logging structured

### Testing
- [ ] Unit tests >90% coverage
- [ ] Integration tests passing
- [ ] Performance tests within budget
- [ ] Security tests completed

### Documentation
- [ ] API documentation complete
- [ ] Usage guide written
- [ ] Troubleshooting guide
- [ ] Runbook created

### Deployment
- [ ] Feature flags configured
- [ ] Rollout plan defined
- [ ] Rollback procedure tested
- [ ] Alerts configured

## Anti-Patterns to Avoid

### 1. Premature Optimization
❌ Don't optimize before measuring
✅ Establish baselines first

### 2. Over-Engineering
❌ Don't build for imaginary scale
✅ Build for current needs + 20%

### 3. Manual Processes
❌ Don't require manual intervention
✅ Automate everything

### 4. Tight Coupling
❌ Don't create interdependencies
✅ Use interfaces and events

### 5. Missing Observability
❌ Don't deploy without monitoring
✅ Instrument everything

## Resources

### Internal
- [Architecture Decisions](../architecture/decisions/)
- [Security Guidelines](../security/guidelines.md)
- [Performance Standards](../performance/standards.md)

### External
- [12 Factor App](https://12factor.net/)
- [Google SRE Book](https://sre.google/books/)
- [AWS Well-Architected](https://aws.amazon.com/architecture/well-architected/)

## Getting Help

### Slack Channels
- #infrastructure - General infrastructure
- #security - Security-specific
- #performance - Performance optimization
- #incidents - Production issues

### Office Hours
- Tuesday 2-3pm: Infrastructure
- Thursday 2-3pm: Security
- Friday 2-3pm: Performance

### Escalation
1. Team lead
2. Infrastructure architect
3. CTO

Remember: Good infrastructure is invisible when working correctly!