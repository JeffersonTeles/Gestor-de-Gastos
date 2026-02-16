/**
 * Web Vitals Tracking - Monitora performance em produção
 * 
 * Métricas:
 * - FCP (First Contentful Paint): < 1.5s
 * - LCP (Largest Contentful Paint): < 2.5s
 * - CLS (Cumulative Layout Shift): < 0.1
 * - TTFB (Time to First Byte): < 600ms
 */

// Exemplo de como implementar:
/*
'use client';

import { FC, useEffect } from 'react';

interface WebVital {
  name: string;
  value: number;
  id: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export function WebVitalsReporter() {
  useEffect(() => {
    // sendToAnalytics('web-vitals', {
    //   FCP, LCP, CLS, TTFB
    // });
  }, []);

  return null; // Component sem UI
}
*/

// Target Web Vitals
export const WEB_VITALS_TARGETS = {
  FCP: {
    good: 1500, // 1.5s
    poor: 2500, // 2.5s
    metric: 'First Contentful Paint'
  },
  LCP: {
    good: 2500, // 2.5s
    poor: 4000, // 4s
    metric: 'Largest Contentful Paint'
  },
  CLS: {
    good: 0.1,
    poor: 0.25,
    metric: 'Cumulative Layout Shift'
  },
  TTFB: {
    good: 600, // 600ms
    poor: 1200, // 1.2s
    metric: 'Time to First Byte'
  }
} as const;

/**
 * Função para enviar métricas para serviço de analytics
 * Use com Vercel Analytics, Datadog, ou similar
 */
export async function reportWebVital(metric: any) {
  if (process.env.NODE_ENV !== 'production') return;

  try {
    const url = '/api/analytics/web-vitals';
    const body = JSON.stringify(metric);

    if (navigator.sendBeacon) {
      // Usar sendBeacon se disponível (mais confiável)
      navigator.sendBeacon(url, body);
    } else {
      // Fallback para fetch
      await fetch(url, {
        method: 'POST',
        body,
        keepalive: true,
      });
    }
  } catch (error) {
    console.error('Erro ao reportar Web Vitals:', error);
  }
}

/**
 * Uso em root layout:
 * 
 * import { WebVitalsReporter } from '@/lib/webVitals';
 * 
 * <WebVitalsReporter />
 */
