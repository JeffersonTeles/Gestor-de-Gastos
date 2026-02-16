'use client';

import { Topbar } from '@/components/layout/Topbar';
import { useAuth } from '@/hooks/useAuth';
import { useReports } from '@/hooks/useReports';
import { Report } from '@/types/features';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

export default function ReportsPage() {
  const { user } = useAuth();
  const { reports, generateReport, isGenerating, exportPDF, exportCSV } = useReports(user?.id);
  
  const [type, setType] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [startDate, setStartDate] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );

  const handleGenerateReport = async () => {
    try {
      await generateReport({
        type,
        period_start: startDate,
        period_end: endDate,
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    }
  };

  return (
    <>
      <Topbar
        title="Relatórios Financeiros"
        subtitle="Análise completa de suas finanças"
      />

      <div className="app-content bg-neutral-50 dark:bg-neutral-900 flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Gerador de Relatórios */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-sm border border-neutral-200 dark:border-neutral-700">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
              Gerar Novo Relatório
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-2">
                  Tipo
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                >
                  <option value="monthly">Mensal</option>
                  <option value="quarterly">Trimestral</option>
                  <option value="annual">Anual</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-2">
                  De
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-2">
                  Até
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {isGenerating ? 'Gerando...' : 'Gerar'}
                </button>
              </div>
            </div>
          </div>

          {/* Lista de Relatórios */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              Relatórios Gerados
            </h2>

            {reports.length > 0 ? (
              reports.map((report: Report) => (
                <div
                  key={report.id}
                  className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-sm border border-neutral-200 dark:border-neutral-700"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-neutral-900 dark:text-white">
                        Relatório {report.type.toUpperCase()}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                        {format(new Date(report.period_start), 'd \'de\' MMMM', { locale: ptBR })} até{' '}
                        {format(new Date(report.period_end), 'd \'de\' MMMM \'de\' yyyy', { locale: ptBR })}
                      </p>
                    </div>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {format(new Date(report.generated_at), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-y border-neutral-200 dark:border-neutral-700">
                    <div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">Receitas</p>
                      <p className="text-lg font-bold text-green-600">
                        R$ {report.summary.total_income.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">Despesas</p>
                      <p className="text-lg font-bold text-red-600">
                        R$ {report.summary.total_expense.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">Saldo</p>
                      <p
                        className={`text-lg font-bold ${
                          report.summary.net >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        R$ {report.summary.net.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => exportPDF(report)}
                      className="flex-1 px-4 py-2 bg-danger-100 dark:bg-danger-900/30 text-danger-600 rounded-lg hover:bg-danger-200 dark:hover:bg-danger-900/50 text-sm font-medium"
                    >
                      Exportar PDF
                    </button>
                    <button
                      onClick={() => exportCSV(report)}
                      className="flex-1 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 text-sm font-medium"
                    >
                      Exportar CSV
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-neutral-600 dark:text-neutral-400">
                Nenhum relatório gerado ainda. Crie um novo relatório acima.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
