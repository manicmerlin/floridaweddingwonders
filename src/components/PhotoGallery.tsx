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
  /** Slug of the page the user is on. Used to build the Pin-It URL.
   *  When omitted, the Pin overlay is hidden. */
  venueSlug?: string;
  /** Description used by Pinterest in the suggested caption. */
  pinDescription?: string;
}

/**
 * Returns the Pinterest pin-creation URL for an image. Pinterest's official
 * widget pattern — opens a popup with the image + URL + description
 * pre-filled. No JS dependency; the user clicks, Pinterest opens the popup.
 */
function buildPinItUrl(
  pageUrl: string,
  imageUrl: string,
  description: string
): string {
  const params = new URLSearchParams({
    url: pageUrl,
    media: imageUrl,
    description,
  });
  return `https://www.pinterest.com/pin/create/button/?${params.toString()}`;
}

export default function PhotoGallery({
  images,
  venueName,
  venueSlug,
  pinDescription,
}: PhotoGalleryProps) {
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
  const renderImage = (url: string, alt: string, className: string, priority?: boolean, index?: number) => {
    // Generate better alt text if needed
    const enhancedAlt = alt || `${venueName} - Photo ${index !== undefined ? index + 1 : ''}`;
    
    if (isDataURL(url)) {
      // Use regular img tag for data URLs (Next.js Image doesn't support them well)
      return (
        <img
          src={url}
          alt={enhancedAlt}
          className={className}
          loading={priority ? 'eager' : 'lazy'}
        />
      );
    } else {
      // Use Next.js Image component for regular URLs
      return (
        <Image
          src={url}
          alt={enhancedAlt}
          width={800}
          height={500}
          className={className}
          priority={priority}
          loading={priority ? undefined : 'lazy'}
          quality={90}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
        />
      );
    }
  };

  return (
    <div className="w-full">
      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Main Image */}
        <div className="relative w-full aspect-w-16 aspect-h-10 mb-4 group">
          {renderImage(
            images[selectedImage].url,
            images[selectedImage].alt || `${venueName} - Main photo`,
            "w-full h-64 sm:h-80 object-cover rounded-lg",
            selectedImage === 0, // Priority load only first image
            selectedImage
          )}
          {venueSlug && (
            <PinItButton
              pageUrl={`https://floridaweddingwonders.com/venues/${venueSlug}`}
              imageUrl={images[selectedImage].url}
              description={pinDescription || `${venueName} — Florida wedding venue`}
            />
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
          <div className="relative col-span-3 h-full group">
            {renderImage(
              images[selectedImage].url,
              images[selectedImage].alt,
              "w-full h-full object-cover rounded-lg",
              true
            )}
            {venueSlug && (
              <PinItButton
                pageUrl={`https://floridaweddingwonders.com/venues/${venueSlug}`}
                imageUrl={images[selectedImage].url}
                description={pinDescription || `${venueName} — Florida wedding venue`}
              />
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

function PinItButton({
  pageUrl,
  imageUrl,
  description,
}: {
  pageUrl: string;
  imageUrl: string;
  description: string;
}) {
  return (
    <a
      href={buildPinItUrl(pageUrl, imageUrl, description)}
      target="_blank"
      rel="noopener noreferrer"
      data-pin-do="buttonPin"
      data-pin-custom="true"
      className="absolute top-3 right-3 inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
      aria-label="Save to Pinterest"
    >
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />
      </svg>
      Save
    </a>
  );
}
