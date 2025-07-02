/**
 * @module @utils/string/formatting
 * 
 * String formatting utilities for text manipulation and display.
 * 
 * Provides utilities for truncating, formatting bytes/durations, and
 * other common string operations. All functions are pure and have
 * no side effects.
 * 
 * @example
 * ```typescript
 * import { truncate, formatBytes, formatDuration } from '@utils/string/formatting';
 * 
 * // Truncate long text
 * truncate('This is a very long string', { maxLength: 10 });
 * // 'This is...'
 * 
 * // Format file sizes
 * formatBytes(1536); // '1.5 KB'
 * formatBytes(1073741824); // '1 GB'
 * 
 * // Format durations
 * formatDuration(65000); // '1m 5s'
 * formatDuration(3661000); // '1h 1m 1s'
 * ```
 */

// =============================================================================
// TRUNCATION
// =============================================================================

/**
 * Options for string truncation.
 */
export interface TruncateOptions {
  /** Maximum length of the resulting string */
  maxLength: number;
  /** String to append when truncated. Default: '...' */
  ellipsis?: string;
  /** Break at word boundaries. Default: true */
  breakWords?: boolean;
  /** Position to truncate from: 'end', 'middle', 'start'. Default: 'end' */
  position?: 'end' | 'middle' | 'start';
}

/**
 * Truncates a string to a specified length.
 * 
 * @param str - String to truncate
 * @param options - Truncation options
 * @returns Truncated string
 * 
 * @example
 * ```typescript
 * truncate('Hello world', { maxLength: 8 }); // 'Hello...'
 * truncate('Hello world', { maxLength: 8, ellipsis: '…' }); // 'Hello w…'
 * truncate('Hello world', { maxLength: 8, position: 'middle' }); // 'Hel...ld'
 * ```
 */
export function truncate(str: string, options: TruncateOptions): string {
  const {
    maxLength,
    ellipsis = '...',
    breakWords = true,
    position = 'end'
  } = options;

  if (!str || str.length <= maxLength) {
    return str;
  }

  if (maxLength <= 0) {
    return '';
  }

  const ellipsisLength = ellipsis.length;
  
  // If maxLength is too small to fit ellipsis, return truncated ellipsis
  if (maxLength <= ellipsisLength) {
    return ellipsis.substring(0, maxLength);
  }

  const targetLength = maxLength - ellipsisLength;

  switch (position) {
    case 'start':
      return ellipsis + str.substring(str.length - targetLength);
    
    case 'middle': {
      const halfLength = Math.floor(targetLength / 2);
      const start = str.substring(0, halfLength);
      const end = str.substring(str.length - (targetLength - halfLength));
      return start + ellipsis + end;
    }
    
    case 'end':
    default: {
      let truncated = str.substring(0, targetLength);
      
      // Break at word boundary if requested
      if (breakWords) {
        const lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > 0 && lastSpace > targetLength * 0.5) {
          truncated = truncated.substring(0, lastSpace);
        }
      }
      
      return truncated + ellipsis;
    }
  }
}

/**
 * Adds ellipsis to a string if it exceeds maxLength.
 * Convenience wrapper around truncate.
 * 
 * @param str - String to add ellipsis to
 * @param maxLength - Maximum length before adding ellipsis
 * @param ellipsis - Ellipsis string. Default: '...'
 * @returns String with ellipsis if needed
 * 
 * @example
 * ```typescript
 * ellipsis('Short', 10); // 'Short'
 * ellipsis('This is too long', 10); // 'This is...'
 * ```
 */
export function ellipsis(str: string, maxLength: number, ellipsis = '...'): string {
  return truncate(str, { maxLength, ellipsis });
}

// =============================================================================
// BYTE FORMATTING
// =============================================================================

/**
 * Options for byte formatting.
 */
export interface FormatBytesOptions {
  /** Number of decimal places. Default: 2 */
  decimals?: number;
  /** Use binary units (1024) instead of decimal (1000). Default: true */
  binary?: boolean;
  /** Minimum unit to display. Default: 'B' */
  minUnit?: 'B' | 'KB' | 'MB' | 'GB' | 'TB' | 'PB';
  /** Locale for number formatting. Default: 'en-US' */
  locale?: string;
}

/**
 * Formats bytes into human-readable strings.
 * 
 * @param bytes - Number of bytes
 * @param options - Formatting options
 * @returns Formatted string
 * 
 * @example
 * ```typescript
 * formatBytes(0); // '0 B'
 * formatBytes(1024); // '1 KB'
 * formatBytes(1536); // '1.5 KB'
 * formatBytes(1073741824); // '1 GB'
 * formatBytes(1000, { binary: false }); // '1 KB' (decimal)
 * ```
 */
export function formatBytes(bytes: number, options: FormatBytesOptions = {}): string {
  const {
    decimals = 2,
    binary = true,
    minUnit = 'B',
    locale = 'en-US'
  } = options;

  if (bytes === 0) return '0 B';
  if (!isFinite(bytes)) return 'Invalid size';

  const k = binary ? 1024 : 1000;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  // Find minimum unit index
  const minUnitIndex = sizes.indexOf(minUnit);
  if (minUnitIndex === -1) {
    throw new Error(`Invalid minUnit: ${minUnit}`);
  }

  const sign = bytes < 0 ? '-' : '';
  const absBytes = Math.abs(bytes);
  
  let i = Math.floor(Math.log(absBytes) / Math.log(k));
  i = Math.max(i, minUnitIndex);
  i = Math.min(i, sizes.length - 1);

  const value = absBytes / Math.pow(k, i);
  const formatted = value.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });

  return `${sign}${formatted} ${sizes[i]}`;
}

// =============================================================================
// DURATION FORMATTING
// =============================================================================

/**
 * Options for duration formatting.
 */
export interface FormatDurationOptions {
  /** Include milliseconds. Default: false */
  includeMs?: boolean;
  /** Compact format (1h2m3s vs 1 hour, 2 minutes, 3 seconds). Default: true */
  compact?: boolean;
  /** Maximum number of units to show. Default: 3 */
  maxUnits?: number;
  /** Separator between units. Default: ' ' */
  separator?: string;
  /** Locale for pluralization. Default: 'en-US' */
  locale?: string;
}

/**
 * Formats milliseconds into human-readable duration strings.
 * 
 * @param ms - Duration in milliseconds
 * @param options - Formatting options
 * @returns Formatted duration string
 * 
 * @example
 * ```typescript
 * formatDuration(1000); // '1s'
 * formatDuration(65000); // '1m 5s'
 * formatDuration(3661000); // '1h 1m 1s'
 * formatDuration(86400000); // '1d'
 * formatDuration(65500, { includeMs: true }); // '1m 5s 500ms'
 * formatDuration(3661000, { compact: false }); // '1 hour, 1 minute, 1 second'
 * ```
 */
export function formatDuration(ms: number, options: FormatDurationOptions = {}): string {
  const {
    includeMs = false,
    compact = true,
    maxUnits = 3,
    separator = ' '
  } = options;

  if (!isFinite(ms)) {
    return 'Invalid duration';
  }

  const units = [
    { label: 'd', labelLong: 'day', ms: 86400000 },
    { label: 'h', labelLong: 'hour', ms: 3600000 },
    { label: 'm', labelLong: 'minute', ms: 60000 },
    { label: 's', labelLong: 'second', ms: 1000 },
    ...(includeMs ? [{ label: 'ms', labelLong: 'millisecond', ms: 1 }] : [])
  ];

  const parts: string[] = [];
  let remaining = Math.abs(ms);

  for (const unit of units) {
    const value = Math.floor(remaining / unit.ms);
    if (value > 0) {
      remaining %= unit.ms;
      
      if (compact) {
        parts.push(`${value}${unit.label}`);
      } else {
        const label = value === 1 ? unit.labelLong : `${unit.labelLong}s`;
        parts.push(`${value} ${label}`);
      }
      
      if (parts.length >= maxUnits) {
        break;
      }
    }
  }

  if (parts.length === 0) {
    return compact ? '0s' : '0 seconds';
  }

  const sign = ms < 0 ? '-' : '';
  const formatted = parts.join(compact ? separator : ', ');
  
  return sign + formatted;
}

// =============================================================================
// RELATIVE TIME FORMATTING
// =============================================================================

/**
 * Options for relative time formatting.
 */
export interface FormatRelativeTimeOptions {
  /** Locale for formatting. Default: 'en-US' */
  locale?: string;
  /** Style: 'long', 'short', 'narrow'. Default: 'long' */
  style?: 'long' | 'short' | 'narrow';
  /** Numeric formatting: 'always', 'auto'. Default: 'auto' */
  numeric?: 'always' | 'auto';
}

/**
 * Formats a date as relative time (e.g., "2 hours ago", "in 3 days").
 * 
 * @param date - Date to format
 * @param baseDate - Base date for comparison. Default: now
 * @param options - Formatting options
 * @returns Formatted relative time string
 * 
 * @example
 * ```typescript
 * const yesterday = new Date(Date.now() - 86400000);
 * formatRelativeTime(yesterday); // 'yesterday' or '1 day ago'
 * 
 * const inTwoHours = new Date(Date.now() + 7200000);
 * formatRelativeTime(inTwoHours); // 'in 2 hours'
 * ```
 */
export function formatRelativeTime(
  date: Date,
  baseDate: Date = new Date(),
  options: FormatRelativeTimeOptions = {}
): string {
  const {
    locale = 'en-US',
    style = 'long',
    numeric = 'auto'
  } = options;

  const diffMs = date.getTime() - baseDate.getTime();
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  // Use Intl.RelativeTimeFormat if available
  if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
    const rtf = new Intl.RelativeTimeFormat(locale, { style, numeric });
    
    if (Math.abs(years) >= 1) {
      return rtf.format(years, 'year');
    } else if (Math.abs(months) >= 1) {
      return rtf.format(months, 'month');
    } else if (Math.abs(days) >= 1) {
      return rtf.format(days, 'day');
    } else if (Math.abs(hours) >= 1) {
      return rtf.format(hours, 'hour');
    } else if (Math.abs(minutes) >= 1) {
      return rtf.format(minutes, 'minute');
    } else {
      return rtf.format(seconds, 'second');
    }
  }

  // Fallback for environments without Intl.RelativeTimeFormat
  if (years !== 0) {
    return years > 0 ? `in ${Math.abs(years)} year${Math.abs(years) !== 1 ? 's' : ''}` 
                     : `${Math.abs(years)} year${Math.abs(years) !== 1 ? 's' : ''} ago`;
  } else if (months !== 0) {
    return months > 0 ? `in ${Math.abs(months)} month${Math.abs(months) !== 1 ? 's' : ''}` 
                      : `${Math.abs(months)} month${Math.abs(months) !== 1 ? 's' : ''} ago`;
  } else if (days !== 0) {
    return days > 0 ? `in ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''}` 
                    : `${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago`;
  } else if (hours !== 0) {
    return hours > 0 ? `in ${Math.abs(hours)} hour${Math.abs(hours) !== 1 ? 's' : ''}` 
                     : `${Math.abs(hours)} hour${Math.abs(hours) !== 1 ? 's' : ''} ago`;
  } else if (minutes !== 0) {
    return minutes > 0 ? `in ${Math.abs(minutes)} minute${Math.abs(minutes) !== 1 ? 's' : ''}` 
                       : `${Math.abs(minutes)} minute${Math.abs(minutes) !== 1 ? 's' : ''} ago`;
  } else {
    return seconds >= 0 ? 'just now' : `${Math.abs(seconds)} second${Math.abs(seconds) !== 1 ? 's' : ''} ago`;
  }
}

// =============================================================================
// NUMBER FORMATTING
// =============================================================================

/**
 * Options for number formatting.
 */
export interface FormatNumberOptions {
  /** Locale for formatting. Default: 'en-US' */
  locale?: string;
  /** Minimum fraction digits. Default: 0 */
  minimumFractionDigits?: number;
  /** Maximum fraction digits. Default: 2 */
  maximumFractionDigits?: number;
  /** Use grouping separators. Default: true */
  useGrouping?: boolean;
  /** Notation: 'standard', 'scientific', 'engineering', 'compact'. Default: 'standard' */
  notation?: 'standard' | 'scientific' | 'engineering' | 'compact';
}

/**
 * Formats a number with locale-aware formatting.
 * 
 * @param value - Number to format
 * @param options - Formatting options
 * @returns Formatted number string
 * 
 * @example
 * ```typescript
 * formatNumber(1234.567); // '1,234.57'
 * formatNumber(1234567, { notation: 'compact' }); // '1.2M'
 * formatNumber(0.0000123, { notation: 'scientific' }); // '1.23E-5'
 * ```
 */
export function formatNumber(value: number, options: FormatNumberOptions = {}): string {
  const {
    locale = 'en-US',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    useGrouping = true,
    notation = 'standard'
  } = options;

  if (!isFinite(value)) {
    return value.toString();
  }

  return value.toLocaleString(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping,
    notation: notation as Intl.NumberFormatOptions['notation']
  });
}

/**
 * Formats a number as a percentage.
 * 
 * @param value - Number to format (0-1 for percentage, or already multiplied by 100)
 * @param options - Formatting options
 * @param alreadyPercentage - Whether the value is already multiplied by 100. Default: false
 * @returns Formatted percentage string
 * 
 * @example
 * ```typescript
 * formatPercentage(0.1234); // '12.34%'
 * formatPercentage(12.34, {}, true); // '12.34%'
 * formatPercentage(0.1234, { maximumFractionDigits: 0 }); // '12%'
 * ```
 */
export function formatPercentage(
  value: number, 
  options: FormatNumberOptions = {},
  alreadyPercentage = false
): string {
  const percentValue = alreadyPercentage ? value : value * 100;
  const formatted = formatNumber(percentValue, {
    maximumFractionDigits: 2,
    ...options
  });
  
  return `${formatted}%`;
}

/**
 * Formats a number as currency.
 * 
 * @param value - Number to format
 * @param currency - Currency code (e.g., 'USD', 'EUR')
 * @param locale - Locale for formatting. Default: 'en-US'
 * @returns Formatted currency string
 * 
 * @example
 * ```typescript
 * formatCurrency(1234.56, 'USD'); // '$1,234.56'
 * formatCurrency(1234.56, 'EUR', 'de-DE'); // '1.234,56 €'
 * ```
 */
export function formatCurrency(value: number, currency: string, locale = 'en-US'): string {
  if (!isFinite(value)) {
    return value.toString();
  }

  return value.toLocaleString(locale, {
    style: 'currency',
    currency
  });
}