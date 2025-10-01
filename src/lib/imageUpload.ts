// Image and video upload utilities

import { isVideoFile, processVideo, VideoProcessingError } from './videoUtils';

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
  maxSize: 10 * 1024 * 1024, // 10MB for images
  maxWidth: 2048,
  maxHeight: 2048,
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  quality: 0.8
};

// Video upload options
export interface VideoUploadOptions {
  maxSize?: number; // in bytes  
  allowedTypes?: string[];
}

const DEFAULT_VIDEO_OPTIONS: Required<VideoUploadOptions> = {
  maxSize: 100 * 1024 * 1024, // 100MB for videos
  allowedTypes: ['video/mp4', 'video/webm', 'video/mov', 'video/quicktime', 'video/avi', 'video/x-msvideo']
};

export class ImageUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageUploadError';
  }
}

export function validateFile(file: File, options: ImageUploadOptions | VideoUploadOptions = {}): void {
  if (isVideoFile(file)) {
    const videoOpts = { ...DEFAULT_VIDEO_OPTIONS, ...options } as Required<VideoUploadOptions>;
    
    // Check file type
    if (!videoOpts.allowedTypes.includes(file.type)) {
      throw new ImageUploadError(
        `Invalid video type. Allowed types: ${videoOpts.allowedTypes.join(', ')}`
      );
    }

    // Check file size
    if (file.size > videoOpts.maxSize) {
      throw new ImageUploadError(
        `Video file too large. Maximum size: ${(videoOpts.maxSize / (1024 * 1024)).toFixed(0)}MB`
      );
    }
  } else {
    // Handle as image
    const imageOpts = { ...DEFAULT_OPTIONS, ...options } as Required<ImageUploadOptions>;
    
    // Check file type
    if (!imageOpts.allowedTypes.includes(file.type)) {
      throw new ImageUploadError(
        `Invalid image type. Allowed types: ${imageOpts.allowedTypes.join(', ')}`
      );
    }

    // Check file size
    if (file.size > imageOpts.maxSize) {
      throw new ImageUploadError(
        `Image file too large. Maximum size: ${(imageOpts.maxSize / (1024 * 1024)).toFixed(1)}MB`
      );
    }
  }
}

// Legacy function for backward compatibility
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
  try {
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // In a real implementation, you would upload to AWS S3, Cloudinary, etc.
    // For development, use local URLs; for production, use your CDN domain
    const timestamp = Date.now();
    const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    
    if (isDevelopment) {
      // Create a local blob URL for development
      const url = URL.createObjectURL(blob);
      console.log('✅ Image uploaded successfully (development mode):', url);
      return url;
    } else {
      // Production URL structure
      const url = `https://images.sofloweddingvenues.com/venues/${venueId}/${imageId}_${timestamp}.jpg`;
      console.log('✅ Image uploaded successfully (production):', url);
      return url;
    }
  } catch (error) {
    console.error('❌ Upload to cloud storage failed:', error);
    throw new ImageUploadError('Failed to upload image to storage');
  }
}

// Mixed media upload manager
export class MediaUploadManager {
  private venueId: string;
  private imageOptions: Required<ImageUploadOptions>;
  private videoOptions: Required<VideoUploadOptions>;

  constructor(
    venueId: string, 
    imageOptions: ImageUploadOptions = {},
    videoOptions: VideoUploadOptions = {}
  ) {
    this.venueId = venueId;
    this.imageOptions = { ...DEFAULT_OPTIONS, ...imageOptions };
    this.videoOptions = { ...DEFAULT_VIDEO_OPTIONS, ...videoOptions };
  }

  async uploadFiles(files: File[]): Promise<{
    successful: Array<{ id: string; url: string; originalName: string; type: 'image' | 'video'; thumbnailUrl?: string }>;
    failed: Array<{ file: File; error: string }>;
  }> {
    const successful: Array<{ id: string; url: string; originalName: string; type: 'image' | 'video'; thumbnailUrl?: string }> = [];
    const failed: Array<{ file: File; error: string }> = [];

    for (const file of files) {
      try {
        const fileId = generateImageId();
        
        if (isVideoFile(file)) {
          // Process video and generate thumbnail
          const videoData = await processVideo(file);
          
          // Upload video file
          const videoUrl = await uploadToCloudStorage(file, this.venueId, fileId);
          
          // Upload thumbnail separately (optional, could be generated on-demand)
          // const thumbnailBlob = await fetch(videoData.thumbnail).then(r => r.blob());
          // const thumbnailUrl = await uploadToCloudStorage(thumbnailBlob, this.venueId, `${fileId}_thumb`);
          
          successful.push({
            id: fileId,
            url: videoUrl,
            originalName: file.name,
            type: 'video',
            thumbnailUrl: videoData.thumbnail // Using data URL for now
          });
        } else {
          // Process image
          const { processedBlob, originalFile } = await processImage(file, this.imageOptions);
          
          // Upload the processed image (or original if no processing needed)
          // Important: Use the original file if no processing was done to preserve quality
          const blobToUpload = processedBlob || originalFile;
          
          console.log('📤 Uploading image:', file.name, 'Size:', blobToUpload.size, 'bytes');
          const url = await uploadToCloudStorage(blobToUpload, this.venueId, fileId);
          console.log('✅ Upload successful, URL:', url);
          
          successful.push({
            id: fileId,
            url,
            originalName: file.name,
            type: 'image'
          });
        }
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

// Legacy class for backward compatibility
export class ImageUploadManager extends MediaUploadManager {
  constructor(venueId: string, options: ImageUploadOptions = {}) {
    super(venueId, options, {});
  }

  async uploadImages(files: File[]): Promise<{
    successful: Array<{ id: string; url: string; originalName: string }>;
    failed: Array<{ file: File; error: string }>;
  }> {
    const result = await this.uploadFiles(files);
    return {
      successful: result.successful.map(({ id, url, originalName }) => ({ id, url, originalName })),
      failed: result.failed
    };
  }
}
