'use client';

import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function Logo({ className = '', size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-10 w-auto', 
    lg: 'h-12 w-auto'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <Link href="/" className={`flex items-center space-x-3 hover:opacity-80 transition-opacity ${className}`}>
      {/* Logo Image */}
      <Image
        src="/images/logo.png"
        alt="Florida Wedding Wonders"
        width={40}
        height={40}
        className={sizeClasses[size]}
        priority
      />
      
      {/* Text Logo */}
      {showText && (
        <span className={`font-bold font-heading text-pink-600 hover:text-pink-700 transition ${textSizeClasses[size]}`}>
          Florida Wedding Wonders
        </span>
      )}
    </Link>
  );
}
