import localFont from 'next/font/local';

// Custom heading font - Nowra
export const customHeadingFont = localFont({
  src: '../../public/fonts/Nowra-Regular.otf',
  variable: '--font-heading',
  display: 'swap',
});

// Fallback configuration using Google Fonts
import { Inter, Playfair_Display } from 'next/font/google';

export const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-heading-fallback',
  display: 'swap',
});

// Export the fonts to use
export const bodyFont = inter;
export const headingFont = customHeadingFont; // Now using Nowra!
