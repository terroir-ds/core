# Security Policy

## Supported Versions

The following versions of Terroir Core are currently being supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## Reporting a Vulnerability

The Terroir Core team takes security bugs seriously. We appreciate your efforts to responsibly disclose your findings, and will make every effort to acknowledge your contributions.

### How to Report

To report a security vulnerability, please follow these steps:

1. **DO NOT** create a public GitHub issue for the vulnerability.
2. Email your findings to `security@terroir-ds.dev` (or create a private security advisory on GitHub).
3. Include the following information:
   - Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
   - Full paths of source file(s) related to the manifestation of the issue
   - The location of the affected source code (tag/branch/commit or direct URL)
   - Any special configuration required to reproduce the issue
   - Step-by-step instructions to reproduce the issue
   - Proof-of-concept or exploit code (if possible)
   - Impact of the issue, including how an attacker might exploit the issue

### What to Expect

- You will receive a response acknowledging your email within 48 hours.
- We will provide an estimated timeline for addressing the vulnerability.
- We will notify you when the vulnerability is fixed.
- We will publicly acknowledge your responsible disclosure, unless you prefer to remain anonymous.

### Security Update Process

1. The reported vulnerability is assigned a severity level.
2. A fix is developed and tested.
3. A new version is released with the security fix.
4. The vulnerability is disclosed in the release notes after users have had time to update.

## Security Best Practices

When using Terroir Core in your projects:

1. **Keep Dependencies Updated**: Regularly update to the latest version of Terroir Core.
2. **Review Security Advisories**: Monitor our GitHub repository for security advisories.
3. **Validate Inputs**: Always validate and sanitize user inputs in your applications.
4. **Use Environment Variables**: Never hardcode sensitive information in your code.
5. **Enable CSP**: Use Content Security Policy headers when serving Terroir Core assets.

## Known Security Considerations

### SVG Injection

When using dynamic SVG token replacement, ensure that:

- Token values are properly sanitized
- User-provided content is never directly inserted into SVG templates
- CSP headers are configured to prevent inline script execution

### Color Input Validation

When accepting color values from users:

- Validate color formats before processing
- Use the built-in color validation utilities
- Sanitize color values before use in CSS

## Contact

For any security-related questions that don't need to be private, you can:

- Open a discussion in our GitHub repository
- Tag your issue with the `security` label (for non-sensitive issues only)

Thank you for helping keep Terroir Core and its users safe!
