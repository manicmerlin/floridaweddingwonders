'use client';

import { useState, useRef, useEffect } from 'react';

interface ImageCropperProps {
  imageUrl: string;
  imageName: string;
  onCropComplete: (croppedBlob: Blob, croppedDataUrl: string) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

export default function ImageCropper({ 
  imageUrl, 
  imageName,
  onCropComplete, 
  onCancel,
  aspectRatio = 4 / 3
}: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [imageScale, setImageScale] = useState(1);
  const [cropBoxSize, setCropBoxSize] = useState({ width: 600, height: 450 });
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setOriginalImage(img);
      setImageLoaded(true);
      
      // Calculate crop box size (fixed size, centered in viewport)
      const maxWidth = Math.min(800, window.innerWidth - 100);
      const cropWidth = maxWidth;
      const cropHeight = cropWidth / aspectRatio;
      setCropBoxSize({ width: cropWidth, height: cropHeight });
      
      // Calculate scale to fit image to crop box
      const scaleX = cropWidth / img.width;
      const scaleY = cropHeight / img.height;
      const scale = Math.max(scaleX, scaleY); // Ensure image covers crop box
      setImageScale(scale);
      
      // Center image in crop box
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      setImagePosition({
        x: (cropWidth - scaledWidth) / 2,
        y: (cropHeight - scaledHeight) / 2
      });
    };
    img.src = imageUrl;
  }, [imageUrl, aspectRatio]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !originalImage) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Constrain movement so image doesn't leave crop box
    const scaledWidth = originalImage.width * imageScale;
    const scaledHeight = originalImage.height * imageScale;
    
    const minX = cropBoxSize.width - scaledWidth;
    const minY = cropBoxSize.height - scaledHeight;
    
    setImagePosition({
      x: Math.min(0, Math.max(minX, newX)),
      y: Math.min(0, Math.max(minY, newY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCrop = async () => {
    if (!originalImage || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to crop box size
    canvas.width = cropBoxSize.width;
    canvas.height = cropBoxSize.height;
    
    // Calculate source coordinates (portion of original image to crop)
    const sourceX = -imagePosition.x / imageScale;
    const sourceY = -imagePosition.y / imageScale;
    const sourceWidth = cropBoxSize.width / imageScale;
    const sourceHeight = cropBoxSize.height / imageScale;
    
    // Detect image format from URL or default to JPEG
    let mimeType = 'image/jpeg';
    let quality = 0.9;
    
    if (imageUrl.includes('data:image/png') || imageName.toLowerCase().endsWith('.png')) {
      mimeType = 'image/png';
      quality = 1.0; // PNG doesn't use quality parameter but set to max
    } else if (imageUrl.includes('data:image/webp') || imageName.toLowerCase().endsWith('.webp')) {
      mimeType = 'image/webp';
      quality = 0.9;
    }
    
    console.log('🖼️ Cropping image as:', mimeType);
    
    // Draw the visible portion of the image
    ctx.drawImage(
      originalImage,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      cropBoxSize.width,
      cropBoxSize.height
    );
    
    canvas.toBlob((blob) => {
      if (blob) {
        const dataUrl = canvas.toDataURL(mimeType, quality);
        onCropComplete(blob, dataUrl);
      }
    }, mimeType, quality);
  };

  if (!imageLoaded || !originalImage) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading image...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-screen overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Crop Image</h2>
              <p className="text-sm text-gray-600 mt-1">
                {imageName} • Aspect Ratio: {aspectRatio.toFixed(2)}:1 (Gallery size)
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4 bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Instructions:</strong> Drag the image to position it within the crop frame. 
              The pink frame shows the area that will be saved ({aspectRatio.toFixed(2)}:1 ratio for gallery).
            </p>
          </div>

          <div className="flex justify-center">
            <div
              ref={containerRef}
              className="relative border-4 border-pink-500 overflow-hidden cursor-move bg-gray-900"
              style={{ 
                width: cropBoxSize.width, 
                height: cropBoxSize.height,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                src={imageUrl}
                alt="Drag to position"
                className="absolute select-none"
                draggable={false}
                style={{
                  width: originalImage.width * imageScale,
                  height: originalImage.height * imageScale,
                  left: imagePosition.x,
                  top: imagePosition.y,
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
              />
              
              {/* Corner indicators */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white opacity-75"></div>
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white opacity-75"></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white opacity-75"></div>
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white opacity-75"></div>
            </div>
          </div>

          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Output size: {cropBoxSize.width} × {cropBoxSize.height} px
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCrop}
                className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition"
              >
                Crop & Upload
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
