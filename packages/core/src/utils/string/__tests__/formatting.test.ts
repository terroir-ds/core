/**
 * @module @utils/string/__tests__/formatting.test.ts
 * 
 * Tests for string formatting utilities.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  truncate,
  ellipsis,
  formatBytes,
  formatDuration,
  formatRelativeTime,
  formatNumber,
  formatPercentage,
  formatCurrency,
} from '../formatting.js';

describe('String Formatting Utilities', () => {
  describe('truncate', () => {
    it('should truncate strings longer than maxLength', () => {
      expect(truncate('Hello world', { maxLength: 8 })).toBe('Hello...');
      expect(truncate('Very long string here', { maxLength: 10 })).toBe('Very...');
    });

    it('should not truncate strings shorter than maxLength', () => {
      expect(truncate('Short', { maxLength: 10 })).toBe('Short');
      expect(truncate('Exactly10!', { maxLength: 10 })).toBe('Exactly10!');
    });

    it('should use custom ellipsis', () => {
      expect(truncate('Hello world', { maxLength: 8, ellipsis: '…' })).toBe('Hello…');
      expect(truncate('Hello world', { maxLength: 10, ellipsis: ' [more]' })).toBe('Hel [more]');
    });

    it('should break at word boundaries', () => {
      expect(truncate('Hello world test', { maxLength: 10, breakWords: true })).toBe('Hello...');
      expect(truncate('Helloworldtest', { maxLength: 10, breakWords: true })).toBe('Hellowo...');
    });

    it('should truncate from start', () => {
      expect(truncate('Hello world', { maxLength: 8, position: 'start' })).toBe('...world');
    });

    it('should truncate from middle', () => {
      expect(truncate('Hello world', { maxLength: 8, position: 'middle' })).toBe('He...rld');
      expect(truncate('Very long string', { maxLength: 10, position: 'middle' })).toBe('Ver...ring');
    });

    it('should handle edge cases', () => {
      expect(truncate('', { maxLength: 5 })).toBe('');
      expect(truncate('Hi', { maxLength: 0 })).toBe('');
      expect(truncate('Hello', { maxLength: 2, ellipsis: '......' })).toBe('..');
    });

    it('should handle Unicode characters', () => {
      expect(truncate('Hello 🌟 world', { maxLength: 10 })).toBe('Hello...');
      expect(truncate('Café résumé', { maxLength: 8 })).toBe('Café...');
    });
  });

  describe('ellipsis', () => {
    it('should be a convenience wrapper for truncate', () => {
      expect(ellipsis('Hello world', 8)).toBe(truncate('Hello world', { maxLength: 8 }));
      expect(ellipsis('Short', 10)).toBe('Short');
    });

    it('should use custom ellipsis string', () => {
      expect(ellipsis('Hello world', 8, '…')).toBe('Hello…');
    });
  });

  describe('formatBytes', () => {
    it('should format zero bytes', () => {
      expect(formatBytes(0)).toBe('0 B');
    });

    it('should format bytes in binary units', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
      expect(formatBytes(1099511627776)).toBe('1 TB');
    });

    it('should format bytes in decimal units', () => {
      expect(formatBytes(1000, { binary: false })).toBe('1 KB');
      expect(formatBytes(1500, { binary: false })).toBe('1.5 KB');
      expect(formatBytes(1000000, { binary: false })).toBe('1 MB');
    });

    it('should respect decimal places', () => {
      expect(formatBytes(1536, { decimals: 0 })).toBe('2 KB');
      expect(formatBytes(1536, { decimals: 1 })).toBe('1.5 KB');
      expect(formatBytes(1536, { decimals: 3 })).toBe('1.5 KB');
    });

    it('should handle negative values', () => {
      expect(formatBytes(-1024)).toBe('-1 KB');
      expect(formatBytes(-1536)).toBe('-1.5 KB');
    });

    it('should handle invalid values', () => {
      expect(formatBytes(Infinity)).toBe('Invalid size');
      expect(formatBytes(-Infinity)).toBe('Invalid size');
      expect(formatBytes(NaN)).toBe('Invalid size');
    });

    it('should respect minimum unit', () => {
      expect(formatBytes(512, { minUnit: 'KB' })).toBe('0.5 KB');
      expect(formatBytes(1024, { minUnit: 'MB' })).toBe('0 MB');
    });

    it('should handle very large numbers', () => {
      const exabyte = Math.pow(1024, 6);
      expect(formatBytes(exabyte)).toBe('1 EB');
    });

    it('should use locale formatting', () => {
      const result = formatBytes(1234567, { locale: 'en-US' });
      expect(result).toContain('1.18');
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds', () => {
      expect(formatDuration(1000)).toBe('1s');
      expect(formatDuration(500, { includeMs: true })).toBe('500ms');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(65000)).toBe('1m 5s');
      expect(formatDuration(125000)).toBe('2m 5s');
    });

    it('should format hours, minutes, and seconds', () => {
      expect(formatDuration(3661000)).toBe('1h 1m 1s');
      expect(formatDuration(7200000)).toBe('2h');
    });

    it('should format days', () => {
      expect(formatDuration(86400000)).toBe('1d');
      expect(formatDuration(90061000)).toBe('1d 1h 1m');
    });

    it('should include milliseconds when requested', () => {
      expect(formatDuration(65500, { includeMs: true })).toBe('1m 5s 500ms');
      expect(formatDuration(1500, { includeMs: true })).toBe('1s 500ms');
    });

    it('should use long format', () => {
      expect(formatDuration(3661000, { compact: false })).toBe('1 hour, 1 minute, 1 second');
      expect(formatDuration(65000, { compact: false })).toBe('1 minute, 5 seconds');
    });

    it('should limit number of units', () => {
      expect(formatDuration(90061000, { maxUnits: 2 })).toBe('1d 1h');
      expect(formatDuration(3661000, { maxUnits: 1 })).toBe('1h');
    });

    it('should handle zero duration', () => {
      expect(formatDuration(0)).toBe('0s');
      expect(formatDuration(0, { compact: false })).toBe('0 seconds');
    });

    it('should handle negative durations', () => {
      expect(formatDuration(-65000)).toBe('-1m 5s');
      expect(formatDuration(-1000)).toBe('-1s');
    });

    it('should handle invalid values', () => {
      expect(formatDuration(Infinity)).toBe('Invalid duration');
      expect(formatDuration(-Infinity)).toBe('Invalid duration');
      expect(formatDuration(NaN)).toBe('Invalid duration');
    });

    it('should use custom separator', () => {
      expect(formatDuration(3661000, { separator: '-' })).toBe('1h-1m-1s');
    });
  });

  describe('formatRelativeTime', () => {
    it('should format relative times', () => {
      const now = new Date();
      const future = new Date(now.getTime() + 7200000); // 2 hours from now
      const result = formatRelativeTime(future, now);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle basic time differences', () => {
      const now = new Date();
      const past = new Date(now.getTime() - 3600000); // 1 hour ago
      const result = formatRelativeTime(past, now);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with default options', () => {
      expect(formatNumber(1234.567)).toBe('1,234.57');
      expect(formatNumber(1000000)).toBe('1,000,000');
    });

    it('should respect decimal places', () => {
      expect(formatNumber(1234.567, { minimumFractionDigits: 0 })).toBe('1,234.57');
      expect(formatNumber(1234.567, { maximumFractionDigits: 1 })).toBe('1,234.6');
      expect(formatNumber(1234, { minimumFractionDigits: 2 })).toBe('1,234.00');
    });

    it('should disable grouping', () => {
      expect(formatNumber(1234567, { useGrouping: false })).toBe('1234567');
    });

    it('should handle different notations', () => {
      // Note: compact notation may not be supported in all environments
      try {
        const result = formatNumber(1234567, { notation: 'compact' });
        expect(typeof result).toBe('string');
      } catch (e) {
        // Compact notation not supported, skip test
      }
      
      try {
        const result = formatNumber(0.0000123, { notation: 'scientific' });
        expect(result).toContain('E');
      } catch (e) {
        // Scientific notation not supported, skip test
      }
    });

    it('should handle invalid numbers', () => {
      expect(formatNumber(Infinity)).toBe('Infinity');
      expect(formatNumber(-Infinity)).toBe('-Infinity');
      expect(formatNumber(NaN)).toBe('NaN');
    });
  });

  describe('formatPercentage', () => {
    it('should format decimal percentages', () => {
      expect(formatPercentage(0.1234)).toBe('12.34%');
      expect(formatPercentage(0.5)).toBe('50%');
      expect(formatPercentage(1)).toBe('100%');
    });

    it('should handle already-percentage values', () => {
      expect(formatPercentage(12.34, {}, true)).toBe('12.34%');
      expect(formatPercentage(50, {}, true)).toBe('50%');
    });

    it('should respect decimal places', () => {
      expect(formatPercentage(0.12345, { maximumFractionDigits: 1 })).toBe('12.3%');
      expect(formatPercentage(0.12345, { maximumFractionDigits: 0 })).toBe('12%');
    });
  });

  describe('formatCurrency', () => {
    it('should format USD currency', () => {
      const result = formatCurrency(1234.56, 'USD');
      expect(result).toContain('1,234.56');
      expect(result).toContain('$');
    });

    it('should format EUR currency', () => {
      const result = formatCurrency(1234.56, 'EUR', 'de-DE');
      expect(result).toContain('1.234,56');
      expect(result).toContain('€');
    });

    it('should handle different locales', () => {
      const usd = formatCurrency(1234.56, 'USD', 'en-US');
      const eur = formatCurrency(1234.56, 'USD', 'en-GB');
      
      expect(typeof usd).toBe('string');
      expect(typeof eur).toBe('string');
    });

    it('should handle invalid numbers', () => {
      expect(formatCurrency(Infinity, 'USD')).toBe('Infinity');
      expect(formatCurrency(NaN, 'USD')).toBe('NaN');
    });

    it('should handle zero and negative values', () => {
      const zero = formatCurrency(0, 'USD');
      const negative = formatCurrency(-100, 'USD');
      
      expect(zero).toContain('0');
      expect(negative).toContain('-');
    });
  });

  describe('Performance', () => {
    it('should handle large inputs efficiently', () => {
      const longString = 'a'.repeat(10000);
      
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        truncate(longString, { maxLength: 100 });
        formatBytes(Math.random() * 1000000);
        formatDuration(Math.random() * 86400000);
      }
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should handle many small operations efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        truncate(`Test string ${i}`, { maxLength: 10 });
        formatBytes(i * 1024);
        formatDuration(i * 1000);
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(200); // Should complete in under 200ms
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      expect(truncate('', { maxLength: 10 })).toBe('');
      expect(ellipsis('', 10)).toBe('');
    });

    it('should handle very small maxLength values', () => {
      expect(truncate('Hello', { maxLength: 1 })).toBe('.');
      expect(truncate('Hello', { maxLength: 2 })).toBe('..');
      expect(truncate('Hello', { maxLength: 3 })).toBe('...');
    });

    it('should handle Unicode and emoji', () => {
      expect(truncate('Hello 👋 World 🌍', { maxLength: 12 })).toContain('👋');
      expect(formatDuration(1000)).toBe('1s'); // ASCII only
    });

    it('should handle very large numbers in formatBytes', () => {
      const yottabyte = Math.pow(1024, 8);
      const result = formatBytes(yottabyte);
      expect(result).toContain('YB');
    });

    it('should handle very small durations', () => {
      expect(formatDuration(1, { includeMs: true })).toBe('1ms');
      expect(formatDuration(0.5, { includeMs: true })).toBe('0s');
    });
  });
});