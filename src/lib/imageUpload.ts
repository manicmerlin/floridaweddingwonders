// Image upload utilities

export interface ImageFile {
  file: File;
  preview: string;
  id: string;
}

export interface ImageUploadOptions {
  maxSize?: number; // in bytes
  maxWidth?: number;
  maxHeight?: number;
  allowedTypes?: string[];
  quality?: number; // 0-1 for compression
}

const DEFAULT_OPTIONS: Required<ImageUploadOptions> = {
  maxSize: 10 * 1024 * 1024, // 10MB
  maxWidth: 2048,
  maxHeight: 2048,
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  quality: 0.8
};

export class ImageUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageUploadError';
  }
}

export function validateImage(file: File, options: ImageUploadOptions = {}): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Check file type
  if (!opts.allowedTypes.includes(file.type)) {
    throw new ImageUploadError(
      `Invalid file type. Allowed types: ${opts.allowedTypes.join(', ')}`
    );
  }

  // Check file size
  if (file.size > opts.maxSize) {
    throw new ImageUploadError(
      `File too large. Maximum size: ${(opts.maxSize / (1024 * 1024)).toFixed(1)}MB`
    );
  }
}

export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function resizeImage(
  file: File, 
  maxWidth: number, 
  maxHeight: number, 
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;
        
        if (width > height) {
          width = maxWidth;
          height = width / aspectRatio;
        } else {
          height = maxHeight;
          width = height * aspectRatio;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export async function processImage(
  file: File, 
  options: ImageUploadOptions = {}
): Promise<{ originalFile: File; processedBlob?: Blob; preview: string }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Validate the image
  validateImage(file, opts);
  
  // Create preview
  const preview = await createImagePreview(file);
  
  // Check if we need to resize
  const img = new Image();
  const needsResize = await new Promise<boolean>((resolve) => {
    img.onload = () => {
      resolve(img.width > opts.maxWidth || img.height > opts.maxHeight);
    };
    img.src = preview;
  });

  let processedBlob: Blob | undefined;
  
  if (needsResize) {
    processedBlob = await resizeImage(file, opts.maxWidth, opts.maxHeight, opts.quality);
  }

  return {
    originalFile: file,
    processedBlob,
    preview
  };
}

export function generateImageId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

// Simulate upload to cloud storage (replace with actual implementation)
export async function uploadToCloudStorage(
  blob: Blob, 
  venueId: string, 
  imageId: string
): Promise<string> {
  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // In a real implementation, you would upload to AWS S3, Cloudinary, etc.
  // For development, use local URLs; for production, use your CDN domain
  const timestamp = Date.now();
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    // Create a local blob URL for development
    return URL.createObjectURL(blob);
  } else {
    // Production URL structure
    return `https://images.sofloweddingvenues.com/venues/${venueId}/${imageId}_${timestamp}.jpg`;
  }
}

export class ImageUploadManager {
  private venueId: string;
  private options: Required<ImageUploadOptions>;

  constructor(venueId: string, options: ImageUploadOptions = {}) {
    this.venueId = venueId;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async uploadImages(files: File[]): Promise<{
    successful: Array<{ id: string; url: string; originalName: string }>;
    failed: Array<{ file: File; error: string }>;
  }> {
    const successful: Array<{ id: string; url: string; originalName: string }> = [];
    const failed: Array<{ file: File; error: string }> = [];

    for (const file of files) {
      try {
        const imageId = generateImageId();
        const { processedBlob } = await processImage(file, this.options);
        
        // Upload the processed image (or original if no processing needed)
        const blobToUpload = processedBlob || file;
        const url = await uploadToCloudStorage(blobToUpload, this.venueId, imageId);
        
        successful.push({
          id: imageId,
          url,
          originalName: file.name
        });
      } catch (error) {
        failed.push({
          file,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { successful, failed };
  }
}
