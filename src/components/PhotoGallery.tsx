'use client';

import { useState } from 'react';
import Image from 'next/image';
import { VenueMedia } from '@/types';

interface PhotoGalleryProps {
  media: VenueMedia[];
  venueName: string;
}

export default function PhotoGallery({ media, venueName }: PhotoGalleryProps) {
  const [mediaErrors, setMediaErrors] = useState<Set<string>>(new Set());
  const [selectedMedia, setSelectedMedia] = useState<number | null>(null);
  const [loadedMedia, setLoadedMedia] = useState<Set<string>>(new Set());

  const handleMediaError = (mediaId: string, mediaUrl: string) => {
    console.warn('Media failed to load:', mediaUrl);
    setMediaErrors(prev => new Set(prev).add(mediaId));
  };

  const handleMediaLoad = (mediaId: string, mediaUrl: string) => {
    console.log('✅ Media loaded successfully:', mediaUrl);
    setLoadedMedia(prev => new Set(prev).add(mediaId));
  };

  const openLightbox = (index: number) => {
    setSelectedMedia(index);
  };

  const closeLightbox = () => {
    setSelectedMedia(null);
  };

  const goToPrevious = () => {
    if (selectedMedia !== null) {
      setSelectedMedia(selectedMedia > 0 ? selectedMedia - 1 : media.length - 1);
    }
  };

  const goToNext = () => {
    if (selectedMedia !== null) {
      setSelectedMedia(selectedMedia < media.length - 1 ? selectedMedia + 1 : 0);
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!media || media.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-gray-500">Photos & videos coming soon</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {media.map((item, index) => {
          const hasError = mediaErrors.has(item.id);
          const isLoaded = loadedMedia.has(item.id);
          const displayUrl = item.type === 'video' ? (item.thumbnailUrl || item.url) : item.url;
          
          return (
            <div 
              key={item.id} 
              className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden group cursor-pointer"
              onClick={() => !hasError && openLightbox(index)}
            >
              {hasError ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs text-gray-500">{item.type === 'video' ? 'Video' : 'Image'} unavailable</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Loading skeleton */}
                  {!isLoaded && (
                    <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  
                  <Image
                    src={displayUrl}
                    alt={item.alt || `${venueName} ${item.type} ${index + 1}`}
                    fill
                    className={`object-cover group-hover:scale-105 transition-all duration-300 ${
                      isLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    onError={() => handleMediaError(item.id, displayUrl)}
                    onLoad={() => handleMediaLoad(item.id, displayUrl)}
                    priority={index === 0} // Prioritize loading the first item
                  />
                  
                  {/* Video Play Indicator */}
                  {item.type === 'video' && isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black bg-opacity-60 rounded-full p-3 group-hover:bg-opacity-80 transition-all duration-300">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                  )}
                  
                  {/* Duration Badge for Videos */}
                  {item.type === 'video' && item.duration && isLoaded && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 text-xs rounded">
                      {formatDuration(item.duration)}
                    </div>
                  )}
                  
                  {/* Hover overlay - only show when media is loaded */}
                  {isLoaded && item.type === 'image' && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {item.isPrimary && !hasError && (
                <div className="absolute top-2 left-2 bg-pink-600 text-white px-2 py-1 text-xs font-medium rounded">
                  Main {item.type === 'video' ? 'Video' : 'Photo'}
                </div>
              )}
              
              {/* Media Type Badge */}
              {isLoaded && (
                <div className="absolute top-2 right-2 bg-blue-600 text-white px-1 py-0.5 text-xs font-medium rounded capitalize opacity-75">
                  {item.type}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      {selectedMedia !== null && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {media.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            <div className="relative aspect-video max-h-[80vh]">
              {media[selectedMedia].type === 'video' ? (
                <video
                  src={media[selectedMedia].url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                  poster={media[selectedMedia].thumbnailUrl}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <Image
                  src={media[selectedMedia].url}
                  alt={media[selectedMedia].alt || `${venueName} ${media[selectedMedia].type} ${selectedMedia + 1}`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              )}
            </div>
            
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <p className="text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
                {media[selectedMedia].alt || `${media[selectedMedia].type === 'video' ? 'Video' : 'Photo'} ${selectedMedia + 1} of ${media.length}`}
                {media[selectedMedia].type === 'video' && media[selectedMedia].duration && (
                  <span className="ml-2">({formatDuration(media[selectedMedia].duration!)})</span>
                )}
              </p>
              {media.length > 1 && (
                <p className="text-white text-xs mt-1">
                  {selectedMedia + 1} of {media.length}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
