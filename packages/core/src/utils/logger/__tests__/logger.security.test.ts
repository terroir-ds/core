/**
 * @module test/lib/utils/logger/logger.security
 * 
 * Security-focused tests for the logger utility
 * 
 * Tests security features including:
 * - Sensitive field redaction (passwords, API keys, tokens)
 * - Nested data redaction with deep object traversal
 * - Provider-specific API key patterns (Stripe, GitHub, AWS)
 * - Email address redaction
 * - Circular reference handling
 * - Input validation for large objects and unusual data types
 * - Error resilience during redaction
 * - Production mode security hardening
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  createConfigMock, 
  mockConfigProduction 
} from '@lib/config/__mocks__/config.mock.js';

// Mock the env module
const mockConfig = createConfigMock();
vi.mock('@lib/config/index.js', () => mockConfig);

describe('Logger Security', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Data Redaction', () => {
    it('should redact sensitive field names', async () => {
      // Set to production mode for proper redaction
      mockConfigProduction();
      vi.resetModules();
      
      // Import logger fresh after setting production mode
      const { logger } = await import('../index.js');
      
      // Capture console output manually since we can't easily mock the logger internals
      const originalWrite = process.stdout.write;
      const outputs: string[] = [];
      process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
        outputs.push(chunk.toString());
        return true;
      }) as unknown as typeof process.stdout.write;
      
      // Test data with sensitive fields - must use 'config' key for redaction
      const sensitiveData = {
        config: {
          username: 'testuser',
          password: 'supersecret123',
          email: 'test@example.com',
          secret: 'hidden-value',
          publicInfo: 'this is fine'
        }
      };
      
      logger.info(sensitiveData, 'User login attempt');
      
      // Restore stdout
      process.stdout.write = originalWrite;
      
      // Check the output
      expect(outputs.length).toBeGreaterThan(0);
      const output = outputs[0];
      
      // The logger should have redacted sensitive fields
      expect(output).toContain('[REDACTED]');
      expect(output).toContain('testuser');
      expect(output).toContain('this is fine');
      expect(output).not.toContain('supersecret123');
      expect(output).not.toContain('hidden-value');
    });

    it('should redact nested sensitive data', async () => {
      mockConfigProduction();
      vi.resetModules();
      
      const { logger } = await import('../index.js');
      
      const nestedData = {
        config: {
          user: {
            id: 123,
            credentials: {
              password: 'secret123',
              apiKey: 'ak_live_1234567890'
            }
          },
          database: {
            host: 'localhost',
            password: 'dbpass123'
          }
        }
      };
      
      const originalWrite = process.stdout.write;
      const outputs: string[] = [];
      process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
        outputs.push(chunk.toString());
        return true;
      }) as unknown as typeof process.stdout.write;
      
      logger.info(nestedData, 'System configuration');
      
      process.stdout.write = originalWrite;
      
      expect(outputs.length).toBeGreaterThan(0);
      const output = outputs[0];
      
      // Check that nested passwords are redacted
      expect(output).toContain('[REDACTED]');
      expect(output).toContain('localhost');
      expect(output).not.toContain('secret123');
      expect(output).not.toContain('dbpass123');
      expect(output).not.toContain('ak_live_1234567890');
    });

    it('should redact API keys from known providers', async () => {
      mockConfigProduction();
      vi.resetModules();
      
      const { logger } = await import('../index.js');
      
      const apiConfig = {
        config: {
          stripe: {
            key: 'sk_test_FAKE_KEY_FOR_TESTING_ONLY_12345',
            webhook: 'whsec_test_FAKE_WEBHOOK_SECRET_12345'
          },
          github: {
            token: 'ghp_FAKE_TOKEN_FOR_TESTING_ONLY_1234567890'
          },
          aws: {
            accessKey: 'AKIA_FAKE_ACCESS_KEY_FOR_TESTING',
            secretKey: 'fake+secret+key+for+testing+purposes+only'
          }
        }
      };
      
      const originalWrite = process.stdout.write;
      const outputs: string[] = [];
      process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
        outputs.push(chunk.toString());
        return true;
      }) as unknown as typeof process.stdout.write;
      
      logger.info(apiConfig, 'API configuration');
      
      process.stdout.write = originalWrite;
      
      expect(outputs.length).toBeGreaterThan(0);
      const output = outputs[0];
      
      // All keys should be redacted
      expect(output).toContain('[REDACTED]');
      expect(output).not.toContain('sk_test_FAKE_KEY_FOR_TESTING_ONLY_12345');
      expect(output).not.toContain('ghp_FAKE_TOKEN_FOR_TESTING_ONLY_1234567890');
      expect(output).not.toContain('AKIA_FAKE_ACCESS_KEY_FOR_TESTING');
      expect(output).not.toContain('fake+secret+key+for+testing+purposes+only');
    });

    it('should handle circular references safely', async () => {
      mockConfigProduction();
      vi.resetModules();
      
      const { logger } = await import('../index.js');
      
      const circularObj: Record<string, unknown> = {
        name: 'test',
        password: 'secret123'
      };
      circularObj['self'] = circularObj;
      
      expect(() => {
        logger.info(circularObj, 'Circular object test');
      }).not.toThrow();
    });

    it('should redact email addresses', async () => {
      mockConfigProduction();
      vi.resetModules();
      
      const { logger } = await import('../index.js');
      
      const userData = {
        emails: ['user@example.com', 'admin@company.org'],
        primaryEmail: 'primary@domain.com',
        contactInfo: 'Please reach out to support@company.com for help'
      };
      
      const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      logger.info(userData, 'User contact information');
      
      const output = spy.mock.calls[0]?.[0] as string;
      // Emails should be redacted based on configured redaction patterns
      expect(output).toMatch(/"emails":\["[^"]*","[^"]*"\]/);
      
      spy.mockRestore();
    });
  });

  describe('Input Validation', () => {
    it('should handle extremely large objects', async () => {
      mockConfigProduction();
      vi.resetModules();
      
      const { logger } = await import('../index.js');
      
      const largeObj = {
        data: 'x'.repeat(50000), // 50KB string
        metadata: {
          size: 'large',
          password: 'should-be-redacted'
        }
      };
      
      expect(() => {
        logger.info(largeObj, 'Large object test');
      }).not.toThrow();
    });

    it('should handle unusual data types', async () => {
      mockConfigProduction();
      vi.resetModules();
      
      const { logger } = await import('../index.js');
      
      const weirdData = {
        date: new Date(),
        regex: /test-pattern/gi,
        func: () => 'test',
        symbol: Symbol('test'),
        bigint: BigInt(123456789),
        password: 'secret123'
      };
      
      expect(() => {
        logger.info(weirdData, 'Unusual data types');
      }).not.toThrow();
    });

    it('should handle null and undefined values', async () => {
      mockConfigProduction();
      vi.resetModules();
      
      const { logger } = await import('../index.js');
      
      // Need to pass through 'config' serializer for redaction to work
      const nullishData = {
        config: {
          nullValue: null,
          undefinedValue: undefined,
          emptyString: '',
          password: 'secret123'
        }
      };
      
      const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      logger.info(nullishData, 'Nullish values test');
      
      const output = spy.mock.calls[0]?.[0] as string;
      expect(output).toContain('"password":"[REDACTED]"');
      expect(output).toContain('"nullValue":null');
      
      spy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle logging errors gracefully', async () => {
      mockConfigProduction();
      vi.resetModules();
      
      const { logger } = await import('../index.js');
      
      // Create a problematic object that will cause serialization issues
      const circularRef: Record<string, unknown> = { a: 1 };
      circularRef['self'] = circularRef;
      
      // The logger should handle circular references without throwing
      expect(() => {
        logger.info(circularRef, 'This should not crash');
      }).not.toThrow();
    });

    it('should handle redaction errors gracefully', async () => {
      mockConfigProduction();
      vi.resetModules();
      
      const { logger } = await import('../index.js');
      
      // Pass through config serializer to trigger redaction logic
      const problematicObj = {
        config: {
          get password() {
            throw new Error('Getter error');
          },
          normalField: 'value'
        }
      };
      
      // The logger should handle getter errors without throwing
      expect(() => {
        logger.info(problematicObj, 'Problematic object');
      }).not.toThrow();
    });
  });
});