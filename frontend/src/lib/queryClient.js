import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds fresh cache
      gcTime: 10 * 60 * 1000, // 10 minutes cache garbage collection
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const portfolioKeys = {
  all: ['portfolio'],
  summary: () => [...portfolioKeys.all, 'summary'],
  advisory: () => [...portfolioKeys.all, 'advisory'],
};

export const investmentKeys = {
  all: ['investments'],
  catalog: (filters) => [...investmentKeys.all, 'catalog', filters],
  detail: (id) => [...investmentKeys.all, 'detail', id],
  holdings: () => [...investmentKeys.all, 'holdings'],
  taxLots: () => [...investmentKeys.all, 'taxLots'],
};

export const sipKeys = {
  all: ['sips'],
  list: () => [...sipKeys.all, 'list'],
};

export const goalKeys = {
  all: ['goals'],
  list: () => [...goalKeys.all, 'list'],
};

export const transactionKeys = {
  all: ['transactions'],
  list: (page) => [...transactionKeys.all, 'list', page],
  ledger: () => [...transactionKeys.all, 'ledger'],
};

export const adminKeys = {
  all: ['admin'],
  kpis: () => [...adminKeys.all, 'kpis'],
  settlements: () => [...adminKeys.all, 'settlements'],
  users: () => [...adminKeys.all, 'users'],
};

