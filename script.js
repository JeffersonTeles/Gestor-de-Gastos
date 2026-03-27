import { createClient } from "@supabase/supabase-js";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { createWorker } from "tesseract.js";
import {
  sanitizeHTML,
  escapeAttribute,
  isValidEmail,
  validatePassword,
  sanitizeNumber,
  sanitizeDate,
  sanitizeCategory,
  sanitizeDescription,
  loginRateLimiter,
  importRateLimiter,
  validateAndSanitizeTransaction,
  detectXSS,
  sanitizeInput
} from "./security-utils.js";
import {
  getUserFriendlyErrorMessage,
  logErrorForDevelopment
} from "./error-utils.js";
import {
  buildProjectionSeries as buildProjectionSeriesEngine,
  calculateFinancialScore as calculateFinancialScoreEngine,
  calculateTotals,
  clamp,
  detectOutlierExpenses,
  projectEndMonthBalance as projectEndMonthBalanceEngine
} from "./financial-engine.js";
import {
  normalizeSourceBank,
  parseImportedTransactions,
  transactionDedupKey
} from "./import-utils.js";
import {
  cssEscape,
  csvEscape,
  debounce,
  downloadTextFile,
  escapeHtml,
  formatCurrency,
  formatDate,
  normalizeCategoryName,
  normalizeTransaction,
  roundRect,
  toBrazilianNumber
} from "./app-utils.js";
import {
  loadCategories as loadCategoriesFromStorage,
  loadCategoryBudgets as loadCategoryBudgetsFromStorage,
  loadGoals as loadGoalsFromStorage,
  loadTransactions as loadTransactionsFromStorage,
  loadViewMode as loadViewModeFromStorage,
  persistJson,
  persistViewMode as persistViewModeToStorage
} from "./storage-utils.js";

const STORAGE_KEY_TRANSACTIONS = "fluxoforte.transactions.v1";
const STORAGE_KEY_GOALS = "fluxoforte.goals.v1";
const STORAGE_KEY_CATEGORIES = "fluxoforte.categories.v1";
const STORAGE_KEY_CATEGORY_BUDGETS = "fluxoforte.categoryBudgets.v1";
const STORAGE_KEY_VIEW_MODE = "fluxoforte.viewMode.v1";
const STORAGE_KEY_AUTO_RULES = "fluxoforte.autoRules.v1";
const STORAGE_KEY_RECURRING_TEMPLATES = "fluxoforte.recurringTemplates.v1";
const STORAGE_KEY_GUIDE_DONE = "fluxoforte.guideDone.v1";
const STORAGE_KEY_LAST_IMPORT_SOURCE = "fluxoforte.lastImportSource.v1";
const STORAGE_KEY_LAST_IMPORT_META = "fluxoforte.lastImportMeta.v1";
const STORAGE_KEY_GATE_DISMISSED = "fluxoforte.preDashboardGateDismissed.v1";
const STORAGE_KEY_IMPORT_LOG = "fluxoforte.importLog.v1";
const MAX_IMPORT_LOG_ITEMS = 20;
const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
const IMPORT_INFER_SAMPLE_CHARS = 4000;
const TRANSACTIONS_PER_PAGE = 20;

const DEFAULT_CATEGORIES = [
  "Moradia",
  "Alimentacao",
  "Transporte",
  "Lazer",
  "Saude",
  "Educacao",
  "Salario",
  "Investimento",
  "Outros"
];

const state = {
  transactions: loadTransactionsFromStorage(STORAGE_KEY_TRANSACTIONS, normalizeTransaction),
  goals: loadGoalsFromStorage(STORAGE_KEY_GOALS),
  categories: loadCategoriesFromStorage(STORAGE_KEY_CATEGORIES, DEFAULT_CATEGORIES, normalizeCategoryName),
  categoryBudgets: loadCategoryBudgetsFromStorage(STORAGE_KEY_CATEGORY_BUDGETS, normalizeCategoryName),
  autoRules: loadSimpleArray(STORAGE_KEY_AUTO_RULES),
  recurringTemplates: loadSimpleArray(STORAGE_KEY_RECURRING_TEMPLATES),
  importHistory: loadSimpleArray(STORAGE_KEY_IMPORT_LOG),
  filters: {
    search: "",
    type: "all",
    month: "",
    bank: "all"
  },
  currentPage: 1,
  telemetry: {
    sent: 0,
    failed: 0,
    enabled: false
  },
  viewMode: loadViewModeFromStorage(STORAGE_KEY_VIEW_MODE),
  user: null,
  supabaseEnabled: false,
  editingTransactionId: null
};

const transactionForm = document.getElementById("transactionForm");
const goalsForm = document.getElementById("goalsForm");
const tableBody = document.getElementById("transactionsTableBody");
const emptyStateTemplate = document.getElementById("emptyStateTemplate");

const balanceValue = document.getElementById("balanceValue");
const incomeValue = document.getElementById("incomeValue");
const expenseValue = document.getElementById("expenseValue");
const savingsRateValue = document.getElementById("savingsRateValue");
const summaryPeriodInput = document.getElementById("summaryPeriod");
const summaryMonthInput = document.getElementById("summaryMonth");
const summaryYearInput = document.getElementById("summaryYear");
const summaryMonthText = document.getElementById("summaryMonthText");
const kpiBalanceCard = document.getElementById("kpiBalanceCard");
const kpiAdjustedBalanceCard = document.getElementById("kpiAdjustedBalanceCard");
const healthBadge = document.getElementById("healthBadge");
const financialScoreValue = document.getElementById("financialScoreValue");
const financialScoreText = document.getElementById("financialScoreText");
const forecastBalanceValue = document.getElementById("forecastBalanceValue");
const forecastBalanceText = document.getElementById("forecastBalanceText");
const anomalyText = document.getElementById("anomalyText");
const recommendationText = document.getElementById("recommendationText");
const scenarioForm = document.getElementById("scenarioForm");
const scenarioIncomeIncreaseInput = document.getElementById("scenarioIncomeIncrease");
const scenarioExpenseReductionInput = document.getElementById("scenarioExpenseReduction");
const scenarioResultText = document.getElementById("scenarioResultText");
const scenarioChart = document.getElementById("scenarioChart");
const futurePlanningForm = document.getElementById("futurePlanningForm");
const futureTargetMonthInput = document.getElementById("futureTargetMonth");
const futureGoalAmountInput = document.getElementById("futureGoalAmount");
const futureVariableReductionInput = document.getElementById("futureVariableReduction");
const futureSummaryText = document.getElementById("futureSummaryText");
const futureGoalInsightText = document.getElementById("futureGoalInsightText");
const futureSavingsChart = document.getElementById("futureSavingsChart");
const emptyAnalyticsNotice = document.getElementById("emptyAnalyticsNotice");
const sectionFinancialIntelligence = document.getElementById("sectionFinancialIntelligence");
const sectionScenarioLab = document.getElementById("sectionScenarioLab");
const sectionFutureSummary = document.getElementById("sectionFutureSummary");
const sectionTrend = document.getElementById("sectionTrend");
const sectionCategoryDistribution = document.getElementById("sectionCategoryDistribution");
const sectionMonthlyReport = document.getElementById("sectionMonthlyReport");
const sectionBankConsolidation = document.getElementById("sectionBankConsolidation");

const expenseProgress = document.getElementById("expenseProgress");
const savingsProgress = document.getElementById("savingsProgress");
const expenseProgressText = document.getElementById("expenseProgressText");
const savingsProgressText = document.getElementById("savingsProgressText");
const budgetAlertText = document.getElementById("budgetAlertText");
const adjustedBalanceValue = document.getElementById("adjustedBalanceValue");
const currentBalanceInsightText = document.getElementById("currentBalanceInsightText");

const expenseLimitInput = document.getElementById("expenseLimit");
const savingsGoalInput = document.getElementById("savingsGoal");
const currentBalanceInput = document.getElementById("currentBalance");
const reconcileBalanceBtn = document.getElementById("reconcileBalanceBtn");

const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const dateInput = document.getElementById("date");
const typeInput = document.getElementById("type");
const categorySelect = document.getElementById("category");
const sectionNewTransaction = document.getElementById("sectionNewTransaction");

const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const bankFilter = document.getElementById("bankFilter");
const monthFilter = document.getElementById("monthFilter");
const historyPrevPageBtn = document.getElementById("historyPrevPageBtn");
const historyNextPageBtn = document.getElementById("historyNextPageBtn");
const historyPageInfo = document.getElementById("historyPageInfo");
const clearFilterBtn = document.getElementById("clearFilterBtn");
const clearAllDataBtn = document.getElementById("clearAllDataBtn");
const clearAllDataBtnSecondary = document.getElementById("clearAllDataBtnSecondary");
const clearAllDataBtnTop = document.getElementById("clearAllDataBtnTop");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const trendChart = document.getElementById("trendChart");
const categoryChart = document.getElementById("categoryChart");
const categoryChartLegend = document.getElementById("categoryChartLegend");
const categoryChartSubtitle = document.getElementById("categoryChartSubtitle");
const reportMonthInput = document.getElementById("reportMonth");
const exportMonthlyCsvBtn = document.getElementById("exportMonthlyCsvBtn");
const exportMonthlyPdfBtn = document.getElementById("exportMonthlyPdfBtn");
const closeMonthBtn = document.getElementById("closeMonthBtn");
const closeMonthStatus = document.getElementById("closeMonthStatus");
const closeMonthChecklist = document.getElementById("closeMonthChecklist");
const saveTransactionBtn = document.getElementById("saveTransactionBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const formModeText = document.getElementById("formModeText");
const globalSpinner = document.getElementById("globalSpinner");
const toastContainer = document.getElementById("toastContainer");

const categoryForm = document.getElementById("categoryForm");
const newCategoryNameInput = document.getElementById("newCategoryName");
const categoryBudgetList = document.getElementById("categoryBudgetList");
const importForm = document.getElementById("importForm");
const importSourceBankInput = document.getElementById("importSourceBank");
const importFileInput = document.getElementById("importFile");
const importDropZone = document.getElementById("importDropZone");
const importRawTextInput = document.getElementById("importRawText");
const importBatchPreview = document.getElementById("importBatchPreview");
const importReviewModal = document.getElementById("importReviewModal");
const importReviewPanel = document.getElementById("importReviewPanel");
const importReviewSummary = document.getElementById("importReviewSummary");
const importReviewTableBody = document.getElementById("importReviewTableBody");
const applyAiSuggestionsBtn = document.getElementById("applyAiSuggestionsBtn");
const confirmImportBtn = document.getElementById("confirmImportBtn");
const cancelImportBtn = document.getElementById("cancelImportBtn");
const closeImportReviewBtn = document.getElementById("closeImportReviewBtn");
const selectAllImportRowsBtn = document.getElementById("selectAllImportRowsBtn");
const clearAllImportRowsBtn = document.getElementById("clearAllImportRowsBtn");
const undoLastImportBtn = document.getElementById("undoLastImportBtn");
const resendPendingSyncBtn = document.getElementById("resendPendingSyncBtn");
const importStatusText = document.getElementById("importStatusText");
const importAuditList = document.getElementById("importAuditList");
const summaryDiagnosticsText = document.getElementById("summaryDiagnosticsText");
const summaryYearComparisonText = document.getElementById("summaryYearComparisonText");
const bankConsolidationList = document.getElementById("bankConsolidationList");
const bankConsolidationSubtitle = document.getElementById("bankConsolidationSubtitle");
const autoRuleForm = document.getElementById("autoRuleForm");
const autoRuleKeywordInput = document.getElementById("autoRuleKeyword");
const autoRuleCategorySelect = document.getElementById("autoRuleCategory");
const simulateRulesBtn = document.getElementById("simulateRulesBtn");
const autoRulesStatusText = document.getElementById("autoRulesStatusText");
const autoRulesList = document.getElementById("autoRulesList");
const recurringForm = document.getElementById("recurringForm");
const recurringDescriptionInput = document.getElementById("recurringDescription");
const recurringAmountInput = document.getElementById("recurringAmount");
const recurringDayInput = document.getElementById("recurringDay");
const recurringTypeInput = document.getElementById("recurringType");
const recurringCategorySelect = document.getElementById("recurringCategory");
const recurringList = document.getElementById("recurringList");
const generateRecurringBtn = document.getElementById("generateRecurringBtn");
const recurringStatusText = document.getElementById("recurringStatusText");
const startGuideBtn = document.getElementById("startGuideBtn");
const prevGuideBtn = document.getElementById("prevGuideBtn");
const nextGuideBtn = document.getElementById("nextGuideBtn");
const finishGuideBtn = document.getElementById("finishGuideBtn");
const guideStatusText = document.getElementById("guideStatusText");
const quickstartSection = document.getElementById("quickstartSection");

const authForm = document.getElementById("authForm");
const authEmailInput = document.getElementById("authEmail");
const authPasswordInput = document.getElementById("authPassword");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const logoutBtn = document.getElementById("logoutBtn");
const openAuthModalBtn = document.getElementById("openAuthModalBtn");
const closeAuthModalBtn = document.getElementById("closeAuthModalBtn");
const authSettingsModal = document.getElementById("authSettingsModal");
const integrationText = document.getElementById("integrationText");
const authCompactText = document.getElementById("authCompactText");
const preDashboardGate = document.getElementById("preDashboardGate");
const openAuthFromGateBtn = document.getElementById("openAuthFromGateBtn");
const continueLocalBtn = document.getElementById("continueLocalBtn");
const authUser = document.getElementById("authUser");
const authMessage = document.getElementById("authMessage");
const syncStatusText = document.getElementById("syncStatusText");
const syncModeBadge = document.getElementById("syncModeBadge");
const telemetryStatusText = document.getElementById("telemetryStatusText");
const viewModeBtn = document.getElementById("viewModeBtn");

let supabaseClient = null;
let realtimeChannel = null;
let refreshTimer = null;
let droppedImportFiles = [];
let guideStepIndex = -1;
let pdfJsModulePromise = null;
let ocrWorkerPromise = null;
let pendingImportDraft = null;
let alertedBudgetCategories = new Set();

const guideSteps = [
  {
    sectionId: "sectionNewTransaction",
    message: "Passo 1: adicione seus primeiros lancamentos para alimentar os indicadores."
  },
  {
    sectionId: "sectionGoals",
    message: "Passo 2: defina metas para ativar alertas e acompanhar progresso mensal."
  },
  {
    sectionId: "sectionImport",
    message: "Passo 3: importe extratos por arquivo ou arraste e solte no bloco de importacao."
  }
];

bootstrap();

async function bootstrap() {
  mountImportReviewModal();
  dateInput.value = getLocalTodayISODate();
  reportMonthInput.value = getLocalCurrentMonth();
  if (summaryMonthInput && !summaryMonthInput.value) {
    summaryMonthInput.value = getLocalCurrentMonth();
  }
  if (summaryYearInput && !summaryYearInput.value) {
    summaryYearInput.value = String(new Date().getFullYear());
  }
  if (futureTargetMonthInput && !futureTargetMonthInput.value) {
    futureTargetMonthInput.value = addMonthsToMonthKey(getLocalCurrentMonth(), 6);
  }
  if (futureGoalAmountInput && Number(state.goals?.savingsGoal || 0) > 0 && !futureGoalAmountInput.value) {
    futureGoalAmountInput.value = String(Number(state.goals.savingsGoal));
  }
  expenseLimitInput.value = state.goals.expenseLimit || "";
  savingsGoalInput.value = state.goals.savingsGoal || "";
  currentBalanceInput.value = state.goals.currentBalanceSet
    ? Number(state.goals.currentBalance || 0)
    : "";

  state.autoRules = state.autoRules
    .filter((rule) => rule && rule.keyword && rule.category)
    .map((rule, index) => ({
      id: String(rule.id || crypto.randomUUID()),
      keyword: String(rule.keyword).trim().toLowerCase(),
      category: normalizeCategoryName(String(rule.category)),
      priority: Number.isFinite(Number(rule.priority)) ? Number(rule.priority) : index + 1
    }));

  state.recurringTemplates = state.recurringTemplates
    .filter((item) => item && item.description && Number(item.amount) > 0)
    .map((item) => ({
      id: String(item.id || crypto.randomUUID()),
      description: String(item.description).trim(),
      amount: Number(item.amount),
      dayOfMonth: Math.min(31, Math.max(1, Number(item.dayOfMonth || 1))),
      type: item.type === "income" ? "income" : "expense",
      category: normalizeCategoryName(String(item.category || "Outros"))
    }));

  ensureCategoriesValid();
  persistAutoRules();
  persistRecurringTemplates();

  const lastImportSource = normalizeSourceBank(localStorage.getItem(STORAGE_KEY_LAST_IMPORT_SOURCE) || "");
  if (lastImportSource && importSourceBankInput && !importSourceBankInput.value) {
    importSourceBankInput.value = lastImportSource;
  }

  bindEvents();
  updateTransactionFormTone();
  updateUndoLastImportButton();
  updateGuideButtons();
  setupSupabaseClient();
  render();

  if (localStorage.getItem(STORAGE_KEY_GUIDE_DONE) !== "1") {
    guideStatusText.textContent = "Dica: use o modo assistido para configurar tudo em poucos cliques.";
  } else {
    guideStatusText.textContent = "Modo assistido disponivel para revisao quando quiser.";
  }
  updateQuickstartVisibility();

  if (!supabaseClient) {
    closePreDashboardGate();
    return;
  }

  await restoreSessionAndSync();
  maybeShowPreDashboardGate();
  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    state.user = session?.user || null;
    updateAuthUi();

    if (state.user) {
      localStorage.setItem(STORAGE_KEY_GATE_DISMISSED, "1");
      closePreDashboardGate();
      subscribeToRealtime();
      await pullCloudData();
    } else {
      unsubscribeFromRealtime();
      setSyncStatus("Sessao encerrada. Continuando em modo local.");
      maybeShowPreDashboardGate();
    }
  });
}

function bindEvents() {
  transactionForm.addEventListener("submit", onTransactionSubmit);
  typeInput?.addEventListener("change", updateTransactionFormTone);
  amountInput?.addEventListener("input", onAmountInputMask);
  goalsForm.addEventListener("submit", onGoalsSubmit);
  reconcileBalanceBtn?.addEventListener("click", onReconcileBalanceClick);
  categoryForm.addEventListener("submit", onCategorySubmit);
  importForm.addEventListener("submit", onImportSubmit);
  autoRuleForm?.addEventListener("submit", onAutoRuleSubmit);
  recurringForm?.addEventListener("submit", onRecurringSubmit);
  generateRecurringBtn?.addEventListener("click", onGenerateRecurringClick);
  simulateRulesBtn?.addEventListener("click", onSimulateRulesClick);
  applyAiSuggestionsBtn?.addEventListener("click", onApplyAiSuggestionsClick);
  confirmImportBtn?.addEventListener("click", onConfirmImportClick);
  cancelImportBtn?.addEventListener("click", onCancelImportClick);
  closeImportReviewBtn?.addEventListener("click", onCancelImportClick);
  selectAllImportRowsBtn?.addEventListener("click", onSelectAllImportRowsClick);
  clearAllImportRowsBtn?.addEventListener("click", onClearAllImportRowsClick);
  undoLastImportBtn?.addEventListener("click", onUndoLastImportClick);
  resendPendingSyncBtn?.addEventListener("click", onResendPendingSyncClick);
  importReviewTableBody?.addEventListener("input", onImportReviewInput);
  importReviewTableBody?.addEventListener("change", onImportReviewInput);

  importReviewModal?.addEventListener("click", (event) => {
    if (event.target !== importReviewModal) return;
    onCancelImportClick();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!pendingImportDraft) return;
    onCancelImportClick();
  });

  searchInput.addEventListener("input", (event) => {
    state.filters.search = event.target.value.trim().toLowerCase();
    resetHistoryPage();
    renderTable();
  });

  typeFilter.addEventListener("change", (event) => {
    state.filters.type = event.target.value;
    resetHistoryPage();
    renderTable();
  });

  monthFilter.addEventListener("change", (event) => {
    state.filters.month = event.target.value;
    resetHistoryPage();
    if (summaryPeriodInput) summaryPeriodInput.value = "month";
    if ((summaryPeriodInput?.value || "month") === "month") {
      if (summaryMonthInput) summaryMonthInput.value = event.target.value || getLocalCurrentMonth();
    } else if (summaryYearInput && event.target.value) {
      summaryYearInput.value = String(event.target.value).slice(0, 4);
    }
    renderTable();
    renderBankConsolidation();
    renderSummary();
  });

  summaryPeriodInput?.addEventListener("change", () => {
    if (summaryPeriodInput.value === "year") {
      if (summaryYearInput && !summaryYearInput.value && summaryMonthInput?.value) {
        summaryYearInput.value = String(summaryMonthInput.value).slice(0, 4);
      }
    } else if (summaryMonthInput && !summaryMonthInput.value && summaryYearInput?.value) {
      summaryMonthInput.value = `${String(summaryYearInput.value).slice(0, 4)}-01`;
    }
    updateSummaryPeriodControls();
    renderSummary();
  });

  summaryMonthInput?.addEventListener("change", () => {
    if (summaryPeriodInput) summaryPeriodInput.value = "month";
    updateSummaryPeriodControls();
    renderSummary();
  });

  summaryYearInput?.addEventListener("change", () => {
    if (summaryPeriodInput) summaryPeriodInput.value = "year";
    updateSummaryPeriodControls();
    renderSummary();
  });

  bankFilter.addEventListener("change", (event) => {
    state.filters.bank = event.target.value;
    resetHistoryPage();
    renderTable();
  });

  clearFilterBtn.addEventListener("click", () => {
    state.filters = { search: "", type: "all", month: "", bank: "all" };
    resetHistoryPage();
    searchInput.value = "";
    typeFilter.value = "all";
    monthFilter.value = "";
    bankFilter.value = "all";
    renderTable();
    renderBankConsolidation();
  });

  historyPrevPageBtn?.addEventListener("click", () => {
    if (state.currentPage <= 1) return;
    state.currentPage -= 1;
    renderTable();
  });

  historyNextPageBtn?.addEventListener("click", () => {
    const totalPages = getFilteredTransactionTotalPages();
    if (state.currentPage >= totalPages) return;
    state.currentPage += 1;
    renderTable();
  });
  clearAllDataBtn?.addEventListener("click", onClearAllDataClick);
  clearAllDataBtnSecondary?.addEventListener("click", onClearAllDataClick);
  clearAllDataBtnTop?.addEventListener("click", onClearAllDataClick);

  exportCsvBtn.addEventListener("click", onExportCsvClick);
  exportMonthlyCsvBtn.addEventListener("click", onExportMonthlyCsvClick);
  exportMonthlyPdfBtn.addEventListener("click", onExportMonthlyPdfClick);
  closeMonthBtn?.addEventListener("click", onCloseMonthClick);
  reportMonthInput.addEventListener("change", renderCategoryChart);
  scenarioForm.addEventListener("submit", onScenarioSubmit);
  futurePlanningForm?.addEventListener("submit", onFuturePlanningSubmit);

  autoRulesList?.addEventListener("click", onAutoRuleListClick);
  recurringList?.addEventListener("click", onRecurringListClick);
  startGuideBtn?.addEventListener("click", onStartGuideClick);
  prevGuideBtn?.addEventListener("click", onPrevGuideClick);
  nextGuideBtn?.addEventListener("click", onNextGuideClick);
  finishGuideBtn?.addEventListener("click", onFinishGuideClick);

  importFileInput?.addEventListener("change", () => {
    droppedImportFiles = Array.from(importFileInput.files || []);
    handleSelectedImportFiles(droppedImportFiles, "arquivo selecionado");
  });

  importRawTextInput?.addEventListener("blur", async () => {
    maybeInferSourceFromRawText();
    await updateImportPreview();
  });

  bindImportDropZoneEvents();

  tableBody.addEventListener("click", async (event) => {
    const btn = event.target.closest("button[data-id]");
    if (!btn) return;

    const { id } = btn.dataset;
    const action = btn.dataset.action;

    if (action === "edit") {
      startEditTransaction(id);
      return;
    }

    if (action === "delete") {
      await deleteTransaction(id);
      render();
    }
  });

  categoryBudgetList.addEventListener("click", async (event) => {
    const btn = event.target.closest("button[data-category]");
    if (!btn) return;

    if (btn.dataset.action === "remove-category") {
      await removeCategory(btn.dataset.category);
      renderCategoryArea();
      render();
    }

    if (btn.dataset.action === "save-budget") {
      const categoryName = btn.dataset.category;
      const input = categoryBudgetList.querySelector(`input[data-budget-category="${cssEscape(categoryName)}"]`);
      const amount = Number(input?.value || 0);
      await saveCategoryBudget(categoryName, amount);
      renderCategoryArea();
      renderSummary();
    }
  });

  authForm.addEventListener("submit", onLoginSubmit);
  registerBtn.addEventListener("click", onRegisterClick);
  logoutBtn.addEventListener("click", onLogoutClick);
  openAuthModalBtn?.addEventListener("click", openAuthSettingsModal);
  closeAuthModalBtn?.addEventListener("click", closeAuthSettingsModal);
  openAuthFromGateBtn?.addEventListener("click", () => {
    closePreDashboardGate();
    openAuthSettingsModal();
  });
  continueLocalBtn?.addEventListener("click", () => {
    localStorage.setItem(STORAGE_KEY_GATE_DISMISSED, "1");
    closePreDashboardGate();
    setSyncStatus("Modo local ativo. Voce pode entrar na nuvem depois.");
  });

  authSettingsModal?.addEventListener("click", (event) => {
    if (event.target !== authSettingsModal) return;
    closeAuthSettingsModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (authSettingsModal?.classList.contains("is-hidden")) return;
    closeAuthSettingsModal();
  });

  cancelEditBtn.addEventListener("click", resetTransactionForm);
  viewModeBtn.addEventListener("click", toggleViewMode);
}

function openAuthSettingsModal() {
  if (!authSettingsModal) return;
  authSettingsModal.classList.remove("is-hidden");
  authSettingsModal.setAttribute("aria-hidden", "false");
}

function updateTransactionFormTone() {
  if (!sectionNewTransaction || !typeInput) return;
  const type = typeInput.value === "income" ? "income" : "expense";
  sectionNewTransaction.classList.remove("income-mode", "expense-mode");
  sectionNewTransaction.classList.add(`${type}-mode`);
}

function closeAuthSettingsModal() {
  if (!authSettingsModal) return;
  authSettingsModal.classList.add("is-hidden");
  authSettingsModal.setAttribute("aria-hidden", "true");
  maybeShowPreDashboardGate();
}

function openPreDashboardGate() {
  if (!preDashboardGate) return;
  preDashboardGate.classList.remove("is-hidden");
  preDashboardGate.setAttribute("aria-hidden", "false");
}

function closePreDashboardGate() {
  if (!preDashboardGate) return;
  preDashboardGate.classList.add("is-hidden");
  preDashboardGate.setAttribute("aria-hidden", "true");
}

function maybeShowPreDashboardGate() {
  if (!state.supabaseEnabled) {
    closePreDashboardGate();
    return;
  }

  if (isCloudMode()) {
    closePreDashboardGate();
    return;
  }

  const dismissed = localStorage.getItem(STORAGE_KEY_GATE_DISMISSED) === "1";
  if (dismissed) {
    closePreDashboardGate();
    return;
  }

  openPreDashboardGate();
}

function setupSupabaseClient() {
  const viteUrl = String(import.meta.env.VITE_SUPABASE_URL || "").trim();
  const viteAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();
  const legacyUrl = String(import.meta.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const legacyAnonKey = String(import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

  const cfg = {
    url: viteUrl || legacyUrl,
    anonKey: viteAnonKey || legacyAnonKey
  };

  if (!cfg.url || !cfg.anonKey) {
    setModeBadge("local", "Modo local");
    setAuthMessage("Configure o arquivo .env com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
    setSyncStatus("Somente armazenamento local.");
    refreshTelemetryStatus();
    return;
  }

  const hasValidUrl = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(cfg.url);
  const hasValidAnonKey = cfg.anonKey.startsWith("eyJ") && cfg.anonKey.length > 40;
  if (!hasValidUrl || !hasValidAnonKey) {
    setModeBadge("local", "Modo local");
    setAuthMessage("Variáveis do Supabase inválidas. Revise URL e ANON KEY no Vercel.");
    setSyncStatus("Somente armazenamento local.");
    refreshTelemetryStatus();
    return;
  }

  supabaseClient = createClient(cfg.url, cfg.anonKey);
  state.supabaseEnabled = true;
  setModeBadge("local", "Nuvem pronta");
  setAuthMessage("Supabase conectado. Faca login para sincronizar seus dados.");
}

async function restoreSessionAndSync() {
  setSyncStatus("Verificando sessao...");
  showGlobalSpinner();

  let data;
  try {
    const response = await supabaseClient.auth.getSession();
    data = response.data;
    if (response.error) {
      const msg = getUserFriendlyErrorMessage(response.error, "auth");
      setAuthMessage(msg);
      logErrorForDevelopment(response.error, "restoreSessionAndSync");
      return;
    }
  } catch (error) {
    const msg = getUserFriendlyErrorMessage(error, "sync");
    setAuthMessage(msg);
    setSyncStatus("Falha ao verificar sessão. Continuando em modo local.");
    logErrorForDevelopment(error, "restoreSessionAndSync.catch");
    return;
  } finally {
    hideGlobalSpinner();
  }

  state.user = data.session?.user || null;
  updateAuthUi();

  if (state.user) {
    subscribeToRealtime();
    showGlobalSpinner();
    try {
      await pullCloudData();
    } finally {
      hideGlobalSpinner();
    }
  } else {
    setSyncStatus("Faca login para sincronizar com a nuvem.");
  }
}

async function onLoginSubmit(event) {
  event.preventDefault();
  if (!supabaseClient) {
    setAuthMessage("Nuvem não configurada. Revise as variáveis VITE_SUPABASE no deploy.");
    return;
  }

  const email = String(authEmailInput.value || "").trim().toLowerCase();
  const password = authPasswordInput.value;
  
  // Validar email/senha presentes
  if (!email || !password) {
    setAuthMessage("Informe e-mail e senha.");
    return;
  }

  // Validar formato de email
  if (!isValidEmail(email)) {
    setAuthMessage("E-mail inválido.");
    return;
  }

  // Aplicar rate limiter
  if (!loginRateLimiter.check(email)) {
    setAuthMessage("Muitas tentativas de login. Tente novamente em alguns minutos.");
    trackEvent("auth_rate_limit_exceeded", { emailDomain: email.split("@")[1] || "" });
    return;
  }

  setAuthMessage("Entrando...");
  showGlobalSpinner();
  setLoadingState(true, loginBtn);

  try {
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      const msg = getUserFriendlyErrorMessage(error, "auth");
      setAuthMessage(msg);
      logErrorForDevelopment(error, "onLoginSubmit");
      return;
    }

    authPasswordInput.value = "";
    setAuthMessage("Login realizado com sucesso.");
    localStorage.setItem(STORAGE_KEY_GATE_DISMISSED, "1");
    closePreDashboardGate();
    closeAuthSettingsModal();
    trackEvent("auth_login_success", { emailDomain: email.split("@")[1] || "" });
  } catch (error) {
    const msg = getUserFriendlyErrorMessage(error, "auth");
    setAuthMessage(msg);
    logErrorForDevelopment(error, "onLoginSubmit.catch");
  } finally {
    hideGlobalSpinner();
    setLoadingState(false, loginBtn);
  }
}

async function onRegisterClick() {
  if (!supabaseClient) {
    setAuthMessage("Nuvem não configurada. Revise as variáveis VITE_SUPABASE no deploy.");
    return;
  }

  const email = String(authEmailInput.value || "").trim().toLowerCase();
  const password = authPasswordInput.value;
  
  if (!email || !password) {
    setAuthMessage("Informe e-mail e senha para criar conta.");
    return;
  }

  // Validar email
  if (!isValidEmail(email)) {
    setAuthMessage("E-mail inválido.");
    return;
  }

  // Validar força da senha
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    setAuthMessage("Senha: " + passwordValidation.errors[0]);
    return;
  }

  // Aplicar rate limiter
  if (!loginRateLimiter.check(email)) {
    setAuthMessage("Muitas tentativas. Tente novamente em alguns minutos.");
    return;
  }

  setAuthMessage("Criando conta...");
  showGlobalSpinner();
  setLoadingState(true, registerBtn);

  try {
    const { error } = await supabaseClient.auth.signUp({ email, password });
    if (error) {
      const alreadyRegistered = String(error.message || "").toLowerCase().includes("already registered");
      const msg = alreadyRegistered
        ? "Este e-mail já está registrado."
        : getUserFriendlyErrorMessage(error, "auth");
      setAuthMessage(msg);
      logErrorForDevelopment(error, "onRegisterClick");
      return;
    }

    setAuthMessage("Conta criada. Verifique seu e-mail se a confirmacao estiver ativa.");
    trackEvent("auth_register_success", { emailDomain: email.split("@")[1] || "" });
  } catch (error) {
    const msg = getUserFriendlyErrorMessage(error, "auth");
    setAuthMessage(msg);
    logErrorForDevelopment(error, "onRegisterClick.catch");
  } finally {
    hideGlobalSpinner();
    setLoadingState(false, registerBtn);
  }
}

async function onLogoutClick() {
  if (!supabaseClient) return;

  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    const msg = getUserFriendlyErrorMessage(error, "auth");
    setAuthMessage(msg);
    logErrorForDevelopment(error, "onLogoutClick");
    return;
  }

  setAuthMessage("Voce saiu da conta.");
  trackEvent("auth_logout", {});
}

async function onClearAllDataClick() {
  const firstConfirm = window.confirm("Isso vai apagar todos os seus dados (transacoes, metas, categorias e importacoes). Deseja continuar?");
  if (!firstConfirm) return;

  const typed = window.prompt('Digite APAGAR para confirmar a exclusao total dos dados.') || "";
  if (typed.trim().toUpperCase() !== "APAGAR") {
    setAuthMessage("Acao cancelada. Texto de confirmacao incorreto.");
    return;
  }

  setClearAllButtonsBusy(true, "Apagando...");

  try {
    if (isCloudMode()) {
      const rpcRes = await supabaseClient.rpc("clear_user_data");
      if (rpcRes.error) {
        const rpcMessage = String(rpcRes.error.message || "").toLowerCase();
        const rpcMissing = rpcMessage.includes("could not find the function")
          || rpcMessage.includes("function public.clear_user_data")
          || rpcRes.error.code === "PGRST202";

        if (rpcMissing) {
          const tableNames = ["transactions", "category_budgets", "categories", "goals", "usage_events"];
          const deletionResults = await Promise.all(
            tableNames.map(async (tableName) => {
              const { error } = await supabaseClient
                .from(tableName)
                .delete()
                .eq("user_id", state.user.id);
              return { tableName, error };
            })
          );

          const failed = deletionResults.filter((item) => item.error);
          if (failed.length > 0) {
            failed.forEach((item) => logErrorForDevelopment(item.error, `onClearAllDataClick.${item.tableName}`));
            const firstMsg = getUserFriendlyErrorMessage(failed[0].error, "database");
            const failedTables = failed.map((item) => item.tableName).join(", ");
            setAuthMessage(`Falha ao apagar dados na nuvem: ${firstMsg}`);
            setSyncStatus(`Processo interrompido. Tabelas com falha: ${failedTables}.`);
            return;
          }
        } else {
          const msg = getUserFriendlyErrorMessage(rpcRes.error, "database");
          setAuthMessage(`Falha ao apagar dados na nuvem: ${msg}`);
          setSyncStatus("Processo interrompido. Tente novamente em alguns instantes.");
          logErrorForDevelopment(rpcRes.error, "onClearAllDataClick.rpc");
          return;
        }
      }
    }

    state.transactions = [];
    state.goals = {
      expenseLimit: 0,
      savingsGoal: 0,
      currentBalance: 0,
      currentBalanceSet: false
    };
    state.categories = DEFAULT_CATEGORIES.map((name) => ({ name, isDefault: true }));
    state.categoryBudgets = {};
    state.autoRules = [];
    state.recurringTemplates = [];
    state.importHistory = [];
    state.filters = { search: "", type: "all", month: "", bank: "all" };
    resetHistoryPage();

    droppedImportFiles = [];
    pendingImportDraft = null;

    if (searchInput) searchInput.value = "";
    if (typeFilter) typeFilter.value = "all";
    if (bankFilter) bankFilter.value = "all";
    if (monthFilter) monthFilter.value = "";
    if (expenseLimitInput) expenseLimitInput.value = "";
    if (savingsGoalInput) savingsGoalInput.value = "";
    if (currentBalanceInput) currentBalanceInput.value = "";
    if (newCategoryNameInput) newCategoryNameInput.value = "";
    if (importRawTextInput) importRawTextInput.value = "";
    if (importFileInput) importFileInput.value = "";

    localStorage.removeItem(STORAGE_KEY_LAST_IMPORT_META);
    localStorage.removeItem(STORAGE_KEY_LAST_IMPORT_SOURCE);
    localStorage.removeItem(STORAGE_KEY_IMPORT_LOG);

    persistTransactions();
    persistGoals();
    persistCategories();
    persistCategoryBudgets();
    persistAutoRules();
    persistRecurringTemplates();
    persistImportHistory();

    resetTransactionForm();
    render();

    setSyncStatus(isCloudMode()
      ? "Todos os dados locais e da nuvem foram apagados."
      : "Todos os dados locais foram apagados.");
    setAuthMessage("Dados apagados com sucesso.");
  } catch (error) {
    const msg = getUserFriendlyErrorMessage(error, "database");
    setAuthMessage(`Erro ao apagar dados: ${msg}`);
    logErrorForDevelopment(error, "onClearAllDataClick.catch");
  } finally {
    setClearAllButtonsBusy(false);
  }
}

function setClearAllButtonsBusy(busy, busyLabel = "Apagando...") {
  setButtonBusy(clearAllDataBtn, busy, busyLabel);
  setButtonBusy(clearAllDataBtnSecondary, busy, busyLabel);
  setButtonBusy(clearAllDataBtnTop, busy, busyLabel);
}

async function onTransactionSubmit(event) {
  event.preventDefault();

  const formData = new FormData(transactionForm);
  
  // Sanitizar inputs
const amount = Number(amountInput.dataset.realValue || 0);
  const description = sanitizeDescription(String(formData.get("description")).trim());
  const date = sanitizeDate(String(formData.get("date")));
  const type = String(formData.get("type"));
  const category = sanitizeCategory(String(formData.get("category")));

  // Validar campos obrigatórios
  if (!Number.isFinite(amount) || amount <= 0) {
    showToast("Informe um valor maior que zero.", TOAST_TYPES.ERROR);
    return;
  }

  if (!description) {
    showToast("Descrição é obrigatória.", TOAST_TYPES.ERROR);
    return;
  }

  if (!date) {
    showToast("Data inválida.", TOAST_TYPES.ERROR);
    return;
  }

  // Detectar tentativas de XSS (não impedir, só alertar em dev)
  if (detectXSS(description)) {
    console.warn("[SECURITY] Potencial XSS detectado na descrição:", description);
    showToast("Descrição contém caracteres não permitidos.", TOAST_TYPES.ERROR);
    return;
  }

  const transaction = {
    id: state.editingTransactionId || crypto.randomUUID(),
    description,
    amount,
    date,
    type,
    category,
    source_bank: "Manual",
    import_hash: null,
    import_batch_id: null,
    import_source_format: null,
    imported_at: null
  };

  if (state.editingTransactionId) {
    const original = state.transactions.find((tx) => tx.id === state.editingTransactionId);
    if (original) {
      transaction.source_bank = original.source_bank || "Manual";
      transaction.import_hash = original.import_hash || null;
      transaction.import_batch_id = original.import_batch_id || null;
      transaction.import_source_format = original.import_source_format || null;
      transaction.imported_at = original.imported_at || null;
    }
  }

  if (state.editingTransactionId) {
    try {
      if (isCloudMode()) showGlobalSpinner();
      await updateTransaction(transaction);
    } finally {
      if (isCloudMode()) hideGlobalSpinner();
    }
  } else {
    try {
      if (isCloudMode()) showGlobalSpinner();
      await saveTransaction(transaction);
    } finally {
      if (isCloudMode()) hideGlobalSpinner();
    }
  }

  resetTransactionForm();
  render();
  checkBudgetAlerts();
  showToast(state.editingTransactionId ? "Lançamento atualizado!" : "Lançamento salvo!", "success", 3000);
}

async function onGoalsSubmit(event) {
  event.preventDefault();

  const rawCurrentBalance = String(currentBalanceInput.value || "").trim();
  const currentBalanceSet = rawCurrentBalance !== "";
  const parsedCurrentBalance = Number(rawCurrentBalance);

  state.goals = {
    expenseLimit: Math.max(0, Number(expenseLimitInput.value || 0)),
    savingsGoal: Math.max(0, Number(savingsGoalInput.value || 0)),
    currentBalance: currentBalanceSet && Number.isFinite(parsedCurrentBalance) ? parsedCurrentBalance : 0,
    currentBalanceSet
  };

  persistGoals();

  if (isCloudMode()) {
    const { error } = await supabaseClient.from("goals").upsert(
      {
        user_id: state.user.id,
        expense_limit: state.goals.expenseLimit,
        savings_goal: state.goals.savingsGoal,
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_id" }
    );

    if (error) {
      const msg = getUserFriendlyErrorMessage(error, "sync");
      setAuthMessage(`Meta salva localmente. ${msg}`);
      logErrorForDevelopment(error, "onGoalsSubmit");
    } else {
      setSyncStatus("Metas sincronizadas.");
    }
  }

  renderSummary();
  showToast("Metas atualizadas com sucesso!", "success", 3000);
  trackEvent("goals_updated", {
    expenseLimit: state.goals.expenseLimit,
    savingsGoal: state.goals.savingsGoal,
    hasCurrentBalance: Boolean(state.goals.currentBalanceSet)
  });
}

async function onReconcileBalanceClick() {
  const hasCurrentBalance = Boolean(state.goals.currentBalanceSet);
  const currentBalance = Number(state.goals.currentBalance || 0);

  if (!hasCurrentBalance || !Number.isFinite(currentBalance)) {
    currentBalanceInsightText.textContent = "Defina e salve o saldo atual no banco antes de conciliar.";
    return;
  }

  const totals = calculateTotals(state.transactions);
  const gap = Number((currentBalance - totals.balance).toFixed(2));

  if (Math.abs(gap) < 0.01) {
    currentBalanceInsightText.textContent = "Saldo ja conciliado. Nao ha ajuste necessario.";
    return;
  }

  const type = gap > 0 ? "income" : "expense";
  const amount = Math.abs(gap);
  const directionLabel = gap > 0 ? "entrada" : "saida";

  const confirmed = window.confirm(
    `Gerar ajuste de ${directionLabel} de ${formatCurrency(amount)} para conciliar o saldo?`
  );
  if (!confirmed) return;

  const adjustment = {
    id: crypto.randomUUID(),
    description: `Ajuste de conciliacao de saldo (${new Date().toLocaleDateString("pt-BR")})`,
    amount,
    date: getLocalTodayISODate(),
    type,
    category: "Outros",
    source_bank: "Ajuste",
    import_hash: null,
    import_batch_id: null,
    import_source_format: "manual-reconcile",
    imported_at: null
  };

  await saveTransaction(adjustment);
  render();

  currentBalanceInsightText.textContent = `Ajuste criado com sucesso (${directionLabel} de ${formatCurrency(amount)}).`;
  trackEvent("balance_reconciled", { amount, type });
}

async function onCategorySubmit(event) {
  event.preventDefault();
  const raw = newCategoryNameInput.value.trim();
  if (!raw) return;

  const categoryName = normalizeCategoryName(raw);

  if (state.categories.some((item) => item.name.toLowerCase() === categoryName.toLowerCase())) {
    setAuthMessage("Categoria ja existe.");
    return;
  }

  const category = { name: categoryName, isDefault: false };

  if (isCloudMode()) {
    const { error } = await supabaseClient.from("categories").insert({
      user_id: state.user.id,
      name: categoryName,
      is_default: false
    });

    if (error) {
      const msg = getUserFriendlyErrorMessage(error, "database");
      setAuthMessage(`Falha ao criar categoria: ${msg}`);
      logErrorForDevelopment(error, "onNewCategorySubmit");
      return;
    }

    setSyncStatus("Categoria sincronizada.");
  }

  state.categories.push(category);
  persistCategories();
  newCategoryNameInput.value = "";
  renderCategoryArea();
  showToast(`Categoria "${categoryName}" criada!`, "success", 3000);
  trackEvent("category_created", { categoryName });
}

function onAutoRuleSubmit(event) {
  event.preventDefault();
  const keyword = String(autoRuleKeywordInput?.value || "").trim().toLowerCase();
  const category = String(autoRuleCategorySelect?.value || "").trim();

  if (!keyword || !category) return;

  const exists = state.autoRules.some((rule) => rule.keyword === keyword && rule.category === category);
  if (exists) {
    setAuthMessage("Regra ja existe.");
    return;
  }

  state.autoRules.push({ id: crypto.randomUUID(), keyword, category });
  state.autoRules.forEach((rule, index) => {
    if (!Number.isFinite(Number(rule.priority))) {
      rule.priority = index + 1;
    }
  });
  persistAutoRules();
  autoRuleForm.reset();
  renderAutoRules();
  autoRulesStatusText.textContent = "Regra adicionada. Execute a simulacao para validar impacto antes da importacao.";
  trackEvent("auto_rule_created", { keyword, category });
}

function onAutoRuleListClick(event) {
  const btn = event.target.closest("button[data-rule-id]");
  if (!btn) return;

  const ruleId = btn.dataset.ruleId;
  const action = btn.dataset.action || "delete";

  if (action === "up" || action === "down") {
    moveAutoRule(ruleId, action === "up" ? -1 : 1);
    return;
  }

  state.autoRules = state.autoRules.filter((rule) => rule.id !== ruleId);
  state.autoRules.forEach((rule, index) => {
    rule.priority = index + 1;
  });
  persistAutoRules();
  renderAutoRules();
  if (autoRulesStatusText) {
    autoRulesStatusText.textContent = "Regra excluida com sucesso.";
  }
}

function moveAutoRule(ruleId, direction) {
  const ordered = getOrderedAutoRules();
  const index = ordered.findIndex((rule) => rule.id === ruleId);
  if (index < 0) return;

  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= ordered.length) return;

  const temp = ordered[index];
  ordered[index] = ordered[nextIndex];
  ordered[nextIndex] = temp;

  ordered.forEach((rule, orderIndex) => {
    rule.priority = orderIndex + 1;
  });

  state.autoRules = ordered;
  persistAutoRules();
  renderAutoRules();
}

function onSimulateRulesClick() {
  if (!autoRulesStatusText) return;

  if (!state.autoRules.length) {
    autoRulesStatusText.textContent = "Crie pelo menos uma regra para simular.";
    return;
  }

  const simulation = summarizeRuleSimulation(state.transactions);
  if (simulation.candidates === 0) {
    autoRulesStatusText.textContent = "Nenhuma transacao pendente/Outros disponivel para simulacao.";
    return;
  }

  if (simulation.matched === 0) {
    autoRulesStatusText.textContent = `Simulacao concluida: ${simulation.candidates} candidatas, 0 com regra aplicada.`;
    return;
  }

  autoRulesStatusText.textContent = `Simulacao: ${simulation.matched} de ${simulation.candidates} candidatas seriam categorizadas automaticamente (${simulation.distinctCategories} categorias).`;
}

function summarizeRuleSimulation(transactions) {
  const orderedRules = getOrderedAutoRules();
  const categorySet = new Set();
  let candidates = 0;
  let matched = 0;

  transactions.forEach((tx) => {
    const currentCategory = String(tx.category || "").toLowerCase();
    const canOverride = !currentCategory || currentCategory === "outros" || currentCategory.includes("pendente");
    if (!canOverride) return;

    candidates += 1;
    const text = String(tx.description || "").toLowerCase();
    const rule = orderedRules.find((item) => text.includes(item.keyword));
    if (!rule) return;

    matched += 1;
    categorySet.add(rule.category);
  });

  return {
    candidates,
    matched,
    distinctCategories: categorySet.size
  };
}

function onRecurringSubmit(event) {
  event.preventDefault();

  const template = {
    id: crypto.randomUUID(),
    description: String(recurringDescriptionInput?.value || "").trim(),
    amount: Number(recurringAmountInput?.value || 0),
    dayOfMonth: Number(recurringDayInput?.value || 0),
    type: String(recurringTypeInput?.value || "expense"),
    category: String(recurringCategorySelect?.value || "Outros")
  };

  if (!template.description || !Number.isFinite(template.amount) || template.amount <= 0) return;
  if (!Number.isInteger(template.dayOfMonth) || template.dayOfMonth < 1 || template.dayOfMonth > 31) return;

  state.recurringTemplates.push(template);
  persistRecurringTemplates();
  recurringForm.reset();
  recurringTypeInput.value = "expense";
  renderRecurringCategoryOptions();
  renderRecurringList();
  trackEvent("recurring_template_created", { type: template.type, category: template.category });
}

function onRecurringListClick(event) {
  const btn = event.target.closest("button[data-recurring-id]");
  if (!btn) return;

  state.recurringTemplates = state.recurringTemplates.filter((item) => item.id !== btn.dataset.recurringId);
  persistRecurringTemplates();
  renderRecurringList();
}

async function onGenerateRecurringClick() {
  if (!state.recurringTemplates.length) {
    recurringStatusText.textContent = "Cadastre recorrencias antes de gerar o mes.";
    return;
  }

  const monthKey = new Date().toISOString().slice(0, 7);
  const generated = state.recurringTemplates.map((template) => buildRecurringTransaction(template, monthKey));
  const existingKeys = new Set(state.transactions.map((tx) => transactionDedupKey(tx)));
  const unique = generated.filter((tx) => !existingKeys.has(transactionDedupKey(tx)));

  if (!unique.length) {
    recurringStatusText.textContent = "Nenhum novo lancamento recorrente para gerar neste mes.";
    return;
  }

  if (isCloudMode()) {
    const payload = unique.map((tx) => ({
      id: tx.id,
      user_id: state.user.id,
      description: tx.description,
      amount: tx.amount,
      date: tx.date,
      type: tx.type,
      category: tx.category,
      source_bank: tx.source_bank,
      import_hash: tx.import_hash,
      import_batch_id: tx.import_batch_id,
      import_source_format: tx.import_source_format,
      imported_at: tx.imported_at
    }));

    const { data, error } = await supabaseClient
      .from("transactions")
      .insert(payload)
      .select("id, description, amount, date, type, category, source_bank, import_hash, import_batch_id, import_source_format, imported_at");

    if (error) {
      const msg = getUserFriendlyErrorMessage(error, "database");
      recurringStatusText.textContent = `Falha ao gerar recorrências: ${msg}`;
      logErrorForDevelopment(error, "onRecurringRequestSubmit");
      return;
    }

    state.transactions.push(...(data || []).map(normalizeTransaction));
  } else {
    state.transactions.push(...unique);
  }

  persistTransactions();
  render();
  checkBudgetAlerts();
  recurringStatusText.textContent = `Geracao concluida: ${unique.length} lancamentos recorrentes adicionados.`;
  showToast(`${unique.length} lançamento(s) recorrente(s) gerado(s)!`, "success", 3000);
  trackEvent("recurring_generated", { generated: unique.length });
}

async function onCloseMonthClick() {
  const monthKey = getReportMonthKey();
  const monthDate = new Date(`${monthKey}-01T00:00:00`);
  const label = monthDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const checklist = buildMonthClosingChecklist(monthKey);
  renderCloseMonthChecklist(checklist);

  closeMonthStatus.textContent = `Fechando ${label}...`;
  onExportMonthlyCsvClick();
  await onExportMonthlyPdfClick();

  closeMonthStatus.textContent = `Fechamento concluido para ${label}. CSV e PDF gerados.`;
  trackEvent("month_closed_one_click", { monthKey });
}

function buildMonthClosingChecklist(monthKey) {
  const monthTransactions = state.transactions.filter((tx) => tx.date.slice(0, 7) === monthKey);
  const uncategorized = monthTransactions.filter((tx) => {
    const category = String(tx.category || "").toLowerCase();
    return !category || category === "outros" || category.includes("pendente");
  }).length;
  const highExpenses = monthTransactions.filter((tx) => tx.type === "expense" && tx.amount >= 1000).length;

  return [
    {
      title: "Lancamentos no mes",
      detail: `${monthTransactions.length} itens registrados`,
      status: monthTransactions.length > 0 ? "ok" : "warn"
    },
    {
      title: "Categorias pendentes",
      detail: `${uncategorized} transacoes em Outros/Pendente`,
      status: uncategorized > 0 ? "warn" : "ok"
    },
    {
      title: "Gastos altos para revisar",
      detail: `${highExpenses} despesas >= R$ 1.000,00`,
      status: highExpenses > 0 ? "warn" : "ok"
    }
  ];
}

function renderCloseMonthChecklist(checklist) {
  if (!closeMonthChecklist) return;

  closeMonthChecklist.innerHTML = checklist.map((item) => `
    <div class="legend-item">
      <span class="legend-dot" style="background:${item.status === "ok" ? "#0b7a5a" : "#d08f2f"}"></span>
      <span><strong>${escapeHtml(item.title)}:</strong> ${escapeHtml(item.detail)}</span>
    </div>
  `).join("");
}

function buildRecurringTransaction(template, monthKey) {
  const [yearText, monthText] = monthKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const maxDay = new Date(year, month, 0).getDate();
  const day = Math.min(template.dayOfMonth, maxDay);
  const date = `${yearText}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return normalizeTransaction({
    id: crypto.randomUUID(),
    description: template.description,
    amount: template.amount,
    date,
    type: template.type,
    category: template.category,
    source_bank: "Recorrente",
    import_hash: null,
    import_batch_id: null,
    import_source_format: "recurring",
    imported_at: new Date().toISOString()
  });
}

function applyAutoRulesOnTransactions(transactions) {
  if (!state.autoRules.length) return transactions;
  const orderedRules = getOrderedAutoRules();

  return transactions.map((tx) => {
    const currentCategory = String(tx.category || "").toLowerCase();
    const canOverride = !currentCategory || currentCategory === "outros" || currentCategory.includes("pendente");
    if (!canOverride) return tx;

    const text = String(tx.description || "").toLowerCase();
    const matched = orderedRules.find((rule) => text.includes(rule.keyword));
    if (!matched) return tx;

    return normalizeTransaction({ ...tx, category: matched.category });
  });
}

function normalizeTextForSimilarity(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isLikelyTransferText(description) {
  const text = normalizeTextForSimilarity(description);
  if (!text) return false;
  return ["pix", "transfer", "ted", "doc", "entre contas", "conta corrente"].some((item) => text.includes(item));
}

function isLikelyInternalTransferDuplicate(candidate, existing, sourceBank) {
  if (!candidate || !existing) return false;
  if (candidate.type === existing.type) return false;

  const amountGap = Math.abs(Number(candidate.amount || 0) - Number(existing.amount || 0));
  if (amountGap > 0.01) return false;

  const candidateDate = new Date(`${candidate.date}T00:00:00`);
  const existingDate = new Date(`${existing.date}T00:00:00`);
  if (Number.isNaN(candidateDate.getTime()) || Number.isNaN(existingDate.getTime())) return false;

  const daysGap = Math.abs(candidateDate.getTime() - existingDate.getTime()) / 86400000;
  if (daysGap > 2) return false;

  const existingBank = normalizeSourceBank(existing.source_bank || "");
  if (!existingBank || existingBank === sourceBank) return false;

  const candidateTransferLike = isLikelyTransferText(candidate.description);
  const existingTransferLike = isLikelyTransferText(existing.description);
  return candidateTransferLike || existingTransferLike;
}

function estimateImportConfidence(tx) {
  let score = 0;
  const reasons = [];

  const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(String(tx.date || ""));
  if (isoDate) score += 30;
  else reasons.push("data em formato incomum");

  const amount = Number(tx.amount || 0);
  if (amount > 0) score += 25;
  else reasons.push("valor nao reconhecido");

  if (amount >= 0.5 && amount <= 200000) score += 10;
  else reasons.push("valor fora do padrao");

  const description = String(tx.description || "").trim();
  if (description.length >= 6) score += 20;
  else reasons.push("descricao muito curta");

  const noisyPattern = /autenticacao|documento emitido|assinatura digital|hash|chave de seguranca|protocolo/i;
  if (!noisyPattern.test(description)) score += 10;
  else reasons.push("texto com ruido de comprovante");

  if (String(tx.category || "").toLowerCase() !== "outros") score += 5;

  const label = score >= 75 ? "Alta" : score >= 50 ? "Media" : "Baixa";
  const reason = reasons.length ? reasons.slice(0, 2).join(", ") : "dados consistentes";

  return { score, label, reason };
}

function buildReviewedImportRows(transactions, sourceBank) {
  return transactions.map((tx) => {
    const confidence = estimateImportConfidence(tx);
    const selected = true;
    let reviewNote = confidence.reason;

    const matched = state.transactions.find((existing) => isLikelyInternalTransferDuplicate(tx, existing, sourceBank));
    if (matched) {
      reviewNote = `Possivel transferencia interna ja registrada em ${matched.source_bank}.`;
    }

    return {
      ...tx,
      selected,
      confidenceLabel: confidence.label,
      confidenceScore: confidence.score,
      reviewNote
    };
  });
}

async function onImportSubmit(event) {
  event.preventDefault();
  const submitBtn = importForm.querySelector('button[type="submit"]');
  setButtonBusy(submitBtn, true, "Importando...");

  try {
    const sourceBank = normalizeSourceBank(importSourceBankInput.value);
    if (!sourceBank) {
      importStatusText.textContent = "Informe o banco/origem da importacao.";
      return;
    }

    let payloads = [];
    try {
      payloads = await readImportPayloads();
    } catch (error) {
      const msg = getUserFriendlyErrorMessage(error, "import");
      importStatusText.textContent = `Falha ao ler arquivo(s): ${msg}.`;
      logErrorForDevelopment(error, "onImportFilesSelected");
      return;
    }
    if (!payloads.length) {
      importStatusText.textContent = "Selecione um arquivo ou cole o conteudo bruto para importar.";
      return;
    }

    const stats = { totalRecords: 0, missingDateRecords: 0, invalidRecords: 0 };
    const formatSet = new Set();
    let failedFiles = 0;
    const failedLabels = [];
    const parsed = [];

    for (const payload of payloads) {
      if (new Blob([payload.raw]).size > MAX_IMPORT_BYTES) {
        failedFiles += 1;
        failedLabels.push(`${payload.label}: acima de 10 MB`);
        continue;
      }

      let parsedResult;
      try {
        parsedResult = parseImportedTransactions(payload.raw, {
          sourceBank,
          normalizeCategoryName,
          sourceFormatHint: payload.kind === "pdf" ? "pdf" : ""
        });
      } catch {
        failedFiles += 1;
        failedLabels.push(`${payload.label}: formato nao reconhecido`);
        continue;
      }

      if (!parsedResult.transactions.length && parsedResult.stats.totalRecords === 0) {
        failedFiles += 1;
        failedLabels.push(`${payload.label}: sem texto/lancamentos reconhecidos`);
        continue;
      }

      formatSet.add(parsedResult.format);
      stats.totalRecords += parsedResult.stats.totalRecords;
      stats.missingDateRecords += parsedResult.stats.missingDateRecords;
      stats.invalidRecords += parsedResult.stats.invalidRecords;
      parsed.push(...applyAutoRulesOnTransactions(parsedResult.transactions.map(normalizeTransaction)));
    }

    const format = [...formatSet].join(",") || "mixed";

    if (parsed.length === 0) {
      importStatusText.textContent = `Nenhuma transacao valida encontrada. Registros lidos: ${stats.totalRecords}. Invalidos: ${stats.invalidRecords}. Arquivos com falha: ${failedFiles}.`;
      return;
    }

    const existingKeys = new Set(state.transactions.map((tx) => transactionDedupKey(tx)));
    const unique = [];
    let duplicates = 0;
    parsed.forEach((tx) => {
      const key = transactionDedupKey(tx);
      if (existingKeys.has(key)) {
        duplicates += 1;
        return;
      }
      existingKeys.add(key);
      unique.push(tx);
    });

    if (unique.length === 0) {
      importStatusText.textContent = `Importacao ignorada: todas as transacoes ja existiam. Registros lidos: ${stats.totalRecords}. Duplicados: ${duplicates}.`;
      return;
    }

    const reviewedRows = buildReviewedImportRows(unique, sourceBank);

    pendingImportDraft = {
      sourceBank,
      format,
      stats,
      payloadsCount: payloads.length,
      failedFiles,
      failedLabels,
      duplicates,
      totalParsed: parsed.length,
      transactions: reviewedRows
    };

    renderImportReview();
    importStatusText.textContent = [
      `Pre-importacao pronta: ${unique.length} transacoes detectadas de ${sourceBank}.`,
      "Revise os itens abaixo e clique em Confirmar Importacao.",
      `Arquivos: ${payloads.length}. Falhas: ${failedFiles}.`,
      failedLabels.length ? `Detalhes: ${failedLabels.slice(0, 3).join(" | ")}.` : ""
    ].join(" ");
  } finally {
    setButtonBusy(submitBtn, false);
  }
}

function onImportReviewInput(event) {
  if (!pendingImportDraft) return;
  const row = event.target.closest("tr[data-index]");
  if (!row) return;
  const index = Number(row.dataset.index);
  const tx = pendingImportDraft.transactions[index];
  if (!tx) return;

  const field = event.target.dataset.field;
  if (!field) return;

  if (field === "selected") {
    tx.selected = Boolean(event.target.checked);
  }
  if (field === "date") {
    tx.date = normalizeDateForDateInput(event.target.value) || tx.date;
  }
  if (field === "description") {
    tx.description = String(event.target.value || "").trim().slice(0, 240);
  }
  if (field === "amount") {
    const amount = Number(event.target.value || 0);
    if (Number.isFinite(amount) && amount > 0) tx.amount = amount;
  }
  if (field === "type") {
    tx.type = event.target.value === "income" ? "income" : "expense";
  }
  if (field === "category") {
    tx.category = normalizeCategoryName(String(event.target.value || tx.category));
  }

  const confidence = estimateImportConfidence(tx);
  tx.confidenceLabel = confidence.label;
  tx.confidenceScore = confidence.score;
  if (!String(tx.reviewNote || "").startsWith("Possivel transferencia interna")) {
    tx.reviewNote = confidence.reason;
  }

  renderImportReview();
  updateImportReviewSummary();
}

function onCancelImportClick() {
  pendingImportDraft = null;
  renderImportReview();
  importStatusText.textContent = "Importacao cancelada. Nenhum dado foi salvo.";
}

function onSelectAllImportRowsClick() {
  if (!pendingImportDraft) return;
  pendingImportDraft.transactions.forEach((tx) => {
    tx.selected = true;
  });
  renderImportReview();
  importStatusText.textContent = "Todos os itens foram marcados para importacao.";
}

function onClearAllImportRowsClick() {
  if (!pendingImportDraft) return;
  pendingImportDraft.transactions.forEach((tx) => {
    tx.selected = false;
  });
  renderImportReview();
  importStatusText.textContent = "Todos os itens foram desmarcados.";
}

function readLastImportMeta() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAST_IMPORT_META);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.batchId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLastImportMeta(meta) {
  if (!meta) {
    localStorage.removeItem(STORAGE_KEY_LAST_IMPORT_META);
    updateUndoLastImportButton();
    return;
  }

  localStorage.setItem(STORAGE_KEY_LAST_IMPORT_META, JSON.stringify(meta));
  updateUndoLastImportButton();
}

function updateUndoLastImportButton() {
  if (!undoLastImportBtn) return;
  const meta = readLastImportMeta();
  if (!meta) {
    undoLastImportBtn.disabled = true;
    undoLastImportBtn.textContent = "Desfazer Ultima Importacao";
    return;
  }

  undoLastImportBtn.disabled = false;
  undoLastImportBtn.textContent = `Desfazer Ultima Importacao (${Number(meta.count || 0)})`;
}

async function onUndoLastImportClick() {
  const meta = readLastImportMeta();
  if (!meta?.batchId) {
    importStatusText.textContent = "Nao ha lote de importacao recente para desfazer.";
    updateUndoLastImportButton();
    return;
  }

  const confirmed = window.confirm(`Desfazer a ultima importacao de ${meta.sourceBank || "origem desconhecida"}?`);
  if (!confirmed) return;

  if (isCloudMode()) {
    const { error } = await supabaseClient
      .from("transactions")
      .delete()
      .eq("user_id", state.user.id)
      .eq("import_batch_id", meta.batchId);

    if (error) {
      const msg = getUserFriendlyErrorMessage(error, "sync");
      importStatusText.textContent = `Nao foi possivel desfazer na nuvem: ${msg}`;
      logErrorForDevelopment(error, "onUndoLastImportClick");
      return;
    }
  }

  const before = state.transactions.length;
  state.transactions = state.transactions.filter((tx) => tx.import_batch_id !== meta.batchId);
  const removed = before - state.transactions.length;

  persistTransactions();
  render();
  writeLastImportMeta(null);

  if (!removed) {
    importStatusText.textContent = "Lote nao encontrado entre as transacoes atuais.";
    return;
  }

  importStatusText.textContent = `Importacao desfeita: ${removed} transacao(oes) removida(s).`;
  trackEvent("import_undo", { batchId: meta.batchId, removed });
}

function appendImportAuditEntry(entry) {
  const item = {
    id: String(entry.id || crypto.randomUUID()),
    importedAt: String(entry.importedAt || new Date().toISOString()),
    sourceBank: String(entry.sourceBank || "Origem desconhecida"),
    format: String(entry.format || "desconhecido"),
    selectedCount: Math.max(0, Number(entry.selectedCount || 0)),
    duplicates: Math.max(0, Number(entry.duplicates || 0)),
    failedFiles: Math.max(0, Number(entry.failedFiles || 0)),
    totalRecords: Math.max(0, Number(entry.totalRecords || 0)),
    status: ["cloud", "local", "pending"].includes(String(entry.status)) ? String(entry.status) : "local",
    note: String(entry.note || "").trim().slice(0, 220)
  };

  state.importHistory = [item, ...state.importHistory].slice(0, MAX_IMPORT_LOG_ITEMS);
  persistImportHistory();
  renderImportAudit();
}

function getPendingSyncTransactions() {
  return state.transactions.filter((tx) => Boolean(tx.pending_sync));
}

function renderImportAudit() {
  if (!importAuditList) return;

  const pendingCount = getPendingSyncTransactions().length;

  if (!state.importHistory.length) {
    importAuditList.innerHTML = `
      <small class="helper-text">Sem historico de importacao ainda.</small>
      <small class="helper-text">Pendentes de sincronizacao: ${pendingCount}.</small>
    `;
    if (resendPendingSyncBtn) {
      resendPendingSyncBtn.disabled = pendingCount === 0;
      resendPendingSyncBtn.textContent = pendingCount > 0
        ? `Reenviar Pendentes (${pendingCount})`
        : "Reenviar Pendentes";
    }
    return;
  }

  importAuditList.innerHTML = state.importHistory.map((item) => {
    const dateLabel = formatDate(item.importedAt);
    const statusMap = {
      cloud: "Sincronizado na nuvem",
      local: "Salvo localmente",
      pending: "Pendente de sincronizacao"
    };
    const meta = [
      `${item.selectedCount} importadas`,
      `${item.duplicates} duplicadas`,
      `${item.failedFiles} arquivo(s) com falha`
    ].join(" | ");

    return `
      <div class="rule-item">
        <div>
          <strong>${escapeHtml(item.sourceBank)} - ${escapeHtml(dateLabel)}</strong>
          <small>${escapeHtml(statusMap[item.status] || statusMap.local)} | formato: ${escapeHtml(item.format)} | lidos: ${item.totalRecords}</small>
          <small>${escapeHtml(meta)}${item.note ? ` | nota: ${escapeHtml(item.note)}` : ""}</small>
        </div>
      </div>
    `;
  }).join("");

  if (resendPendingSyncBtn) {
    resendPendingSyncBtn.disabled = pendingCount === 0;
    resendPendingSyncBtn.textContent = pendingCount > 0
      ? `Reenviar Pendentes (${pendingCount})`
      : "Reenviar Pendentes";
  }
}

async function onResendPendingSyncClick() {
  const pending = getPendingSyncTransactions();
  if (!pending.length) {
    importStatusText.textContent = "Nao ha transacoes pendentes para reenviar.";
    renderImportAudit();
    return;
  }

  if (!isCloudMode()) {
    importStatusText.textContent = "Faca login para reenviar pendencias para a nuvem.";
    return;
  }

  setButtonBusy(resendPendingSyncBtn, true, "Reenviando...");
  importStatusText.textContent = `Reenviando ${pending.length} transacao(oes) pendente(s)...`;

  try {
    const payload = pending.map((tx) => ({
      id: tx.id,
      user_id: state.user.id,
      description: tx.description,
      amount: tx.amount,
      date: tx.date,
      type: tx.type,
      category: tx.category,
      source_bank: tx.source_bank || "Manual",
      import_hash: tx.import_hash || null,
      import_batch_id: tx.import_batch_id || null,
      import_source_format: tx.import_source_format || null,
      imported_at: tx.imported_at || null
    }));

    const { error } = await supabaseClient.from("transactions").upsert(payload, { onConflict: "id" });

    if (error) {
      const msg = getUserFriendlyErrorMessage(error, "sync");
      importStatusText.textContent = `Falha ao reenviar pendencias: ${msg}`;
      logErrorForDevelopment(error, "onResendPendingSyncClick");
      setSyncStatus("Pendencias continuam locais. Tente novamente.");
      return;
    }

    const pendingIds = new Set(pending.map((tx) => tx.id));
    state.transactions = state.transactions.map((tx) => (
      pendingIds.has(tx.id)
        ? normalizeTransaction({ ...tx, pending_sync: false })
        : tx
    ));
    persistTransactions();
    render();
    setSyncStatus("Pendencias reenviadas para a nuvem com sucesso.");
    importStatusText.textContent = `${pending.length} pendencia(s) sincronizada(s) na nuvem.`;

    appendImportAuditEntry({
      sourceBank: "Reenvio pendente",
      format: "sync-retry",
      selectedCount: pending.length,
      duplicates: 0,
      failedFiles: 0,
      totalRecords: pending.length,
      status: "cloud",
      note: "reenvio manual de pendencias"
    });
  } finally {
    setButtonBusy(resendPendingSyncBtn, false);
  }
}

function onApplyAiSuggestionsClick() {
  if (!pendingImportDraft || !pendingImportDraft.transactions.length) return;

  let changed = 0;
  pendingImportDraft.transactions.forEach((tx) => {
    if (!tx.selected) return;
    const suggestion = suggestWithLocalAI(tx);

    if (suggestion.type && suggestion.type !== tx.type) {
      tx.type = suggestion.type;
      changed += 1;
    }

    if (suggestion.category && suggestion.category !== tx.category) {
      tx.category = suggestion.category;
      changed += 1;
    }

    const confidence = estimateImportConfidence(tx);
    tx.confidenceLabel = confidence.label;
    tx.confidenceScore = confidence.score;
    if (!String(tx.reviewNote || "").startsWith("Possivel transferencia interna")) {
      tx.reviewNote = confidence.reason;
    }
  });

  renderImportReview();
  importStatusText.textContent = changed > 0
    ? `IA local aplicada: ${changed} ajuste(s) sugerido(s) em tipo/categoria.`
    : "IA local nao encontrou ajustes relevantes nos itens selecionados.";
}

async function onConfirmImportClick() {
  if (!pendingImportDraft) {
    importStatusText.textContent = "Nenhuma importacao pendente para confirmar.";
    return;
  }

  setButtonBusy(confirmImportBtn, true, "Confirmando...");
  importStatusText.textContent = "Confirmando importacao...";

  try {
    const draft = pendingImportDraft;
    let syncMode = "local";
    let syncErrorMessage = "";
    let selected = draft.transactions
      .filter((tx) => tx.selected)
      .map((tx) => normalizeTransaction(tx))
      .filter((tx) => tx.description && tx.date && Number(tx.amount) > 0);

    // If checkboxes were not toggled correctly in the UI, fallback to all valid rows.
    if (!selected.length && draft.transactions.length > 0) {
      selected = draft.transactions
        .map((tx) => normalizeTransaction(tx))
        .filter((tx) => tx.description && tx.date && Number(tx.amount) > 0);
    }

    if (!selected.length) {
      importStatusText.textContent = "Selecione ao menos uma transacao valida para confirmar.";
      return;
    }

    const sourceBank = draft.sourceBank;
    const format = draft.format;
    const importBatchId = crypto.randomUUID();
    const importedAt = new Date().toISOString();

    await ensureCategoriesForImportedTransactions(selected);

    if (isCloudMode()) {
      syncMode = "cloud";
      const payload = selected.map((tx) => ({
        id: tx.id,
        user_id: state.user.id,
        description: tx.description,
        amount: tx.amount,
        date: tx.date,
        type: tx.type,
        category: tx.category,
        source_bank: tx.source_bank,
        import_hash: tx.import_hash,
        import_batch_id: importBatchId,
        import_source_format: format,
        imported_at: importedAt
      }));

      const insertPromise = supabaseClient
        .from("transactions")
        .insert(payload)
        .select("id, description, amount, date, type, category, source_bank, import_hash, import_batch_id, import_source_format, imported_at");

      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => resolve({ data: null, error: { message: "tempo limite na sincronizacao" } }), 10000);
      });

      const { data, error } = await Promise.race([insertPromise, timeoutPromise]);

      if (error) {
        const msg = getUserFriendlyErrorMessage(error, "sync");
        state.transactions.push(...selected.map((tx) => ({
          ...tx,
          import_batch_id: importBatchId,
          import_source_format: format,
          imported_at: importedAt,
          pending_sync: true
        })));
        persistTransactions();
        render();
        importStatusText.textContent = `Importacao salva localmente (${selected.length} itens), mas falhou na nuvem: ${msg}`;
        setSyncStatus("Importacao pendente de sincronizacao na nuvem.");
        syncMode = "pending";
        syncErrorMessage = msg;
        logErrorForDevelopment(error, "onConfirmImportClick");
      } else {
        state.transactions.push(...(data || []).map((tx) => normalizeTransaction({ ...tx, pending_sync: false })));
        persistTransactions();
        render();
      }
    } else {
      state.transactions.push(...selected.map((tx) => ({
        ...tx,
        import_batch_id: importBatchId,
        import_source_format: format,
        imported_at: importedAt,
        pending_sync: false
      })));
      persistTransactions();
      render();
      checkBudgetAlerts();
      showToast(`${selected.length} transação(ões) importada(s) com sucesso!`, "success", 3000);
    }

    if (!String(importStatusText.textContent || "").includes("salva localmente")) {
      importStatusText.textContent = [
        `Importacao concluida: ${selected.length} novas transacoes adicionadas de ${sourceBank}.`,
        `Arquivos processados: ${draft.payloadsCount}. Falhas: ${draft.failedFiles}.`,
        `Lidas: ${draft.stats.totalRecords}. Invalidas: ${draft.stats.invalidRecords}.`,
        `Sem data original (data atual aplicada): ${draft.stats.missingDateRecords}.`,
        `Duplicadas ignoradas: ${draft.duplicates}.`,
        draft.failedLabels.length ? `Detalhes das falhas: ${draft.failedLabels.slice(0, 3).join(" | ")}.` : ""
      ].join(" ");
    }

    localStorage.setItem(STORAGE_KEY_LAST_IMPORT_SOURCE, sourceBank);
    writeLastImportMeta({
      batchId: importBatchId,
      sourceBank,
      count: selected.length,
      importedAt
    });
    appendImportAuditEntry({
      id: importBatchId,
      importedAt,
      sourceBank,
      format,
      selectedCount: selected.length,
      duplicates: draft.duplicates || 0,
      failedFiles: draft.failedFiles || 0,
      totalRecords: draft.stats?.totalRecords || selected.length,
      status: syncMode,
      note: syncErrorMessage || ""
    });
    droppedImportFiles = [];
    if (importFileInput) importFileInput.value = "";
    pendingImportDraft = null;
    renderImportReview();

    trackEvent("import_transactions", {
      sourceBank,
      imported: selected.length,
      totalParsed: draft.totalParsed || selected.length,
      format,
      files: draft.payloadsCount || 1,
      failedFiles: draft.failedFiles || 0
    });
  } catch (error) {
    const msg = getUserFriendlyErrorMessage(error, "import");
    importStatusText.textContent = `Falha ao confirmar importacao: ${msg}.`;
    logErrorForDevelopment(error, "onConfirmImportClick.catch");
  } finally {
    setButtonBusy(confirmImportBtn, false);
  }
}

function updateImportReviewSummary() {
  if (!importReviewSummary || !pendingImportDraft) return;
  const selectedCount = pendingImportDraft.transactions.filter((tx) => tx.selected).length;
  const lowConfidence = pendingImportDraft.transactions.filter((tx) => String(tx.confidenceLabel || "") === "Baixa").length;
  const autoUnselected = pendingImportDraft.transactions.filter((tx) => !tx.selected && String(tx.reviewNote || "").includes("transferencia interna")).length;
  importReviewSummary.textContent = `${selectedCount} de ${pendingImportDraft.transactions.length} itens selecionados. Confianca baixa: ${lowConfidence}. Possiveis transferencias internas desmarcadas: ${autoUnselected}.`;
}

function renderImportReview() {
  if (!importReviewModal || !importReviewPanel || !importReviewTableBody || !importReviewSummary) return;

  if (!pendingImportDraft || !pendingImportDraft.transactions.length) {
    importReviewModal.classList.add("is-hidden");
    importReviewModal.setAttribute("aria-hidden", "true");
    importReviewTableBody.innerHTML = "";
    importReviewSummary.textContent = "Sem itens para revisar.";
    return;
  }

  const categoryOptions = state.categories
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    .map((item) => item.name);

  importReviewTableBody.innerHTML = pendingImportDraft.transactions.map((tx, index) => {
    const options = categoryOptions.map((name) => `<option value="${escapeHtml(name)}" ${name === tx.category ? "selected" : ""}>${escapeHtml(name)}</option>`).join("");
    const confidenceClass = String(tx.confidenceLabel || "").toLowerCase();
    return `
      <tr data-index="${index}">
        <td class="check-cell" data-label="Usar"><input type="checkbox" data-field="selected" ${tx.selected ? "checked" : ""}></td>
        <td data-label="Data"><input type="date" data-field="date" value="${escapeHtml(normalizeDateForDateInput(tx.date) || getLocalTodayISODate())}"></td>
        <td data-label="Descricao"><input type="text" data-field="description" value="${escapeHtml(tx.description)}" maxlength="240"></td>
        <td data-label="Confianca"><span class="confidence-badge ${confidenceClass}">${escapeHtml(tx.confidenceLabel || "Media")}</span></td>
        <td data-label="Tipo">
          <select data-field="type">
            <option value="expense" ${tx.type === "expense" ? "selected" : ""}>Despesa</option>
            <option value="income" ${tx.type === "income" ? "selected" : ""}>Receita</option>
          </select>
        </td>
        <td data-label="Categoria"><select data-field="category">${options}</select></td>
        <td data-label="Valor"><input type="number" data-field="amount" min="0.01" step="0.01" value="${tx.amount}"></td>
        <td data-label="Motivo"><small>${escapeHtml(tx.reviewNote || "")}</small></td>
      </tr>
    `;
  }).join("");

  importReviewModal.classList.remove("is-hidden");
  importReviewModal.setAttribute("aria-hidden", "false");
  updateImportReviewSummary();
}

function mountImportReviewModal() {
  if (!importReviewModal) return;
  if (importReviewModal.parentElement === document.body) return;
  document.body.append(importReviewModal);
}

function suggestWithLocalAI(tx) {
  const text = String(tx.description || "").toLowerCase();

  const hints = [
    { keywords: ["super", "mercado", "atac", "padaria", "ifood", "restaurante"], category: "Alimentacao", type: "expense" },
    { keywords: ["uber", "99", "combust", "posto", "estacion", "pedagio"], category: "Transporte", type: "expense" },
    { keywords: ["farm", "droga", "hospital", "clinica", "medic"], category: "Saude", type: "expense" },
    { keywords: ["aluguel", "condominio", "energia", "agua", "internet", "vivo", "tim", "claro"], category: "Moradia", type: "expense" },
    { keywords: ["salario", "folha", "pagamento recebido", "pix recebido", "deposito"], category: "Salario", type: "income" },
    { keywords: ["rendimento", "invest", "cdb", "tesouro", "dividendo"], category: "Investimento", type: "income" },
    { keywords: ["cinema", "spotify", "netflix", "lazer", "show"], category: "Lazer", type: "expense" },
    { keywords: ["curso", "escola", "faculdade", "udemy", "alura"], category: "Educacao", type: "expense" }
  ];

  const matched = hints.find((hint) => hint.keywords.some((keyword) => text.includes(keyword)));
  if (!matched) return { type: tx.type, category: tx.category };

  const categoryExists = state.categories.some((item) => item.name.toLowerCase() === matched.category.toLowerCase());
  return {
    type: matched.type,
    category: categoryExists ? matched.category : tx.category
  };
}

async function readImportPayloads() {
  const direct = String(importRawTextInput.value || "").trim();
  if (direct) return [{ raw: direct, label: "texto", kind: "text" }];

  const files = droppedImportFiles.length
    ? droppedImportFiles
    : Array.from(importFileInput?.files || []);

  if (!files.length) return [];

  return Promise.all(files.map(async (file) => {
    const isPdf = isPdfFile(file);
    const sizeBytes = file?.size || 0;
    if (sizeBytes > MAX_IMPORT_BYTES) {
      throw new Error(`Arquivo excede ${Math.round(MAX_IMPORT_BYTES / (1024 * 1024))} MB: ${file.name || "arquivo"}`);
    }
    return {
      raw: isPdf ? await extractTextFromPdfFile(file) : await file.text(),
      label: file.name || "arquivo",
      kind: isPdf ? "pdf" : "text"
    };
  }));
}

function isPdfFile(file) {
  const name = String(file?.name || "").toLowerCase();
  return file?.type === "application/pdf" || name.endsWith(".pdf");
}

async function extractTextFromPdfFile(file) {
  if (!pdfJsModulePromise) {
    pdfJsModulePromise = import("pdfjs-dist");
  }

  const pdfjs = await pdfJsModulePromise;
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;
  }

  const bytes = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: bytes });
  const pdf = await loadingTask.promise;
  const parts = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = buildPdfPageText(textContent.items || []);
    parts.push(pageText);
  }

  const merged = parts.join("\n").replace(/\u00A0/g, " ").trim();
  if (merged && merged.length >= 20) {
    return merged;
  }

  const ocrText = await extractTextFromScannedPdf(pdf);
  if (!ocrText || ocrText.length < 20) {
    throw new Error("PDF sem texto reconhecivel. Tente outro arquivo ou qualidade melhor.");
  }

  return ocrText;
}

async function extractTextFromScannedPdf(pdf) {
  const worker = await getOcrWorker();
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const imageDataUrl = await renderPdfPageToImage(page, 2);
    const result = await worker.recognize(imageDataUrl);
    const text = String(result?.data?.text || "").trim();
    if (text) pages.push(text);
  }

  return pages.join("\n").replace(/\u00A0/g, " ").trim();
}

async function renderPdfPageToImage(page, scale = 2) {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext("2d", { alpha: false });

  await page.render({ canvasContext: context, viewport }).promise;
  return canvas.toDataURL("image/png");
}

async function getOcrWorker() {
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = (async () => {
      const worker = await createWorker("por+eng");
      return worker;
    })();
  }

  return ocrWorkerPromise;
}

function buildPdfPageText(items) {
  const rows = [];

  items.forEach((item) => {
    if (!("str" in item)) return;
    const text = String(item.str || "").trim();
    if (!text) return;

    const x = Array.isArray(item.transform) ? Number(item.transform[4] || 0) : 0;
    const y = Array.isArray(item.transform) ? Number(item.transform[5] || 0) : 0;

    // Group nearby text fragments by vertical position to reconstruct statement rows.
    const row = rows.find((r) => Math.abs(r.y - y) < 2.5);
    if (row) {
      row.items.push({ x, text });
    } else {
      rows.push({ y, items: [{ x, text }] });
    }
  });

  rows.sort((a, b) => b.y - a.y);

  return rows
    .map((row) => row.items.sort((a, b) => a.x - b.x).map((part) => part.text).join(" "))
    .join("\n");
}

async function updateImportPreview() {
  if (!importBatchPreview) return;

  const sourceBank = normalizeSourceBank(importSourceBankInput?.value || "");
  let payloads = [];
  try {
    payloads = await readImportPayloads();
  } catch (error) {
    const msg = getUserFriendlyErrorMessage(error, "file");
    importBatchPreview.innerHTML = `<small class="helper-text">Pre-visualizacao indisponivel: ${escapeHtml(msg)}. Se o PDF for escaneado, converta para CSV/OFX ou use PDF com texto selecionavel.</small>`;
    logErrorForDevelopment(error, "updateImportPreview");
    return;
  }

  if (!payloads.length) {
    importBatchPreview.innerHTML = '<small class="helper-text">Pre-visualizacao: selecione arquivos ou cole texto para validar antes de importar.</small>';
    return;
  }

  const stats = { totalRecords: 0, validRecords: 0, invalidRecords: 0, missingDateRecords: 0 };
  const previewItems = payloads.map((payload) => {
    const sizeBytes = new Blob([payload.raw]).size;
    if (sizeBytes > MAX_IMPORT_BYTES) {
      return {
        label: payload.label,
        format: "-",
        totalRecords: 0,
        validRecords: 0,
        invalidRecords: 0,
        sizeText: formatBytes(sizeBytes),
        status: "Arquivo acima do limite de 10 MB"
      };
    }

    try {
      const parsed = parseImportedTransactions(payload.raw, {
        sourceBank: sourceBank || "Importado",
        normalizeCategoryName,
        sourceFormatHint: payload.kind === "pdf" ? "pdf" : ""
      });
      const validRecords = parsed.transactions.length;

      stats.totalRecords += parsed.stats.totalRecords;
      stats.validRecords += validRecords;
      stats.invalidRecords += parsed.stats.invalidRecords;
      stats.missingDateRecords += parsed.stats.missingDateRecords;

      return {
        label: payload.label,
        format: parsed.format,
        totalRecords: parsed.stats.totalRecords,
        validRecords,
        invalidRecords: parsed.stats.invalidRecords,
        sizeText: formatBytes(sizeBytes),
        status: "Pronto"
      };
    } catch {
      return {
        label: payload.label,
        format: "-",
        totalRecords: 0,
        validRecords: 0,
        invalidRecords: 0,
        sizeText: formatBytes(sizeBytes),
        status: "Falha na leitura"
      };
    }
  });

  importBatchPreview.innerHTML = [
    `<small class="helper-text">Pre-visualizacao: ${previewItems.length} origem(ns), ${stats.validRecords} validas, ${stats.invalidRecords} invalidas, ${stats.missingDateRecords} sem data original.</small>`,
    ...previewItems.map((item) => `
      <div class="legend-item">
        <span class="legend-dot" style="background:${item.status === "Pronto" ? "#0b7a5a" : "#d08f2f"}"></span>
        <span><strong>${escapeHtml(item.label)}</strong> (${escapeHtml(item.sizeText)}) - ${escapeHtml(item.status)} - formato: ${escapeHtml(item.format)} - validas: ${item.validRecords}/${item.totalRecords}</span>
      </div>
    `)
  ].join("");
}

function bindImportDropZoneEvents() {
  if (!importDropZone) return;

  importDropZone.addEventListener("click", () => {
    importFileInput?.click();
  });

  importDropZone.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    importFileInput?.click();
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    importDropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      importDropZone.classList.add("drag-over");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    importDropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      importDropZone.classList.remove("drag-over");
    });
  });

  importDropZone.addEventListener("drop", (event) => {
    const files = Array.from(event.dataTransfer?.files || []);
    if (!files.length) return;
    droppedImportFiles = files;
    handleSelectedImportFiles(files, "arrastar/soltar");
  });
}

async function handleSelectedImportFiles(files, originLabel) {
  if (!files || files.length === 0) return;
  if (files.length === 1) {
    importStatusText.textContent = `Arquivo recebido (${originLabel}): ${files[0].name}`;
  } else {
    importStatusText.textContent = `${files.length} arquivos recebidos (${originLabel}).`;
  }
  await maybeInferSourceFromFiles(files);
  await updateImportPreview();
}

async function maybeInferSourceFromFiles(files) {
  if (!files || files.length === 0) return;

  for (const file of files) {
    const byName = inferSourceBankFromText(file.name || "", "");
    if (byName) {
      applyInferredSourceBank(byName);
      return;
    }
  }

  const firstFile = files[0];
  let sample = "";
  try {
    sample = (await firstFile.text()).slice(0, IMPORT_INFER_SAMPLE_CHARS);
  } catch {
    sample = "";
  }

  const inferred = inferSourceBankFromText(firstFile.name || "", sample);
  applyInferredSourceBank(inferred);
}

function maybeInferSourceFromRawText() {
  const raw = String(importRawTextInput?.value || "").trim();
  if (!raw) {
    updateImportPreview();
    return;
  }
  const inferred = inferSourceBankFromText("", raw.slice(0, IMPORT_INFER_SAMPLE_CHARS));
  applyInferredSourceBank(inferred);
}

function inferSourceBankFromText(fileName, sample) {
  const haystack = `${fileName} ${sample}`.toLowerCase();

  const candidates = [
    { pattern: /mercado\s*pago|mercadopago|mp\s*open\s*finance/, label: "Mercado Pago" },
    { pattern: /nubank|nu\s*pagamentos/, label: "Nubank" },
    { pattern: /picpay/, label: "PicPay" },
    { pattern: /sicoob/, label: "Sicoob" },
    { pattern: /itau|ita[uú]/, label: "Itau" },
    { pattern: /bradesco/, label: "Bradesco" },
    { pattern: /santander/, label: "Santander" },
    { pattern: /caixa\s*economica|caixa/, label: "Caixa" },
    { pattern: /banco\s*do\s*brasil|\bbb\b/, label: "Banco do Brasil" },
    { pattern: /inter\b|banco\s*inter/, label: "Banco Inter" },
    { pattern: /c6\s*bank|\bc6\b/, label: "C6 Bank" }
  ];

  const match = candidates.find((item) => item.pattern.test(haystack));
  return match?.label || "";
}

function applyInferredSourceBank(value) {
  const inferred = normalizeSourceBank(value);
  if (!inferred || !importSourceBankInput) return;

  if (importSourceBankInput.value.trim()) return;

  importSourceBankInput.value = inferred;
  importStatusText.textContent = `Origem inferida automaticamente: ${inferred}. Revise se necessario.`;
}

function onStartGuideClick() {
  guideStepIndex = 0;
  applyGuideStep();
}

function onPrevGuideClick() {
  if (guideStepIndex <= 0) return;
  guideStepIndex -= 1;
  applyGuideStep();
}

function onNextGuideClick() {
  if (guideStepIndex < 0 || guideStepIndex >= guideSteps.length - 1) return;
  guideStepIndex += 1;
  applyGuideStep();
}

function onFinishGuideClick() {
  clearGuideFocus();
  guideStepIndex = -1;
  localStorage.setItem(STORAGE_KEY_GUIDE_DONE, "1");
  guideStatusText.textContent = "Modo assistido concluido. Voce pode repetir quando quiser.";
  updateQuickstartVisibility();
  updateGuideButtons();
}

function updateQuickstartVisibility() {
  if (!quickstartSection) return;
  const done = localStorage.getItem(STORAGE_KEY_GUIDE_DONE) === "1";
  quickstartSection.classList.toggle("is-hidden", done);
}

function applyGuideStep() {
  const step = guideSteps[guideStepIndex];
  if (!step) return;

  clearGuideFocus();
  const section = document.getElementById(step.sectionId);
  if (section) {
    section.classList.add("guide-focus");
    section.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  guideStatusText.textContent = step.message;
  updateGuideButtons();
}

function clearGuideFocus() {
  guideSteps.forEach((step) => {
    const section = document.getElementById(step.sectionId);
    section?.classList.remove("guide-focus");
  });
}

function updateGuideButtons() {
  const active = guideStepIndex >= 0;
  if (startGuideBtn) startGuideBtn.disabled = active;
  if (prevGuideBtn) prevGuideBtn.disabled = !active || guideStepIndex <= 0;
  if (nextGuideBtn) nextGuideBtn.disabled = !active || guideStepIndex >= guideSteps.length - 1;
  if (finishGuideBtn) finishGuideBtn.disabled = !active;
}

function setButtonBusy(button, busy, busyLabel = "Processando...") {
  if (!button) return;
  if (busy) {
    button.dataset.originalText = button.textContent || "";
    button.textContent = busyLabel;
    button.disabled = true;
    return;
  }

  button.textContent = button.dataset.originalText || button.textContent;
  button.disabled = false;
}

function setLoadingState(isLoading, targetBtn = null) {
  setButtonBusy(targetBtn, isLoading, "Aguarde…");
}

function showGlobalSpinner() {
  if (globalSpinner) {
    globalSpinner.classList.remove("is-hidden");
  }
}

function hideGlobalSpinner() {
  if (globalSpinner) {
    globalSpinner.classList.add("is-hidden");
  }
}

function showToast(message, type = "warning", duration = 4000) {
  if (!toastContainer) return;

  const toastEl = document.createElement("div");
  toastEl.className = `toast toast--${type}`;
  toastEl.setAttribute("role", "status");
  toastEl.textContent = message;

  toastContainer.appendChild(toastEl);

  const timeoutId = setTimeout(() => {
    toastEl.classList.add("toast--closing");
    setTimeout(() => {
      toastEl.remove();
    }, 300);
  }, duration);

  toastEl.addEventListener("click", () => {
    clearTimeout(timeoutId);
    toastEl.classList.add("toast--closing");
    setTimeout(() => {
      toastEl.remove();
    }, 300);
  });
}

function checkBudgetAlerts() {
  const monthKey = getLocalCurrentMonth();
  const monthTransactions = state.transactions.filter(
    (tx) => tx.date.slice(0, 7) === monthKey && tx.type === "expense"
  );

  const spentByCategory = {};
  monthTransactions.forEach((tx) => {
    spentByCategory[tx.category] = (spentByCategory[tx.category] || 0) + tx.amount;
  });

  Object.entries(state.categoryBudgets).forEach(([category, budget]) => {
    if (!budget || budget <= 0) return;

    const spent = spentByCategory[category] || 0;
    const percentage = (spent / budget) * 100;
    const categoryKey = `${monthKey}-${category}`;

    if (percentage >= 100 && !alertedBudgetCategories.has(categoryKey)) {
      alertedBudgetCategories.add(categoryKey);
      showToast(
        `⚠️ Orçamento de "${category}" foi ultrapassado! (${formatCurrency(spent)} / ${formatCurrency(budget)})`,
        "error",
        5000
      );
    } else if (percentage >= 80 && percentage < 100) {
      const warnKey = `warn-${categoryKey}`;
      if (!alertedBudgetCategories.has(warnKey)) {
        alertedBudgetCategories.add(warnKey);
        showToast(
          `⏰ Atenção: "${category}" em ${percentage.toFixed(0)}% do orçamento (${formatCurrency(spent)} / ${formatCurrency(budget)})`,
          "warning",
          4000
        );
      }
    }
  });
}

async function ensureCategoriesForImportedTransactions(transactions) {
  const missing = [...new Set(transactions.map((tx) => tx.category))]
    .filter((category) => !state.categories.some((item) => item.name.toLowerCase() === category.toLowerCase()));

  if (missing.length === 0) return;

  missing.forEach((name) => {
    state.categories.push({ name, isDefault: false });
  });
  persistCategories();

  if (isCloudMode()) {
    const payload = missing.map((name) => ({ user_id: state.user.id, name, is_default: false }));
    const { error } = await supabaseClient.from("categories").upsert(payload, { onConflict: "user_id,name" });
    if (error) {
      const msg = getUserFriendlyErrorMessage(error, "database");
      setAuthMessage(`Categorias criadas localmente. Falha ao sincronizar categorias: ${msg}`);
      logErrorForDevelopment(error, "ensureCategoriesForImportedTransactions");
    }
  }
}

function onExportCsvClick() {
  const rows = getFilteredTransactions().sort((a, b) => new Date(a.date) - new Date(b.date));
  const header = ["data", "descricao", "categoria", "tipo", "valor"];
  const csvRows = [header.join(",")];

  rows.forEach((tx) => {
    csvRows.push(
      [
        tx.date,
        csvEscape(tx.description),
        csvEscape(tx.category),
        tx.type,
        String(tx.amount).replace(".", ",")
      ].join(",")
    );
  });

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `fluxoforte-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  trackEvent("report_filtered_csv_export", { rows: rows.length });
}

function onExportMonthlyCsvClick() {
  const report = buildMonthlyReportData(getReportMonthKey());
  const insights = buildFinancialInsights(report.monthKey);
  const lines = [];

  lines.push("tipo;chave;valor");
  lines.push(`resumo;mes;${report.monthKey}`);
  lines.push(`resumo;receitas;${toBrazilianNumber(report.totals.income)}`);
  lines.push(`resumo;despesas;${toBrazilianNumber(report.totals.expense)}`);
  lines.push(`resumo;saldo;${toBrazilianNumber(report.totals.balance)}`);
  lines.push(`resumo;taxa_poupanca;${toBrazilianNumber(report.savingsRate)}`);
  lines.push(`resumo;score_financeiro;${toBrazilianNumber(insights.score)}`);
  lines.push(`resumo;saldo_previsto_fim_mes;${toBrazilianNumber(insights.forecast.balance)}`);
  lines.push("");

  lines.push("categoria;total_despesa;orcamento;uso_percentual");
  report.categoryRanking.forEach((item) => {
    lines.push(
      `${csvEscape(item.category)};${toBrazilianNumber(item.spent)};${toBrazilianNumber(item.budget)};${toBrazilianNumber(item.ratio * 100)}`
    );
  });

  lines.push("");
  lines.push("data;descricao;categoria;tipo;valor");
  report.transactions.forEach((tx) => {
    lines.push(
      `${tx.date};${csvEscape(tx.description)};${csvEscape(tx.category)};${tx.type};${toBrazilianNumber(tx.amount)}`
    );
  });

  lines.push("");
  lines.push("insights;descricao");
  lines.push(`insights;${csvEscape(insights.anomalyMessage)}`);
  lines.push(`insights;${csvEscape(insights.recommendation)}`);

  downloadTextFile(lines.join("\n"), `fluxoforte-relatorio-${report.monthKey}.csv`, "text/csv;charset=utf-8;");
  trackEvent("report_monthly_csv_export", { monthKey: report.monthKey, rows: report.transactions.length });
}

async function onExportMonthlyPdfClick() {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable")
  ]);

  const report = buildMonthlyReportData(getReportMonthKey());
  const insights = buildFinancialInsights(report.monthKey);
  const pdf = new jsPDF({ unit: "pt", format: "a4" });

  pdf.setFontSize(16);
  pdf.text("Gestor de Gastos - Relatorio Mensal", 40, 42);
  pdf.setFontSize(11);
  pdf.text(`Mes: ${report.monthLabel}`, 40, 62);
  pdf.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 40, 78);

  autoTable(pdf, {
    startY: 96,
    head: [["Resumo", "Valor"]],
    body: [
      ["Receitas", formatCurrency(report.totals.income)],
      ["Despesas", formatCurrency(report.totals.expense)],
      ["Saldo", formatCurrency(report.totals.balance)],
      ["Taxa de poupanca", `${report.savingsRate.toFixed(1)}%`],
      ["Score financeiro", `${insights.score.toFixed(1)}`],
      ["Saldo previsto (fim do mes)", formatCurrency(insights.forecast.balance)]
    ]
  });

  autoTable(pdf, {
    startY: pdf.lastAutoTable.finalY + 16,
    head: [["Categoria", "Despesa", "Orcamento", "Uso"]],
    body: report.categoryRanking.map((item) => [
      item.category,
      formatCurrency(item.spent),
      item.budget > 0 ? formatCurrency(item.budget) : "-",
      item.budget > 0 ? `${(item.ratio * 100).toFixed(1)}%` : "-"
    ])
  });

  autoTable(pdf, {
    startY: pdf.lastAutoTable.finalY + 16,
    head: [["Inteligencia", "Detalhe"]],
    body: [
      ["Anomalias", insights.anomalyMessage],
      ["Recomendacao", insights.recommendation]
    ]
  });

  autoTable(pdf, {
    startY: pdf.lastAutoTable.finalY + 16,
    head: [["Data", "Descricao", "Categoria", "Tipo", "Valor"]],
    body: report.transactions.map((tx) => [
      formatDate(tx.date),
      tx.description,
      tx.category,
      tx.type === "income" ? "Receita" : "Despesa",
      formatCurrency(tx.amount)
    ])
  });

  pdf.save(`fluxoforte-relatorio-${report.monthKey}.pdf`);
  trackEvent("report_monthly_pdf_export", { monthKey: report.monthKey, rows: report.transactions.length });
}

function renderFinancialIntelligence(totals, monthKey = getReportMonthKey()) {
  const insights = buildFinancialInsights(monthKey);

  financialScoreValue.textContent = insights.score.toFixed(1);
  financialScoreText.textContent = insights.scoreExplanation;

  forecastBalanceValue.textContent = formatCurrency(insights.forecast.balance);
  forecastBalanceText.textContent = insights.forecast.explanation;

  anomalyText.textContent = insights.anomalyMessage;
  recommendationText.textContent = insights.recommendation;

  if (totals.income === 0 && totals.expense === 0) {
    financialScoreValue.textContent = "0.0";
    financialScoreText.textContent = "Adicione transacoes para calcular.";
    forecastBalanceText.textContent = "Sem dados suficientes.";
    anomalyText.textContent = "Sem anomalias detectadas.";
    recommendationText.textContent = "Registre lancamentos para receber recomendacoes.";
  }
}

function getBestMonthKeyForYear(yearKey) {
  const year = String(yearKey || new Date().getFullYear());
  const keys = [...new Set(
    state.transactions
      .map((tx) => String(tx.date || "").slice(0, 7))
      .filter((key) => /^\d{4}-\d{2}$/.test(key) && key.slice(0, 4) === year)
  )].sort();

  return keys[keys.length - 1] || `${year}-01`;
}

function buildFinancialInsights(monthKey = getReportMonthKey()) {
  const report = buildMonthlyReportData(monthKey);
  const monthlyTransactions = report.transactions;
  const monthBudgetStatus = evaluateBudgetStatus(monthlyTransactions);
  const score = calculateFinancialScore(report, monthBudgetStatus);
  const anomaly = detectExpenseAnomalies(monthlyTransactions);
  const forecast = projectEndMonthBalance(monthlyTransactions);

  const scoreExplanation = score >= 80
    ? "Ritmo financeiro consistente e sustentavel."
    : score >= 60
      ? "Boa saude geral, com pontos de ajuste em despesas variaveis."
      : "Risco financeiro elevado no mes atual.";

  const recommendation = generateRecommendation(report, monthBudgetStatus, forecast, anomaly);

  return {
    score,
    scoreExplanation,
    forecast,
    anomalyMessage: anomaly.message,
    recommendation
  };
}

function evaluateBudgetStatus(transactions) {
  const expensesByCategory = transactions.reduce((acc, tx) => {
    if (tx.type !== "expense") return acc;
    acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    return acc;
  }, {});

  let exceeded = 0;
  let warning = 0;

  Object.entries(state.categoryBudgets).forEach(([category, budget]) => {
    if (!budget || budget <= 0) return;
    const spent = expensesByCategory[category] || 0;
    const ratio = spent / budget;
    if (ratio >= 1) exceeded += 1;
    else if (ratio >= 0.8) warning += 1;
  });

  return { exceeded, warning };
}

function calculateFinancialScore(report, budgetStatus) {
  return calculateFinancialScoreEngine({
    savingsRate: report.savingsRate,
    budgetExceeded: budgetStatus.exceeded,
    budgetWarning: budgetStatus.warning,
    transactionCount: report.transactions.length
  });
}

function detectExpenseAnomalies(transactions) {
  const expenses = transactions.filter((tx) => tx.type === "expense");
  const outliers = detectOutlierExpenses(expenses).slice(0, 2);
  if (expenses.length < 4) {
    return { message: "Amostra insuficiente para detectar anomalias." };
  }

  if (outliers.length === 0) {
    return { message: "Nenhum gasto fora do padrao estatistico neste mes." };
  }

  const text = outliers
    .map((tx) => `${tx.category}: ${formatCurrency(tx.amount)} (${formatDate(tx.date)})`)
    .join(" | ");

  return { message: `Possiveis anomalias detectadas: ${text}` };
}

function projectEndMonthBalance(transactions) {
  const now = new Date();
  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const totals = calculateTotals(transactions);
  const projectedNet = projectEndMonthBalanceEngine({
    monthBalance: totals.balance,
    currentDay,
    totalDays
  });
  const dailyNet = totals.balance / Math.max(1, currentDay);

  return {
    balance: projectedNet,
    explanation: `Media diaria projetada em ${formatCurrency(dailyNet)} por dia.`
  };
}

function generateRecommendation(report, budgetStatus, forecast, anomaly) {
  if (budgetStatus.exceeded > 0) {
    return "Priorize reduzir categorias que estouraram orcamento e renegocie gastos fixos.";
  }

  if (forecast.balance < 0) {
    return "Seu saldo previsto esta negativo. Considere congelar despesas variaveis por 7 dias.";
  }

  if (anomaly.message.includes("anomalias")) {
    return "Revise os gastos fora do padrao e classifique se sao recorrentes ou excepcionais.";
  }

  if (report.savingsRate < 15) {
    return "Para acelerar sua reserva, direcione 10% de toda receita futura para poupanca automatica.";
  }

  return "Bom desempenho. Proximo passo: ampliar a meta de economia em 5% para o proximo mes.";
}

function buildMonthlyReportData(monthKey) {
  const transactions = state.transactions
    .filter((tx) => tx.date.slice(0, 7) === monthKey)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const totals = calculateTotals(transactions);
  const savingsRate = totals.income > 0 ? (totals.balance / totals.income) * 100 : 0;

  const categorySpentMap = transactions.reduce((acc, tx) => {
    if (tx.type !== "expense") return acc;
    acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    return acc;
  }, {});

  const categoryRanking = Object.entries(categorySpentMap)
    .map(([category, spent]) => {
      const budget = Number(state.categoryBudgets[category] || 0);
      return {
        category,
        spent,
        budget,
        ratio: budget > 0 ? spent / budget : 0
      };
    })
    .sort((a, b) => b.spent - a.spent);

  const monthDate = new Date(`${monthKey}-01T00:00:00`);

  return {
    monthKey,
    monthLabel: monthDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
    totals,
    savingsRate,
    categoryRanking,
    transactions
  };
}

async function saveTransaction(transaction) {
  if (isCloudMode()) {
    const { data, error } = await supabaseClient
      .from("transactions")
      .insert({
        id: transaction.id,
        user_id: state.user.id,
        description: transaction.description,
        amount: transaction.amount,
        date: transaction.date,
        type: transaction.type,
        category: transaction.category,
        source_bank: transaction.source_bank || "Manual",
        import_hash: transaction.import_hash || null,
        import_batch_id: transaction.import_batch_id || null,
        import_source_format: transaction.import_source_format || null,
        imported_at: transaction.imported_at || null
      })
      .select("id, description, amount, date, type, category, source_bank, import_hash, import_batch_id, import_source_format, imported_at")
      .single();

    if (error) {
      const msg = getUserFriendlyErrorMessage(error, "database");
      setAuthMessage(`Erro ao sincronizar transacao: ${msg}`);
      logErrorForDevelopment(error, "saveTransaction");
      return;
    }

    state.transactions.push(normalizeTransaction(data));
    setSyncStatus("Transacao salva na nuvem.");
  } else {
    state.transactions.push(transaction);
  }

  persistTransactions();
  trackEvent("transaction_created", { type: transaction.type, category: transaction.category, amount: transaction.amount });
}

async function updateTransaction(transaction) {
  if (isCloudMode()) {
    const { data, error } = await supabaseClient
      .from("transactions")
      .update({
        description: transaction.description,
        amount: transaction.amount,
        date: transaction.date,
        type: transaction.type,
        category: transaction.category,
        source_bank: transaction.source_bank || "Manual",
        import_hash: transaction.import_hash || null,
        import_batch_id: transaction.import_batch_id || null,
        import_source_format: transaction.import_source_format || null,
        imported_at: transaction.imported_at || null
      })
      .eq("id", transaction.id)
      .eq("user_id", state.user.id)
      .select("id, description, amount, date, type, category, source_bank, import_hash, import_batch_id, import_source_format, imported_at")
      .single();

    if (error) {
      const msg = getUserFriendlyErrorMessage(error, "database");
      setAuthMessage(`Erro ao atualizar transacao: ${msg}`);
      logErrorForDevelopment(error, "updateTransaction");
      return;
    }

    state.transactions = state.transactions.map((tx) => (tx.id === transaction.id ? normalizeTransaction(data) : tx));
    setSyncStatus("Transacao atualizada na nuvem.");
  } else {
    state.transactions = state.transactions.map((tx) => (tx.id === transaction.id ? transaction : tx));
  }

  persistTransactions();
  trackEvent("transaction_updated", { type: transaction.type, category: transaction.category, amount: transaction.amount });
}

async function deleteTransaction(id) {
  let cloudDeleteFailed = false;

  if (isCloudMode()) {
    const { error } = await supabaseClient.from("transactions").delete().eq("id", id).eq("user_id", state.user.id);

    if (error) {
      cloudDeleteFailed = true;
      const msg = getUserFriendlyErrorMessage(error, "database");
      setAuthMessage(`Falha ao excluir na nuvem: ${msg}. O item foi removido localmente.`);
      setSyncStatus("Atencao: exclusao pendente na nuvem. Tente novamente em alguns instantes.");
      logErrorForDevelopment(error, "deleteTransaction");
    } else {
      setSyncStatus("Transacao removida da nuvem.");
    }
  }

  state.transactions = state.transactions.filter((tx) => tx.id !== id);

  if (state.editingTransactionId === id) {
    resetTransactionForm();
  }

  persistTransactions();
  trackEvent(cloudDeleteFailed ? "transaction_deleted_local_fallback" : "transaction_deleted", { id });
}

async function removeCategory(categoryName) {
  const category = state.categories.find((item) => item.name === categoryName);
  if (!category || category.isDefault) return;

  const hasUsage = state.transactions.some((tx) => tx.category === categoryName);
  if (hasUsage) {
    setAuthMessage("Nao e possivel remover categoria em uso por transacoes.");
    return;
  }

  if (isCloudMode()) {
    const { error } = await supabaseClient
      .from("categories")
      .delete()
      .eq("user_id", state.user.id)
      .eq("name", categoryName);

    if (error) {
      const msg = getUserFriendlyErrorMessage(error, "database");
      setAuthMessage(`Falha ao remover categoria: ${msg}`);
      logErrorForDevelopment(error, "removeCategory");
      return;
    }

    await supabaseClient.from("category_budgets").delete().eq("user_id", state.user.id).eq("category_name", categoryName);
  }

  state.categories = state.categories.filter((item) => item.name !== categoryName);
  delete state.categoryBudgets[categoryName];
  ensureCategoriesValid();
  persistCategories();
  persistCategoryBudgets();
  trackEvent("category_deleted", { categoryName });
}

async function saveCategoryBudget(categoryName, amount) {
  const normalizedAmount = Math.max(0, Number(amount || 0));

  if (normalizedAmount === 0) {
    delete state.categoryBudgets[categoryName];

    if (isCloudMode()) {
      await supabaseClient
        .from("category_budgets")
        .delete()
        .eq("user_id", state.user.id)
        .eq("category_name", categoryName);
    }

    persistCategoryBudgets();
    return;
  }

  state.categoryBudgets[categoryName] = normalizedAmount;

  if (isCloudMode()) {
    const { error } = await supabaseClient.from("category_budgets").upsert(
      {
        user_id: state.user.id,
        category_name: categoryName,
        budget_amount: normalizedAmount,
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_id,category_name" }
    );

    if (error) {
      const msg = getUserFriendlyErrorMessage(error, "database");
      setAuthMessage(`Falha ao salvar orcamento: ${msg}`);
      logErrorForDevelopment(error, "saveCategoryBudget");
      return;
    }
  }

  persistCategoryBudgets();
  trackEvent("category_budget_saved", { categoryName, amount: normalizedAmount });
}

function startEditTransaction(id) {
  const tx = state.transactions.find((item) => item.id === id);
  if (!tx) return;

  state.editingTransactionId = tx.id;
  descriptionInput.value = tx.description;
  amountInput.value = formatCentsAsCurrency(Math.round(tx.amount * 100));
  amountInput.dataset.realValue = tx.amount.toString();
  dateInput.value = normalizeDateForDateInput(tx.date) || getLocalTodayISODate();
  typeInput.value = tx.type;
  categorySelect.value = tx.category;
  updateTransactionFormTone();

  saveTransactionBtn.textContent = "Atualizar Lancamento";
  cancelEditBtn.disabled = false;
  formModeText.textContent = "Voce esta editando um lancamento existente.";
}

function formatCentsAsCurrency(cents) {
  const valueInReais = cents / 100;
  return valueInReais.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function extractDigitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function onAmountInputMask(event) {
  const input = event.target;
  const digits = extractDigitsOnly(input.value);
  const cents = Number(digits) || 0;
  
  amountInput.dataset.realValue = (cents / 100).toString();
  input.value = formatCentsAsCurrency(cents);
}

function resetTransactionForm() {
  state.editingTransactionId = null;
  transactionForm.reset();
  dateInput.value = getLocalTodayISODate();
  amountInput.value = "";
  amountInput.dataset.realValue = "";
  saveTransactionBtn.textContent = "Salvar Lancamento";
  cancelEditBtn.disabled = true;
  formModeText.textContent = "Preencha os dados para adicionar um lancamento.";
  categorySelect.value = state.categories[0]?.name || "Outros";
  updateTransactionFormTone();
}

async function pullCloudData() {
  if (!isCloudMode()) return;

  setSyncStatus("Sincronizando com a nuvem...");

  let txRes;
  let goalsRes;
  let categoriesRes;
  let budgetsRes;
  try {
    [txRes, goalsRes, categoriesRes, budgetsRes] = await Promise.all([
    supabaseClient
      .from("transactions")
      .select("id, description, amount, date, type, category, source_bank, import_hash, import_batch_id, import_source_format, imported_at")
      .eq("user_id", state.user.id)
      .order("date", { ascending: false }),
    supabaseClient.from("goals").select("expense_limit, savings_goal").eq("user_id", state.user.id).maybeSingle(),
    supabaseClient.from("categories").select("name, is_default").eq("user_id", state.user.id).order("name"),
    supabaseClient.from("category_budgets").select("category_name, budget_amount").eq("user_id", state.user.id)
    ]);
  } catch (error) {
    const msg = getUserFriendlyErrorMessage(error, "sync");
    setAuthMessage(msg);
    setSyncStatus("Falha na sincronização. Continuando com dados locais.");
    logErrorForDevelopment(error, "pullCloudData.catch");
    return;
  }

  if (txRes.error) {
    setAuthMessage(getUserFriendlyErrorMessage(txRes.error, "database"));
    logErrorForDevelopment(txRes.error, "pullCloudData.transactions");
    setSyncStatus("Falha na sincronizacao. Continuando com dados locais.");
    return;
  }

  if (goalsRes.error && goalsRes.error.code !== "PGRST116") {
    setAuthMessage(getUserFriendlyErrorMessage(goalsRes.error, "database"));
    logErrorForDevelopment(goalsRes.error, "pullCloudData.goals");
  }

  if (categoriesRes.error) {
    setAuthMessage(getUserFriendlyErrorMessage(categoriesRes.error, "database"));
    logErrorForDevelopment(categoriesRes.error, "pullCloudData.categories");
  }

  if (budgetsRes.error) {
    setAuthMessage(getUserFriendlyErrorMessage(budgetsRes.error, "database"));
    logErrorForDevelopment(budgetsRes.error, "pullCloudData.budgets");
  }

  const remoteTransactions = (txRes.data || []).map(normalizeTransaction);
  const localPending = state.transactions.filter((tx) => Boolean(tx.pending_sync));

  if (remoteTransactions.length === 0 && state.transactions.length > 0) {
    await migrateLocalToCloud();
  } else {
    state.transactions = remoteTransactions;
    if (localPending.length) {
      const knownIds = new Set(remoteTransactions.map((tx) => tx.id));
      const missingPending = localPending.filter((tx) => !knownIds.has(tx.id));
      if (missingPending.length) {
        state.transactions.push(...missingPending.map((tx) => normalizeTransaction({ ...tx, pending_sync: true })));
        setSyncStatus(`Dados sincronizados com pendencias locais restantes: ${missingPending.length}.`);
      }
    }
  }

  if (goalsRes.data) {
    state.goals = {
      expenseLimit: Number(goalsRes.data.expense_limit) || 0,
      savingsGoal: Number(goalsRes.data.savings_goal) || 0,
      currentBalance: Number(state.goals.currentBalance || 0),
      currentBalanceSet: Boolean(state.goals.currentBalanceSet)
    };
    expenseLimitInput.value = state.goals.expenseLimit || "";
    savingsGoalInput.value = state.goals.savingsGoal || "";
    currentBalanceInput.value = state.goals.currentBalanceSet
      ? Number(state.goals.currentBalance || 0)
      : "";
  }

  if (categoriesRes.data?.length) {
    state.categories = categoriesRes.data.map((item) => ({
      name: String(item.name),
      isDefault: Boolean(item.is_default)
    }));
  }

  if (budgetsRes.data) {
    state.categoryBudgets = budgetsRes.data.reduce((acc, item) => {
      acc[String(item.category_name)] = Number(item.budget_amount) || 0;
      return acc;
    }, {});
  }

  ensureCategoriesValid();
  persistTransactions();
  persistGoals();
  persistCategories();
  persistCategoryBudgets();
  setSyncStatus("Dados sincronizados com sucesso.");
  render();
}

async function migrateLocalToCloud() {
  if (!isCloudMode()) return;

  if (state.transactions.length > 0) {
    const txPayload = state.transactions.map((tx) => ({
      id: tx.id,
      user_id: state.user.id,
      description: tx.description,
      amount: tx.amount,
      date: tx.date,
      type: tx.type,
      category: tx.category,
      source_bank: tx.source_bank || "Manual",
      import_hash: tx.import_hash || null,
      import_batch_id: tx.import_batch_id || null,
      import_source_format: tx.import_source_format || null,
      imported_at: tx.imported_at || null
    }));

    const { error: txError } = await supabaseClient.from("transactions").upsert(txPayload, { onConflict: "id" });
    if (txError) {
      setAuthMessage(`Falha ao migrar transacoes: ${txError.message}`);
    } else {
      state.transactions = state.transactions.map((tx) => normalizeTransaction({ ...tx, pending_sync: false }));
      persistTransactions();
    }
  }

  if (state.goals.expenseLimit > 0 || state.goals.savingsGoal > 0) {
    await supabaseClient.from("goals").upsert(
      {
        user_id: state.user.id,
        expense_limit: state.goals.expenseLimit,
        savings_goal: state.goals.savingsGoal,
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_id" }
    );
  }

  const categoriesPayload = state.categories.map((item) => ({
    user_id: state.user.id,
    name: item.name,
    is_default: item.isDefault
  }));

  await supabaseClient.from("categories").upsert(categoriesPayload, { onConflict: "user_id,name" });

  const budgetsPayload = Object.entries(state.categoryBudgets).map(([category_name, budget_amount]) => ({
    user_id: state.user.id,
    category_name,
    budget_amount
  }));

  if (budgetsPayload.length > 0) {
    await supabaseClient.from("category_budgets").upsert(budgetsPayload, { onConflict: "user_id,category_name" });
  }

  setSyncStatus("Dados locais migrados para a nuvem.");
}

function subscribeToRealtime() {
  if (!supabaseClient || !state.user) return;

  unsubscribeFromRealtime();
  const userFilter = `user_id=eq.${state.user.id}`;

  realtimeChannel = supabaseClient
    .channel(`fluxoforte-sync-${state.user.id}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: userFilter }, scheduleCloudRefresh)
    .on("postgres_changes", { event: "*", schema: "public", table: "goals", filter: userFilter }, scheduleCloudRefresh)
    .on("postgres_changes", { event: "*", schema: "public", table: "categories", filter: userFilter }, scheduleCloudRefresh)
    .on("postgres_changes", { event: "*", schema: "public", table: "category_budgets", filter: userFilter }, scheduleCloudRefresh)
    .subscribe();
}

function unsubscribeFromRealtime() {
  if (!supabaseClient || !realtimeChannel) return;
  supabaseClient.removeChannel(realtimeChannel);
  realtimeChannel = null;
}

function scheduleCloudRefresh() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    pullCloudData();
  }, 300);
}

function isCloudMode() {
  return Boolean(supabaseClient && state.user);
}

function updateAuthUi() {
  authUser.textContent = state.user?.email || "nao autenticado";
  const loggedIn = isCloudMode();

  if (authForm) {
    authForm.classList.toggle("is-hidden", loggedIn);
  }

  if (registerBtn) {
    registerBtn.classList.toggle("is-hidden", loggedIn);
  }

  if (loginBtn) {
    loginBtn.classList.toggle("is-hidden", loggedIn);
  }

  if (logoutBtn) {
    logoutBtn.disabled = !loggedIn;
  }

  if (integrationText) {
    integrationText.textContent = loggedIn
      ? "Conta conectada. Use a janela de conta apenas quando precisar trocar usuario ou sair."
      : "Faça login para sincronizar seus dados entre dispositivos. Sem login, seus dados continuam salvos localmente neste navegador.";
  }

  if (authCompactText) {
    authCompactText.textContent = loggedIn
      ? "Campos de login ocultos apos autenticacao. Abra a janela de conta somente quando precisar gerenciar acesso."
      : "Os campos de login ficam na janela \"Conta e Sincronizacao\" para manter a tela principal limpa.";
  }

  if (loggedIn) {
    setModeBadge("cloud", "Modo nuvem");
  } else {
    setModeBadge("local", state.supabaseEnabled ? "Nuvem pronta" : "Modo local");
  }

  refreshTelemetryStatus();
}

function setModeBadge(mode, text) {
  syncModeBadge.textContent = text;
  syncModeBadge.classList.remove("cloud", "local");
  syncModeBadge.classList.add(mode);
}

function setAuthMessage(text) {
  authMessage.textContent = text;
}

function setSyncStatus(text) {
  syncStatusText.textContent = text;
}

async function trackEvent(eventType, payload) {
  if (!isCloudMode()) {
    refreshTelemetryStatus();
    return;
  }

  try {
    const { error } = await supabaseClient.from("usage_events").insert({
      user_id: state.user.id,
      event_type: eventType,
      payload: payload || {}
    });

    if (error) {
      state.telemetry.failed += 1;
    } else {
      state.telemetry.sent += 1;
      state.telemetry.enabled = true;
    }
  } catch {
    state.telemetry.failed += 1;
  }

  refreshTelemetryStatus();
}

function refreshTelemetryStatus() {
  if (!telemetryStatusText) return;

  if (!isCloudMode()) {
    telemetryStatusText.textContent = "Desativada (sem login).";
    return;
  }

  telemetryStatusText.textContent = `Ativa - enviados: ${state.telemetry.sent}, falhas: ${state.telemetry.failed}`;
}

function render() {
  updateAnalyticsVisibility();
  renderCategoryArea();
  renderAutomationArea();
  renderImportReview();
  renderImportAudit();
  renderSummary();
  renderBankFilterOptions();
  renderTable();
  renderBankConsolidation();
  renderTrendChart();
  renderCategoryChart();
  renderScenarioProjection();
  renderFutureSavingsSummary();
  renderViewMode();
  updateAuthUi();
}

function updateAnalyticsVisibility() {
  const hasTransactions = state.transactions.some((tx) => Number(tx.amount) > 0 && (tx.type === "income" || tx.type === "expense"));

  emptyAnalyticsNotice?.classList.toggle("is-hidden", hasTransactions);
  sectionFinancialIntelligence?.classList.toggle("is-hidden", !hasTransactions);
  sectionScenarioLab?.classList.toggle("is-hidden", !hasTransactions);
  sectionFutureSummary?.classList.toggle("is-hidden", !hasTransactions);
  sectionTrend?.classList.toggle("is-hidden", !hasTransactions);
  sectionCategoryDistribution?.classList.toggle("is-hidden", !hasTransactions);
  sectionMonthlyReport?.classList.toggle("is-hidden", !hasTransactions);
  sectionBankConsolidation?.classList.toggle("is-hidden", !hasTransactions);
}

function addMonthsToMonthKey(monthKey, offset) {
  const [yearText, monthText] = String(monthKey || getLocalCurrentMonth()).split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const base = new Date(Number.isFinite(year) ? year : new Date().getFullYear(), Number.isFinite(month) ? month - 1 : 0, 1);
  base.setMonth(base.getMonth() + Number(offset || 0));
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}`;
}

function monthDiffInclusive(fromKey, toKey) {
  const [fy, fm] = String(fromKey).split("-").map(Number);
  const [ty, tm] = String(toKey).split("-").map(Number);
  if (!Number.isFinite(fy) || !Number.isFinite(fm) || !Number.isFinite(ty) || !Number.isFinite(tm)) {
    return 1;
  }
  const diff = (ty - fy) * 12 + (tm - fm) + 1;
  return clamp(diff, 1, 36);
}

function buildFutureSavingsModel(variableReductionPct = 0) {
  const lookbackMonths = 6;
  const monthKeys = [];
  const now = new Date();
  for (let i = lookbackMonths - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const txInWindow = state.transactions.filter((tx) => monthKeys.includes(tx.date.slice(0, 7)));
  const monthlyIncome = monthKeys.map((key) => {
    const monthTx = txInWindow.filter((tx) => tx.date.slice(0, 7) === key);
    return monthTx.filter((tx) => tx.type === "income").reduce((sum, tx) => sum + tx.amount, 0);
  });

  const expenseTx = txInWindow.filter((tx) => tx.type === "expense");
  const groups = new Map();

  expenseTx.forEach((tx) => {
    const signature = String(tx.description || "")
      .toLowerCase()
      .trim()
      .replace(/\d+/g, "")
      .replace(/\s+/g, " ");
    if (!signature) return;
    const existing = groups.get(signature) || { months: new Set(), amounts: [] };
    existing.months.add(tx.date.slice(0, 7));
    existing.amounts.push(Number(tx.amount || 0));
    groups.set(signature, existing);
  });

  const fixedSignatures = new Set(
    [...groups.entries()]
      .filter(([, value]) => value.months.size >= 3)
      .map(([signature]) => signature)
  );

  const monthExpenseMap = monthKeys.reduce((acc, key) => {
    acc[key] = { fixed: 0, variable: 0 };
    return acc;
  }, {});

  expenseTx.forEach((tx) => {
    const key = tx.date.slice(0, 7);
    if (!monthExpenseMap[key]) return;
    const signature = String(tx.description || "")
      .toLowerCase()
      .trim()
      .replace(/\d+/g, "")
      .replace(/\s+/g, " ");

    if (fixedSignatures.has(signature)) monthExpenseMap[key].fixed += tx.amount;
    else monthExpenseMap[key].variable += tx.amount;
  });

  const monthCount = Math.max(1, monthKeys.length);
  const avgIncome = monthlyIncome.reduce((sum, value) => sum + value, 0) / monthCount;
  const avgFixed = monthKeys.reduce((sum, key) => sum + monthExpenseMap[key].fixed, 0) / monthCount;
  const avgVariable = monthKeys.reduce((sum, key) => sum + monthExpenseMap[key].variable, 0) / monthCount;

  const reduction = clamp(Number(variableReductionPct || 0), 0, 100);
  const baseMonthlySavings = avgIncome - (avgFixed + avgVariable);
  const optimizedMonthlySavings = avgIncome - (avgFixed + (avgVariable * (1 - reduction / 100)));

  return {
    avgIncome,
    avgFixed,
    avgVariable,
    baseMonthlySavings,
    optimizedMonthlySavings
  };
}

function onFuturePlanningSubmit(event) {
  event.preventDefault();
  renderFutureSavingsSummary();
  trackEvent("future_summary_updated", {
    targetMonth: futureTargetMonthInput?.value || "",
    variableReductionPct: Number(futureVariableReductionInput?.value || 0),
    goalAmount: Number(futureGoalAmountInput?.value || 0)
  });
}

function renderFutureSavingsSummary() {
  if (!futureSummaryText || !futureTargetMonthInput || !futureSavingsChart) return;

  if (state.transactions.length === 0) {
    futureSummaryText.textContent = "Adicione historico para gerar previsao.";
    if (futureGoalInsightText) futureGoalInsightText.textContent = "Defina uma meta para calcular ritmo mensal e chance estimada.";
    clearCanvas(futureSavingsChart);
    return;
  }

  const targetMonth = futureTargetMonthInput.value || addMonthsToMonthKey(getLocalCurrentMonth(), 6);
  futureTargetMonthInput.value = targetMonth;
  const monthsAhead = monthDiffInclusive(getLocalCurrentMonth(), targetMonth);
  const reductionPct = clamp(Number(futureVariableReductionInput?.value || 0), 0, 100);
  if (futureVariableReductionInput) futureVariableReductionInput.value = String(reductionPct);

  const model = buildFutureSavingsModel(reductionPct);
  const baseSeries = buildProjectionSeriesEngine(0, model.baseMonthlySavings, monthsAhead);
  const optimizedSeries = buildProjectionSeriesEngine(0, model.optimizedMonthlySavings, monthsAhead);

  const goalAmount = Math.max(0, Number(futureGoalAmountInput?.value || 0));
  if (futureGoalAmountInput) {
    futureGoalAmountInput.value = goalAmount > 0 ? String(goalAmount) : "";
  }

  const baseFinal = baseSeries[baseSeries.length - 1] || 0;
  const optimizedFinal = optimizedSeries[optimizedSeries.length - 1] || 0;
  const delta = optimizedFinal - baseFinal;

  futureSummaryText.textContent = [
    `Media mensal: receitas ${formatCurrency(model.avgIncome)}, despesas fixas ${formatCurrency(model.avgFixed)}, variaveis ${formatCurrency(model.avgVariable)}.`,
    `Ate ${targetMonth}, economia acumulada base: ${formatCurrency(baseFinal)}.`,
    `Com reducao variavel de ${reductionPct}%: ${formatCurrency(optimizedFinal)} (${delta >= 0 ? "+" : ""}${formatCurrency(delta)}).`
  ].join(" ");

  if (futureGoalInsightText) {
    if (goalAmount <= 0) {
      futureGoalInsightText.textContent = "Defina uma meta para calcular ritmo mensal e chance estimada.";
    } else {
      const requiredPerMonth = goalAmount / Math.max(1, monthsAhead);
      const paceGap = optimizedFinal - goalAmount;
      const stats = getRecentNetStats(6);
      const probability = estimateGoalProbability({
        expectedMonthlySavings: model.optimizedMonthlySavings,
        requiredMonthlySavings: requiredPerMonth,
        monthlyStdDev: stats.stdDev
      });

      const paceText = paceGap >= 0
        ? `No ritmo atual, voce pode superar a meta em ${formatCurrency(paceGap)}.`
        : `No ritmo atual, faltariam ${formatCurrency(Math.abs(paceGap))} ate a meta.`;

      futureGoalInsightText.textContent = [
        `Meta: ${formatCurrency(goalAmount)} ate ${targetMonth}.`,
        `Ritmo necessario: ${formatCurrency(requiredPerMonth)}/mes.`,
        `Ritmo projetado: ${formatCurrency(model.optimizedMonthlySavings)}/mes.`,
        `Chance estimada de bater a meta: ${probability.toFixed(0)}%.`,
        paceText
      ].join(" ");
    }
  }

  renderFutureSavingsChart(baseSeries, optimizedSeries);
}

function getRecentNetStats(monthsBack = 6) {
  const now = new Date();
  const monthKeys = [];
  for (let i = monthsBack - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const nets = monthKeys.map((key) => {
    const monthTx = state.transactions.filter((tx) => tx.date.slice(0, 7) === key);
    const totals = calculateTotals(monthTx);
    return totals.balance;
  });

  const mean = nets.reduce((sum, value) => sum + value, 0) / Math.max(1, nets.length);
  const variance = nets.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / Math.max(1, nets.length);
  return {
    mean,
    stdDev: Math.sqrt(variance)
  };
}

function estimateGoalProbability(params) {
  const expected = Number(params.expectedMonthlySavings || 0);
  const required = Math.max(0.01, Number(params.requiredMonthlySavings || 0));
  const stdDev = Math.max(0, Number(params.monthlyStdDev || 0));

  const paceRatio = expected / required;
  const paceScore = clamp(paceRatio, 0, 1.6) / 1.6;
  const volatilityScore = clamp(1 - (stdDev / Math.max(Math.abs(expected), required)), 0, 1);

  return clamp((paceScore * 75 + volatilityScore * 25) * 100, 0, 100);
}

function renderFutureSavingsChart(baseSeries, optimizedSeries) {
  const ctx = futureSavingsChart.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const rect = futureSavingsChart.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  futureSavingsChart.width = rect.width * dpr;
  futureSavingsChart.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, rect.width, rect.height);

  // Get colors from CSS variables (respects dark mode)
  const root = document.documentElement;
  const styles = getComputedStyle(root);
  const textSecondary = styles.getPropertyValue('--text-secondary').trim();
  const muted = styles.getPropertyValue('--muted').trim();
  const income = styles.getPropertyValue('--income').trim();
  const border = styles.getPropertyValue('--border').trim();

  const allValues = [...baseSeries, ...optimizedSeries, 0];
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const span = Math.max(1, maxVal - minVal);

  const padX = 28;
  const padY = 20;
  const plotW = rect.width - padX * 2;
  const plotH = rect.height - padY * 2;

  drawProjectionLine(ctx, baseSeries, {
    color: muted,
    padX,
    padY,
    plotW,
    plotH,
    minVal,
    span
  });

  drawProjectionLine(ctx, optimizedSeries, {
    color: income,
    padX,
    padY,
    plotW,
    plotH,
    minVal,
    span
  });

  const zeroY = padY + (1 - (0 - minVal) / span) * plotH;
  ctx.beginPath();
  ctx.moveTo(padX, zeroY);
  ctx.lineTo(padX + plotW, zeroY);
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = textSecondary;
  ctx.font = "11px Space Grotesk";
  ctx.fillText("Base", padX, padY - 4);
  ctx.fillText("Com ajuste", padX + 52, padY - 4);
}

function clearCanvas(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width || canvas.width, rect.height || canvas.height);
}

function renderBankFilterOptions() {
  if (!bankFilter) return;

  const current = state.filters.bank || "all";
  const banks = [...new Set(state.transactions.map((tx) => tx.source_bank || "Manual"))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));

  bankFilter.innerHTML = '<option value="all">Todos os bancos</option>';
  banks.forEach((bank) => {
    const opt = document.createElement("option");
    opt.value = bank;
    opt.textContent = bank;
    bankFilter.append(opt);
  });

  if (current !== "all" && !banks.includes(current)) {
    state.filters.bank = "all";
    bankFilter.value = "all";
    return;
  }

  bankFilter.value = current;
}

function renderBankConsolidation() {
  if (!bankConsolidationList || !bankConsolidationSubtitle) return;

  const monthKey = state.filters.month || new Date().toISOString().slice(0, 7);
  const monthDate = new Date(`${monthKey}-01T00:00:00`);
  bankConsolidationSubtitle.textContent = monthDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const monthTransactions = state.transactions.filter((tx) => tx.date.slice(0, 7) === monthKey);
  if (monthTransactions.length === 0) {
    bankConsolidationList.innerHTML = '<small class="helper-text">Sem dados para consolidar neste periodo.</small>';
    return;
  }

  const byBank = monthTransactions.reduce((acc, tx) => {
    const bank = tx.source_bank || "Manual";
    if (!acc[bank]) {
      acc[bank] = { income: 0, expense: 0, count: 0 };
    }

    if (tx.type === "income") acc[bank].income += tx.amount;
    else acc[bank].expense += tx.amount;
    acc[bank].count += 1;
    return acc;
  }, {});

  const items = Object.entries(byBank)
    .map(([bank, totals]) => ({
      bank,
      income: totals.income,
      expense: totals.expense,
      balance: totals.income - totals.expense,
      count: totals.count
    }))
    .sort((a, b) => Math.abs(b.expense) - Math.abs(a.expense));

  bankConsolidationList.innerHTML = items.map((item) => `
    <article class="bank-item">
      <h3>${escapeHtml(item.bank)}</h3>
      <div class="bank-kpi"><span>Lancamentos</span><strong>${item.count}</strong></div>
      <div class="bank-kpi"><span>Receitas</span><strong>${formatCurrency(item.income)}</strong></div>
      <div class="bank-kpi"><span>Despesas</span><strong>${formatCurrency(item.expense)}</strong></div>
      <div class="bank-kpi"><span>Saldo</span><strong>${formatCurrency(item.balance)}</strong></div>
    </article>
  `).join("");
}

function toggleViewMode() {
  state.viewMode = state.viewMode === "simple" ? "advanced" : "simple";
  persistViewMode();
  renderViewMode();
}

function renderViewMode() {
  const isSimple = state.viewMode === "simple";

  document.querySelectorAll('[data-advanced="true"]').forEach((section) => {
    section.classList.toggle("is-hidden", isSimple);
  });

  viewModeBtn.textContent = `Modo: ${isSimple ? "Simples" : "Avancado"}`;
}

function renderCategoryArea() {
  renderCategoryOptions();
  renderCategoryBudgets();
}

function renderAutomationArea() {
  renderAutoRuleCategoryOptions();
  renderAutoRules();
  renderRecurringCategoryOptions();
  renderRecurringList();
}

function renderCategoryOptions() {
  const current = categorySelect.value;
  categorySelect.innerHTML = "";

  state.categories
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    .forEach((item) => {
      const option = document.createElement("option");
      option.value = item.name;
      option.textContent = item.name;
      categorySelect.append(option);
    });

  categorySelect.value = state.categories.some((item) => item.name === current)
    ? current
    : state.categories[0]?.name || "Outros";
}

function renderAutoRuleCategoryOptions() {
  if (!autoRuleCategorySelect) return;
  const current = autoRuleCategorySelect.value;
  autoRuleCategorySelect.innerHTML = "";

  state.categories
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    .forEach((item) => {
      const option = document.createElement("option");
      option.value = item.name;
      option.textContent = item.name;
      autoRuleCategorySelect.append(option);
    });

  autoRuleCategorySelect.value = state.categories.some((item) => item.name === current)
    ? current
    : state.categories[0]?.name || "Outros";
}

function renderRecurringCategoryOptions() {
  if (!recurringCategorySelect) return;
  const current = recurringCategorySelect.value;
  recurringCategorySelect.innerHTML = "";

  state.categories
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    .forEach((item) => {
      const option = document.createElement("option");
      option.value = item.name;
      option.textContent = item.name;
      recurringCategorySelect.append(option);
    });

  recurringCategorySelect.value = state.categories.some((item) => item.name === current)
    ? current
    : state.categories[0]?.name || "Outros";
}

function renderAutoRules() {
  if (!autoRulesList) return;

  if (!state.autoRules.length) {
    autoRulesList.innerHTML = '<small class="helper-text">Nenhuma regra criada ainda.</small>';
    return;
  }

  const ordered = getOrderedAutoRules();

  autoRulesList.innerHTML = ordered.map((rule, index) => `
    <div class="rule-item">
      <div>
        <strong>#${index + 1} ${escapeHtml(rule.keyword)}</strong>
        <small> -> ${escapeHtml(rule.category)}</small>
      </div>
      <div class="row-actions">
        <button type="button" class="ghost" data-rule-id="${rule.id}" data-action="up" ${index === 0 ? "disabled" : ""}>Subir</button>
        <button type="button" class="ghost" data-rule-id="${rule.id}" data-action="down" ${index === ordered.length - 1 ? "disabled" : ""}>Descer</button>
        <button type="button" class="ghost" data-rule-id="${rule.id}" data-action="delete">Excluir</button>
      </div>
    </div>
  `).join("");
}

function getOrderedAutoRules() {
  return state.autoRules
    .slice()
    .sort((a, b) => {
      const left = Number.isFinite(Number(a.priority)) ? Number(a.priority) : Number.MAX_SAFE_INTEGER;
      const right = Number.isFinite(Number(b.priority)) ? Number(b.priority) : Number.MAX_SAFE_INTEGER;
      return left - right;
    });
}

function renderRecurringList() {
  if (!recurringList) return;

  if (!state.recurringTemplates.length) {
    recurringList.innerHTML = '<small class="helper-text">Nenhum lancamento recorrente cadastrado.</small>';
    return;
  }

  recurringList.innerHTML = state.recurringTemplates.map((item) => `
    <div class="budget-item">
      <div>
        <strong>${escapeHtml(item.description)}</strong>
        <small>Dia ${item.dayOfMonth} - ${item.type === "income" ? "Receita" : "Despesa"} - ${escapeHtml(item.category)}</small>
      </div>
      <div><strong>${formatCurrency(item.amount)}</strong></div>
      <div class="row-actions">
        <button type="button" class="ghost" data-recurring-id="${item.id}">Remover</button>
      </div>
    </div>
  `).join("");
}

function renderCategoryBudgets() {
  const spentMap = getCurrentMonthExpenseByCategory();

  const blocks = state.categories
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    .map((item) => {
      const spent = spentMap[item.name] || 0;
      const budget = Number(state.categoryBudgets[item.name] || 0);
      const ratio = budget > 0 ? spent / budget : 0;

      let cls = "";
      if (budget > 0 && ratio >= 1) cls = "over-budget";
      else if (budget > 0 && ratio >= 0.8) cls = "near-budget";

      return `
        <div class="budget-item ${cls}">
          <div>
            <strong>${escapeHtml(item.name)}</strong>
            <small>${formatCurrency(spent)} gasto neste mes</small>
          </div>
          <input type="number" min="0" step="0.01" value="${budget || ""}" data-budget-category="${escapeHtml(item.name)}" placeholder="Orcamento" />
          <div class="row-actions">
            <button type="button" class="ghost" data-action="save-budget" data-category="${escapeHtml(item.name)}">Salvar</button>
            <button type="button" class="ghost" data-action="remove-category" data-category="${escapeHtml(item.name)}" ${item.isDefault ? "disabled" : ""}>Remover</button>
          </div>
        </div>
      `;
    })
    .join("");

  categoryBudgetList.innerHTML = blocks || "<small class=\"helper-text\">Nenhuma categoria disponivel.</small>";
}

function renderSummary() {
  const summaryPeriod = summaryPeriodInput?.value === "year" ? "year" : "month";
  const summaryMonthKey = summaryMonthInput?.value || getLocalCurrentMonth();
  const summaryYearKey = String(summaryYearInput?.value || new Date().getFullYear());
  const summaryTransactions = state.transactions.filter((tx) => {
    const dateText = String(tx.date || "");
    if (summaryPeriod === "year") {
      return dateText.slice(0, 4) === summaryYearKey;
    }
    return dateText.slice(0, 7) === summaryMonthKey;
  });
  const totals = calculateTotals(summaryTransactions);
  const currentBalance = Number(state.goals.currentBalance || 0);
  const hasCurrentBalance = Boolean(state.goals.currentBalanceSet);
  const nowMonthKey = getLocalCurrentMonth();
  const nowYearKey = String(new Date().getFullYear());
  const isCurrentPeriod = summaryPeriod === "year"
    ? summaryYearKey === nowYearKey
    : summaryMonthKey === nowMonthKey;
  const adjustedBalance = (hasCurrentBalance && isCurrentPeriod) ? currentBalance : totals.balance;

  if (summaryMonthInput && !summaryMonthInput.value) {
    summaryMonthInput.value = summaryMonthKey;
  }
  if (summaryYearInput && !summaryYearInput.value) {
    summaryYearInput.value = summaryYearKey;
  }
  updateSummaryPeriodControls();

  if (summaryMonthText) {
    if (summaryPeriod === "year") {
      summaryMonthText.textContent = `Resumo anual de ${summaryYearKey}.`;
    } else {
      const monthDate = new Date(`${summaryMonthKey}-01T00:00:00`);
      summaryMonthText.textContent = Number.isNaN(monthDate.getTime())
        ? "Periodo selecionado no resumo."
        : `Resumo de ${monthDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}.`;
    }
  }

  renderSummaryDiagnostics(summaryTransactions, summaryPeriod, summaryPeriod === "year" ? summaryYearKey : summaryMonthKey);

  balanceValue.textContent = formatCurrency(totals.balance);
  incomeValue.textContent = formatCurrency(totals.income);
  expenseValue.textContent = formatCurrency(totals.expense);
  adjustedBalanceValue.textContent = formatCurrency(adjustedBalance);
  updateSummaryCardsTone(totals.balance, adjustedBalance);

  const savingsRate = totals.income > 0 ? (totals.balance / totals.income) * 100 : 0;
  savingsRateValue.textContent = `${Math.max(0, savingsRate).toFixed(1)}%`;

  if (totals.income === 0 && totals.expense === 0) {
    healthBadge.textContent = "Sem dados";
  } else if (totals.balance >= 0 && savingsRate >= 20) {
    healthBadge.textContent = "Excelente";
  } else if (totals.balance >= 0) {
    healthBadge.textContent = "Estavel";
  } else {
    healthBadge.textContent = "Atencao";
  }

  const selectedInsightMonthKey = summaryPeriod === "year"
    ? getBestMonthKeyForYear(summaryYearKey)
    : summaryMonthKey;

  updateGoalProgress(totals, summaryPeriod, summaryPeriod === "year" ? summaryYearKey : summaryMonthKey);
  updateBudgetAlert(summaryPeriod, summaryPeriod === "year" ? summaryYearKey : summaryMonthKey);
  updateCurrentBalanceInsight(totals, currentBalance, hasCurrentBalance, isCurrentPeriod);
  renderYearComparison(summaryPeriod, summaryYearKey, totals);
  renderFinancialIntelligence(totals, selectedInsightMonthKey);
}

function renderSummaryDiagnostics(transactions, period, periodKey) {
  if (!summaryDiagnosticsText) return;
  const totals = calculateTotals(transactions || []);
  const count = Array.isArray(transactions) ? transactions.length : 0;
  const label = period === "year"
    ? `ano ${periodKey}`
    : (() => {
      const monthDate = new Date(`${periodKey}-01T00:00:00`);
      return Number.isNaN(monthDate.getTime())
        ? `mes ${periodKey}`
        : monthDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    })();

  summaryDiagnosticsText.textContent = `Base do resumo: ${count} transacao(oes) em ${label}. Receitas ${formatCurrency(totals.income)}, despesas ${formatCurrency(totals.expense)}, saldo ${formatCurrency(totals.balance)}.`;
}

function renderYearComparison(summaryPeriod, summaryYearKey, selectedTotals) {
  if (!summaryYearComparisonText) return;

  if (summaryPeriod !== "year") {
    summaryYearComparisonText.classList.add("is-hidden");
    summaryYearComparisonText.textContent = "Comparativo anual indisponivel neste periodo.";
    return;
  }

  const year = String(summaryYearKey || new Date().getFullYear());
  const prevYear = String(Number(year) - 1);
  const previousTx = state.transactions.filter((tx) => String(tx.date || "").slice(0, 4) === prevYear);
  const previousTotals = calculateTotals(previousTx);

  const comparePct = (current, previous) => {
    if (!Number.isFinite(previous) || Math.abs(previous) < 0.01) {
      return current > 0 ? "+100.0%" : "0.0%";
    }
    const pct = ((current - previous) / Math.abs(previous)) * 100;
    return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
  };

  const incomeDelta = comparePct(selectedTotals.income, previousTotals.income);
  const expenseDelta = comparePct(selectedTotals.expense, previousTotals.expense);
  const balanceDelta = comparePct(selectedTotals.balance, previousTotals.balance);

  summaryYearComparisonText.classList.remove("is-hidden");
  summaryYearComparisonText.textContent = `Comparativo ${year} vs ${prevYear}: receitas ${incomeDelta}, despesas ${expenseDelta}, saldo ${balanceDelta}.`;
}

function updateSummaryPeriodControls() {
  const period = summaryPeriodInput?.value === "year" ? "year" : "month";
  summaryMonthInput?.classList.toggle("is-hidden", period !== "month");
  summaryYearInput?.classList.toggle("is-hidden", period !== "year");
}

function updateSummaryCardsTone(balance, adjustedBalance) {
  if (kpiBalanceCard) {
    kpiBalanceCard.classList.remove("is-positive", "is-negative");
    kpiBalanceCard.classList.add(balance >= 0 ? "is-positive" : "is-negative");
  }

  if (kpiAdjustedBalanceCard) {
    kpiAdjustedBalanceCard.classList.remove("is-positive", "is-negative");
    kpiAdjustedBalanceCard.classList.add(adjustedBalance >= 0 ? "is-positive" : "is-negative");
  }
}

function updateCurrentBalanceInsight(totals, currentBalance, hasCurrentBalance, isCurrentPeriod = true) {
  if (!currentBalanceInsightText) return;
  const summaryPeriod = summaryPeriodInput?.value === "year" ? "year" : "month";

  if (!hasCurrentBalance || !Number.isFinite(currentBalance)) {
    currentBalanceInsightText.textContent = "Defina o saldo atual no banco para comparar com o saldo calculado pelo historico.";
    return;
  }

  if (!isCurrentPeriod) {
    currentBalanceInsightText.textContent = "Saldo real ajustado e aplicado apenas ao periodo atual. Para periodos historicos, o resumo usa somente transacoes do periodo.";
    return;
  }

  const gap = currentBalance - totals.balance;
  const absGap = Math.abs(gap);

  if (absGap < 0.01) {
    currentBalanceInsightText.textContent = "Saldo real confere com o saldo calculado pelas transacoes.";
    return;
  }

  if (gap > 0) {
    currentBalanceInsightText.textContent = summaryPeriod === "year"
      ? `Comparacao anual: saldo real atual esta ${formatCurrency(absGap)} acima do acumulado do ano selecionado.`
      : `Seu saldo real esta ${formatCurrency(absGap)} acima do calculado. Isso pode indicar entradas nao registradas ou saldo inicial maior.`;
    return;
  }

  currentBalanceInsightText.textContent = summaryPeriod === "year"
    ? `Comparacao anual: saldo real atual esta ${formatCurrency(absGap)} abaixo do acumulado do ano selecionado.`
    : `Seu saldo real esta ${formatCurrency(absGap)} abaixo do calculado. Revise despesas/saques que podem nao ter sido importados.`;
}

function getAnnualBudgetMonthMultiplier(yearKey) {
  const selectedYear = Number(yearKey);
  const now = new Date();
  const currentYear = now.getFullYear();

  if (!Number.isFinite(selectedYear)) return 12;
  if (selectedYear < currentYear) return 12;
  if (selectedYear > currentYear) return 12;
  return now.getMonth() + 1;
}

function updateGoalProgress(totals, period = "month", periodKey = getLocalCurrentMonth()) {
  const multiplier = period === "year"
    ? getAnnualBudgetMonthMultiplier(String(periodKey))
    : 1;
  const expenseLimit = state.goals.expenseLimit * multiplier;
  const savingsGoal = state.goals.savingsGoal * multiplier;
  const periodLabel = period === "year" ? `${multiplier} mes(es) do ano` : "mes";

  if (expenseLimit > 0) {
    const percentage = Math.min(100, (totals.expense / expenseLimit) * 100);
    expenseProgress.style.width = `${percentage.toFixed(1)}%`;
    expenseProgressText.textContent = `${formatCurrency(totals.expense)} de ${formatCurrency(expenseLimit)} (${percentage.toFixed(1)}%) no ${periodLabel}`;
    expenseProgress.style.background = percentage >= 100
      ? "linear-gradient(100deg, #b6422f, #d26652)"
      : "linear-gradient(100deg, #0f6675, #2fa7bc)";
  } else {
    expenseProgress.style.width = "0%";
    expenseProgressText.textContent = "Configure uma meta para acompanhar.";
  }

  if (savingsGoal > 0) {
    const saved = Math.max(0, totals.balance);
    const percentage = Math.min(100, (saved / savingsGoal) * 100);
    savingsProgress.style.width = `${percentage.toFixed(1)}%`;
    savingsProgressText.textContent = `${formatCurrency(saved)} de ${formatCurrency(savingsGoal)} (${percentage.toFixed(1)}%) no ${periodLabel}`;
  } else {
    savingsProgress.style.width = "0%";
    savingsProgressText.textContent = "Configure uma meta para acompanhar.";
  }
}

function updateBudgetAlert(period = "month", key = getLocalCurrentMonth()) {
  const spentMap = period === "year"
    ? getExpenseByCategoryForYear(String(key))
    : getExpenseByCategoryForMonth(String(key));
  const annualMultiplier = period === "year" ? getAnnualBudgetMonthMultiplier(String(key)) : 1;

  let highestStatus = "ok";
  const alerts = [];

  Object.entries(state.categoryBudgets).forEach(([category, budget]) => {
    if (!budget || budget <= 0) return;
    const spent = spentMap[category] || 0;
    const periodBudget = period === "year" ? budget * annualMultiplier : budget;
    const ratio = spent / periodBudget;

    if (ratio >= 1) {
      highestStatus = "danger";
      alerts.push(`${category}: ${formatCurrency(spent)} / ${formatCurrency(periodBudget)}`);
      return;
    }

    if (ratio >= 0.8 && highestStatus !== "danger") {
      highestStatus = "warn";
      alerts.push(`${category}: ${formatCurrency(spent)} / ${formatCurrency(periodBudget)}`);
    }
  });

  budgetAlertText.classList.remove("warn", "danger");

  if (alerts.length === 0) {
    budgetAlertText.textContent = "Sem alertas de orcamento no momento.";
    return;
  }

  budgetAlertText.classList.add(highestStatus);
  budgetAlertText.textContent = alerts.join(" | ");
}

function getExpenseByCategoryForYear(yearKey) {
  const year = String(yearKey || new Date().getFullYear());
  return state.transactions.reduce((acc, tx) => {
    if (tx.type !== "expense" || String(tx.date || "").slice(0, 4) !== year) return acc;
    acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    return acc;
  }, {});
}

function renderTable() {
  const filtered = getFilteredTransactions().sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalPages = Math.max(1, Math.ceil(filtered.length / TRANSACTIONS_PER_PAGE));
  state.currentPage = Math.min(Math.max(1, state.currentPage), totalPages);

  const startIndex = (state.currentPage - 1) * TRANSACTIONS_PER_PAGE;
  const endIndex = startIndex + TRANSACTIONS_PER_PAGE;
  const pageRows = filtered.slice(startIndex, endIndex);

  renderHistoryPaginationControls(totalPages);
  tableBody.innerHTML = "";

  if (!pageRows.length) {
    tableBody.append(emptyStateTemplate.content.cloneNode(true));
    return;
  }

  const rows = pageRows.map((tx) => {
      const tr = document.createElement("tr");
      const isIncome = tx.type === "income";
      const sign = isIncome ? "+" : "-";

      tr.innerHTML = `
        <td data-label="Data">${formatDate(tx.date)}</td>
        <td data-label="Descricao">${escapeHtml(tx.description)}</td>
        <td data-label="Categoria"><small>${escapeHtml(tx.category)}</small></td>
        <td data-label="Origem"><small>${escapeHtml(tx.source_bank || "Manual")}</small></td>
        <td data-label="Tipo"><span class="tag ${tx.type}">${isIncome ? "Receita" : "Despesa"}</span></td>
        <td data-label="Valor" class="${isIncome ? "amount-income" : "amount-expense"}">${sign} ${formatCurrency(tx.amount)}</td>
        <td data-label="Acoes">
          <div class="row-actions">
            <button type="button" class="ghost" data-id="${tx.id}" data-action="edit">Editar</button>
            <button type="button" class="ghost" data-id="${tx.id}" data-action="delete">Excluir</button>
          </div>
        </td>
      `;
      return tr;
    });

  tableBody.append(...rows);
}

function resetHistoryPage() {
  state.currentPage = 1;
}

function getFilteredTransactionTotalPages() {
  const totalItems = getFilteredTransactions().length;
  return Math.max(1, Math.ceil(totalItems / TRANSACTIONS_PER_PAGE));
}

function renderHistoryPaginationControls(totalPages) {
  if (historyPageInfo) {
    historyPageInfo.textContent = `Pagina ${state.currentPage} de ${totalPages}`;
  }

  if (historyPrevPageBtn) {
    historyPrevPageBtn.disabled = state.currentPage <= 1;
  }

  if (historyNextPageBtn) {
    historyNextPageBtn.disabled = state.currentPage >= totalPages;
  }
}

function getFilteredTransactions() {
  return state.transactions.filter((tx) => {
    const byType = state.filters.type === "all" || tx.type === state.filters.type;
    const byMonth = !state.filters.month || tx.date.slice(0, 7) === state.filters.month;
    const byBank = state.filters.bank === "all" || (tx.source_bank || "Manual") === state.filters.bank;
    const haystack = `${tx.description} ${tx.category}`.toLowerCase();
    const bySearch = !state.filters.search || haystack.includes(state.filters.search);
    return byType && byMonth && byBank && bySearch;
  });
}

function renderTrendChart() {
  const ctx = trendChart.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const rect = trendChart.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  trendChart.width = rect.width * dpr;
  trendChart.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const monthlyData = getLastSixMonthsNet();
  ctx.clearRect(0, 0, rect.width, rect.height);

  // Get colors from CSS variables (respects dark mode)
  const root = document.documentElement;
  const styles = getComputedStyle(root);
  const incomeColor = styles.getPropertyValue('--income').trim();
  const expenseColor = styles.getPropertyValue('--expense').trim();
  const gridColor = styles.getPropertyValue('--chart-grid').trim();
  const textColor = styles.getPropertyValue('--text-secondary').trim();

  const maxAbs = Math.max(1, ...monthlyData.map((d) => Math.abs(d.net)));
  const barWidth = rect.width / (monthlyData.length * 1.6);
  const baseLine = rect.height * 0.6;

  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, baseLine);
  ctx.lineTo(rect.width, baseLine);
  ctx.stroke();

  monthlyData.forEach((item, index) => {
    const x = (index + 0.6) * (rect.width / monthlyData.length);
    const height = (Math.abs(item.net) / maxAbs) * (rect.height * 0.42);
    const y = item.net >= 0 ? baseLine - height : baseLine;

    ctx.fillStyle = item.net >= 0 ? incomeColor : expenseColor;
    roundRect(ctx, x, y, barWidth, height, 8);
    ctx.fill();

    ctx.fillStyle = textColor;
    ctx.font = "12px Space Grotesk";
    ctx.fillText(item.label, x - 6, rect.height - 14);
  });
}

function renderCategoryChart() {
  const ctx = categoryChart.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const rect = categoryChart.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  categoryChart.width = rect.width * dpr;
  categoryChart.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, rect.width, rect.height);

  const monthKey = getReportMonthKey();
  const report = buildMonthlyReportData(monthKey);
  categoryChartSubtitle.textContent = report.monthLabel;

  // Get colors from CSS variables (respects dark mode)
  const root = document.documentElement;
  const styles = getComputedStyle(root);
  const mutedColor = styles.getPropertyValue('--muted').trim();
  const chartBgLight = styles.getPropertyValue('--chart-bg-light').trim();
  const accent = styles.getPropertyValue('--accent').trim();
  const warning = styles.getPropertyValue('--warning-alt').trim();
  const expense = styles.getPropertyValue('--expense').trim();
  const chartGreen = styles.getPropertyValue('--chart-green-alt').trim();
  const chartPurple = styles.getPropertyValue('--chart-purple').trim();
  const chartTeal = styles.getPropertyValue('--chart-teal-alt').trim();
  const chartBrown = styles.getPropertyValue('--chart-brown').trim();

  if (report.categoryRanking.length === 0) {
    ctx.fillStyle = mutedColor;
    ctx.font = "14px Space Grotesk";
    ctx.fillText("Sem despesas para o mes selecionado.", 16, 32);
    categoryChartLegend.innerHTML = "";
    return;
  }

  const totalExpense = Math.max(1, report.totals.expense);
  const centerX = rect.width * 0.28;
  const centerY = rect.height * 0.52;
  const radius = Math.min(rect.height * 0.34, rect.width * 0.18);

  const palette = [accent, warning, expense, chartGreen, chartPurple, chartTeal, chartBrown];
  let startAngle = -Math.PI / 2;

  report.categoryRanking.slice(0, 7).forEach((item, index) => {
    const ratio = item.spent / totalExpense;
    const endAngle = startAngle + ratio * Math.PI * 2;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = palette[index % palette.length];
    ctx.fill();

    startAngle = endAngle;
  });

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = chartBgLight;
  ctx.fill();

  ctx.fillStyle = mutedColor;
  ctx.font = "11px Space Grotesk";
  ctx.fillText("Despesas", centerX - 22, centerY - 4);
  ctx.font = "bold 13px Space Grotesk";
  ctx.fillText(formatCurrency(report.totals.expense), centerX - 48, centerY + 14);

  categoryChartLegend.innerHTML = report.categoryRanking.slice(0, 7).map((item, index) => {
    const ratio = report.totals.expense > 0 ? (item.spent / report.totals.expense) * 100 : 0;
    return `
      <div class="legend-item">
        <span class="legend-dot" style="background:${palette[index % palette.length]}"></span>
        <span>${escapeHtml(item.category)} - ${formatCurrency(item.spent)} (${ratio.toFixed(1)}%)</span>
      </div>
    `;
  }).join("");
}

function onScenarioSubmit(event) {
  event.preventDefault();
  renderScenarioProjection();
  trackEvent("scenario_simulated", {
    incomeIncrease: Number(scenarioIncomeIncreaseInput.value || 0),
    expenseReduction: Number(scenarioExpenseReductionInput.value || 0)
  });
}

function renderScenarioProjection() {
  const incomeIncreasePct = clamp(Number(scenarioIncomeIncreaseInput.value || 0), 0, 100);
  const expenseReductionPct = clamp(Number(scenarioExpenseReductionInput.value || 0), 0, 100);

  const monthlyStats = getLastMonthsAverages(3);
  const currentBalance = calculateTotals(state.transactions).balance;

  const baseMonthlyNet = monthlyStats.income - monthlyStats.expense;
  const optimizedMonthlyNet = (monthlyStats.income * (1 + incomeIncreasePct / 100))
    - (monthlyStats.expense * (1 - expenseReductionPct / 100));

  const baseProjection = buildProjectionSeriesEngine(currentBalance, baseMonthlyNet, 6);
  const optimizedProjection = buildProjectionSeriesEngine(currentBalance, optimizedMonthlyNet, 6);

  const deltaFinal = optimizedProjection[optimizedProjection.length - 1] - baseProjection[baseProjection.length - 1];
  scenarioResultText.textContent = `Em 6 meses, o cenario otimizado projeta ${formatCurrency(deltaFinal)} a mais que o cenario base.`;

  renderScenarioChart(baseProjection, optimizedProjection);
}

function getLastMonthsAverages(monthsBack) {
  const now = new Date();
  const months = [];

  for (let i = monthsBack - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push(key);
  }

  let totalIncome = 0;
  let totalExpense = 0;

  months.forEach((key) => {
    const monthTx = state.transactions.filter((tx) => tx.date.slice(0, 7) === key);
    const totals = calculateTotals(monthTx);
    totalIncome += totals.income;
    totalExpense += totals.expense;
  });

  const divisor = Math.max(1, months.length);
  return {
    income: totalIncome / divisor,
    expense: totalExpense / divisor
  };
}

function renderScenarioChart(baseProjection, optimizedProjection) {
  const ctx = scenarioChart.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const rect = scenarioChart.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  scenarioChart.width = rect.width * dpr;
  scenarioChart.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, rect.width, rect.height);

  // Get colors from CSS variables (respects dark mode)
  const root = document.documentElement;
  const styles = getComputedStyle(root);
  const textSecondary = styles.getPropertyValue('--text-secondary').trim();
  const muted = styles.getPropertyValue('--muted').trim();
  const income = styles.getPropertyValue('--income').trim();

  const allValues = [...baseProjection, ...optimizedProjection];
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const span = Math.max(1, maxVal - minVal);

  const padX = 28;
  const padY = 20;
  const plotW = rect.width - padX * 2;
  const plotH = rect.height - padY * 2;

  drawProjectionLine(ctx, baseProjection, {
    color: muted,
    label: "Base",
    padX,
    padY,
    plotW,
    plotH,
    minVal,
    span
  });

  drawProjectionLine(ctx, optimizedProjection, {
    color: income,
    label: "Otimizado",
    padX,
    padY,
    plotW,
    plotH,
    minVal,
    span
  });

  ctx.fillStyle = textSecondary;
  ctx.font = "11px Space Grotesk";
  ctx.fillText("Base", padX, padY - 4);
  ctx.fillText("Otimizado", padX + 60, padY - 4);
}

function drawProjectionLine(ctx, values, options) {
  const { color, padX, padY, plotW, plotH, minVal, span } = options;
  const stepX = values.length > 1 ? plotW / (values.length - 1) : 0;

  ctx.beginPath();
  values.forEach((value, index) => {
    const x = padX + stepX * index;
    const y = padY + (1 - (value - minVal) / span) * plotH;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function getLastSixMonthsNet() {
  const now = new Date();
  const months = [];

  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({
      key,
      label: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      net: 0
    });
  }

  state.transactions.forEach((tx) => {
    const target = months.find((item) => item.key === tx.date.slice(0, 7));
    if (!target) return;
    target.net += tx.type === "income" ? tx.amount : -tx.amount;
  });

  return months;
}

function getExpenseByCategoryForMonth(monthKey) {
  const key = String(monthKey || getLocalCurrentMonth());
  return state.transactions.reduce((acc, tx) => {
    if (tx.type !== "expense" || String(tx.date || "").slice(0, 7) !== key) return acc;
    acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    return acc;
  }, {});
}

function getCurrentMonthExpenseByCategory() {
  return getExpenseByCategoryForMonth(getLocalCurrentMonth());
}

function ensureCategoriesValid() {
  const txCategories = state.transactions.map((tx) => tx.category).filter(Boolean);
  const fromTx = txCategories.map((name) => ({ name, isDefault: DEFAULT_CATEGORIES.includes(name) }));
  const all = [...state.categories, ...fromTx, ...DEFAULT_CATEGORIES.map((name) => ({ name, isDefault: true }))];

  const seen = new Set();
  state.categories = all
    .filter((item) => {
      const key = item.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((item) => ({
      name: normalizeCategoryName(item.name),
      isDefault: item.isDefault || DEFAULT_CATEGORIES.includes(item.name)
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

function getReportMonthKey() {
  return reportMonthInput.value || new Date().toISOString().slice(0, 7);
}

function persistTransactions() {
  persistJson(STORAGE_KEY_TRANSACTIONS, state.transactions);
}

function persistAutoRules() {
  persistJson(STORAGE_KEY_AUTO_RULES, state.autoRules);
}

function persistRecurringTemplates() {
  persistJson(STORAGE_KEY_RECURRING_TEMPLATES, state.recurringTemplates);
}

function persistImportHistory() {
  persistJson(STORAGE_KEY_IMPORT_LOG, state.importHistory);
}

function persistGoals() {
  persistJson(STORAGE_KEY_GOALS, state.goals);
}

function persistCategories() {
  persistJson(STORAGE_KEY_CATEGORIES, state.categories);
}

function persistCategoryBudgets() {
  persistJson(STORAGE_KEY_CATEGORY_BUDGETS, state.categoryBudgets);
}

function persistViewMode() {
  persistViewModeToStorage(STORAGE_KEY_VIEW_MODE, state.viewMode);
}

function loadSimpleArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getLocalTodayISODate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLocalCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function normalizeDateForDateInput(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  if (/^\d{2}[./-]\d{2}[./-]\d{4}/.test(text)) {
    const [datePart] = text.split(/[T\s]/);
    const [dd, mm, yyyy] = datePart.replace(/[.-]/g, "/").split("/");
    if (yyyy && mm && dd) return `${yyyy}-${mm}-${dd}`;
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

window.addEventListener("resize", debounce(() => {
  renderTrendChart();
  renderCategoryChart();
  renderScenarioProjection();
}, 180));

// Register Service Worker for PWA offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service Worker registration failed:', err);
    });
  });
}

// ============================================================
// Dark Mode Theme Management
// ============================================================

const themeManager = {
  STORAGE_KEY: 'theme-preference',
  LIGHT_THEME: '',
  DARK_THEME: 'dark',

  init() {
    this.setupEventListeners();
    this.applySystemPreference();
  },

  setupEventListeners() {
    const themeModeBtn = document.getElementById('themeModeBtn');
    if (themeModeBtn) {
      themeModeBtn.addEventListener('click', () => this.toggle());
    }

    // Listen for system theme changes
    const prefersDarkMedia = window.matchMedia('(prefers-color-scheme: dark)');
    prefersDarkMedia.addEventListener('change', (e) => {
      const savedTheme = localStorage.getItem(this.STORAGE_KEY);
      if (!savedTheme) {
        // No user preference, apply system preference
        this.setTheme(e.matches ? this.DARK_THEME : this.LIGHT_THEME);
      }
    });
  },

  applySystemPreference() {
    const savedTheme = localStorage.getItem(this.STORAGE_KEY);

    if (savedTheme) {
      // User has a saved preference
      this.setTheme(savedTheme);
    } else {
      // No saved preference, use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark ? this.DARK_THEME : this.LIGHT_THEME);
    }
  },

  toggle() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || this.LIGHT_THEME;
    const newTheme = currentTheme === this.LIGHT_THEME ? this.DARK_THEME : this.LIGHT_THEME;
    this.setTheme(newTheme);
    localStorage.setItem(this.STORAGE_KEY, newTheme);
  },

  setTheme(theme) {
    if (theme === this.LIGHT_THEME) {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }

    this.updateButtonText();
    this.updateMetaThemeColor();
    this.redrawCharts();
  },

  updateButtonText() {
    const themeModeBtn = document.getElementById('themeModeBtn');
    if (themeModeBtn) {
      const isDark = document.documentElement.getAttribute('data-theme') === this.DARK_THEME;
      themeModeBtn.textContent = isDark ? '☀️ Modo Claro' : '🌙 Modo Escuro';
    }
  },

  updateMetaThemeColor() {
    const isDark = document.documentElement.getAttribute('data-theme') === this.DARK_THEME;
    const themeColor = isDark ? '#58a6ff' : '#0f6675'; // Light: teal, Dark: blue
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');

    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }

    metaThemeColor.content = themeColor;
  },

  redrawCharts() {
    // Redraw all canvas charts with updated colors
    if (typeof renderTrendChart !== 'undefined') {
      renderTrendChart();
    }
    if (typeof renderCategoryChart !== 'undefined') {
      renderCategoryChart();
    }
    if (typeof renderScenarioProjection !== 'undefined') {
      renderScenarioProjection();
    }
  }
};

// Initialize theme on page load
window.addEventListener('DOMContentLoaded', () => {
  themeManager.init();
});
