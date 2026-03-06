export function loadTransactions(storageKey, normalizeTransaction) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeTransaction)
      .filter((tx) => tx.id && tx.description && tx.date && Number.isFinite(tx.amount));
  } catch {
    return [];
  }
}

export function loadGoals(storageKey) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "{}");
    const hasCurrentBalanceFlag = typeof parsed.currentBalanceSet === "boolean";
    const currentBalanceParsed = Number(parsed.currentBalance);
    return {
      expenseLimit: Number(parsed.expenseLimit) || 0,
      savingsGoal: Number(parsed.savingsGoal) || 0,
      currentBalance: Number.isFinite(currentBalanceParsed) ? currentBalanceParsed : 0,
      currentBalanceSet: hasCurrentBalanceFlag ? parsed.currentBalanceSet : Number.isFinite(currentBalanceParsed)
    };
  } catch {
    return { expenseLimit: 0, savingsGoal: 0, currentBalance: 0, currentBalanceSet: false };
  }
}

export function loadCategories(storageKey, defaultCategories, normalizeCategoryName) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return defaultCategories.map((name) => ({ name, isDefault: true }));
    }

    return parsed
      .filter((item) => item && item.name)
      .map((item) => ({
        name: normalizeCategoryName(String(item.name)),
        isDefault: Boolean(item.isDefault || defaultCategories.includes(item.name))
      }));
  } catch {
    return defaultCategories.map((name) => ({ name, isDefault: true }));
  }
}

export function loadCategoryBudgets(storageKey, normalizeCategoryName) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "{}");
    if (!parsed || typeof parsed !== "object") return {};

    return Object.entries(parsed).reduce((acc, [category, value]) => {
      const amount = Number(value);
      if (amount > 0) acc[normalizeCategoryName(category)] = amount;
      return acc;
    }, {});
  } catch {
    return {};
  }
}

export function persistJson(storageKey, value) {
  localStorage.setItem(storageKey, JSON.stringify(value));
}

export function loadViewMode(storageKey) {
  const mode = localStorage.getItem(storageKey);
  return mode === "advanced" ? "advanced" : "simple";
}

export function persistViewMode(storageKey, mode) {
  localStorage.setItem(storageKey, mode);
}
