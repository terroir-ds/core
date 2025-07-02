/**
 * @module test/utils/guards/integration
 * 
 * Integration tests for the guards module
 * 
 * Tests integration scenarios including:
 * - Cross-module functionality (guards + assertions + validation)
 * - Real-world use cases and workflows
 * - Performance with complex validation chains
 * - TypeScript type narrowing in realistic scenarios
 * - Error handling and recovery patterns
 * - Compatibility with existing error system
 * - Memory usage and cleanup
 */

import { describe, it, expect } from 'vitest';
import {
  // Type guards
  isString,
  isNumber,
  isObject,
  isArray,
  isDefined,
  isPlainObject,
  
  // Assertions
  assert,
  assertDefined,
  assertType,
  assertProperties,
  AssertionError,
  
  // Validation
  validateEmail,
  validatePhone,
  validatePassword,
  validateSchema,
  type ValidationResult,
  
  // Predicates
  isPositive,
  hasMinLength,
  hasProperties,
  and,
  createValidator,
} from '@utils/guards';

import { ValidationError } from '@utils/errors/base-error';

describe('Guards Integration Tests', () => {
  describe('User Registration Workflow', () => {
    interface UserRegistration {
      email: string;
      password: string;
      profile: {
        firstName: string;
        lastName: string;
        age: number;
        phone?: string;
      };
      preferences: {
        newsletter: boolean;
        theme: 'light' | 'dark';
      };
    }

    function validateUserRegistration(data: unknown): ValidationResult<UserRegistration> {
      // First, use type guards to check basic structure
      if (!isPlainObject(data)) {
        return {
          valid: false,
          errors: [new ValidationError('Registration data must be an object')],
          input: data
        };
      }

      // Use assertions for required structure
      try {
        assertProperties(data, ['email', 'password', 'profile', 'preferences']);
        const typedData = data as {
          email: unknown;
          password: unknown;
          profile: unknown;
          preferences: unknown;
        };
        assertType(typedData.email, 'string');
        assertType(typedData.password, 'string');
        assertType(typedData.profile, 'object');
        assertType(typedData.preferences, 'object');
        
        const profile = typedData.profile as Record<string, unknown>;
        assertProperties(profile, ['firstName', 'lastName', 'age']);
        assertType(profile.firstName, 'string');
        assertType(profile.lastName, 'string');
        assertType(profile.age, 'number');
        
        const preferences = typedData.preferences as Record<string, unknown>;
        assertProperties(preferences, ['newsletter', 'theme']);
        assertType(preferences.newsletter, 'boolean');
        assertType(preferences.theme, 'string');
      } catch (error) {
        return {
          valid: false,
          errors: [error as ValidationError],
          input: data
        };
      }

      // Use detailed validation for specific fields
      const errors: ValidationError[] = [];
      const typedData = data as {
        email: string;
        password: string;
        profile: {
          firstName: string;
          lastName: string;
          age: number;
        };
        preferences: {
          newsletter: boolean;
          theme: string;
        };
      };
      const profile = typedData.profile;
      const preferences = typedData.preferences;

      // Email validation
      const emailResult = validateEmail(typedData.email);
      if (!emailResult.valid) {
        errors.push(...(emailResult.errors || []));
      }

      // Password validation
      const passwordResult = validatePassword(typedData.password, {
        minLength: 8,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialChars: true
      });
      if (!passwordResult.valid) {
        errors.push(...(passwordResult.errors || []));
      }

      // Profile validation using predicates
      const isValidName = and(isString, hasMinLength(2));
      const isValidAge = and(isNumber, isPositive, (age: number) => age >= 13 && age <= 120);

      if (!isValidName(profile.firstName)) {
        errors.push(new ValidationError('First name must be at least 2 characters'));
      }
      if (!isValidName(profile.lastName)) {
        errors.push(new ValidationError('Last name must be at least 2 characters'));
      }
      if (!isValidAge(profile.age)) {
        errors.push(new ValidationError('Age must be between 13 and 120'));
      }

      // Optional phone validation
      if (isDefined(profile.phone)) {
        const phoneResult = validatePhone(profile.phone);
        if (!phoneResult.valid) {
          errors.push(...(phoneResult.errors || []));
        }
      }

      // Theme validation
      if (!['light', 'dark'].includes(preferences.theme)) {
        errors.push(new ValidationError('Theme must be light or dark'));
      }

      if (errors.length > 0) {
        return { valid: false, errors, input: data };
      }

      return { valid: true, value: typedData as UserRegistration, input: data };
    }

    it('should validate complete user registration', () => {
      const validRegistration = {
        email: 'user@example.com',
        password: 'SecurePass123!',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          age: 30,
          phone: '+1234567890'
        },
        preferences: {
          newsletter: true,
          theme: 'dark' as const
        }
      };

      const result = validateUserRegistration(validRegistration);
      expect(result.valid).toBe(true);
      expect(result.value).toEqual(validRegistration);
      expect(result.errors).toBeUndefined();
    });

    it('should handle missing required fields', () => {
      const incompleteRegistration = {
        email: 'user@example.com',
        // Missing password, profile, preferences
      };

      const result = validateUserRegistration(incompleteRegistration);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors?.[0]).toBeInstanceOf(AssertionError);
    });

    it('should validate individual field errors', () => {
      const invalidRegistration = {
        email: 'invalid-email',
        password: 'weak',
        profile: {
          firstName: 'A', // Too short
          lastName: 'Doe',
          age: -5, // Invalid age
          phone: 'invalid-phone'
        },
        preferences: {
          newsletter: true,
          theme: 'invalid-theme'
        }
      };

      const result = validateUserRegistration(invalidRegistration);
      expect(result.valid).toBe(false);
      expect(result.errors?.length).toBeGreaterThan(4); // Multiple validation errors
      
      // Check that we get specific error types
      const errorCodes = result.errors?.map(e => e.code) || [];
      expect(errorCodes).toContain('EMAIL_INVALID_FORMAT');
      expect(errorCodes).toContain('PASSWORD_TOO_SHORT');
    });

    it('should handle optional fields correctly', () => {
      const registrationWithoutPhone = {
        email: 'user@example.com',
        password: 'SecurePass123!',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          age: 30
          // No phone number
        },
        preferences: {
          newsletter: false,
          theme: 'light' as const
        }
      };

      const result = validateUserRegistration(registrationWithoutPhone);
      expect(result.valid).toBe(true);
    });
  });

  describe('API Data Processing Pipeline', () => {
    interface ApiResponse {
      data: Array<{
        id: number;
        name: string;
        email: string;
        status: 'active' | 'inactive' | 'pending';
        metadata: {
          lastLogin?: string;
          preferences: Record<string, unknown>;
        };
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
      };
    }

    function processApiResponse(response: unknown): ApiResponse {
      // Type checking with guards
      assertType(response, 'object', 'API response must be an object');
      assertProperties(response as Record<string, unknown>, ['data', 'pagination']);
      
      const typedResponse = response as {
        data: unknown;
        pagination: unknown;
      };
      
      // Validate data array
      assertType(typedResponse.data, 'object');
      assert(isArray(typedResponse.data), 'Data must be an array');
      
      // Validate each item in data array
      const processedData = typedResponse.data.map((item: unknown, index: number) => {
        try {
          assertType(item, 'object', `Item ${index} must be an object`);
          assertProperties(item as Record<string, unknown>, ['id', 'name', 'email', 'status', 'metadata']);
          
          const typedItem = item as {
            id: number;
            name: string;
            email: string;
            status: 'active' | 'inactive' | 'pending';
            metadata: {
              lastLogin?: string;
              preferences: Record<string, unknown>;
            };
          };
          
          // Validate individual fields
          assertType(typedItem.id, 'number');
          assert(isPositive(typedItem.id), `Item ${index} ID must be positive`);
          
          assertType(typedItem.name, 'string');
          assert(hasMinLength(1)(typedItem.name), `Item ${index} name cannot be empty`);
          
          // Validate email
          const emailResult = validateEmail(typedItem.email);
          assert(emailResult.valid, `Item ${index} has invalid email: ${typedItem.email}`);
          
          // Validate status
          const validStatuses = ['active', 'inactive', 'pending'];
          assert(validStatuses.includes(typedItem.status), 
                `Item ${index} has invalid status: ${typedItem.status}`);
          
          // Validate metadata
          assertType(typedItem.metadata, 'object');
          assertProperties(typedItem.metadata, ['preferences']);
          assertType(typedItem.metadata.preferences, 'object');
          
          return typedItem;
        } catch (error) {
          throw new ValidationError(`Validation failed for item ${index}`, {
            cause: error,
            context: { index, item }
          });
        }
      });
      
      // Validate pagination
      assertType(typedResponse.pagination, 'object');
      assertProperties(typedResponse.pagination, ['page', 'limit', 'total']);
      
      const pagination = typedResponse.pagination;
      assertType(pagination.page, 'number');
      assertType(pagination.limit, 'number');
      assertType(pagination.total, 'number');
      
      assert(isPositive(pagination.page), 'Page must be positive');
      assert(isPositive(pagination.limit), 'Limit must be positive');
      assert(pagination.total >= 0, 'Total must be non-negative');
      
      return {
        data: processedData,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total
        }
      };
    }

    it('should process valid API response', () => {
      const validResponse = {
        data: [
          {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            status: 'active',
            metadata: {
              lastLogin: '2023-01-01T00:00:00Z',
              preferences: { theme: 'dark', notifications: true }
            }
          },
          {
            id: 2,
            name: 'Jane Smith',
            email: 'jane@example.com',
            status: 'pending',
            metadata: {
              preferences: { theme: 'light' }
            }
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2
        }
      };

      const result = processApiResponse(validResponse);
      expect(result.data).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
    });

    it('should handle malformed API response', () => {
      const invalidResponse = {
        data: [
          {
            id: -1, // Invalid ID
            name: '', // Empty name
            email: 'invalid-email',
            status: 'unknown', // Invalid status
            metadata: {
              preferences: 'not-an-object' // Invalid preferences
            }
          }
        ],
        pagination: {
          page: 0, // Invalid page
          limit: -5, // Invalid limit
          total: -1 // Invalid total
        }
      };

      expect(() => processApiResponse(invalidResponse)).toThrow(ValidationError);
    });

    it('should provide detailed error context', () => {
      const responseWithBadItem = {
        data: [
          {
            id: 1,
            name: 'Valid User',
            email: 'valid@example.com',
            status: 'active',
            metadata: { preferences: {} }
          },
          {
            id: 'invalid', // Should be number
            name: 'Invalid User',
            email: 'invalid@example.com',
            status: 'active',
            metadata: { preferences: {} }
          }
        ],
        pagination: { page: 1, limit: 10, total: 2 }
      };

      try {
        processApiResponse(responseWithBadItem);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain('item 1');
        expect((error as ValidationError).context).toHaveProperty('index', 1);
      }
    });
  });

  describe('Form Validation Integration', () => {
    const createFormValidator = (schema: Record<string, (value: unknown) => ValidationResult>) => {
      return (formData: Record<string, unknown>) => {
        const result = validateSchema(formData, schema);
        return {
          isValid: result.valid,
          errors: result.fieldErrors || {},
          values: result.value
        };
      };
    };

    it('should validate complex forms with nested validation', () => {
      const userFormSchema = {
        personalInfo: (value: unknown) => {
          const nestedSchema = {
            firstName: createValidator(
              and(isString, hasMinLength(2)),
              'First name must be at least 2 characters'
            ),
            lastName: createValidator(
              and(isString, hasMinLength(2)),
              'Last name must be at least 2 characters'
            ),
            age: createValidator(
              and(isNumber, (n: unknown) => isPositive(n as number), (n: unknown) => (n as number) >= 18),
              'Must be 18 or older'
            )
          };
          return validateSchema(value, nestedSchema);
        },
        contact: (value: unknown) => {
          const nestedSchema = {
            email: validateEmail,
            phone: validatePhone
          };
          return validateSchema(value, nestedSchema);
        },
        security: (value: unknown) => {
          const nestedSchema = {
            password: (pwd: unknown) => validatePassword(pwd, {
              minLength: 8,
              requireUppercase: true,
              requireNumbers: true
            }),
            confirmPassword: createValidator(
              isString,
              'Password confirmation is required'
            )
          };
          return validateSchema(value, nestedSchema);
        }
      };

      const validator = createFormValidator(userFormSchema);

      const validForm = {
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
          age: 30
        },
        contact: {
          email: 'john@example.com',
          phone: '+1234567890'
        },
        security: {
          password: 'SecurePass123',
          confirmPassword: 'SecurePass123'
        }
      };

      const result = validator(validForm);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should handle field-level validation errors', () => {
      const simpleSchema = {
        username: createValidator(
          and(isString, hasMinLength(3)),
          'Username must be at least 3 characters'
        ),
        email: validateEmail,
        age: createValidator(
          and(isNumber, isPositive),
          'Age must be a positive number'
        )
      };

      const validator = createFormValidator(simpleSchema);

      const invalidForm = {
        username: 'ab', // Too short
        email: 'invalid-email',
        age: -5 // Negative
      };

      const result = validator(invalidForm);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty('username');
      expect(result.errors).toHaveProperty('email');
      expect(result.errors).toHaveProperty('age');
    });
  });

  describe('Performance Integration Tests', () => {
    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 50000 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        age: 18 + (i % 50),
        active: i % 3 !== 0,
        roles: ['user', 'admin', 'moderator'].slice(0, (i % 3) + 1)
      }));

      // Create complex validation chain
      const isValidUser = and(
        hasProperties(['id', 'name', 'email', 'age', 'active', 'roles']),
        (user: unknown) => {
          const u = user as {
            id: number;
            name: string;
            email: string;
            age: number;
            active: boolean;
            roles: unknown[];
          };
          return isPositive(u.id) &&
                 hasMinLength(3)(u.name) &&
                 validateEmail(u.email).valid &&
                 isPositive(u.age) &&
                 u.age <= 120 &&
                 typeof u.active === 'boolean' &&
                 isArray(u.roles) &&
                 u.roles.length > 0;
        }
      );

      const start = performance.now();
      const validUsers = largeDataset.filter(isValidUser);
      const end = performance.now();

      expect(validUsers.length).toBeGreaterThan(0);
      expect(end - start).toBeLessThan(500); // Should complete in reasonable time
    });

    it('should optimize validation chains', () => {
      // Test that early failures short-circuit expensive operations
      let expensiveCallCount = 0;
      
      const expensiveValidation = (value: unknown) => {
        expensiveCallCount++;
        return validateEmail((value as { email?: string }).email || '').valid;
      };

      const optimizedValidator = and(
        isObject, // Fast check first
        hasProperties(['email']), // Medium check
        expensiveValidation // Expensive check last
      );

      const testData = [
        'not an object', // Should fail first check
        { notEmail: 'test' }, // Should fail second check
        { email: 'invalid' }, // Should reach third check
        { email: 'valid@example.com' } // Should reach third check
      ];

      testData.forEach(data => {
        try {
          optimizedValidator(data);
        } catch {
          // Ignore errors, we're testing performance
        }
      });

      expect(expensiveCallCount).toBe(2); // Only called for last two items
    });
  });

  describe('Error Integration Tests', () => {
    it('should integrate with existing error system', () => {
      try {
        assertDefined(null, 'Required value is missing');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error).toBeInstanceOf(AssertionError);
        
        // Should have all BaseError properties
        const assertionError = error as AssertionError;
        expect(assertionError.errorId).toBeDefined();
        expect(assertionError.timestamp).toBeDefined();
        expect(assertionError.code).toBe('VALUE_UNDEFINED');
        expect(assertionError.category).toBeDefined();
        expect(assertionError.severity).toBeDefined();
      }
    });

    it('should provide consistent error serialization', () => {
      const errors: ValidationError[] = [];

      // Collect different types of validation errors
      try {
        assertType(123, 'string');
      } catch (error) {
        errors.push(error as ValidationError);
      }

      const emailResult = validateEmail('invalid');
      if (!emailResult.valid) {
        errors.push(...(emailResult.errors || []));
      }

      const passwordResult = validatePassword('weak');
      if (!passwordResult.valid) {
        errors.push(...(passwordResult.errors || []));
      }

      // All errors should serialize consistently
      errors.forEach(error => {
        const serialized = error.toJSON();
        expect(serialized).toHaveProperty('errorId');
        expect(serialized).toHaveProperty('timestamp');
        expect(serialized).toHaveProperty('code');
        expect(serialized).toHaveProperty('message');
        expect(serialized).toHaveProperty('category');
        expect(serialized).toHaveProperty('severity');

        const publicJson = error.toPublicJSON();
        expect(publicJson).not.toHaveProperty('stack');
        expect(publicJson).not.toHaveProperty('context');
      });
    });
  });

  describe('TypeScript Integration', () => {
    it('should provide proper type narrowing in real scenarios', () => {
      function processUserData(data: unknown): string {
        // Type guard chain
        if (!isObject(data)) {
          return 'Data must be an object';
        }

        assertProperties(data, ['user' as keyof typeof data, 'settings' as keyof typeof data]);
        const typedData = data as { user: unknown; settings: unknown };

        // Nested type checking
        if (!isObject(typedData.user)) {
          return 'User must be an object';
        }

        assertProperties(typedData.user as Record<string, unknown>, ['name', 'email']);
        const user = typedData.user as { name: unknown; email: unknown };

        if (!isString(user.name)) {
          return 'Name must be a string';
        }

        if (!isString(user.email)) {
          return 'Email must be a string';
        }

        // TypeScript should know these are strings now
        return `User: ${user.name.toUpperCase()} (${user.email.toLowerCase()})`;
      }

      const validData = {
        user: {
          name: 'John Doe',
          email: 'JOHN@EXAMPLE.COM'
        },
        settings: {}
      };

      const result = processUserData(validData);
      expect(result).toBe('User: JOHN DOE (john@example.com)');
    });

    it('should work with generic validation functions', () => {
      function validateAndTransform<T>(
        data: unknown,
        validator: (value: unknown) => ValidationResult<T>,
        transformer: (value: T) => T
      ): T {
        const result = validator(data);
        
        if (!result.valid) {
          throw new ValidationError('Validation failed', {
            cause: result.errors?.[0]
          });
        }

        assertDefined(result.value, 'Validated value should be defined');
        return transformer(result.value);
      }

      const emailValidator = (value: unknown) => validateEmail(value);
      const emailTransformer = (email: string) => email.toLowerCase();

      const result = validateAndTransform(
        'USER@EXAMPLE.COM',
        emailValidator,
        emailTransformer
      );

      expect(result).toBe('user@example.com');
    });
  });
});