
import React, { useState, useRef } from 'react';
import { X, FileUp, CheckCircle, AlertCircle, Loader2, Info, Tag } from 'lucide-react';
import { Transaction, Category } from '../types';

interface FileImporterProps {
  onClose: () => void;
  onImport: (transactions: Omit<Transaction, 'id'>[]) => Promise<void>;
}

const KEYWORD_MAP: Record<string, Category> = {
  'ifood': Category.Food,
  'uber eats': Category.Food,
  'restaurante': Category.Food,
  'padaria': Category.Food,
  'mercado': Category.Food,
  'extra': Category.Food,
  'carrefour': Category.Food,
  'pão de açucar': Category.Food,
  'pzq': Category.Food,
  'mcdonalds': Category.Food,
  'burger king': Category.Food,
  'uber': Category.Transport,
  '99app': Category.Transport,
  '99 taxi': Category.Transport,
  'posto': Category.Transport,
  'shell': Category.Transport,
  'ipiranga': Category.Transport,
  'combustivel': Category.Transport,
  'pedagio': Category.Transport,
  'metro': Category.Transport,
  'cptm': Category.Transport,
  'sptrans': Category.Transport,
  'aluguel': Category.Housing,
  'condomínio': Category.Housing,
  'enel': Category.Housing,
  'sabesp': Category.Housing,
  'vivo': Category.Housing,
  'claro': Category.Housing,
  'net': Category.Housing,
  'sky': Category.Housing,
  'iptu': Category.Housing,
  'netflix': Category.Leisure,
  'spotify': Category.Leisure,
  'steam': Category.Leisure,
  'playstation': Category.Leisure,
  'xbox': Category.Leisure,
  'cinema': Category.Leisure,
  'bar': Category.Leisure,
  'boteco': Category.Leisure,
  'ingresso': Category.Leisure,
  'show': Category.Leisure,
  'salario': Category.Salary,
  'provento': Category.Salary,
  'pagamento': Category.Salary,
  'recebimento': Category.Salary,
  'farmacia': Category.Health,
  'drogasil': Category.Health,
  'pague menos': Category.Health,
  'hospital': Category.Health,
  'consulta': Category.Health,
  'exame': Category.Health,
  'unimed': Category.Health,
  'bradesco saude': Category.Health,
  'faculdade': Category.Education,
  'escola': Category.Education,
  'curso': Category.Education,
  'udemy': Category.Education,
  'alura': Category.Education,
  'livros': Category.Education,
  'papelaria': Category.Education,
  'corretora': Category.Investment,
  'rico': Category.Investment,
  'xp': Category.Investment,
  'inter': Category.Investment,
  'nubank': Category.Investment,
  'caixinha': Category.Investment,
  'cdb': Category.Investment,
  'tesouro': Category.Investment,
  'dividendos': Category.Investment,
  'emprestimo': Category.Loan,
  'financiamento': Category.Loan,
  'parcela': Category.Loan,
};

const autoCategorize = (description: string): Category => {
  const desc = description.toLowerCase();
  for (const [keyword, category] of Object.entries(KEYWORD_MAP)) {
    if (desc.includes(keyword)) {
      return category;
    }
  }
  return Category.Others;
};

export const FileImporter: React.FC<FileImporterProps> = ({ onClose, onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState<Omit<Transaction, 'id'>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): Omit<Transaction, 'id'>[] => {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length < 2) throw new Error("Arquivo CSV vazio ou inválido.");

    const firstLine = lines[0];
    const separator = firstLine.includes(';') ? ';' : ',';
    const headers = firstLine.toLowerCase().split(separator).map(h => h.trim());

    const dateIdx = headers.findIndex(h => h.includes('data') || h.includes('date'));
    const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('memo') || h.includes('historico'));
    const amountIdx = headers.findIndex(h => h.includes('valor') || h.includes('amount') || h.includes('quant') || h.includes('value'));

    if (dateIdx === -1 || amountIdx === -1) {
      throw new Error("Não foi possível identificar as colunas de Data e Valor.");
    }

    return lines.slice(1).map(line => {
      const parts = line.split(separator).map(p => p.trim());
      const amountStr = parts[amountIdx].replace(/[R$ ]/g, '').replace(',', '.');
      const value = parseFloat(amountStr);

      let date = new Date().toISOString().split('T')[0];
      try {
        const dPart = parts[dateIdx];
        if (dPart.includes('/')) {
          const [d, m, y] = dPart.split('/');
          date = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        } else {
          date = new Date(dPart).toISOString().split('T')[0];
        }
      } catch (e) {
        console.warn(`Não foi possível converter a data "${parts[dateIdx]}", usando data atual como fallback`);
      }

      const description = parts[descIdx] || 'Importado CSV';

      return {
        description,
        value: Math.abs(value),
        type: value >= 0 ? 'income' : 'expense',
        category: autoCategorize(description),
        date: date
      };
    });
  };

  const parseOFX = (text: string): Omit<Transaction, 'id'>[] => {
    const transactions: Omit<Transaction, 'id'>[] = [];
    const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
    let match;

    while ((match = stmtTrnRegex.exec(text)) !== null) {
      const content = match[1];
      const amount = parseFloat(content.match(/<TRNAMT>(.*)/)?.[1] || '0');
      const description = content.match(/<NAME>(.*)/)?.[1] || content.match(/<MEMO>(.*)/)?.[1] || 'Importado OFX';
      const rawDate = content.match(/<DTPOSTED>(.*)/)?.[1] || '';

      const y = rawDate.slice(0, 4);
      const m = rawDate.slice(4, 6);
      const d = rawDate.slice(6, 8);
      const date = `${y}-${m}-${d}`;

      transactions.push({
        description,
        value: Math.abs(amount),
        type: amount >= 0 ? 'income' : 'expense',
        category: autoCategorize(description),
        date
      });
    }

    if (transactions.length === 0) throw new Error("Nenhuma transação encontrada no arquivo OFX.");
    return transactions;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setError(null);
    setParsing(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        let results: Omit<Transaction, 'id'>[] = [];

        if (selected.name.toLowerCase().endsWith('.csv')) {
          results = parseCSV(text);
        } else if (selected.name.toLowerCase().endsWith('.ofx')) {
          results = parseOFX(text);
        } else {
          throw new Error("Formato de arquivo não suportado. Use CSV ou OFX.");
        }

        setPreview(results);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Erro ao processar arquivo.";
        setError(errorMessage);
        setFile(null);
      } finally {
        setParsing(false);
      }
    };
    reader.readAsText(selected);
  };

  const updateItemCategory = (index: number, category: Category) => {
    const newPreview = [...preview];
    newPreview[index] = { ...newPreview[index], category };
    setPreview(newPreview);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden border dark:border-zinc-800">
        <div className="flex items-center justify-between p-8 border-b dark:border-zinc-800">
          <div>
            <h3 className="text-2xl font-black tracking-tight">Importar Extrato</h3>
            <p className="text-sm text-slate-500 font-medium">Auto-categorização inteligente ativa</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><X size={24} /></button>
        </div>

        <div className="p-8 space-y-6 max-h-[65vh] overflow-y-auto">
          {!file && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-4 border-dashed border-slate-100 dark:border-zinc-800 rounded-[2rem] p-12 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all bg-slate-50/50 dark:bg-zinc-900 group"
            >
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <FileUp size={40} />
              </div>
              <p className="text-lg font-bold text-slate-700 dark:text-zinc-200">Clique ou arraste seu arquivo</p>
              <p className="text-sm text-slate-400 mt-2">Formatos aceitos: .csv, .ofx</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".csv,.ofx"
              />
            </div>
          )}

          {parsing && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
              <p className="font-bold text-slate-500">Processando e categorizando...</p>
            </div>
          )}

          {error && (
            <div className="p-6 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl flex items-start gap-4">
              <AlertCircle className="text-rose-500 shrink-0" size={24} />
              <div>
                <h4 className="font-bold text-rose-700 dark:text-rose-400">Ops! Algo deu errado</h4>
                <p className="text-sm text-rose-600/80 dark:text-rose-400/80 mt-1">{error}</p>
                <button onClick={() => { setFile(null); setError(null); }} className="mt-4 text-xs font-black uppercase text-rose-600 hover:underline">Tentar novamente</button>
              </div>
            </div>
          )}

          {preview.length > 0 && !parsing && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-600 font-bold">
                  <CheckCircle size={20} />
                  {preview.length} transações prontas para revisão
                </div>
                <button onClick={() => { setFile(null); setPreview([]); }} className="text-xs font-bold text-slate-400 hover:text-rose-500 uppercase">Trocar arquivo</button>
              </div>

              <div className="bg-slate-50 dark:bg-zinc-950 rounded-3xl border dark:border-zinc-800 overflow-hidden">
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 dark:bg-zinc-800/50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 tracking-wider">Transação</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 tracking-wider text-right">Valor</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 tracking-wider">Categoria (Auto)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-zinc-800">
                      {preview.map((t, i) => (
                        <tr key={i} className="hover:bg-white dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-sm truncate max-w-[250px]">{t.description}</span>
                              <span className="text-[10px] text-slate-400 font-medium">{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className={`font-black text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {t.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded-xl px-2 py-1">
                              <Tag size={12} className="text-indigo-500" />
                              <select
                                value={t.category}
                                onChange={(e) => updateItemCategory(i, e.target.value as Category)}
                                className="bg-transparent border-none outline-none text-xs font-bold w-full cursor-pointer dark:text-zinc-200"
                              >
                                {Object.values(Category).map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-4 bg-indigo-50 dark:bg-indigo-500/5 rounded-2xl flex gap-3 border border-indigo-100 dark:border-indigo-500/10">
                <Info className="text-indigo-500 shrink-0" size={20} />
                <p className="text-xs text-indigo-700/70 dark:text-indigo-400/70 leading-relaxed font-medium">
                  Verifique as categorias atribuídas automaticamente acima. Você pode clicar no seletor para corrigir qualquer item antes de finalizar a importação.
                </p>
              </div>
            </div>
          )}
        </div>

        {preview.length > 0 && (
          <div className="p-8 border-t dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 flex gap-4">
            <button
              onClick={onClose}
              className="px-8 py-4 rounded-2xl font-black text-slate-400 hover:text-rose-500 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={() => onImport(preview)}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
            >
              Confirmar {preview.length} Lançamentos
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
