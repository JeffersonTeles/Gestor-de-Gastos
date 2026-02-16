'use client';

import { useToast } from '@/contexts/ToastContext';
import { useState } from 'react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (transactions: any[]) => Promise<void>;
}

export const ImportModal = ({ isOpen, onClose, onImport }: ImportModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [format, setFormat] = useState<'csv' | 'ofx'>('csv');
  const { showToast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    
    // Detectar formato pelo nome do arquivo
    if (selectedFile.name.endsWith('.ofx') || selectedFile.name.endsWith('.OFX')) {
      setFormat('ofx');
    } else {
      setFormat('csv');
    }

    // Processar preview
    try {
      const text = await selectedFile.text();
      const parsed = format === 'csv' ? parseCSV(text) : parseOFX(text);
      setPreview(parsed.slice(0, 5)); // Mostrar apenas 5 primeiros
    } catch (error: any) {
      showToast('error', `Erro ao ler arquivo: ${error.message}`);
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) throw new Error('Arquivo CSV vazio ou inválido');

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const transactions: any[] = [];

    // Detectar colunas importantes
    const dateIndex = headers.findIndex(h => h.includes('data') || h.includes('date'));
    const descIndex = headers.findIndex(h => h.includes('descri') || h.includes('description'));
    const amountIndex = headers.findIndex(h => h.includes('valor') || h.includes('amount'));
    const categoryIndex = headers.findIndex(h => h.includes('categoria') || h.includes('category'));

    if (dateIndex === -1 || descIndex === -1 || amountIndex === -1) {
      throw new Error('CSV deve ter colunas: Data, Descrição e Valor');
    }

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < 3) continue;

      const amount = parseFloat(values[amountIndex].replace(/[^\d.-]/g, ''));
      
      transactions.push({
        date: values[dateIndex],
        description: values[descIndex],
        amount: Math.abs(amount),
        type: amount < 0 ? 'expense' : 'income',
        category: categoryIndex !== -1 ? values[categoryIndex] : 'Outros',
      });
    }

    return transactions;
  };

  const parseOFX = (text: string): any[] => {
    const transactions: any[] = [];
    
    // Regex para extrair transações OFX
    const stmtTrnRegex = /<STMTTRN>(.*?)<\/STMTTRN>/gs;
    const matches = text.matchAll(stmtTrnRegex);

    for (const match of matches) {
      const trnBlock = match[1];
      
      // Extrair campos
      const dateMatch = trnBlock.match(/<DTPOSTED>(\d{8})/);
      const amountMatch = trnBlock.match(/<TRNAMT>([-\d.]+)/);
      const memoMatch = trnBlock.match(/<MEMO>(.*?)</);
      
      if (!dateMatch || !amountMatch) continue;

      const dateStr = dateMatch[1];
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      const date = `${year}-${month}-${day}`;
      
      const amount = parseFloat(amountMatch[1]);
      
      transactions.push({
        date,
        description: memoMatch ? memoMatch[1].trim() : 'Transação importada',
        amount: Math.abs(amount),
        type: amount < 0 ? 'expense' : 'income',
        category: 'Importado',
      });
    }

    if (transactions.length === 0) {
      throw new Error('Nenhuma transação encontrada no arquivo OFX');
    }

    return transactions;
  };

  const handleImport = async () => {
    if (!file) {
      showToast('warning', 'Selecione um arquivo primeiro');
      return;
    }

    setIsProcessing(true);
    try {
      const text = await file.text();
      const parsed = format === 'csv' ? parseCSV(text) : parseOFX(text);
      
      await onImport(parsed);
      showToast('success', `${parsed.length} transações importadas com sucesso!`);
      handleClose();
    } catch (error: any) {
      showToast('error', `Erro na importação: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl glass-panel rounded-3xl p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[var(--ink)]">
            📥 Importar Transações
          </h2>
          <button
            onClick={handleClose}
            className="text-2xl text-gray-400 hover:text-gray-600 transition"
          >
            ✕
          </button>
        </div>

        {/* Seletor de formato */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-600 mb-3">
            Formato do arquivo
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setFormat('csv')}
              className={`p-4 rounded-2xl border-2 transition-all ${
                format === 'csv'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-2xl mb-2">📊</div>
              <div className="font-semibold text-[var(--ink)]">CSV</div>
              <div className="text-xs text-slate-500 mt-1">
                Excel, Google Sheets
              </div>
            </button>
            <button
              onClick={() => setFormat('ofx')}
              className={`p-4 rounded-2xl border-2 transition-all ${
                format === 'ofx'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-2xl mb-2">🏦</div>
              <div className="font-semibold text-[var(--ink)]">OFX</div>
              <div className="text-xs text-slate-500 mt-1">
                Extrato bancário
              </div>
            </button>
          </div>
        </div>

        {/* Upload area */}
        <div className="mb-6">
          <label
            htmlFor="file-upload"
            className={`
              block w-full p-8 border-2 border-dashed rounded-2xl
              text-center cursor-pointer transition-all
              ${file 
                ? 'border-emerald-500 bg-emerald-50' 
                : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
              }
            `}
          >
            <div className="text-4xl mb-3">{file ? '✓' : '⬆️'}</div>
            <div className="font-semibold text-[var(--ink)] mb-1">
              {file ? file.name : `Clique para selecionar arquivo ${format.toUpperCase()}`}
            </div>
            <div className="text-sm text-slate-500">
              {file
                ? `${(file.size / 1024).toFixed(1)} KB`
                : 'ou arraste e solte aqui'
              }
            </div>
          </label>
          <input
            id="file-upload"
            type="file"
            accept={format === 'csv' ? '.csv' : '.ofx'}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-600 mb-3">
              Prévia ({preview.length} de {preview.length} primeiras)
            </h3>
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Data</th>
                    <th className="px-4 py-2 text-left">Descrição</th>
                    <th className="px-4 py-2 text-left">Tipo</th>
                    <th className="px-4 py-2 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((tx, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-4 py-2">{tx.date}</td>
                      <td className="px-4 py-2 truncate max-w-xs">{tx.description}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            tx.type === 'income'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {tx.type === 'income' ? 'Receita' : 'Despesa'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right font-semibold">
                        R$ {tx.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Format instructions */}
        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="text-sm text-slate-700">
            <strong>📋 Formato esperado ({format.toUpperCase()}):</strong>
            {format === 'csv' ? (
              <ul className="mt-2 space-y-1 ml-4 list-disc">
                <li>Primeira linha com cabeçalhos</li>
                <li>Colunas obrigatórias: Data, Descrição, Valor</li>
                <li>Coluna opcional: Categoria</li>
                <li>Exemplo: <code className="text-xs bg-white px-1 rounded">Data,Descrição,Valor,Categoria</code></li>
              </ul>
            ) : (
              <ul className="mt-2 space-y-1 ml-4 list-disc">
                <li>Arquivo de extrato bancário padrão OFX</li>
                <li>Baixado diretamente do site do banco</li>
                <li>Contém tags STMTTRN com transações</li>
              </ul>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 rounded-2xl font-semibold hover:bg-slate-200 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={!file || isProcessing}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-teal-600 to-emerald-500 text-white rounded-2xl font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Importando...' : `Importar ${preview.length > 0 ? preview.length : ''} transações`}
          </button>
        </div>
      </div>
    </div>
  );
};
