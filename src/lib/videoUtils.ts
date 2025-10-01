// Video processing utilities

export interface VideoFile {
  file: File;
  preview: string;
  thumbnail: string;
  duration: number;
  id: string;
}

export interface VideoProcessingOptions {
  thumbnailTime?: number; // Time in seconds to capture thumbnail (default: 1)
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  thumbnailQuality?: number; // 0-1
}

const DEFAULT_VIDEO_OPTIONS: Required<VideoProcessingOptions> = {
  thumbnailTime: 1, // Capture at 1 second
  thumbnailWidth: 400,
  thumbnailHeight: 300,
  thumbnailQuality: 0.8
};

export class VideoProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VideoProcessingError';
  }
}

export function validateVideo(file: File): void {
  const allowedTypes = [
    'video/mp4',
    'video/webm', 
    'video/mov',
    'video/quicktime',
    'video/avi',
    'video/x-msvideo'
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new VideoProcessingError(
      `Invalid video type. Allowed types: ${allowedTypes.join(', ')}`
    );
  }

  // Check file size (100MB limit)
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    throw new VideoProcessingError(
      `Video file too large. Maximum size: ${(maxSize / (1024 * 1024)).toFixed(0)}MB`
    );
  }
}

export function generateVideoThumbnail(
  file: File,
  options: VideoProcessingOptions = {}
): Promise<{ thumbnail: string; duration: number; preview: string }> {
  const opts = { ...DEFAULT_VIDEO_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new VideoProcessingError('Canvas context not available'));
      return;
    }

    // Create object URL for video preview
    const preview = URL.createObjectURL(file);
    video.src = preview;
    video.preload = 'metadata';
    video.muted = true; // Required for autoplay in some browsers

    video.addEventListener('loadedmetadata', () => {
      const duration = video.duration;
      
      // Set canvas dimensions
      canvas.width = opts.thumbnailWidth;
      canvas.height = opts.thumbnailHeight;

      // Seek to the specified time (or 1 second, whichever is smaller)
      const seekTime = Math.min(opts.thumbnailTime, duration - 0.1);
      video.currentTime = seekTime;
    });

    video.addEventListener('seeked', () => {
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob and then to data URL
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                thumbnail: reader.result as string,
                duration: video.duration,
                preview
              });
            };
            reader.onerror = () => reject(new VideoProcessingError('Failed to read thumbnail'));
            reader.readAsDataURL(blob);
          } else {
            reject(new VideoProcessingError('Failed to generate thumbnail'));
          }
        },
        'image/jpeg',
        opts.thumbnailQuality
      );
    });

    video.addEventListener('error', () => {
      reject(new VideoProcessingError('Failed to load video for thumbnail generation'));
    });

    // Handle videos shorter than thumbnailTime
    video.addEventListener('loadeddata', () => {
      if (video.duration < opts.thumbnailTime) {
        video.currentTime = 0.1; // Use a frame near the beginning
      }
    });
  });
}

export async function processVideo(
  file: File,
  options: VideoProcessingOptions = {}
): Promise<VideoFile> {
  // Validate the video file
  validateVideo(file);
  
  // Generate thumbnail and get metadata
  const { thumbnail, duration, preview } = await generateVideoThumbnail(file, options);
  
  return {
    file,
    preview,
    thumbnail,
    duration,
    id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function getVideoMimeType(file: File): string {
  // Return a web-compatible video format
  if (file.type === 'video/quicktime' || file.type === 'video/mov') {
    return 'video/mp4'; // Convert MOV to MP4 for web compatibility
  }
  return file.type;
}

export async function generateVideoPreview(file: File): Promise<string> {
  return URL.createObjectURL(file);
}

// Utility to determine if a file is a video
export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/');
}

// Utility to determine if a file is an image
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

// Mixed media processing
export async function processMediaFile(
  file: File,
  videoOptions: VideoProcessingOptions = {}
): Promise<{ type: 'image' | 'video'; data: any }> {
  if (isVideoFile(file)) {
    const videoData = await processVideo(file, videoOptions);
    return { type: 'video', data: videoData };
  } else if (isImageFile(file)) {
    // Import the existing image processing function
    const { processImage } = await import('./imageUpload');
    const imageData = await processImage(file);
    return { type: 'image', data: imageData };
  } else {
    throw new VideoProcessingError('Unsupported file type. Please upload images or videos only.');
  }
}
