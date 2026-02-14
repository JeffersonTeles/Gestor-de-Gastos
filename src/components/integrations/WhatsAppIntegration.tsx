'use client';

import { useState } from 'react';

interface WhatsAppIntegrationProps {
  className?: string;
}

export const WhatsAppIntegration = ({ className = '' }: WhatsAppIntegrationProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);

  const handleConnect = () => {
    if (!phoneNumber) return;
    
    // Simular conexão
    setTimeout(() => {
      setIsConnected(true);
    }, 1000);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setPhoneNumber('');
  };

  const sendTestMessage = () => {
    const exampleText = `💰 *Gestor de Gastos*\n\nPara adicionar uma despesa, envie:\n\`despesa 50 mercado\`\n\nPara adicionar receita:\n\`receita 1000 salário\`\n\nPara ver saldo:\n\`saldo\``;
    
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(exampleText);
    }
  };

  const whatsappNumber = phoneNumber.replace(/\D/g, '');
  const whatsappLink = `https://wa.me/${whatsappNumber}`;

  return (
    <div className={`card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Integração WhatsApp</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {isConnected ? '✅ Conectado' : 'Adicione gastos pelo WhatsApp'}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="btn-secondary text-sm"
        >
          {showInstructions ? 'Ocultar' : 'Como usar'}
        </button>
      </div>

      {showInstructions && (
        <div className="mb-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800 animate-fade-in">
          <h4 className="font-semibold text-primary-900 dark:text-primary-300 mb-2">📱 Como funciona:</h4>
          <ol className="text-sm text-primary-800 dark:text-primary-400 space-y-1 list-decimal list-inside">
            <li>Conecte seu número de WhatsApp abaixo</li>
            <li>Salve o número do bot nos seus contatos</li>
            <li>Envie comandos para adicionar transações:
              <ul className="ml-6 mt-1 space-y-1 list-disc list-inside">
                <li><code className="bg-primary-100 dark:bg-primary-900/50 px-1 rounded">despesa 50 mercado</code></li>
                <li><code className="bg-primary-100 dark:bg-primary-900/50 px-1 rounded">receita 1000 salário</code></li>
                <li><code className="bg-primary-100 dark:bg-primary-900/50 px-1 rounded">saldo</code> - Ver saldo atual</li>
              </ul>
            </li>
          </ol>
        </div>
      )}

      {!isConnected ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Número de WhatsApp (com DDD)
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="(11) 99999-9999"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-800 dark:text-white"
              />
              <button
                onClick={handleConnect}
                disabled={!phoneNumber}
                className="btn-primary"
              >
                Conectar
              </button>
            </div>
          </div>

          <div className="p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-warning-800 dark:text-warning-400">
                <strong>Importante:</strong> Esta é uma demonstração. Para integração real com WhatsApp, é necessário configurar a API Business do WhatsApp.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-success-50 dark:bg-success-900/20 rounded-lg border border-success-200 dark:border-success-800">
            <div className="flex items-start gap-3 mb-3">
              <svg className="w-5 h-5 text-success-600 dark:text-success-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h4 className="font-semibold text-success-900 dark:text-success-300">WhatsApp Conectado!</h4>
                <p className="text-sm text-success-700 dark:text-success-400 mt-1">
                  Número: <strong>{phoneNumber}</strong>
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-sm flex-1 text-center"
              >
                Abrir WhatsApp
              </a>
              <button
                onClick={sendTestMessage}
                className="btn-secondary text-sm"
              >
                📋 Copiar Comandos
              </button>
            </div>
          </div>

          {/* Exemplo de mensagens recentes */}
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
            <h4 className="font-semibold text-neutral-900 dark:text-white mb-3 text-sm">💬 Últimas Mensagens</h4>
            <div className="space-y-2">
              <div className="p-3 bg-success-50 dark:bg-success-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-success-700 dark:text-success-400">Você</span>
                  <span className="text-xs text-neutral-500">há 2min</span>
                </div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">despesa 45 almoço</p>
              </div>
              <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-primary-700 dark:text-primary-400">Bot</span>
                  <span className="text-xs text-neutral-500">há 2min</span>
                </div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">✅ Despesa de R$ 45,00 em "almoço" adicionada com sucesso!</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleDisconnect}
            className="btn-danger w-full text-sm"
          >
            Desconectar WhatsApp
          </button>
        </div>
      )}
    </div>
  );
};
