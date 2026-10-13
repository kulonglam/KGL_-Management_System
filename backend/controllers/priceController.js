// Coordinates request handling: reads HTTP input, invokes domain services, and returns response payloads.
 import PriceSetting from '../models/PriceSetting.js';
import mongoose from 'mongoose';
import {
  buildPriceIdentityQuery,
  parseAndValidatePriceInput,
  getBranchPriceRows,
  syncProcurementPrices
} from '../services/priceService.js';
import { getPriceHistoryEntries, recordPriceHistory } from '../services/priceHistoryService.js';
import { forwardControllerError } from '../utils/httpError.js';
import { runInTransaction, withSession } from '../utils/transaction.js';
// GET /api/prices: return manager price settings plus inferred produce rows for the branch.
const getPrices = async (req, res, next) => {
  try {
    const prices = await getBranchPriceRows(req.user.branch);
    res.json(prices);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

// GET /api/prices/:id: return one managed price setting for the manager's branch.
const getPriceById = async (req, res, next) => {
  try {
    const setting = await PriceSetting.findById(req.params.id);
    if (!setting) {
      return res.status(404).json({ message: 'Price setting not found' });
    }
    if (setting.branch !== req.user.branch) {
      return res.status(403).json({ message: 'Access denied to this branch data' });
    }
    res.json(setting);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

// GET /api/prices/:id/history: return immutable audit history for one managed price setting.
const getPriceHistory = async (req, res, next) => {
  try {
    const setting = await PriceSetting.findById(req.params.id);
    if (!setting) {
      return res.status(404).json({ message: 'Price setting not found' });
    }
    if (setting.branch !== req.user.branch) {
      return res.status(403).json({ message: 'Access denied to this branch data' });
    }

    const history = await getPriceHistoryEntries({
      branch: req.user.branch,
      priceSettingId: setting._id
    });

    res.json(history);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

// POST /api/prices: create a branch price rule and synchronize affected procurement selling prices.
const createPrice = async (req, res, next) => {
  try {
    const { produceName, produceType, priceUgx } = req.body;
    const validation = parseAndValidatePriceInput(produceName, produceType, priceUgx);
    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    const exists = await PriceSetting.findOne(
      buildPriceIdentityQuery(
        req.user.branch,
        validation.produceName,
        validation.produceType
      )
    );
    if (exists) {
      return res.status(409).json({ message: 'Price already exists for this produce setting' });
    }

    const { setting, updatedProcurements } = await runInTransaction(async (session) => {
      const priceDocument = {
        branch: req.user.branch,
        produceName: validation.produceName,
        produceType: validation.produceType,
        priceUgx: validation.price
      };
      const created = session
        ? (await PriceSetting.create([priceDocument], { session }))[0]
        : await PriceSetting.create(priceDocument);
      await recordPriceHistory({
        branch: req.user.branch,
        priceSettingId: created._id,
        action: 'create',
        previousState: null,
        nextState: created,
        changedBy: req.user._id,
        session
      });
      const updatedCount = await syncProcurementPrices(
        req.user.branch,
        validation.produceName,
        validation.produceType,
        validation.price,
        session
      );
      return { setting: created, updatedProcurements: updatedCount };
    });

    res.status(201).json({
      setting,
      updatedProcurements
    });
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

// PUT /api/prices/:id: update one branch price rule and resync procurement selling prices.
const updatePrice = async (req, res, next) => {
  try {
    const setting = await PriceSetting.findById(req.params.id);
    if (!setting) {
      return res.status(404).json({ message: 'Price setting not found' });
    }
    if (setting.branch !== req.user.branch) {
      return res.status(403).json({ message: 'Access denied to this branch data' });
    }

    const nextProduceName = req.body.produceName ?? setting.produceName ?? '';
    const nextProduceType = req.body.produceType || setting.produceType;
    const nextPriceInput = req.body.priceUgx ?? setting.priceUgx;
    const validation = parseAndValidatePriceInput(nextProduceName, nextProduceType, nextPriceInput);
    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    if (
      validation.produceType !== setting.produceType ||
      validation.produceName !== (setting.produceName || undefined)
    ) {
      const duplicate = await PriceSetting.findOne({
        _id: mongoose.trusted({ $ne: setting._id }),
        ...buildPriceIdentityQuery(
          req.user.branch,
          validation.produceName,
          validation.produceType
        )
      });
      if (duplicate) {
        return res.status(409).json({ message: 'Another price exists for this produce setting' });
      }
    }
    const previousState = {
      produceName: setting.produceName,
      produceType: setting.produceType,
      priceUgx: setting.priceUgx
    };
    const { saved, updatedProcurements } = await runInTransaction(async (session) => {
      setting.produceName = validation.produceName;
      setting.produceType = validation.produceType;
      setting.priceUgx = validation.price;
      const savedSetting = await setting.save(withSession(session));
      await recordPriceHistory({
        branch: req.user.branch,
        priceSettingId: setting._id,
        action: 'update',
        previousState,
        nextState: savedSetting,
        changedBy: req.user._id,
        session
      });
      const updatedCount = await syncProcurementPrices(
        req.user.branch,
        validation.produceName,
        validation.produceType,
        validation.price,
        session
      );
      return { saved: savedSetting, updatedProcurements: updatedCount };
    });

    res.json({
      setting: saved,
      updatedProcurements
    });
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

// DELETE /api/prices/:id: remove one branch price rule after access checks.
const deletePrice = async (req, res, next) => {
  try {
    const setting = await PriceSetting.findById(req.params.id);
    if (!setting) {
      return res.status(404).json({ message: 'Price setting not found' });
    }
    if (setting.branch !== req.user.branch) {
      return res.status(403).json({ message: 'Access denied to this branch data' });
    }

    const previousState = {
      produceName: setting.produceName,
      produceType: setting.produceType,
      priceUgx: setting.priceUgx
    };
    await runInTransaction(async (session) => {
      await setting.deleteOne(withSession(session));
      await recordPriceHistory({
        branch: req.user.branch,
        priceSettingId: setting._id,
        action: 'delete',
        previousState,
        nextState: null,
        changedBy: req.user._id,
        session
      });
    });
    res.json({ message: 'Price setting deleted' });
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

export { getPrices, getPriceById, getPriceHistory, createPrice, updatePrice, deletePrice };





