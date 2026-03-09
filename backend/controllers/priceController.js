/**
 * Coordinates request handling: reads HTTP input, invokes domain services, and returns response payloads.
 * File: backend/controllers/priceController.js
 */

import PriceSetting from '../models/PriceSetting.js';
import mongoose from 'mongoose';
import {
  buildPriceIdentityQuery,
  parseAndValidatePriceInput,
  getBranchPriceRows,
  syncProcurementPrices
} from '../services/priceService.js';
import { getPriceHistoryEntries, recordPriceHistory } from '../services/priceHistoryService.js';
// GET /api/prices: return manager price settings plus inferred produce rows for the branch.
const getPrices = async (req, res) => {
  try {
    const prices = await getBranchPriceRows(req.user.branch);
    res.json(prices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/prices/:id/history: return immutable audit history for one managed price setting.
const getPriceHistory = async (req, res) => {
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
    res.status(400).json({ message: error.message });
  }
};

// POST /api/prices: create a branch price rule and synchronize affected procurement selling prices.
const createPrice = async (req, res) => {
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

    const setting = await PriceSetting.create({
      branch: req.user.branch,
      produceName: validation.produceName,
      produceType: validation.produceType,
      priceUgx: validation.price
    });
    await recordPriceHistory({
      branch: req.user.branch,
      priceSettingId: setting._id,
      action: 'create',
      previousState: null,
      nextState: setting,
      changedBy: req.user._id
    });
    const updatedProcurements = await syncProcurementPrices(
      req.user.branch,
      validation.produceName,
      validation.produceType,
      validation.price
    );

    res.status(201).json({
      setting,
      updatedProcurements
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/prices/:id: update one branch price rule and resync procurement selling prices.
const updatePrice = async (req, res) => {
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
    setting.produceName = validation.produceName;
    setting.produceType = validation.produceType;
    setting.priceUgx = validation.price;
    const saved = await setting.save();
    await recordPriceHistory({
      branch: req.user.branch,
      priceSettingId: setting._id,
      action: 'update',
      previousState,
      nextState: saved,
      changedBy: req.user._id
    });

    const updatedProcurements = await syncProcurementPrices(
      req.user.branch,
      validation.produceName,
      validation.produceType,
      validation.price
    );

    res.json({
      setting: saved,
      updatedProcurements
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/prices/:id: remove one branch price rule after access checks.
const deletePrice = async (req, res) => {
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
    await setting.deleteOne();
    await recordPriceHistory({
      branch: req.user.branch,
      priceSettingId: setting._id,
      action: 'delete',
      previousState,
      nextState: null,
      changedBy: req.user._id
    });
    res.json({ message: 'Price setting deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export { getPrices, getPriceHistory, createPrice, updatePrice, deletePrice };





