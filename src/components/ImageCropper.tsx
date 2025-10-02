'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface ImageCropperProps {
  imageUrl: string;
  imageName: string;
  onCropComplete: (croppedBlob: Blob, croppedDataUrl: string) => void;
  onCancel: () => void;
  aspectRatio?: number; // width/height (e.g., 16/9 = 1.78)
}

export default function ImageCropper({ 
  imageUrl, 
  imageName,
  onCropComplete, 
  onCancel,
  aspectRatio = 16 / 9 // Default to gallery aspect ratio
}: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    // Load the image
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setOriginalImage(img);
      setImageLoaded(true);
      
      // Initialize crop area to center with aspect ratio
      const imgWidth = img.width;
      const imgHeight = img.height;
      
      let cropWidth = imgWidth;
      let cropHeight = cropWidth / aspectRatio;
      
      if (cropHeight > imgHeight) {
        cropHeight = imgHeight;
        cropWidth = cropHeight * aspectRatio;
      }
      
      const x = (imgWidth - cropWidth) / 2;
      const y = (imgHeight - cropHeight) / 2;
      
      setCropArea({
        x: Math.max(0, x),
        y: Math.max(0, y),
        width: cropWidth,
        height: cropHeight
      });
    };
    img.src = imageUrl;
  }, [imageUrl, aspectRatio]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = originalImage ? originalImage.width / rect.width : 1;
    const scaleY = originalImage ? originalImage.height / rect.height : 1;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setIsDragging(true);
    setDragStart({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !imageRef.current || !originalImage) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = originalImage.width / rect.width;
    const scaleY = originalImage.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const width = Math.abs(x - dragStart.x);
    const height = width / aspectRatio;
    
    const newCropArea = {
      x: Math.min(dragStart.x, x),
      y: Math.min(dragStart.y, y),
      width: Math.min(width, originalImage.width - Math.min(dragStart.x, x)),
      height: Math.min(height, originalImage.height - Math.min(dragStart.y, y))
    };
    
    // Ensure aspect ratio is maintained
    if (newCropArea.height > originalImage.height - newCropArea.y) {
      newCropArea.height = originalImage.height - newCropArea.y;
      newCropArea.width = newCropArea.height * aspectRatio;
    }
    
    setCropArea(newCropArea);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCrop = async () => {
    if (!originalImage || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to crop area
    canvas.width = cropArea.width;
    canvas.height = cropArea.height;
    
    // Draw cropped image
    ctx.drawImage(
      originalImage,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
      0,
      0,
      cropArea.width,
      cropArea.height
    );
    
    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onCropComplete(blob, dataUrl);
      }
    }, 'image/jpeg', 0.9);
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

  const displayScale = Math.min(800 / originalImage.width, 600 / originalImage.height, 1);
  const displayWidth = originalImage.width * displayScale;
  const displayHeight = originalImage.height * displayScale;

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
              <strong>Instructions:</strong> Click and drag on the image to select the area you want to crop. 
              The selection will maintain the gallery aspect ratio ({aspectRatio.toFixed(2)}:1).
            </p>
          </div>

          <div className="relative inline-block">
            <div
              className="relative cursor-crosshair"
              style={{ width: displayWidth, height: displayHeight }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Crop preview"
                className="block"
                style={{ width: displayWidth, height: displayHeight }}
              />
              
              {/* Crop overlay */}
              <div
                className="absolute border-2 border-pink-500 bg-pink-500 bg-opacity-20"
                style={{
                  left: (cropArea.x * displayScale) + 'px',
                  top: (cropArea.y * displayScale) + 'px',
                  width: (cropArea.width * displayScale) + 'px',
                  height: (cropArea.height * displayScale) + 'px'
                }}
              >
                {/* Corner handles */}
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-pink-500 rounded-full"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full"></div>
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-pink-500 rounded-full"></div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-pink-500 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Crop size: {Math.round(cropArea.width)} × {Math.round(cropArea.height)} px
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
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hidden canvas for cropping */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
