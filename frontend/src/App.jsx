import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { RequireAuth, RequireAdmin } from './routes/Guards';
import { EditorialShell } from './components/layout/EditorialShell';

// Auth Views
import AuthPage from './features/auth/AuthPage';

// Retail Investor Views
import ExecutiveLedgerPage from './features/dashboard/ExecutiveLedgerPage';
import HoldingsAndXRayPage from './features/portfolio/HoldingsAndXRayPage';
import CuratedPlansPage from './features/marketplace/CuratedPlansPage';
import GoalGlidepathStudioPage from './features/goals/GoalGlidepathStudioPage';
import StepUpSipManagerPage from './features/sips/StepUpSipManagerPage';
import FinancialWorkbenchPage from './features/calculators/FinancialWorkbenchPage';
import DoubleEntryLedgerPage from './features/ledger/DoubleEntryLedgerPage';
import SecurityAndKycPage from './features/settings/SecurityAndKycPage';

// Institutional Admin Views & Layout
import AdminLayout from './features/admin/AdminLayout';
import AdminOverviewPage from './features/admin/AdminOverviewPage';
import AdminUsersAndKycPage from './features/admin/AdminUsersAndKycPage';
import AdminSettlementsPage from './features/admin/AdminSettlementsPage';
import AdminCatalogPlansPage from './features/admin/AdminCatalogPlansPage';
import AdminSipAndAnalyticsPage from './features/admin/AdminSipAndAnalyticsPage';
import AdminAuditLogsPage from './features/admin/AdminAuditLogsPage';
import AdminSystemAndBroadcastPage from './features/admin/AdminSystemAndBroadcastPage';

function RoleBasedRoot() {
  const { user } = useAuthStore();
  if (['ADMIN', 'SUPER_ADMIN', 'COMPLIANCE_CHECKER'].includes(user?.role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  const { fetchMe } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <Routes>
      {/* 1. Public Authentication Views */}
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage />} />

      {/* 2. Retail Investor Daylight Broadsheet Views */}
      <Route
        element={
          <RequireAuth>
            <EditorialShell />
          </RequireAuth>
        }
      >
        <Route path="/" element={<RoleBasedRoot />} />
        <Route path="/dashboard" element={<ExecutiveLedgerPage />} />
        <Route path="/portfolio" element={<HoldingsAndXRayPage />} />
        <Route path="/marketplace" element={<CuratedPlansPage />} />
        <Route path="/goals" element={<GoalGlidepathStudioPage />} />
        <Route path="/sips" element={<StepUpSipManagerPage />} />
        <Route path="/calculators" element={<FinancialWorkbenchPage />} />
        <Route path="/ledger" element={<DoubleEntryLedgerPage />} />
        <Route path="/transactions" element={<Navigate to="/ledger" replace />} />
        <Route path="/settings" element={<SecurityAndKycPage />} />
      </Route>

      {/* 3. Dedicated Institutional Admin Operations Console */}
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminOverviewPage />} />
        <Route path="users" element={<AdminUsersAndKycPage />} />
        <Route path="settlements" element={<AdminSettlementsPage />} />
        <Route path="plans" element={<AdminCatalogPlansPage />} />
        <Route path="analytics" element={<AdminSipAndAnalyticsPage />} />
        <Route path="audit-logs" element={<AdminAuditLogsPage />} />
        <Route path="system" element={<AdminSystemAndBroadcastPage />} />
      </Route>

      {/* 4. Global Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
