import { describe, expect, it } from "vitest";
import {
  buildProjectionSeries,
  calculateFinancialScore,
  calculateTotals,
  detectOutlierExpenses,
  projectEndMonthBalance
} from "./financial-engine.js";

describe("financial-engine", () => {
  it("calcula totais de receitas e despesas", () => {
    const totals = calculateTotals([
      { type: "income", amount: 3000 },
      { type: "expense", amount: 1200 },
      { type: "expense", amount: 300 }
    ]);

    expect(totals.income).toBe(3000);
    expect(totals.expense).toBe(1500);
    expect(totals.balance).toBe(1500);
  });

  it("gera serie de projeção acumulada", () => {
    const projection = buildProjectionSeries(1000, 200, 4);
    expect(projection).toEqual([1200, 1400, 1600, 1800]);
  });

  it("retorna score financeiro dentro da faixa 0-100", () => {
    const score = calculateFinancialScore({
      savingsRate: 22,
      budgetExceeded: 0,
      budgetWarning: 1,
      transactionCount: 24
    });

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBeGreaterThan(60);
  });

  it("detecta gasto anômalo no conjunto", () => {
    const outliers = detectOutlierExpenses([
      { amount: 120 },
      { amount: 130 },
      { amount: 140 },
      { amount: 150 },
      { amount: 1100 }
    ]);

    expect(outliers.length).toBe(1);
    expect(outliers[0].amount).toBe(1100);
  });

  it("projeta saldo final do mês por média diária", () => {
    const projected = projectEndMonthBalance({ monthBalance: 900, currentDay: 15, totalDays: 30 });
    expect(projected).toBe(1800);
  });
});
