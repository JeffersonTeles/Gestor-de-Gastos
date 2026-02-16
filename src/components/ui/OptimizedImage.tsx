'use client';

import Image from 'next/image';
import { ImgHTMLAttributes } from 'react';

/**
 * Wrapper otimizado para imagens usando next/image
 * Fornece lazy loading, otimização automática e responsive images
 * 
 * Benefícios:
 * - WebP com PNG fallback automático
 * - Lazy loading por padrão
 * - Srcset responsivo (mobile, tablet, desktop)
 * - Otimização automática de tamanho
 * - Cache agressivo (1 ano)
 */

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  fill?: boolean;
  className?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  fill = false,
  className = '',
  ...props
}: OptimizedImageProps) {
  return (
    <div className={`relative ${fill ? 'w-full h-full' : ''}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        fill={fill}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        quality={80} // Balancear qualidade vs tamanho
        loading={priority ? 'eager' : 'lazy'}
        className={className}
        {...props}
      />
    </div>
  );
}

/**
 * Uso:
 * 
 * <OptimizedImage
 *   src="/dashboard-hero.png"
 *   alt="Dashboard preview"
 *   width={1200}
 *   height={675}
 *   priority // Apenas para hero image
 * />
 */
