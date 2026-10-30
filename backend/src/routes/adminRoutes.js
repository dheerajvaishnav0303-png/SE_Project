import { Router } from 'express';
import {
  getAdminKPIs,
  getPendingSettlements,
  authorizeSettlement,
  batchApproveSettlements,
  getAdminUsers,
  updateKycStatus,
  getInvestor360Dossier,
  moderateUserAccount,
} from '../controllers/adminController.js';
import {
  createCatalogPlan,
  updateCatalogPlan,
  updatePlanNavAndRecalculate,
  togglePlanInflowStatus,
  getPlanHolders,
  reconcileDoubleEntryLedger,
  getAuditLogs,
  broadcastNotification,
  getSystemDiagnostics,
  reseedDemoData,
  triggerManualMTM,
} from '../controllers/adminCatalogAndSystemController.js';
import {
  getAllSipsMonitor,
  triggerScheduledSipBatch,
  exportAuditLogsCsv,
  exportUsersCsv,
  exportLedgerCsv,
  exportHoldingsCsv,
} from '../controllers/adminReportingController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect, requireAdmin);

// Treasury & Command Center
router.get('/kpis', getAdminKPIs);
router.post('/run-mtm', triggerManualMTM || ((req, res) => res.json({ status: 'success' })));
router.get('/reconciliation', reconcileDoubleEntryLedger);
router.get('/diagnostics', getSystemDiagnostics);
router.post('/reseed', reseedDemoData);

// Maker-Checker Settlements
router.get('/settlements', getPendingSettlements);
router.post('/settlements/:id/action', authorizeSettlement);
router.post('/settlements/batch-approve', batchApproveSettlements);

// Users, KYC & Investor 360
router.get('/users', getAdminUsers);
router.get('/users/:id/360', getInvestor360Dossier);
router.patch('/users/:id/kyc', updateKycStatus);
router.post('/users/:id/moderate', moderateUserAccount);

// Catalog & NAV Lifecycle
router.post('/plans', createCatalogPlan);
router.patch('/plans/:id', updateCatalogPlan);
router.patch('/plans/:id/nav', updatePlanNavAndRecalculate);
router.patch('/plans/:id/inflow', togglePlanInflowStatus);
router.get('/plans/:id/holders', getPlanHolders);

// SIP Mandates & Broadcast
router.get('/sips', getAllSipsMonitor);
router.post('/sips/batch-execute', triggerScheduledSipBatch);
router.post('/broadcast', broadcastNotification);

// Audit Logs & Reports
router.get('/audit-logs', getAuditLogs);
router.get('/reports/audit-logs', exportAuditLogsCsv);
router.get('/reports/users', exportUsersCsv);
router.get('/reports/ledger', exportLedgerCsv);
router.get('/reports/holdings', exportHoldingsCsv);

export default router;
