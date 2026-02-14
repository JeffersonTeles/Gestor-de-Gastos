interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState = ({ icon, title, description, action, className = '' }: EmptyStateProps) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {icon && (
        <div className="mb-4 text-neutral-300">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-neutral-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-neutral-500 max-w-sm mb-6">{description}</p>
      )}
      {action && (
        <button onClick={action.onClick} className="btn-primary">
          {action.label}
        </button>
      )}
    </div>
  );
};

export const EmptyTransactions = ({ onAddTransaction }: { onAddTransaction: () => void }) => (
  <EmptyState
    icon={
      <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    }
    title="Nenhuma transação encontrada"
    description="Comece adicionando sua primeira transação para acompanhar suas finanças"
    action={{
      label: '+ Nova Transação',
      onClick: onAddTransaction
    }}
  />
);

export const EmptyBudgets = ({ onAddBudget }: { onAddBudget: () => void }) => (
  <EmptyState
    icon={
      <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
      </svg>
    }
    title="Nenhum orçamento criado"
    description="Crie orçamentos para controlar seus gastos por categoria"
    action={{
      label: '+ Novo Orçamento',
      onClick: onAddBudget
    }}
  />
);

export const EmptyBills = ({ onAddBill }: { onAddBill: () => void }) => (
  <EmptyState
    icon={
      <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    }
    title="Nenhuma conta cadastrada"
    description="Adicione suas contas recorrentes para não perder os prazos de pagamento"
    action={{
      label: '+ Nova Conta',
      onClick: onAddBill
    }}
  />
);

export const EmptyLoans = ({ onAddLoan }: { onAddLoan: () => void }) => (
  <EmptyState
    icon={
      <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    }
    title="Nenhum empréstimo registrado"
    description="Registre seus empréstimos para acompanhar pagamentos e saldos"
    action={{
      label: '+ Novo Empréstimo',
      onClick: onAddLoan
    }}
  />
);

export const EmptySearchResults = () => (
  <EmptyState
    icon={
      <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    }
    title="Nenhum resultado encontrado"
    description="Tente ajustar os filtros ou termos de busca"
  />
);
