'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { generateSecret } from 'otplib';

export function useTwoFactor(userId?: string) {
  const { data: twoFactorSettings } = useQuery({
    queryKey: ['2fa-settings', userId],
    queryFn: async () => {
      const response = await fetch(`/api/2fa?user_id=${userId}`);
      if (!response.ok) throw new Error('Erro ao buscar configurações 2FA');
      return response.json();
    },
    enabled: !!userId,
  });

  const enableTOTP = useMutation({
    mutationFn: async () => {
      const secret = generateSecret();
      const otpauthUrl = `otpauth://totp/GestorGastos:${userId}?secret=${secret}&issuer=GestorGastos`;
      
      return {
        secret,
        qrCode: otpauthUrl,
      };
    },
  });

  const verifyAndEnableTOTP = useMutation({
    mutationFn: async (data: { secret: string; code: string }) => {
      const response = await fetch('/api/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'totp',
          secret: data.secret,
          code: data.code,
        }),
      });
      if (!response.ok) throw new Error('Código inválido');
      return response.json();
    },
  });

  const disableTOTP = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Erro ao desabilitar 2FA');
      return response.json();
    },
  });

  const verifyTOTP = useMutation({
    mutationFn: async (code: string) => {
      const response = await fetch('/api/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (!response.ok) throw new Error('Código de autenticação inválido');
      return response.json();
    },
  });

  const generateBackupCodes = useMutation({
    mutationFn: async () => {
      const codes = Array.from({ length: 10 }, () =>
        Math.random().toString(36).substring(2, 10).toUpperCase()
      );
      
      const response = await fetch('/api/2fa/backup-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes }),
      });
      if (!response.ok) throw new Error('Erro ao gerar códigos de recuperação');
      return codes;
    },
  });

  const isTwoFactorEnabled = () => {
    return twoFactorSettings?.enabled === true;
  };

  return {
    twoFactorSettings,
    isTwoFactorEnabled,
    enableTOTP: enableTOTP.mutateAsync,
    verifyAndEnableTOTP: verifyAndEnableTOTP.mutateAsync,
    disableTOTP: disableTOTP.mutateAsync,
    verifyTOTP: verifyTOTP.mutateAsync,
    generateBackupCodes: generateBackupCodes.mutateAsync,
    isEnabling: enableTOTP.isPending,
    isVerifying: verifyTOTP.isPending,
  };
}
