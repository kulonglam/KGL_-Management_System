import {
  getTaxConfig,
  updateTaxConfig
} from '../services/taxConfigService.js';
import {
  issueTaxInvoiceForSale,
  listInvoices,
  renderInvoiceHtml,
  renderInvoicePdf
} from '../services/invoiceService.js';
import { openOrGetCashUp, closeCashUp, listCashUps } from '../services/cashUpService.js';
import { buildGlExport, toCsv, listMappings } from '../services/glExportService.js';
import {
  getRetentionPolicy,
  updateRetentionPolicy,
  runRetentionJob,
  buildAuditExportPack
} from '../services/retentionService.js';
import TaxInvoice from '../models/TaxInvoice.js';
import Sale from '../models/Sale.js';
import { recordAudit } from '../services/auditService.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { forwardControllerError } from '../utils/httpError.js';
import { isDirectorAccount } from '../services/authService.js';
import { deniesBranchAccess } from '../utils/branchAccess.js';
import { businessDateKey } from '../utils/businessTime.js';

const getTaxConfigHandler = async (_req, res, next) => {
  try {
    res.json(await getTaxConfig());
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const updateTaxConfigHandler = async (req, res, next) => {
  try {
    const config = await updateTaxConfig({ actorUser: req.user, payload: req.body });
    await recordAudit({
      actor: req.user,
      action: 'update',
      entityType: 'taxConfig',
      entityId: config._id,
      branch: req.user.branch || '',
      metadata: {
        vatRatePercent: config.vatRatePercent,
        tin: config.tin
      }
    });
    res.json(config);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const listInvoicesHandler = async (req, res, next) => {
  try {
    const filter = {};
    if (!isDirectorAccount(req.user)) filter.branch = req.user.branch;
    else if (req.query.branch) filter.branch = req.query.branch;
    if (req.query.documentType) filter.documentType = req.query.documentType;

    const pagination = parsePagination(req.query);
    const items = await listInvoices({ filter, pagination });
    if (!pagination.enabled) return res.json(items);
    const total = await TaxInvoice.countDocuments(filter);
    return res.json({
      items,
      pagination: buildPaginationMeta({ page: pagination.page, limit: pagination.limit, total })
    });
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const getInvoiceHandler = async (req, res, next) => {
  try {
    const invoice = await TaxInvoice.findById(req.params.id).lean();
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (deniesBranchAccess(req.user, invoice.branch)) {
      return res.status(403).json({ message: 'Access denied to this branch data' });
    }
    res.json(invoice);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const getInvoiceDocumentHandler = async (req, res, next) => {
  try {
    const invoice = await TaxInvoice.findById(req.params.id).lean();
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (deniesBranchAccess(req.user, invoice.branch)) {
      return res.status(403).json({ message: 'Access denied to this branch data' });
    }
    const fileBase = invoice.invoiceNumber.replace(/[^\w.-]+/g, '_');
    if (req.query.format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileBase}.pdf"`);
      return res.send(renderInvoicePdf(invoice));
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="${fileBase}.html"`);
    res.send(renderInvoiceHtml(invoice));
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const issueInvoiceForSaleHandler = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.saleId);
    if (!sale) return res.status(404).json({ message: 'Sale not found' });
    if (deniesBranchAccess(req.user, sale.branch)) {
      return res.status(403).json({ message: 'Access denied to this branch data' });
    }
    if (sale.voidedAt) {
      return res.status(400).json({ message: 'Cannot invoice a voided sale; issue a credit note instead' });
    }
    const invoice = await issueTaxInvoiceForSale({ actorUser: req.user, sale });
    await recordAudit({
      actor: req.user,
      action: 'create',
      entityType: 'taxInvoice',
      entityId: invoice._id,
      branch: invoice.branch,
      metadata: { invoiceNumber: invoice.invoiceNumber, saleId: sale._id }
    });
    res.status(201).json(invoice);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const openCashUpHandler = async (req, res, next) => {
  try {
    const session = await openOrGetCashUp({
      actorUser: req.user,
      branch: req.body.branch || req.query.branch,
      businessDate: req.body.businessDate || req.query.businessDate || businessDateKey()
    });
    res.json(session);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const listCashUpsHandler = async (req, res, next) => {
  try {
    const filter = {};
    if (!isDirectorAccount(req.user)) filter.branch = req.user.branch;
    else if (req.query.branch) filter.branch = req.query.branch;
    if (req.query.status) filter.status = req.query.status;
    const items = await listCashUps({ filter });
    res.json(items);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const closeCashUpHandler = async (req, res, next) => {
  try {
    const session = await closeCashUp({
      actorUser: req.user,
      sessionId: req.params.id,
      countedTotals: req.body.countedTotals || req.body,
      varianceNote: req.body.varianceNote
    });
    await recordAudit({
      actor: req.user,
      action: 'update',
      entityType: 'cashUp',
      entityId: session._id,
      branch: session.branch,
      metadata: {
        businessDate: session.businessDate,
        varianceUgx: session.varianceUgx,
        status: session.status
      }
    });
    res.json(session);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const glExportHandler = async (req, res, next) => {
  try {
    let branch = req.query.branch;
    if (!isDirectorAccount(req.user)) {
      branch = req.user.branch;
    }
    const payload = await buildGlExport({
      from: req.query.from,
      to: req.query.to,
      branch: branch || undefined
    });
    if (String(req.query.format || '').toLowerCase() === 'csv') {
      const csv = toCsv(payload);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="gl-export.csv"');
      return res.send(csv);
    }
    res.json(payload);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const listGlMappingsHandler = async (_req, res, next) => {
  try {
    res.json(await listMappings());
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const getRetentionHandler = async (_req, res, next) => {
  try {
    res.json(await getRetentionPolicy());
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const updateRetentionHandler = async (req, res, next) => {
  try {
    const policy = await updateRetentionPolicy({ actorUser: req.user, payload: req.body });
    await recordAudit({
      actor: req.user,
      action: 'update',
      entityType: 'retentionPolicy',
      entityId: policy._id,
      branch: req.user.branch || '',
      metadata: {
        auditLogDays: policy.auditLogDays,
        messageOutboxDays: policy.messageOutboxDays
      }
    });
    res.json(policy);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const runRetentionHandler = async (req, res, next) => {
  try {
    const result = await runRetentionJob({ actorUser: req.user });
    await recordAudit({
      actor: req.user,
      action: 'update',
      entityType: 'retentionPolicy',
      entityId: result.policy._id,
      branch: req.user.branch || '',
      metadata: result.summary
    });
    res.json(result);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const auditPackHandler = async (req, res, next) => {
  try {
    let branch = req.query.branch;
    if (!isDirectorAccount(req.user)) branch = req.user.branch;
    const { zip, manifest } = await buildAuditExportPack({
      from: req.query.from,
      to: req.query.to,
      branch: branch || undefined
    });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="audit-pack-${manifest.generatedAt.slice(0, 10)}.zip"`
    );
    res.send(zip);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

export {
  getTaxConfigHandler,
  updateTaxConfigHandler,
  listInvoicesHandler,
  getInvoiceHandler,
  getInvoiceDocumentHandler,
  issueInvoiceForSaleHandler,
  openCashUpHandler,
  listCashUpsHandler,
  closeCashUpHandler,
  glExportHandler,
  listGlMappingsHandler,
  getRetentionHandler,
  updateRetentionHandler,
  runRetentionHandler,
  auditPackHandler
};
