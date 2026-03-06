export function normalizeCategoryName(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 30)
    .replace(/^./, (char) => char.toUpperCase());
}

export function normalizeTransaction(tx) {
  const date = normalizeTransactionDate(tx.date);
  return {
    id: String(tx.id),
    description: String(tx.description || "").trim(),
    amount: Number(tx.amount) || 0,
    date,
    type: tx.type === "income" ? "income" : "expense",
    category: normalizeCategoryName(String(tx.category || "Outros")),
    source_bank: String(tx.source_bank || "Manual"),
    import_hash: tx.import_hash ? String(tx.import_hash) : null,
    import_batch_id: tx.import_batch_id ? String(tx.import_batch_id) : null,
    import_source_format: tx.import_source_format ? String(tx.import_source_format) : null,
    imported_at: tx.imported_at ? String(tx.imported_at) : null,
    pending_sync: Boolean(tx.pending_sync)
  };
}

function normalizeTransactionDate(value) {
  const text = String(value || "").trim();
  if (!text || text === "null" || text === "undefined") {
    return new Date().toISOString().slice(0, 10);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  if (/^\d{2}[./-]\d{2}[./-]\d{4}/.test(text)) {
    const [datePart] = text.split(/[T\s]/);
    const [dd, mm, yyyy] = datePart.replace(/[.-]/g, "/").split("/");
    if (yyyy && mm && dd) return `${yyyy}-${mm}-${dd}`;
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return parsed.toISOString().slice(0, 10);
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatDate(dateText) {
  const text = String(dateText || "").trim();
  if (!text) return "--/--/----";

  let normalized = text;
  if (/^\d{2}[./-]\d{2}[./-]\d{4}/.test(text)) {
    const [datePart] = text.split(/[T\s]/);
    const [dd, mm, yyyy] = datePart.replace(/[.-]/g, "/").split("/");
    normalized = `${yyyy}-${mm}-${dd}`;
  }

  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(normalized)
    ? new Date(`${normalized}T00:00:00`)
    : new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return "--/--/----";

  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

export function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

export function csvEscape(value) {
  const text = String(value ?? "");
  if (!text.includes(",") && !text.includes('"') && !text.includes("\n")) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

export function cssEscape(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

export function toBrazilianNumber(value) {
  return Number(value || 0).toFixed(2).replace(".", ",");
}

export function downloadTextFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
