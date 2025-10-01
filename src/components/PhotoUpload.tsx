'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { ImageUploadManager, processImage, ImageUploadError } from '@/lib/imageUpload';
import { processVideo, VideoProcessingError, isVideoFile, isImageFile, formatDuration } from '@/lib/videoUtils';
import { VenueMedia } from '@/types';

interface MediaFile {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  type: 'image' | 'video';
  file?: File;
  thumbnailUrl?: string;
  duration?: number;
}

interface PhotoUploadProps {
  venueId: string;
  existingMedia?: MediaFile[];
  onMediaUpdate: (media: MediaFile[]) => void;
  maxFiles?: number;
  isPremium?: boolean;
}

interface UploadProgress {
  current: number;
  total: number;
  fileName?: string;
}

export default function PhotoUpload({ 
  venueId, 
  existingMedia = [], 
  onMediaUpdate, 
  maxFiles = 20,
  isPremium = false
}: PhotoUploadProps) {
  // Set file limit based on premium status
  const fileLimit = isPremium ? maxFiles : 3; // Increased from 2 to 3 for free users to allow 1 video
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(existingMedia);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    const newFiles = Array.from(files);
    const remainingSlots = fileLimit - mediaFiles.length;
    
    if (newFiles.length > remainingSlots) {
      const message = isPremium 
        ? `You can only upload ${remainingSlots} more files. Maximum of ${fileLimit} files allowed.`
        : `You can only upload ${remainingSlots} more files. Free users are limited to 3 files (photos + videos). Upgrade to Premium for unlimited uploads!`;
      alert(message);
      return;
    }

    console.log('📁 Processing', newFiles.length, 'file(s)...');

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      console.log(`📁 Processing file ${i + 1}/${newFiles.length}:`, file.name, file.type, file.size, 'bytes');
      
      try {
        if (isImageFile(file)) {
          console.log('🖼️  Processing as image...');
          // Process image
          const { preview } = await processImage(file, {
            maxSize: 10 * 1024 * 1024, // 10MB
            maxWidth: 2048,
            maxHeight: 2048,
            quality: 0.8
          });

          const newMediaFile: MediaFile = {
            id: `temp-${Date.now()}-${Math.random()}`,
            url: preview,
            alt: file.name.replace(/\.[^/.]+$/, ""),
            isPrimary: mediaFiles.length === 0 && i === 0,
            type: 'image',
            file: file
          };
          
          console.log('✅ Image processed successfully:', newMediaFile.id);
          
          setMediaFiles(prev => {
            const updated = [...prev, newMediaFile];
            onMediaUpdate(updated);
            return updated;
          });

        } else if (isVideoFile(file)) {
          console.log('🎥 Processing as video...');
          // Process video
          const videoData = await processVideo(file);

          const newMediaFile: MediaFile = {
            id: `temp-${Date.now()}-${Math.random()}`,
            url: videoData.preview,
            thumbnailUrl: videoData.thumbnail,
            alt: file.name.replace(/\.[^/.]+$/, ""),
            isPrimary: mediaFiles.length === 0 && i === 0,
            type: 'video',
            duration: videoData.duration,
            file: file
          };
          
          console.log('✅ Video processed successfully:', newMediaFile.id);
          
          setMediaFiles(prev => {
            const updated = [...prev, newMediaFile];
            onMediaUpdate(updated);
            return updated;
          });

        } else {
          throw new Error('Unsupported file type. Please upload images or videos only.');
        }
      } catch (error) {
        console.error('❌ Error processing file:', file.name, error);
        if (error instanceof ImageUploadError || error instanceof VideoProcessingError) {
          alert(`❌ Error processing ${file.name}: ${error.message}`);
        } else if (error instanceof Error) {
          alert(`❌ Failed to process ${file.name}: ${error.message}`);
        } else {
          alert(`❌ Failed to process ${file.name}. Please try again.`);
        }
      }
    }
    
    console.log('✅ All files processed');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const removeMedia = (mediaId: string) => {
    setMediaFiles(prev => {
      const updated = prev.filter(media => media.id !== mediaId);
      // If we removed the primary media, make the first remaining media primary
      if (updated.length > 0 && !updated.some(media => media.isPrimary)) {
        updated[0].isPrimary = true;
      }
      onMediaUpdate(updated);
      return updated;
    });
  };

  const setPrimary = (mediaId: string) => {
    setMediaFiles(prev => {
      const updated = prev.map(media => ({
        ...media,
        isPrimary: media.id === mediaId
      }));
      onMediaUpdate(updated);
      return updated;
    });
  };

  const updateAltText = (mediaId: string, altText: string) => {
    setMediaFiles(prev => {
      const updated = prev.map(media => 
        media.id === mediaId ? { ...media, alt: altText } : media
      );
      onMediaUpdate(updated);
      return updated;
    });
  };

  const uploadMedia = async () => {
    setUploading(true);
    
    try {
      const mediaWithFiles = mediaFiles.filter(media => media.file);
      
      if (mediaWithFiles.length === 0) {
        alert('No files to upload');
        setUploading(false);
        return;
      }

      console.log('📤 Starting upload of', mediaWithFiles.length, 'file(s)...');
      setUploadProgress({ current: 0, total: mediaWithFiles.length });
      
      // In development mode, convert blob URLs to data URLs for persistence
      const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
      
      if (isDevelopment) {
        console.log('🔄 Converting preview blob URLs to data URLs for persistence...');
        
        // Convert each media file's blob URL to a data URL
        for (let i = 0; i < mediaWithFiles.length; i++) {
          const media = mediaWithFiles[i];
          setUploadProgress({ current: i + 1, total: mediaWithFiles.length, fileName: media.file?.name });
          
          try {
            // Fetch the blob from the blob URL
            const response = await fetch(media.url);
            const blob = await response.blob();
            
            // Convert to data URL
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = () => reject(new Error('Failed to read blob'));
              reader.readAsDataURL(blob);
            });
            
            console.log('✅ Converted to data URL:', media.file?.name, 'Size:', dataUrl.length);
            
            // Update the media with data URL
            setMediaFiles(prev => {
              const updated = prev.map(m => 
                m.id === media.id 
                  ? { ...m, url: dataUrl, file: undefined } // Replace with data URL and clear file
                  : m
              );
              onMediaUpdate(updated);
              return updated;
            });
          } catch (error) {
            console.error('❌ Failed to convert', media.file?.name, error);
            throw error;
          }
        }
        
        alert(`✅ Successfully uploaded ${mediaWithFiles.length} file(s)!`);
      } else {
        // Production mode - actual cloud upload
        const filesToUpload = mediaWithFiles.map(media => media.file!);
        const uploadManager = new ImageUploadManager(venueId);
        const { successful, failed } = await uploadManager.uploadImages(filesToUpload);
        
        console.log('✅ Upload complete. Success:', successful.length, 'Failed:', failed.length);
        
        // Update successful uploads with CDN URLs
        setMediaFiles(prev => {
          const updated = prev.map(media => {
            const successfulUpload = successful.find(s => 
              s.originalName === media.file?.name
            );
            
            if (successfulUpload) {
              console.log('✅ Updated media file:', media.file?.name, '→', successfulUpload.url);
              return { 
                ...media, 
                url: successfulUpload.url,
                id: successfulUpload.id,
                file: undefined
              };
            }
            return media;
          });
          
          onMediaUpdate(updated);
          return updated;
        });
        
        // Show results
        if (successful.length > 0) {
          alert(`✅ Successfully uploaded ${successful.length} file(s)!`);
        }
        
        if (failed.length > 0) {
          const failedNames = failed.map(f => f.file.name).join(', ');
          const failedErrors = failed.map(f => `${f.file.name}: ${f.error}`).join('\n');
          console.error('❌ Failed uploads:', failedErrors);
          alert(`❌ Failed to upload: ${failedNames}\n\nErrors:\n${failedErrors}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Upload failed with error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`❌ Upload failed: ${errorMessage}\n\nPlease check the console for more details.`);
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-pink-500 bg-pink-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900">Upload venue photos & videos</p>
            <p className="text-sm text-gray-500">
              Drag and drop files here, or click to select files
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {mediaFiles.length}/{fileLimit} files uploaded
              {!isPremium && (
                <span className="text-amber-600 font-medium ml-2">
                  (Free: 3 files max - Upgrade for more!)
                </span>
              )}
            </p>
          </div>
          <div className="flex justify-center space-x-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition disabled:opacity-50"
              disabled={mediaFiles.length >= fileLimit}
            >
              Select Files
            </button>
            {mediaFiles.some(media => media.file) && (
              <button
                type="button"
                onClick={uploadMedia}
                disabled={uploading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload Files'}
              </button>
            )}
          </div>
          
          {/* Upload Progress */}
          {uploadProgress && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-blue-800">Uploading photos...</span>
                <span className="text-sm text-blue-600">
                  {uploadProgress.current} / {uploadProgress.total}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(uploadProgress.current / uploadProgress.total) * 100}%` 
                  }}
                ></div>
              </div>
              {uploadProgress.fileName && (
                <p className="text-xs text-blue-700 mt-1">
                  Current: {uploadProgress.fileName}
                </p>
              )}
            </div>
          )}
          
          <div>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* Media Grid */}
      {mediaFiles.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Venue Media ({mediaFiles.length}/{fileLimit})
            </h3>
            {!isPremium && mediaFiles.length >= 3 && (
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                🔥 Upgrade to Premium for unlimited uploads!
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mediaFiles.map((media) => (
              <div key={media.id} className="relative group">
                <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden">
                  {media.type === 'video' ? (
                    <>
                      {/* Video Thumbnail */}
                      <Image
                        src={media.thumbnailUrl || media.url}
                        alt={media.alt}
                        fill
                        className="object-cover"
                      />
                      {/* Video Play Indicator */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black bg-opacity-60 rounded-full p-3">
                          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                      {/* Duration Badge */}
                      {media.duration && (
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 text-xs rounded">
                          {formatDuration(media.duration)}
                        </div>
                      )}
                    </>
                  ) : (
                    /* Image */
                    <Image
                      src={media.url}
                      alt={media.alt}
                      fill
                      className="object-cover"
                    />
                  )}
                  
                  {/* Primary Badge */}
                  {media.isPrimary && (
                    <div className="absolute top-2 left-2 bg-pink-600 text-white px-2 py-1 text-xs font-medium rounded">
                      Primary
                    </div>
                  )}
                  
                  {/* Media Type Badge */}
                  <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 text-xs font-medium rounded capitalize">
                    {media.type}
                  </div>
                  
                  {/* Uploading Indicator */}
                  {media.file && (
                    <div className="absolute top-8 right-2 bg-yellow-600 text-white px-2 py-1 text-xs font-medium rounded">
                      Pending Upload
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    {!media.isPrimary && (
                      <button
                        onClick={() => setPrimary(media.id)}
                        className="px-3 py-1 bg-pink-600 text-white text-sm rounded hover:bg-pink-700 transition"
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      onClick={() => removeMedia(media.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                
                {/* Alt Text Input */}
                <div className="mt-2">
                  <input
                    type="text"
                    value={media.alt}
                    onChange={(e) => updateAltText(media.id, e.target.value)}
                    placeholder={`${media.type === 'video' ? 'Video' : 'Photo'} description...`}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Media Upload Guidelines</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Photos:</strong> Upload high-quality images (minimum 1200px wide)</li>
          <li>• <strong>Videos:</strong> Upload short clips (max 100MB, MP4/MOV/WebM preferred)</li>
          <li>• Include a variety of spaces: ceremony, reception, bridal suite, etc.</li>
          <li>• Show your venue in the best light with professional photography/videography</li>
          <li>• Ensure media is recent and accurately represents your venue</li>
          <li>• <strong>First file will be used as the primary thumbnail in search results</strong></li>
          <li>• <strong>Videos automatically generate thumbnail from first frame</strong></li>
          <li>• Photo formats: JPG, PNG, WebP (max 10MB per file)</li>
          <li>• Video formats: MP4, MOV, WebM, AVI (max 100MB per file)</li>
          {!isPremium && (
            <li className="text-amber-700 font-medium">• Free accounts: 3 files maximum. Upgrade to Premium for unlimited uploads and priority listing!</li>
          )}
        </ul>
      </div>

      {/* Premium Upgrade CTA */}
      {!isPremium && (
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-bold mb-2">🚀 Upgrade to Premium</h4>
              <p className="text-pink-100 mb-3">
                Unlock unlimited photo uploads, priority search placement, and advanced analytics
              </p>
              <ul className="text-sm text-pink-100 space-y-1">
                <li>✨ Unlimited photo uploads</li>
                <li>🎯 Priority search placement</li>
                <li>📊 Advanced booking analytics</li>
                <li>🎨 Custom venue branding</li>
              </ul>
            </div>
            <div className="text-right">
              <button className="bg-white text-pink-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-50 transition">
                Upgrade Now
              </button>
              <p className="text-pink-200 text-sm mt-2">Starting at $29/month</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
