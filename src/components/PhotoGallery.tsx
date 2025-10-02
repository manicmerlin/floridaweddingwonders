'use client';

import { useState } from 'react';
import Image from 'next/image';

interface VenueImage {
  url: string;
  alt: string;
}

interface PhotoGalleryProps {
  images: VenueImage[];
  venueName: string;
}

export default function PhotoGallery({ images, venueName }: PhotoGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded-lg">
        <div className="text-center">
          <span className="text-7xl block mb-2">👰🤵</span>
          <span className="text-sm text-gray-500">No photos yet</span>
        </div>
      </div>
    );
  }

  // Helper to check if URL is a data URL
  const isDataURL = (url: string) => url.startsWith('data:');

  // Helper to render image - use img tag for data URLs, Image component for regular URLs
  const renderImage = (url: string, alt: string, className: string, priority?: boolean) => {
    if (isDataURL(url)) {
      // Use regular img tag for data URLs (Next.js Image doesn't support them well)
      return (
        <img
          src={url}
          alt={alt}
          className={className}
        />
      );
    } else {
      // Use Next.js Image component for regular URLs
      return (
        <Image
          src={url}
          alt={alt}
          width={800}
          height={500}
          className={className}
          priority={priority}
        />
      );
    }
  };

  return (
    <div className="w-full">
      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Main Image */}
        <div className="w-full aspect-w-16 aspect-h-10 mb-4">
          {renderImage(
            images[selectedImage].url,
            images[selectedImage].alt,
            "w-full h-64 sm:h-80 object-cover rounded-lg",
            true
          )}
        </div>
        
        {/* Thumbnail Strip */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                selectedImage === index 
                  ? 'border-pink-500 scale-105' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {isDataURL(image.url) ? (
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image
                  src={image.url}
                  alt={image.alt}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          ))}
          {images.length > 5 && (
            <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm font-medium">
              +{images.length - 5}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block mb-8">
        <div className="grid grid-cols-4 gap-4 h-[500px]">
          {/* Main Image - Takes 3/4 width */}
          <div className="col-span-3 h-full">
            {renderImage(
              images[selectedImage].url,
              images[selectedImage].alt,
              "w-full h-full object-cover rounded-lg",
              true
            )}
          </div>

          {/* Thumbnail Column - Takes 1/4 width */}
          <div className="col-span-1 flex flex-col gap-4 overflow-y-auto h-full">
            {images.slice(0, 4).map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`w-full aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImage === index 
                    ? 'border-pink-500 scale-105' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {isDataURL(image.url) ? (
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={image.url}
                    alt={image.alt}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                )}
              </button>
            ))}
            
            {/* Show more indicator if there are more than 4 images */}
            {images.length > 4 && (
              <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 font-medium border-2 border-gray-200">
                <div className="text-center">
                  <div className="text-lg font-bold">+{images.length - 4}</div>
                  <div className="text-xs">More</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
