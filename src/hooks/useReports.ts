'use client';

import { Report } from '@/types/features';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export function useReports(userId?: string) {
  const queryClient = useQueryClient();

  const { data: reports = [] } = useQuery({
    queryKey: ['reports', userId],
    queryFn: async () => {
      const response = await fetch(`/api/reports?user_id=${userId}`);
      if (!response.ok) throw new Error('Erro ao buscar relatórios');
      return response.json();
    },
    enabled: !!userId,
  });

  const generateReport = useMutation({
    mutationFn: async (data: {
      type: 'monthly' | 'quarterly' | 'annual' | 'custom';
      period_start: string;
      period_end: string;
    }) => {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erro ao gerar relatório');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const exportPDF = async (report: Report) => {
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="padding: 20px; font-family: Arial;">
        <h1>${report.type.toUpperCase()}</h1>
        <p>${new Date(report.period_start).toLocaleDateString('pt-BR')} - ${new Date(report.period_end).toLocaleDateString('pt-BR')}</p>
        
        <h2>Resumo</h2>
        <p><strong>Receita Total:</strong> R$ ${report.summary.total_income.toFixed(2)}</p>
        <p><strong>Despesa Total:</strong> R$ ${report.summary.total_expense.toFixed(2)}</p>
        <p><strong>Saldo:</strong> R$ ${report.summary.net.toFixed(2)}</p>
        
        <h2>Por Categoria</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #f0f0f0;">
            <th style="border: 1px solid #ddd; padding: 8px;">Categoria</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Valor</th>
          </tr>
          ${Object.entries(report.summary.by_category).map(([cat, val]: any) => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${cat}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">R$ ${val.toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;

    const canvas = await html2canvas(element);
    const pdf = new jsPDF();
    const image = canvas.toDataURL('image/png');
    pdf.addImage(image, 'PNG', 10, 10, 190, 280);
    pdf.save(`relatorio-${report.type}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportCSV = (report: Report) => {
    let csv = 'Relatório,Período\n';
    csv += `${report.type.toUpperCase()},${new Date(report.period_start).toLocaleDateString('pt-BR')} - ${new Date(report.period_end).toLocaleDateString('pt-BR')}\n\n`;
    csv += 'Resumo Financeiro\n';
    csv += `Receita Total,R$ ${report.summary.total_income.toFixed(2)}\n`;
    csv += `Despesa Total,R$ ${report.summary.total_expense.toFixed(2)}\n`;
    csv += `Saldo,R$ ${report.summary.net.toFixed(2)}\n\n`;
    csv += 'Por Categoria\n';
    csv += 'Categoria,Valor\n';
    
    Object.entries(report.summary.by_category).forEach(([cat, val]: any) => {
      csv += `${cat},R$ ${val.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${report.type}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return {
    reports,
    generateReport: generateReport.mutateAsync,
    isGenerating: generateReport.isPending,
    exportPDF,
    exportCSV,
  };
}
