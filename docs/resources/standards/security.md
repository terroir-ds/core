# Security Standards

## Overview

Security best practices for the Terroir Core Design System.

## Dependency Security

### Regular Audits

```bash
# Check for vulnerabilities
pnpm audit

# Fix automatically where possible
pnpm audit --fix

# Check specific package
pnpm why package-name
```

### Dependency Updates

1. **Regular Updates**: Weekly for patches, monthly for minor
2. **Test Thoroughly**: Run full test suite after updates
3. **Review Changes**: Check changelogs for breaking changes
4. **Lock Versions**: Use exact versions for critical deps

## Secret Management

### Never Commit Secrets

```typescript
// ❌ NEVER hardcode secrets
const API_KEY = 'sk-1234567890abcdef';

// ✅ Use environment variables
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new ConfigError('API_KEY not configured');
}
```

### Environment Files

```bash
# .env.example (commit this)
API_KEY=your-api-key-here
DATABASE_URL=postgresql://localhost/mydb

# .env (never commit - in .gitignore)
API_KEY=sk-real-secret-key
DATABASE_URL=postgresql://prod-server/proddb
```

### Git Secrets Protection

```bash
# Install git-secrets
brew install git-secrets

# Set up for repo
git secrets --install
git secrets --register-aws

# Add custom patterns
git secrets --add 'sk-[a-zA-Z0-9]{32}'
```

## Input Validation

### Always Validate User Input

```typescript
import { z } from 'zod';
import { ValidationError } from '@utils/errors';

const EmailSchema = z.string().email();

export function validateEmail(input: unknown): string {
  try {
    return EmailSchema.parse(input);
  } catch (error) {
    throw new ValidationError('Invalid email format', {
      code: 'INVALID_EMAIL',
      cause: error
    });
  }
}
```

### Sanitize Output

```typescript
// For HTML output
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href']
  });
}

// For SQL (use parameterized queries)
// ❌ NEVER concatenate
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ Use parameters
const query = 'SELECT * FROM users WHERE id = $1';
const result = await db.query(query, [userId]);
```

## Authentication & Authorization

### Token Security

```typescript
// Use secure token generation
import { randomBytes } from 'crypto';

export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

// Set proper expiration
const TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour
```

### Password Handling

```typescript
// ❌ NEVER store plain passwords
const user = { password: userInput.password };

// ✅ Use proper hashing
import bcrypt from 'bcrypt';

const hashedPassword = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(password, hashedPassword);
```

## Secure Communication

### HTTPS Only

```text
// Enforce HTTPS in production
if (process.env.NODE_ENV === 'production' && !req.secure) {
  return res.redirect(`https://${req.headers.host}${req.url}`);
}
```

### CORS Configuration

```typescript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
  credentials: true,
  optionsSuccessStatus: 200
};
```

## Security Headers

```typescript
// Use helmet for Express apps
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

## Logging Security

### Never Log Sensitive Data

```yaml
// ❌ DON'T log sensitive info
logger.info({
  user: fullUserObject,
  password: req.body.password,
  token: authToken
});

// ✅ DO log safely
logger.info({
  userId: user.id,
  action: 'login',
  ip: req.ip
});
```

### Redact Sensitive Fields

Our logger automatically redacts:

- `password`, `pass`, `pwd`
- `token`, `auth`, `authorization`
- `secret`, `apiKey`, `api_key`
- `creditCard`, `ssn`

## Error Handling Security

### Don't Leak Information

```yaml
// ❌ DON'T expose internals
catch (error) {
  res.status(500).json({
    error: error.stack,
    query: sqlQuery
  });
}

// ✅ DO sanitize errors
catch (error) {
  logger.error({ err: error }, 'Database error');
  res.status(500).json({
    error: 'Internal server error',
    id: generateErrorId()
  });
}
```

## Regular Security Tasks

1. **Weekly**: Run `pnpm audit`
2. **Monthly**: Review dependencies
3. **Quarterly**: Security assessment
4. **On PR**: Check for secrets
5. **On Deploy**: Verify env vars

## Security Tools

- `pnpm audit` - Vulnerability scanning
- `git-secrets` - Prevent secret commits
- `helmet` - Security headers
- `bcrypt` - Password hashing
- `zod` - Input validation
- `DOMPurify` - XSS prevention
