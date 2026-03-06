import { describe, expect, it } from "vitest";
import {
  normalizeSourceBank,
  parseImportedTransactions,
  transactionDedupKey
} from "./import-utils.js";

function normalizeCategoryName(value) {
  return String(value || "Outros").trim() || "Outros";
}

describe("import-utils", () => {
  it("aceita formato com transactions wrapper e aplica data fallback", () => {
    const raw = JSON.stringify({
      transactions: [
        {
          date: null,
          description: "PAGAMENTO DE BOLETO",
          amount: 100.5,
          category: "Contas",
          source: "mercadopagoopen_finance"
        }
      ]
    });

    const result = parseImportedTransactions(raw, {
      sourceBank: "Mercado Pago",
      normalizeCategoryName
    });

    expect(result.transactions.length).toBe(1);
    expect(result.transactions[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.transactions[0].type).toBe("expense");
    expect(result.transactions[0].source_bank).toBe("Mercado Pago Open Finance");
    expect(result.stats.missingDateRecords).toBe(1);
  });

  it("parseia csv com delimitador dentro de aspas", () => {
    const raw = [
      "date,description,amount,type,category",
      "2026-03-01,\"Compra, mercado\",32.30,expense,Alimentacao"
    ].join("\n");

    const result = parseImportedTransactions(raw, {
      sourceBank: "Nubank",
      normalizeCategoryName
    });

    expect(result.transactions.length).toBe(1);
    expect(result.transactions[0].description).toBe("Compra, mercado");
  });

  it("normaliza alias de source bank", () => {
    expect(normalizeSourceBank("mercadopagoopenfinance")).toBe("Mercado Pago Open Finance");
    expect(normalizeSourceBank("mercadopagoopen_finance")).toBe("Mercado Pago Open Finance");
  });

  it("parseia texto extraido de PDF de extrato", () => {
    const raw = [
      "01/03/2026 PIX RECEBIDO JOAO 250,00 1.230,45 C",
      "02/03/2026 COMPRA CARTAO SUPERMERCADO 89,90 1.140,55 D"
    ].join("\n");

    const result = parseImportedTransactions(raw, {
      sourceBank: "Sicoob",
      normalizeCategoryName
    });

    expect(result.format).toBe("pdf");
    expect(result.transactions.length).toBe(2);
    expect(result.transactions[0].type).toBe("income");
    expect(result.transactions[1].type).toBe("expense");
    expect(result.transactions[0].source_bank).toBe("Sicoob");
  });

  it("parseia pdf tokenizado com quebra por palavra", () => {
    const raw = [
      "01/03/2026",
      "PIX",
      "RECEBIDO",
      "CLIENTE",
      "150,00",
      "1.200,00",
      "C",
      "02/03/2026",
      "PAGAMENTO",
      "BOLETO",
      "79,90",
      "1.120,10",
      "D"
    ].join("\n");

    const result = parseImportedTransactions(raw, {
      sourceBank: "PicPay",
      normalizeCategoryName
    });

    expect(result.format).toBe("pdf");
    expect(result.transactions.length).toBe(2);
    expect(result.transactions[0].type).toBe("income");
    expect(result.transactions[1].type).toBe("expense");
  });

  it("parseia comprovante pdf como lancamento unico", () => {
    const raw = [
      "Comprovante Pix",
      "Data: 06/03/2026",
      "Destinatario: Loja Centro",
      "Valor: R$ 45,90"
    ].join("\n");

    const result = parseImportedTransactions(raw, {
      sourceBank: "PicPay",
      normalizeCategoryName
    });

    expect(result.format).toBe("pdf");
    expect(result.transactions.length).toBe(1);
    expect(result.transactions[0].description).toContain("Loja Centro");
    expect(result.transactions[0].amount).toBe(45.9);
  });

  it("parseia comprovante pdf com valor em ponto decimal", () => {
    const raw = [
      "Comprovante de Pagamento",
      "Data: 06-03-2026",
      "Favorecido: Energia Local",
      "Valor total: R$ 123.45"
    ].join("\n");

    const result = parseImportedTransactions(raw, {
      sourceBank: "Sicoob",
      normalizeCategoryName,
      sourceFormatHint: "pdf"
    });

    expect(result.format).toBe("pdf");
    expect(result.transactions.length).toBe(1);
    expect(result.transactions[0].amount).toBe(123.45);
  });

  it("parseia pdf sem palavra-chave via fallback flexivel", () => {
    const raw = [
      "Documento de transacao",
      "Data 06/03/2026",
      "Favorecido: Mercado Central",
      "R$ 32,90"
    ].join("\n");

    const result = parseImportedTransactions(raw, {
      sourceBank: "PicPay",
      normalizeCategoryName,
      sourceFormatHint: "pdf"
    });

    expect(result.format).toBe("pdf");
    expect(result.transactions.length).toBe(1);
    expect(result.transactions[0].amount).toBe(32.9);
  });

  it("nao trata texto comum como csv", () => {
    const raw = [
      "Comprovante",
      "Documento sem cabecalho csv",
      "Sem colunas validas"
    ].join("\n");

    const result = parseImportedTransactions(raw, {
      sourceBank: "Sicoob",
      normalizeCategoryName
    });

    expect(result.format).toBe("csv");
    expect(result.stats.totalRecords).toBe(0);
    expect(result.transactions.length).toBe(0);
  });

  it("limita descricao importada para evitar erro de banco", () => {
    const longDescription = "X".repeat(400);
    const raw = JSON.stringify([
      {
        date: "2026-03-06",
        description: longDescription,
        amount: 10,
        type: "expense",
        category: "Outros"
      }
    ]);

    const result = parseImportedTransactions(raw, {
      sourceBank: "Sicoob",
      normalizeCategoryName
    });

    expect(result.transactions.length).toBe(1);
    expect(result.transactions[0].description.length).toBeLessThanOrEqual(240);
  });

  it("normaliza data dd-mm-aaaa e com horario", () => {
    const raw = JSON.stringify([
      {
        date: "06-03-2026 13:31:50",
        description: "Teste data",
        amount: 20,
        type: "expense",
        category: "Outros"
      }
    ]);

    const result = parseImportedTransactions(raw, {
      sourceBank: "PicPay",
      normalizeCategoryName
    });

    expect(result.transactions.length).toBe(1);
    expect(result.transactions[0].date).toBe("2026-03-06");
  });

  it("parseia varias linhas de pdf com data sem ano", () => {
    const raw = [
      "Extrato PicPay 2026",
      "01/03 PIX recebido Maria 80,00",
      "02/03 Pagamento boleto Energia 120,50",
      "03/03 Compra mercado 45,30"
    ].join("\n");

    const result = parseImportedTransactions(raw, {
      sourceBank: "PicPay",
      normalizeCategoryName,
      sourceFormatHint: "pdf"
    });

    expect(result.format).toBe("pdf");
    expect(result.transactions.length).toBe(3);
    expect(result.transactions[0].date).toBe("2026-03-01");
    expect(result.transactions[1].date).toBe("2026-03-02");
    expect(result.transactions[2].date).toBe("2026-03-03");
  });

  it("parseia layout de linha do tempo do PicPay", () => {
    const raw = [
      "PicPay",
      "07 de fevereiro 2026",
      "18:28 Pix recebido +R$ 120,00 Joao Silva",
      "08:23 Pix enviado -R$ 35,40 Mercado Central"
    ].join("\n");

    const result = parseImportedTransactions(raw, {
      sourceBank: "PicPay",
      normalizeCategoryName,
      sourceFormatHint: "pdf"
    });

    expect(result.format).toBe("pdf");
    expect(result.transactions.length).toBe(2);
    expect(result.transactions[0].date).toBe("2026-02-07");
    expect(result.transactions[0].type).toBe("income");
    expect(result.transactions[1].type).toBe("expense");
  });

  it("parseia extrato bancario com valor final D/C", () => {
    const raw = [
      "HISTORICO DE MOVIMENTACAO",
      "DATA HISTORICO VALOR",
      "12/02 DEB.CONV.DEM.EMPRES 13,20D",
      "12/02 EST.DEB.CONV.DEM.EM 13,20C",
      "12/02 SALDO DO DIA 0,00C"
    ].join("\n");

    const result = parseImportedTransactions(raw, {
      sourceBank: "Sicoob",
      normalizeCategoryName,
      sourceFormatHint: "pdf"
    });

    expect(result.format).toBe("pdf");
    expect(result.transactions.length).toBe(2);
    expect(result.transactions[0].type).toBe("expense");
    expect(result.transactions[1].type).toBe("income");
  });

  it("gera chave de deduplicacao deterministica", () => {
    const tx = {
      date: "2026-03-01",
      description: "PIX Enviado",
      amount: 20,
      type: "expense",
      source_bank: "Nubank"
    };

    const keyA = transactionDedupKey(tx);
    const keyB = transactionDedupKey({ ...tx });
    expect(keyA).toBe(keyB);
  });
});
