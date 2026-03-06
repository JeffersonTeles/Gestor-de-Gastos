export function parseImportedTransactions(raw, options) {
  const { sourceBank, normalizeCategoryName, sourceFormatHint = "" } = options;
  const trimmed = sanitizeImportedRaw(String(raw || "").trim());
  let records = [];
  let format = "unknown";

  if (sourceFormatHint === "pdf") {
    records = parsePdfTextRecords(trimmed, { allowLooseFallback: true });
    format = "pdf";
  } else if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    records = parseJsonRecords(trimmed);
    format = "json";
  } else if (trimmed.includes("<OFX") || trimmed.includes("<STMTTRN>")) {
    records = parseOfxRecords(trimmed);
    format = "ofx";
  } else {
    if (looksLikeCsvInput(trimmed)) {
      records = parseCsvRecords(trimmed);
      format = "csv";
    } else {
      const pdfRecords = parsePdfTextRecords(trimmed, { allowLooseFallback: false });
      if (pdfRecords.length > 0) {
        records = pdfRecords;
        format = "pdf";
      } else {
        records = parseCsvRecords(trimmed);
        format = "csv";
      }
    }
  }

  const stats = {
    totalRecords: records.length,
    missingDateRecords: 0,
    invalidRecords: 0
  };

  const transactions = records
    .map((record, index) => normalizeImportedRecord(record, sourceBank, normalizeCategoryName, index, stats))
    .filter(Boolean);

  return { transactions, stats, format };
}

export function normalizeSourceBank(value) {
  const source = String(value || "").trim();
  if (!source) return "";

  const collapsed = source
    .replace(/[_|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const key = collapsed.toLowerCase().replace(/\s+/g, "");
  const aliases = {
    mercadopagoopenfinance: "Mercado Pago Open Finance",
    mercadopagoof: "Mercado Pago Open Finance",
    picpayopenfinance: "PicPay Open Finance",
    nubankopenfinance: "Nubank Open Finance"
  };

  return (aliases[key] || collapsed).slice(0, 40);
}

export function transactionDedupKey(tx) {
  return `${tx.date}|${String(tx.description || "").toLowerCase()}|${Number(tx.amount).toFixed(2)}|${tx.type}`;
}

function sanitizeImportedRaw(raw) {
  if (raw.startsWith('transactions":[') || raw.startsWith("transactions':[") || raw.startsWith("transactions:[")) {
    return `{${raw}}`;
  }
  return raw;
}

function looksLikeCsvInput(raw) {
  const firstLine = String(raw || "").split(/\r?\n/).find((line) => line.trim().length > 0) || "";
  const normalized = normalizeFieldName(firstLine);
  if (!normalized) return false;

  const csvHeaderHints = ["date", "data", "description", "descricao", "amount", "valor", "type", "tipo", "category", "categoria"];
  const hasDelimiter = firstLine.includes(",") || firstLine.includes(";");
  return hasDelimiter && csvHeaderHints.some((hint) => normalized.includes(hint));
}

function parseJsonRecords(raw) {
  const data = JSON.parse(raw);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.transactions)) return data.transactions;
  throw new Error("JSON invalido: esperado array ou objeto com transactions[].");
}

function parseCsvRecords(raw) {
  const rows = parseCsvMatrix(raw);
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => normalizeFieldName(h));
  if (headers.length < 2) return [];

  const hasKnownHeader = headers.some((key) => [
    "date", "data", "description", "descricao", "amount", "valor", "type", "tipo", "category", "categoria"
  ].includes(key));
  if (!hasKnownHeader) return [];

  return rows.slice(1).map((rowData) => {
    const row = {};
    headers.forEach((key, idx) => {
      row[key] = rowData[idx] || "";
    });
    return row;
  });
}

function parseCsvMatrix(raw) {
  const lines = raw.split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length === 0) return [];

  const separator = detectCsvSeparator(lines[0]);
  const rows = [];
  let row = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];
    const next = raw[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === separator && !inQuotes) {
      row.push(current.trim());
      current = "";
      continue;
    }

    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") {
        i += 1;
      }
      row.push(current.trim());
      current = "";
      if (row.some((part) => part !== "")) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    current += ch;
  }

  row.push(current.trim());
  if (row.some((part) => part !== "")) {
    rows.push(row);
  }

  return rows;
}

function detectCsvSeparator(headerLine) {
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  const commaCount = (headerLine.match(/,/g) || []).length;
  return semicolonCount >= commaCount ? ";" : ",";
}

function parseOfxRecords(raw) {
  const blocks = raw.match(/<STMTTRN>[\s\S]*?(?=<STMTTRN>|$)/gi) || [];
  return blocks.map((block) => ({
    date: extractOfxTag(block, "DTPOSTED"),
    amount: extractOfxTag(block, "TRNAMT"),
    description: extractOfxTag(block, "MEMO") || extractOfxTag(block, "NAME"),
    type: extractOfxTag(block, "TRNTYPE"),
    category: "Outros"
  }));
}

function parsePdfTextRecords(raw, options = {}) {
  const { allowLooseFallback = false } = options;
  const normalized = String(raw || "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  if (!normalized) return [];

  const contextYear = inferYearFromText(normalized);

  const picpayRecords = parsePicPayTimelineRecords(normalized, contextYear);
  if (picpayRecords.length > 0) return picpayRecords;

  const bankStatementRecords = parseBrazilianBankStatementRecords(normalized, contextYear);
  if (bankStatementRecords.length > 0) return bankStatementRecords;

  const lineRecords = parsePdfTextRecordsFromLines(normalized, contextYear);
  if (lineRecords.length > 0) return lineRecords;

  const tokenRecords = parsePdfTextRecordsFromTokens(normalized, contextYear);
  if (tokenRecords.length > 0) return tokenRecords;

  const receiptRecord = parsePdfReceiptRecord(normalized, contextYear);
  if (receiptRecord) return [receiptRecord];

  if (!allowLooseFallback) return [];

  const looseRecord = parsePdfLooseRecord(normalized);
  return looseRecord ? [looseRecord] : [];
}

function parsePdfReceiptRecord(raw, contextYear) {
  const normalized = String(raw || "");
  if (!/comprovante|pix|transferencia|pagamento|recibo|transacao/i.test(normalized)) {
    return null;
  }

  const dateMatch = normalized.match(/\b(\d{2}[/.-]\d{2}(?:[/.-]\d{4})?)\b/);
  const date = normalizePdfDateToken(dateMatch?.[1] || "", contextYear);

  const amountLabeled = normalized.match(/(?:valor|total)\s*[:-]?\s*(r\$\s*)?(-?(?:\d{1,3}(?:[.\s]\d{3})+|\d+)(?:[.,]\d{2})-?)/i);
  const amountAny = normalized.match(/(r\$\s*)?(-?(?:\d{1,3}(?:[.\s]\d{3})+|\d+)(?:[.,]\d{2})-?)/i);
  const amountText = amountLabeled?.[2] || amountAny?.[2] || "";
  const amount = parseLocalizedAmount(amountText);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const description = pickReceiptDescription(normalized);
  const type = inferTypeFromPdfLine(normalized);

  return {
    date,
    description,
    amount,
    type,
    category: "Outros"
  };
}

function parsePdfLooseRecord(raw) {
  const text = String(raw || "");
  const dateMatch = text.match(/\b(\d{2}[/.-]\d{2}[/.-]\d{4})\b/);
  const date = dateMatch ? dateMatch[1].replace(/[.-]/g, "/") : "";

  const amountTokens = text.match(/-?(?:\d{1,3}(?:[.\s]\d{3})+|\d+)(?:[.,]\d{2})-?/g) || [];
  if (!amountTokens.length) return null;

  // In comprovantes, the largest monetary token is usually the transaction value.
  const amountCandidates = amountTokens
    .map((token) => parseLocalizedAmount(token))
    .filter((num) => Number.isFinite(num) && num > 0)
    .sort((a, b) => b - a);

  if (!amountCandidates.length) return null;

  const amount = amountCandidates[0];
  const description = pickReceiptDescription(text);
  const type = inferTypeFromPdfLine(text);

  return {
    date,
    description,
    amount,
    type,
    category: "Outros"
  };
}

function parsePicPayTimelineRecords(raw, contextYear) {
  const text = String(raw || "");
  if (!/\bpicpay\b|pix\s+recebido|pix\s+enviado|saldo\s+ao\s+final\s+do\s+dia/i.test(text)) {
    return [];
  }

  const monthMap = {
    janeiro: "01",
    fevereiro: "02",
    marco: "03",
    março: "03",
    abril: "04",
    maio: "05",
    junho: "06",
    julho: "07",
    agosto: "08",
    setembro: "09",
    outubro: "10",
    novembro: "11",
    dezembro: "12"
  };

  const normalized = text.replace(/\s+/g, " ");
  const dateRe = /(\d{1,2})\s+de\s+([a-zçãé]+)\s+(\d{4})/gi;
  const ranges = [];
  let match;
  while ((match = dateRe.exec(normalized)) !== null) {
    const day = String(Number(match[1])).padStart(2, "0");
    const month = monthMap[(match[2] || "").toLowerCase()] || "";
    const year = match[3] || String(contextYear);
    if (!month) continue;
    ranges.push({
      start: match.index + match[0].length,
      date: `${year}-${month}-${day}`
    });
  }

  if (!ranges.length) return [];

  const records = [];
  for (let i = 0; i < ranges.length; i += 1) {
    const start = ranges[i].start;
    const end = i + 1 < ranges.length ? ranges[i + 1].start : normalized.length;
    const segment = normalized.slice(start, end);
    const date = ranges[i].date;

    const timeMatches = [...segment.matchAll(/\b\d{2}:\d{2}\b/g)];
    if (!timeMatches.length) continue;

    for (let t = 0; t < timeMatches.length; t += 1) {
      const timeToken = timeMatches[t][0];
      const timeIndex = timeMatches[t].index || 0;
      const nextIndex = t + 1 < timeMatches.length ? (timeMatches[t + 1].index || segment.length) : segment.length;
      const chunk = segment.slice(timeIndex, nextIndex);

      const amountMatch = chunk.match(/([+\-−]\s*R\$\s*\d{1,3}(?:\.\d{3})*,\d{2})/i)
        || chunk.match(/(R\$\s*\d{1,3}(?:\.\d{3})*,\d{2})/i);
      if (!amountMatch) continue;

      const amountToken = amountMatch[1] || "";
      const amount = parseLocalizedAmount(amountToken);
      if (!Number.isFinite(amount) || Math.abs(amount) <= 0) continue;

      const rawDescription = chunk
        .replace(timeToken, "")
        .replace(amountToken, "")
        .replace(/\bcom\s+saldo\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();

      const description = sanitizeImportedDescription(rawDescription || "Lancamento PicPay");
      if (!description) continue;
      const explicitSign = amountToken.match(/[+\-−]/)?.[0] || "";
      const type = explicitSign === "+"
        ? "income"
        : (explicitSign === "-" || explicitSign === "−")
          ? "expense"
          : inferTypeFromPdfLine(description);

      records.push({
        date,
        description,
        amount,
        type,
        category: "Outros"
      });
    }
  }

  return records;
}

function parseBrazilianBankStatementRecords(raw, contextYear) {
  const text = String(raw || "");
  if (!/historico\s+de\s+movimentacao|data\s+historico\s+valor|extrato\s+conta\s+corrente/i.test(text)) {
    return [];
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const records = [];
  for (const line of lines) {
    const match = line.match(/^(\d{2}[/.-]\d{2})\s+(.+?)\s+(-?\d{1,3}(?:\.\d{3})*,\d{2})([CD])$/i);
    if (!match) continue;

    const [, dateToken, descriptionRaw, amountToken, signal] = match;
    if (/^saldo\b|resumo|cheque\s+especial|encargos|informacoes|vencimento|taxa/i.test(descriptionRaw)) {
      continue;
    }

    const date = normalizePdfDateToken(dateToken, contextYear);
    const amount = parseLocalizedAmount(amountToken);
    const description = sanitizeImportedDescription(descriptionRaw);
    if (!date || !description || !Number.isFinite(amount) || amount <= 0) continue;

    records.push({
      date,
      description,
      amount,
      type: String(signal).toUpperCase() === "D" ? "expense" : "income",
      category: "Outros"
    });
  }

  return records;
}

function pickReceiptDescription(raw) {
  const candidates = [
    /descricao\s*[:-]\s*([^\n]+)/i,
    /historico\s*[:-]\s*([^\n]+)/i,
    /destinatario\s*[:-]\s*([^\n]+)/i,
    /favorecido\s*[:-]\s*([^\n]+)/i,
    /para\s*[:-]\s*([^\n]+)/i
  ];

  for (const regex of candidates) {
    const match = String(raw || "").match(regex);
    if (match?.[1]) {
      const cleaned = match[1].replace(/\s+/g, " ").trim();
      if (cleaned) return cleaned.slice(0, 120);
    }
  }

  if (/pix/i.test(raw)) return "Comprovante PIX";
  if (/pagamento/i.test(raw)) return "Comprovante de pagamento";
  if (/transferencia/i.test(raw)) return "Comprovante de transferencia";
  return "Comprovante importado (PDF)";
}

function parsePdfTextRecordsFromLines(raw, contextYear) {
  const lines = raw
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const records = [];

  lines.forEach((line) => {
    const dateMatch = line.match(/\b(\d{2}[/.-]\d{2}(?:[/.-]\d{4})?)\b/);
    if (!dateMatch) return;
    if (isLikelyStatementHeader(line)) return;

    const amountTokens = line.match(/-?(?:\d{1,3}(?:[.\s]\d{3})+|\d+)(?:[.,]\d{2})-?/g) || [];
    if (amountTokens.length === 0) return;

    const amountToken = amountTokens.length >= 2 ? amountTokens[amountTokens.length - 2] : amountTokens[0];
    const amount = parseLocalizedAmount(amountToken);
    if (!Number.isFinite(amount) || amount <= 0) return;

    const date = normalizePdfDateToken(dateMatch[1], contextYear);
    if (!date) return;
    const afterDate = line.slice(line.indexOf(dateMatch[1]) + dateMatch[1].length).trim();
    const description = cleanupPdfDescription(afterDate) || "Lancamento importado (PDF)";
    const typeHint = inferTypeFromPdfLine(afterDate);

    records.push({
      date,
      description,
      amount,
      type: typeHint,
      category: "Outros"
    });
  });

  return records;
}

function parsePdfTextRecordsFromTokens(raw, contextYear) {
  const tokens = raw
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  const records = [];
  const dateRegex = /^\d{2}[/.-]\d{2}(?:[/.-]\d{4})?$/;
  const dateIndexes = [];

  tokens.forEach((token, index) => {
    if (dateRegex.test(token)) {
      dateIndexes.push(index);
    }
  });

  for (let i = 0; i < dateIndexes.length; i += 1) {
    const start = dateIndexes[i];
    const end = i + 1 < dateIndexes.length ? dateIndexes[i + 1] : tokens.length;
    const chunk = tokens.slice(start, end);
    if (chunk.length < 3) continue;

    const dateToken = normalizePdfDateToken(chunk[0], contextYear);
    if (!dateToken) continue;
    const payload = chunk.slice(1);
    const joined = payload.join(" ");
    if (isLikelyStatementHeader(joined)) continue;

    const amountCandidates = payload.filter((token) => /-?(?:\d{1,3}(?:[.\s]\d{3})+|\d+)(?:[.,]\d{2})-?/.test(token));
    if (!amountCandidates.length) continue;

    const amountToken = amountCandidates.length >= 2
      ? amountCandidates[amountCandidates.length - 2]
      : amountCandidates[0];
    const amount = parseLocalizedAmount(amountToken);
    if (!Number.isFinite(amount) || amount <= 0) continue;

    const description = cleanupPdfDescription(joined) || "Lancamento importado (PDF)";
    const typeHint = inferTypeFromPdfLine(joined);

    records.push({
      date: dateToken,
      description,
      amount,
      type: typeHint,
      category: "Outros"
    });
  }

  return records;
}

function normalizePdfDateToken(token, contextYear) {
  const raw = String(token || "").trim();
  if (!raw) return "";

  const normalized = raw.replace(/[.-]/g, "/");
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(normalized)) return normalized;

  if (/^\d{2}\/\d{2}$/.test(normalized)) {
    const year = contextYear || new Date().getFullYear();
    return `${normalized}/${year}`;
  }

  return "";
}

function inferYearFromText(raw) {
  const years = String(raw || "").match(/\b20\d{2}\b/g) || [];
  if (!years.length) return new Date().getFullYear();
  const unique = [...new Set(years.map((value) => Number(value)).filter((value) => Number.isFinite(value)))];
  return unique.sort((a, b) => b - a)[0] || new Date().getFullYear();
}

function isLikelyStatementHeader(text) {
  return /data\s+lancamento|historico|descricao|saldo\s+anterior|saldo\s+atual|pagina\s+\d+/i.test(String(text || ""));
}

function cleanupPdfDescription(text) {
  return String(text || "")
    .replace(/-?(?:\d{1,3}(?:[.\s]\d{3})+|\d+)(?:[.,]\d{2})-?/g, "")
    .replace(/\b[CD]\b$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inferTypeFromPdfLine(text) {
  const normalized = String(text || "").toLowerCase();
  if (/\bcredito\b|\brecebido\b|pix recebido|deposito|rendimento|estorno/.test(normalized)) {
    return "income";
  }

  if (/\bdebito\b|\bpagamento\b|compra|pix enviado|boleto|tarifa|saque/.test(normalized)) {
    return "expense";
  }

  if (/\bc\b\s*$/.test(normalized)) return "income";
  if (/\bd\b\s*$/.test(normalized)) return "expense";

  return "expense";
}

function extractOfxTag(block, tag) {
  const regex = new RegExp(`<${tag}>([^\r\n<]+)`, "i");
  const match = block.match(regex);
  return match ? match[1].trim() : "";
}

function normalizeImportedRecord(record, sourceBank, normalizeCategoryName, index, stats) {
  const date = normalizeImportedDate(record.date || record.data || record.dtposted || record.data_lancamento);
  const description = sanitizeImportedDescription(record.description || record.descricao || record.memo || record.name || "");
  const amountRaw = record.amount || record.valor || record.trnamt;
  const amount = parseLocalizedAmount(amountRaw);
  const absoluteAmount = Math.abs(amount);
  const type = normalizeImportedType(record.type || record.tipo || record.trntype, amount, description);
  const category = normalizeCategoryName(String(record.category || record.categoria || "Outros"));
  const recordSource = normalizeSourceBank(record.source_bank || record.source || record.origem || "");
  const effectiveSource = recordSource || sourceBank || "Importado";

  if (!description || !Number.isFinite(amount) || absoluteAmount <= 0) {
    stats.invalidRecords += 1;
    return null;
  }

  if (!date) stats.missingDateRecords += 1;
  const resolvedDate = date || new Date().toISOString().slice(0, 10);

  return {
    id: crypto.randomUUID(),
    date: resolvedDate,
    description,
    amount: absoluteAmount,
    type,
    category,
    source_bank: effectiveSource,
    import_hash: createImportHash(
      { date: resolvedDate, description, amount: Math.abs(amount), type, sourceBank: effectiveSource },
      index
    )
  };
}

function sanitizeImportedDescription(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.slice(0, 240);
}

function normalizeImportedDate(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  const compact = text
    .replace(/[T\s].*$/, "")
    .replace(/[.]/g, "/")
    .replace(/-/g, "/");

  if (/^\d{4}[-/]\d{2}[-/]\d{2}$/.test(text)) {
    const parts = text.replace(/\//g, "-").split("-");
    return `${parts[0]}-${parts[1]}-${parts[2]}`;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(compact)) {
    const [dd, mm, yyyy] = compact.split("/");
    return `${yyyy}-${mm}-${dd}`;
  }

  if (/^\d{8}/.test(text)) {
    const raw = text.slice(0, 8);
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  }

  const parsed = new Date(text.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function parseLocalizedAmount(value) {
  const text = String(value ?? "").trim().replace(/[−–—]/g, "-");
  if (!text) return Number.NaN;

  const trailingNegative = /-$/.test(text);
  const cleaned = text
    .replace(/\s/g, "")
    .replace(/R\$/gi, "")
    .replace(/[()]/g, "")
    .replace(/-$/, "")
    .replace(/[^\d,.-]/g, "");
  let normalized = cleaned;

  if (cleaned.includes(",") && cleaned.includes(".")) {
    normalized = cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")
      ? cleaned.replace(/\./g, "").replace(",", ".")
      : cleaned.replace(/,/g, "");
  } else if (cleaned.includes(",")) {
    normalized = cleaned.replace(/\./g, "").replace(/,/g, ".");
  }

  const num = Number(trailingNegative ? `-${normalized}` : normalized);
  return Number.isFinite(num) ? num : Number.NaN;
}

function normalizeImportedType(typeValue, amount, description = "") {
  const raw = String(typeValue || "").toLowerCase();
  if (raw.includes("income") || raw.includes("receita") || raw.includes("credit") || raw === "dep") return "income";
  if (raw.includes("expense") || raw.includes("despesa") || raw.includes("debit") || raw === "debit") return "expense";
  if (amount < 0) return "expense";

  const text = String(description || "").toLowerCase();
  const expenseHints = ["pagamento", "pix enviado", "compra", "debito", "fatura", "boleto", "saque"];
  const incomeHints = ["salario", "pix recebido", "recebido", "rendimento", "deposito", "estorno"];

  if (expenseHints.some((hint) => text.includes(hint))) return "expense";
  if (incomeHints.some((hint) => text.includes(hint))) return "income";

  return "expense";
}

function normalizeFieldName(field) {
  return String(field || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function createImportHash(data, salt = 0) {
  const base = `${data.date}|${data.description.toLowerCase()}|${data.amount.toFixed(2)}|${data.type}|${data.sourceBank}|${salt}`;
  let hash = 0;
  for (let i = 0; i < base.length; i += 1) {
    hash = ((hash << 5) - hash) + base.charCodeAt(i);
    hash |= 0;
  }
  return `imp_${Math.abs(hash)}`;
}
