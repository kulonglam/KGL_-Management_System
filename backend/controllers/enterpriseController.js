import { forwardControllerError } from '../utils/httpError.js';
import {
  buildAgingReport,
  importBankStatement,
  listBankLines,
  matchBankLine,
  postGlJournal,
  trialBalance
} from '../services/enterpriseFinanceService.js';
import {
  approvePurchaseOrder,
  createPurchaseOrder,
  listPurchaseOrders,
  matchPurchaseOrder,
  receiveGoods,
  receiveWithoutOrder
} from '../services/purchasingService.js';
import { listOutbox, recordDeliveryReceipt, retryOutboxMessage } from '../services/messageService.js';
import { listExchangeRates, quoteCurrency, setExchangeRate } from '../services/currencyService.js';

const wrap = (work) => async (req, res, next) => {
  try {
    const payload = await work(req);
    const status = payload?.statusCode || 200;
    if (payload?.statusCode) delete payload.statusCode;
    res.status(status).json(payload.body ?? payload);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const agingHandler = wrap(async (req) => buildAgingReport({ actorUser: req.user, branch: req.query.branch }));

const postJournalHandler = wrap(async (req) =>
  postGlJournal({ from: req.body.from, to: req.body.to, branch: req.body.branch })
);

const trialBalanceHandler = wrap(async (req) =>
  trialBalance({ from: req.query.from, to: req.query.to, branch: req.query.branch })
);

const importBankHandler = wrap(async (req) => {
  const lines = await importBankStatement({
    actorUser: req.user,
    branch: req.body.branch,
    lines: req.body.lines
  });
  return { statusCode: 201, body: lines };
});

const listBankHandler = wrap(async (req) => listBankLines({ actorUser: req.user, branch: req.query.branch }));

const matchBankHandler = wrap(async (req) =>
  matchBankLine({
    actorUser: req.user,
    id: req.params.id,
    refType: req.body.refType,
    refId: req.body.refId
  })
);

const listOrdersHandler = wrap(async (req) => listPurchaseOrders({ actorUser: req.user, branch: req.query.branch }));

const createOrderHandler = wrap(async (req) => {
  const order = await createPurchaseOrder({
    actorUser: req.user,
    supplierId: req.body.supplierId,
    lines: req.body.lines,
    note: req.body.note
  });
  return { statusCode: 201, body: order };
});

const approveOrderHandler = wrap(async (req) => approvePurchaseOrder({ actorUser: req.user, id: req.params.id }));

const receiveOrderHandler = wrap(async (req) =>
  receiveGoods({ actorUser: req.user, id: req.params.id, lines: req.body.lines, note: req.body.note })
);

const matchOrderHandler = wrap(async (req) => matchPurchaseOrder({ actorUser: req.user, id: req.params.id }));

const receiveWithoutOrderHandler = wrap(async (req) => {
  const procurement = await receiveWithoutOrder({ actorUser: req.user, payload: req.body });
  return { statusCode: 201, body: procurement };
});

const listOutboxHandler = wrap(async (req) => listOutbox({ status: req.query.status, channel: req.query.channel }));

const retryOutboxHandler = wrap(async (req) => retryOutboxMessage(req.params.id));

const deliveryReceiptHandler = wrap(async (req) =>
  recordDeliveryReceipt({
    providerMessageId: req.body.providerMessageId || req.body.messageId,
    token: req.get('x-receipt-token') || req.body.token
  })
);

const listRatesHandler = wrap(async () => listExchangeRates());
const quoteRateHandler = wrap(async (req) => quoteCurrency({ code: req.query.code, amount: req.query.amount }));
const setRateHandler = wrap(async (req) => {
  const saved = await setExchangeRate({
    actorUser: req.user,
    code: req.body.code,
    rateToUgx: req.body.rateToUgx,
    effectiveOn: req.body.effectiveOn
  });
  return { statusCode: 201, body: saved };
});

export {
  agingHandler,
  approveOrderHandler,
  createOrderHandler,
  deliveryReceiptHandler,
  importBankHandler,
  listBankHandler,
  listOrdersHandler,
  listOutboxHandler,
  listRatesHandler,
  matchBankHandler,
  matchOrderHandler,
  postJournalHandler,
  quoteRateHandler,
  receiveOrderHandler,
  receiveWithoutOrderHandler,
  retryOutboxHandler,
  setRateHandler,
  trialBalanceHandler
};
