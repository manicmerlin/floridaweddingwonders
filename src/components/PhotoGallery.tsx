'use client';

import { useState } from 'react';
import Image from 'next/image';

interface MediaItem {
  id: string;
  url: string;
  alt?: string;
  isPrimary?: boolean;
  type?: 'image' | 'video';
  thumbnailUrl?: string;
  duration?: number;
}

interface PhotoGalleryProps {
  images?: MediaItem[];
  media?: MediaItem[];
  venueName: string;
}

export default function PhotoGallery({ images, media, venueName }: PhotoGalleryProps) {
  // Support both old 'images' prop and new 'media' prop for backwards compatibility
  const galleryMedia = media || images || [];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mediaErrors, setMediaErrors] = useState<Set<string>>(new Set());
  const [loadedMedia, setLoadedMedia] = useState<Set<string>>(new Set());

  const handleMediaError = (mediaId: string, mediaUrl: string) => {
    console.warn('Media failed to load:', mediaUrl);
    setMediaErrors(prev => new Set(prev).add(mediaId));
  };

  const handleMediaLoad = (mediaId: string, mediaUrl: string) => {
    console.log('✅ Media loaded successfully:', mediaUrl);
    setLoadedMedia(prev => new Set(prev).add(mediaId));
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!galleryMedia || galleryMedia.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-gray-500">Photos & videos coming soon</p>
      </div>
    );
  }

  const currentMedia = galleryMedia[selectedIndex];
  const hasError = mediaErrors.has(currentMedia?.id || '');
  const isLoaded = loadedMedia.has(currentMedia?.id || '');

  // Show only first 5 thumbnails in grid, rest in "+X" indicator
  const maxVisibleThumbnails = 5;
  const remainingCount = galleryMedia.length > maxVisibleThumbnails ? galleryMedia.length - maxVisibleThumbnails : 0;

  return (
    <div className="w-full bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-4 gap-4 h-[500px]">
          {/* Main Image - Takes up left 3 columns */}
          <div className="col-span-3 relative bg-gray-100 rounded-xl overflow-hidden">
            {hasError ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500">Image unavailable</p>
                </div>
              </div>
            ) : (
              <>
                {/* Loading state */}
                {!isLoaded && (
                  <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                
                <Image
                  src={currentMedia.type === 'video' ? (currentMedia.thumbnailUrl || currentMedia.url) : currentMedia.url}
                  alt={currentMedia.alt || `${venueName} image ${selectedIndex + 1}`}
                  fill
                  className={`object-cover transition-all duration-300 ${
                    isLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  sizes="(max-width: 768px) 100vw, 75vw"
                  onError={() => handleMediaError(currentMedia.id, currentMedia.url)}
                  onLoad={() => handleMediaLoad(currentMedia.id, currentMedia.url)}
                  priority
                />

                {/* Video Play Indicator */}
                {currentMedia.type === 'video' && isLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-full p-6 shadow-lg hover:bg-opacity-100 transition-all duration-300">
                      <svg className="w-12 h-12 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                )}
                
                {/* Duration badge */}
                {currentMedia.type === 'video' && currentMedia.duration && isLoaded && (
                  <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white px-3 py-1 text-sm rounded font-medium">
                    {formatDuration(currentMedia.duration)}
                  </div>
                )}

                {/* Navigation arrows for main image */}
                {galleryMedia.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : galleryMedia.length - 1)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-3 rounded-full shadow-lg transition-all duration-300"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => setSelectedIndex(selectedIndex < galleryMedia.length - 1 ? selectedIndex + 1 : 0)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-3 rounded-full shadow-lg transition-all duration-300"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Image counter */}
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 text-sm rounded font-medium">
                  {selectedIndex + 1} / {galleryMedia.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail Grid - Right column */}
          {galleryMedia.length > 1 && (
            <div className="col-span-1 flex flex-col gap-2">
              {galleryMedia.slice(0, maxVisibleThumbnails).map((item, index) => {
                // Special handling for the last visible thumbnail if there are more images
                const isLastThumbnail = index === maxVisibleThumbnails - 1 && remainingCount > 0;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedIndex(index)}
                    className={`relative flex-1 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                      index === selectedIndex 
                        ? 'border-pink-500 ring-2 ring-pink-200' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={item.type === 'video' ? (item.thumbnailUrl || item.url) : item.url}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                    
                    {/* Video indicator */}
                    {item.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black bg-opacity-60 rounded-full p-1">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                    )}
                    
                    {/* "+X more" overlay for last thumbnail */}
                    {isLastThumbnail && (
                      <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">+{remainingCount}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
