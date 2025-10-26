/**
 * Input Validation & Sanitization
 * 
 * Uses Zod for type-safe validation and provides sanitization utilities
 * to prevent XSS, SQL injection, and other security vulnerabilities.
 */

import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Contact form validation
 */
export const ContactFormSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  email: z.string()
    .email('Invalid email address')
    .toLowerCase(),
  phone: z.string()
    .regex(/^[\d\s\-\(\)\+]+$/, 'Invalid phone number format')
    .optional(),
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be less than 1000 characters')
    .trim(),
  venueName: z.string()
    .min(2, 'Venue name must be at least 2 characters')
    .max(200, 'Venue name must be less than 200 characters')
    .trim()
    .optional(),
});

export type ContactFormData = z.infer<typeof ContactFormSchema>;

/**
 * Email subscription validation
 */
export const EmailSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .toLowerCase(),
  type: z.enum(['regular_user', 'venue_owner']),
  venueName: z.string()
    .min(2)
    .max(200)
    .trim()
    .optional(),
});

export type EmailData = z.infer<typeof EmailSchema>;

/**
 * Venue claim request validation
 */
export const VenueClaimSchema = z.object({
  venueId: z.string().uuid('Invalid venue ID'),
  ownerName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  ownerEmail: z.string()
    .email('Invalid email address')
    .toLowerCase(),
  ownerPhone: z.string()
    .regex(/^[\d\s\-\(\)\+]+$/, 'Invalid phone number format'),
  businessRole: z.string()
    .min(2, 'Role must be at least 2 characters')
    .max(100, 'Role must be less than 100 characters')
    .trim(),
  verificationMethod: z.enum(['business_email', 'business_documents', 'phone_verification']),
  additionalNotes: z.string()
    .max(500, 'Notes must be less than 500 characters')
    .trim()
    .optional(),
});

export type VenueClaimData = z.infer<typeof VenueClaimSchema>;

/**
 * Venue update validation
 */
export const VenueUpdateSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name must be less than 200 characters')
    .trim()
    .optional(),
  description: z.string()
    .min(50, 'Description must be at least 50 characters')
    .max(2000, 'Description must be less than 2000 characters')
    .trim()
    .optional(),
  address: z.string()
    .min(5, 'Address must be at least 5 characters')
    .max(300, 'Address must be less than 300 characters')
    .trim()
    .optional(),
  phone: z.string()
    .regex(/^[\d\s\-\(\)\+]+$/, 'Invalid phone number format')
    .optional(),
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .optional(),
  website: z.string()
    .url('Invalid website URL')
    .optional()
    .or(z.literal('')),
  capacity: z.number()
    .int('Capacity must be a whole number')
    .min(1, 'Capacity must be at least 1')
    .max(10000, 'Capacity must be less than 10,000')
    .optional(),
  price_range: z.enum(['$', '$$', '$$$', '$$$$'])
    .optional(),
  amenities: z.array(z.string().max(50))
    .max(50, 'Too many amenities')
    .optional(),
});

export type VenueUpdateData = z.infer<typeof VenueUpdateSchema>;

/**
 * Review submission validation
 */
export const ReviewSchema = z.object({
  venueId: z.string().uuid('Invalid venue ID'),
  rating: z.number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters')
    .trim(),
  content: z.string()
    .min(20, 'Review must be at least 20 characters')
    .max(1000, 'Review must be less than 1000 characters')
    .trim(),
  eventType: z.enum(['wedding', 'reception', 'ceremony', 'rehearsal_dinner', 'other'])
    .optional(),
  eventDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)')
    .optional(),
});

export type ReviewData = z.infer<typeof ReviewSchema>;

/**
 * Photo upload validation
 */
export const PhotoUploadSchema = z.object({
  venueId: z.string().uuid('Invalid venue ID'),
  caption: z.string()
    .max(200, 'Caption must be less than 200 characters')
    .trim()
    .optional(),
  category: z.enum(['exterior', 'interior', 'ceremony', 'reception', 'details', 'other'])
    .optional(),
  isPrimary: z.boolean().optional(),
});

export type PhotoUploadData = z.infer<typeof PhotoUploadSchema>;

/**
 * Search query validation
 */
export const SearchQuerySchema = z.object({
  query: z.string()
    .max(200, 'Search query too long')
    .trim()
    .optional(),
  location: z.string()
    .max(100, 'Location query too long')
    .trim()
    .optional(),
  capacity: z.number()
    .int()
    .min(1)
    .max(10000)
    .optional(),
  priceRange: z.enum(['$', '$$', '$$$', '$$$$'])
    .optional(),
  amenities: z.array(z.string().max(50))
    .max(20)
    .optional(),
  venueType: z.string()
    .max(50)
    .trim()
    .optional(),
});

export type SearchQueryData = z.infer<typeof SearchQuerySchema>;

// ============================================================================
// SANITIZATION UTILITIES
// ============================================================================

/**
 * Sanitize HTML to prevent XSS attacks
 * Escapes dangerous characters that could be used for script injection
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize user input for display
 * Removes potentially dangerous characters while preserving readability
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Sanitize filename for safe storage
 * Removes special characters and limits length
 */
export function sanitizeFilename(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
  
  const sanitized = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-') // Replace special chars with dash
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .replace(/^-|-$/g, '') // Remove leading/trailing dashes
    .substring(0, 100); // Limit length
  
  return extension ? `${sanitized}.${extension}` : sanitized;
}

/**
 * Sanitize URL to prevent injection
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    
    return parsed.toString();
  } catch {
    return '';
  }
}

/**
 * Validate and sanitize phone number
 */
export function sanitizePhoneNumber(phone: string): string {
  // Remove all non-numeric characters except + - ( ) and spaces
  return phone.replace(/[^\d\s\-\(\)\+]/g, '').trim();
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

// ============================================================================
// FILE VALIDATION
// ============================================================================

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate uploaded file
 */
export function validateFile(file: File): FileValidationResult {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type. Only JPEG, PNG, and WebP images are allowed. Got: ${file.type}`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB. Got: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  // Check filename
  if (file.name.length > 255) {
    return {
      isValid: false,
      error: 'Filename is too long',
    };
  }

  return { isValid: true };
}

/**
 * Validate multiple files
 */
export function validateFiles(files: File[], maxFiles: number = 10): FileValidationResult {
  if (files.length > maxFiles) {
    return {
      isValid: false,
      error: `Too many files. Maximum ${maxFiles} files allowed.`,
    };
  }

  for (const file of files) {
    const result = validateFile(file);
    if (!result.isValid) {
      return result;
    }
  }

  return { isValid: true };
}

// ============================================================================
// PASSWORD VALIDATION
// ============================================================================

export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
};

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`);
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (PASSWORD_REQUIREMENTS.requireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// GENERIC VALIDATION HELPER
// ============================================================================

/**
 * Generic validation helper with error handling
 */
export async function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; errors: string[] }> {
  try {
    const validData = await schema.parseAsync(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
      };
    }
    return {
      success: false,
      errors: ['Validation failed'],
    };
  }
}
