'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { ImageUploadManager, processImage, ImageUploadError } from '@/lib/imageUpload';

interface Photo {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  file?: File;
}

interface PhotoUploadProps {
  venueId: string;
  existingPhotos?: Photo[];
  onPhotosUpdate: (photos: Photo[]) => void;
  maxPhotos?: number;
  isPremium?: boolean;
}

interface UploadProgress {
  current: number;
  total: number;
  fileName?: string;
}

export default function PhotoUpload({ 
  venueId, 
  existingPhotos = [], 
  onPhotosUpdate, 
  maxPhotos = 20,
  isPremium = false
}: PhotoUploadProps) {
  // Set photo limit based on premium status
  const photoLimit = isPremium ? maxPhotos : 2;
  const [photos, setPhotos] = useState<Photo[]>(existingPhotos);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    const newFiles = Array.from(files);
    const remainingSlots = photoLimit - photos.length;
    
    if (newFiles.length > remainingSlots) {
      const message = isPremium 
        ? `You can only upload ${remainingSlots} more photos. Maximum of ${photoLimit} photos allowed.`
        : `You can only upload ${remainingSlots} more photos. Free users are limited to 2 photos. Upgrade to Premium for unlimited photos!`;
      alert(message);
      return;
    }

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      try {
        const { preview } = await processImage(file, {
          maxSize: 10 * 1024 * 1024, // 10MB
          maxWidth: 2048,
          maxHeight: 2048,
          quality: 0.8
        });

        const newPhoto: Photo = {
          id: `temp-${Date.now()}-${Math.random()}`,
          url: preview,
          alt: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for alt text
          isPrimary: photos.length === 0 && i === 0, // Only first photo when no existing photos
          file: file
        };
        
        setPhotos(prev => {
          const updated = [...prev, newPhoto];
          onPhotosUpdate(updated);
          return updated;
        });
      } catch (error) {
        if (error instanceof ImageUploadError) {
          alert(`Error processing ${file.name}: ${error.message}`);
        } else {
          alert(`Failed to process ${file.name}. Please try again.`);
        }
      }
    }
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

  const removePhoto = (photoId: string) => {
    setPhotos(prev => {
      const updated = prev.filter(photo => photo.id !== photoId);
      // If we removed the primary photo, make the first remaining photo primary
      if (updated.length > 0 && !updated.some(photo => photo.isPrimary)) {
        updated[0].isPrimary = true;
      }
      onPhotosUpdate(updated);
      return updated;
    });
  };

  const setPrimary = (photoId: string) => {
    setPhotos(prev => {
      const updated = prev.map(photo => ({
        ...photo,
        isPrimary: photo.id === photoId
      }));
      onPhotosUpdate(updated);
      return updated;
    });
  };

  const updateAltText = (photoId: string, altText: string) => {
    setPhotos(prev => {
      const updated = prev.map(photo => 
        photo.id === photoId ? { ...photo, alt: altText } : photo
      );
      onPhotosUpdate(updated);
      return updated;
    });
  };

  const uploadPhotos = async () => {
    setUploading(true);
    
    try {
      const photosWithFiles = photos.filter(photo => photo.file);
      const filesToUpload = photosWithFiles.map(photo => photo.file!);
      
      if (filesToUpload.length === 0) {
        alert('No photos to upload');
        return;
      }

      setUploadProgress({ current: 0, total: filesToUpload.length });
      
      const uploadManager = new ImageUploadManager(venueId);
      const { successful, failed } = await uploadManager.uploadImages(filesToUpload);
      
      // Update successful uploads
      setPhotos(prev => prev.map(photo => {
        const successfulUpload = successful.find(s => 
          s.originalName === photo.file?.name
        );
        
        if (successfulUpload) {
          return { 
            ...photo, 
            url: successfulUpload.url, 
            id: successfulUpload.id,
            file: undefined 
          };
        }
        return photo;
      }));
      
      // Show results
      if (successful.length > 0) {
        alert(`Successfully uploaded ${successful.length} photo(s)!`);
      }
      
      if (failed.length > 0) {
        const failedNames = failed.map(f => f.file.name).join(', ');
        alert(`Failed to upload: ${failedNames}`);
      }
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
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
            <p className="text-lg font-medium text-gray-900">Upload venue photos</p>
            <p className="text-sm text-gray-500">
              Drag and drop files here, or click to select files
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {photos.length}/{photoLimit} photos uploaded
              {!isPremium && (
                <span className="text-amber-600 font-medium ml-2">
                  (Free: 2 photos max - Upgrade for more!)
                </span>
              )}
            </p>
          </div>
          <div className="flex justify-center space-x-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition disabled:opacity-50"
              disabled={photos.length >= photoLimit}
            >
              Select Files
            </button>
            {photos.some(photo => photo.file) && (
              <button
                type="button"
                onClick={uploadPhotos}
                disabled={uploading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload Photos'}
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
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Venue Photos ({photos.length}/{photoLimit})
            </h3>
            {!isPremium && photos.length >= 2 && (
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                🔥 Upgrade to Premium for unlimited photos!
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group">
                <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden">
                  <Image
                    src={photo.url}
                    alt={photo.alt}
                    fill
                    className="object-cover"
                  />
                  
                  {/* Primary Photo Badge */}
                  {photo.isPrimary && (
                    <div className="absolute top-2 left-2 bg-pink-600 text-white px-2 py-1 text-xs font-medium rounded">
                      Primary
                    </div>
                  )}
                  
                  {/* Uploading Indicator */}
                  {photo.file && (
                    <div className="absolute top-2 right-2 bg-yellow-600 text-white px-2 py-1 text-xs font-medium rounded">
                      Pending Upload
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    {!photo.isPrimary && (
                      <button
                        onClick={() => setPrimary(photo.id)}
                        className="px-3 py-1 bg-pink-600 text-white text-sm rounded hover:bg-pink-700 transition"
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      onClick={() => removePhoto(photo.id)}
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
                    value={photo.alt}
                    onChange={(e) => updateAltText(photo.id, e.target.value)}
                    placeholder="Photo description..."
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
        <h4 className="font-medium text-blue-900 mb-2">Photo Guidelines</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Upload high-quality images (minimum 1200px wide)</li>
          <li>• Include a variety of spaces: ceremony, reception, bridal suite, etc.</li>
          <li>• Show your venue in the best light with professional photography</li>
          <li>• Ensure photos are recent and accurately represent your venue</li>
          <li>• First photo will be used as the primary image in search results</li>
          <li>• Accepted formats: JPG, PNG, WebP (max 10MB per file)</li>
          {!isPremium && (
            <li className="text-amber-700 font-medium">• Free accounts: 2 photos maximum. Upgrade to Premium for unlimited photos and priority listing!</li>
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
