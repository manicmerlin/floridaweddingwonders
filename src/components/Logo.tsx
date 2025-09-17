'use client';

import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  variant?: 'square' | 'horizontal';
}

export default function Logo({ className = '', size = 'md', showText = true, variant = 'horizontal' }: LogoProps) {
  const sizeClasses = {
    sm: variant === 'horizontal' ? 'h-8 w-auto' : 'h-8 w-auto',
    md: variant === 'horizontal' ? 'h-10 w-auto' : 'h-10 w-auto', 
    lg: variant === 'horizontal' ? 'h-12 w-auto' : 'h-12 w-auto'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  // Use horizontal logo by default, with option to use square logo
  const logoSrc = variant === 'horizontal' ? '/images/logo-horizontal.png' : '/images/logo.png';
  
  return (
    <Link href="/" className={`flex items-center space-x-3 hover:opacity-80 transition-opacity ${className}`}>
      {/* Logo Image */}
      <Image
        src={logoSrc}
        alt="Florida Wedding Wonders"
        width={variant === 'horizontal' ? 200 : 40}
        height={variant === 'horizontal' ? 50 : 40}
        className={`${sizeClasses[size]} brightness-0 invert-0`}
        style={{ filter: 'brightness(0) saturate(100%) invert(11%) sepia(7%) saturate(1354%) hue-rotate(183deg) brightness(98%) contrast(88%)' }}
        priority
      />
      
      {/* Text Logo - Hide when using horizontal logo since it likely includes text */}
      {showText && variant === 'square' && (
        <span className={`font-bold font-heading text-pink-600 hover:text-pink-700 transition ${textSizeClasses[size]}`}>
          Florida Wedding Wonders
        </span>
      )}
    </Link>
  );
}
