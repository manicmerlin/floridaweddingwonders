# Security Hardening Guide - Florida Wedding Wonders

## 🛡️ Comprehensive Security Implementation

### 1. API Route Protection

#### Rate Limiting
Prevent abuse of API endpoints by limiting requests per IP address.

**Install dependencies:**
```bash
npm install express-rate-limit
```

**Create rate limiter middleware:**
```typescript
// src/middleware/rateLimiter.ts
import { NextRequest, NextResponse } from 'next/server';

const rateLimit = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  request: NextRequest,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  const now = Date.now();
  const userLimit = rateLimit.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (userLimit.count >= maxRequests) {
    return false;
  }

  userLimit.count++;
  return true;
}
```

#### API Key Validation for Admin Routes
```typescript
// src/middleware/apiKeyAuth.ts
import { NextRequest, NextResponse } from 'next/server';

export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const validKey = process.env.INTERNAL_API_KEY;
  
  if (!apiKey || !validKey) return false;
  return apiKey === validKey;
}
```

### 2. Content Security Policy (CSP)

Add CSP headers to prevent XSS attacks.

**Update next.config.js:**
```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel-insights.com *.googletagmanager.com;
      style-src 'self' 'unsafe-inline' fonts.googleapis.com;
      img-src 'self' data: https: blob:;
      font-src 'self' fonts.gstatic.com;
      connect-src 'self' *.supabase.co *.resend.com *.vercel.com;
      frame-ancestors 'self';
    `.replace(/\\s{2,}/g, ' ').trim()
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

### 3. Input Validation & Sanitization

**Install validation library:**
```bash
npm install zod
```

**Example validation schema:**
```typescript
// src/lib/validation.ts
import { z } from 'zod';

export const ContactFormSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email(),
  phone: z.string().regex(/^[\\d\\s\\-\\(\\)\\+]+$/).optional(),
  message: z.string().min(10).max(1000).trim(),
  venueName: z.string().min(2).max(200).trim().optional(),
});

export const EmailSchema = z.object({
  email: z.string().email().toLowerCase(),
  type: z.enum(['regular_user', 'venue_owner']),
  venueName: z.string().optional(),
});

// Sanitize HTML to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\\//g, '&#x2F;');
}
```

### 4. Database Security (Supabase RLS)

**Enhanced Row Level Security policies:**

```sql
-- Only allow venue owners to modify their own venues
CREATE POLICY "venue_owners_update_own_venue"
ON venues FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM venue_owners 
    WHERE venue_id = venues.id
  )
);

-- Only allow authenticated users to read analytics for their venues
CREATE POLICY "venue_owners_read_own_analytics"
ON venue_analytics FOR SELECT
USING (
  venue_id IN (
    SELECT venue_id FROM venue_owners 
    WHERE user_id = auth.uid()
  )
);

-- Prevent users from deleting other users' favorites
CREATE POLICY "users_delete_own_favorites"
ON user_favorites FOR DELETE
USING (auth.uid() = user_id);
```

### 5. Authentication Hardening

**JWT Token Validation:**
```typescript
// src/lib/authValidation.ts
import { supabase } from './supabase';

export async function validateSession(token: string) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new Error('Invalid session');
    }
    
    return user;
  } catch (error) {
    return null;
  }
}

// Check if session is expired
export function isSessionExpired(expiresAt: number): boolean {
  return Date.now() / 1000 > expiresAt;
}
```

**Password Requirements:**
```typescript
// src/lib/passwordValidation.ts
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
};

export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(\`Password must be at least \${PASSWORD_REQUIREMENTS.minLength} characters\`);
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireNumber && !/\\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (PASSWORD_REQUIREMENTS.requireSpecialChar && !/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

### 6. CORS Configuration

```typescript
// src/middleware/cors.ts
import { NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  'https://floridaweddingwonders.com',
  'https://www.floridaweddingwonders.com',
  'https://staging.floridaweddingwonders.com',
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '',
].filter(Boolean);

export function corsHeaders(origin: string | null) {
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    'Access-Control-Max-Age': '86400',
  };
}
```

### 7. File Upload Security

```typescript
// src/lib/fileValidation.ts
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function validateFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: \`File size must be less than \${MAX_FILE_SIZE / 1024 / 1024}MB\`,
    };
  }

  return { isValid: true };
}

// Sanitize filename
export function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);
}
```

### 8. Logging & Monitoring

```typescript
// src/lib/securityLogger.ts
import { supabase } from './supabase';

export interface SecurityEvent {
  event_type: 'failed_login' | 'suspicious_activity' | 'rate_limit_exceeded' | 'unauthorized_access';
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  details: Record<string, any>;
}

export async function logSecurityEvent(event: SecurityEvent) {
  try {
    await supabase.from('security_logs').insert({
      ...event,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

// Create security_logs table
/*
CREATE TABLE security_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_security_logs_timestamp ON security_logs(timestamp DESC);
CREATE INDEX idx_security_logs_event_type ON security_logs(event_type);
*/
```

### 9. Environment Variable Validation

```typescript
// src/lib/envValidation.ts
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().startsWith('re_'),
  DATABASE_PASSWORD: z.string().min(8),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

export function validateEnv() {
  try {
    envSchema.parse(process.env);
    console.log('✅ Environment variables validated successfully');
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    throw new Error('Invalid environment configuration');
  }
}
```

### 10. Git Security

**Create .gitattributes to prevent sensitive files:**
```bash
# .gitattributes
*.env* filter=git-crypt diff=git-crypt
*.key filter=git-crypt diff=git-crypt
secrets/** filter=git-crypt diff=git-crypt
```

**Pre-commit hook to check for secrets:**
```bash
# .husky/pre-commit
#!/bin/sh

echo "Checking for exposed secrets..."

# Check for common secret patterns
if git diff --cached --name-only | xargs grep -E "(password|api_key|secret|token).*=.*['\"]\\w+" 2>/dev/null; then
  echo "❌ Potential secret detected in staged files!"
  echo "Please remove sensitive data before committing."
  exit 1
fi

# Check for .env files
if git diff --cached --name-only | grep -E "\\.env\\.(production|staging)" 2>/dev/null; then
  echo "❌ .env file detected in staged files!"
  echo "Environment files should not be committed."
  exit 1
fi

echo "✅ No secrets detected"
```

### 11. Supabase Security Settings

**Enable these in Supabase Dashboard:**

1. **Email Auth Settings:**
   - ✅ Enable email confirmation
   - ✅ Secure password recovery
   - ✅ Email rate limiting
   - ✅ CAPTCHA on signup

2. **JWT Settings:**
   - Set JWT expiry: 3600 seconds (1 hour)
   - Enable refresh token rotation
   - Set refresh token expiry: 2592000 seconds (30 days)

3. **API Settings:**
   - Enable API rate limiting
   - Set max payload size: 2MB
   - Enable request logging

### 12. Vercel Security Settings

**Configure in Vercel Dashboard:**

1. **Environment Variables:**
   - Use different keys for Preview/Production
   - Enable "Sensitive" flag on all secrets
   - Rotate keys every 90 days

2. **Deployment Protection:**
   - Enable Vercel Authentication for preview deployments
   - Require team approval for production deploys
   - Enable branch protection on main/master

3. **Security Headers:**
   - Already configured in next.config.js above

### 13. Regular Security Audits

**Monthly checklist:**
```bash
# 1. Check for dependency vulnerabilities
npm audit

# 2. Update dependencies
npm update

# 3. Run security-specific audits
npm audit fix

# 4. Check for outdated packages
npm outdated

# 5. Scan for secrets in codebase
git secrets --scan
```

## 🚀 Implementation Priority

### Immediate (Do Today):
1. ✅ Hide API keys from Git (DONE)
2. ⬜ Add Content Security Policy headers
3. ⬜ Enable Supabase RLS policies
4. ⬜ Add input validation to forms

### Short-term (This Week):
5. ⬜ Implement rate limiting on API routes
6. ⬜ Add file upload validation
7. ⬜ Set up security logging
8. ⬜ Configure CORS properly

### Medium-term (This Month):
9. ⬜ Add password strength requirements
10. ⬜ Implement pre-commit hooks
11. ⬜ Set up monitoring/alerting
12. ⬜ Regular security audits

### Long-term (Ongoing):
13. ⬜ Penetration testing
14. ⬜ Security training for team
15. ⬜ Compliance audits (GDPR, etc.)
16. ⬜ Bug bounty program

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/pages/building-your-application/configuring/content-security-policy)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [Vercel Security](https://vercel.com/docs/security)

---

**Remember**: Security is not a one-time task, it's an ongoing process! 🔒
