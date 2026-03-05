/**
 * Coordinates request handling: reads HTTP input, invokes domain services, and returns response payloads.
 * File: backend/controllers/priceController.js
 */

import PriceSetting from '../models/PriceSetting.js';
import mongoose from 'mongoose';
import {
  parseAndValidatePriceInput,
  getBranchPriceRows,
  syncProcurementPrices
} from '../services/priceService.js';
// GET /api/prices: return manager price settings merged with inferred/unset produce rows for the branch.
const getPrices = async (req, res) => {
  try {
    const prices = await getBranchPriceRows(req.user.branch);
    res.json(prices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/prices/:id: return one price setting only when it belongs to the requester's branch.
const getPriceById = async (req, res) => {
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
    res.status(400).json({ message: error.message });
  }
};

// POST /api/prices: create a branch price rule and synchronize affected procurement selling prices.
const createPrice = async (req, res) => {
  try {
    const { produceType, priceUgx } = req.body;
    const validation = parseAndValidatePriceInput(produceType, priceUgx);
    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    const exists = await PriceSetting.findOne({
      branch: req.user.branch,
      produceType
    });
    if (exists) {
      return res.status(409).json({ message: 'Price already exists for this produce type' });
    }

    const setting = await PriceSetting.create({
      branch: req.user.branch,
      produceType,
      priceUgx: validation.price
    });
    const updatedProcurements = await syncProcurementPrices(
      req.user.branch,
      produceType,
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

    const nextProduceType = req.body.produceType || setting.produceType;
    const nextPriceInput = req.body.priceUgx ?? setting.priceUgx;
    const validation = parseAndValidatePriceInput(nextProduceType, nextPriceInput);
    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    if (nextProduceType !== setting.produceType) {
      const duplicate = await PriceSetting.findOne({
        _id: mongoose.trusted({ $ne: setting._id }),
        branch: req.user.branch,
        produceType: nextProduceType
      });
      if (duplicate) {
        return res.status(409).json({ message: 'Another price exists for this produce type' });
      }
    }
    setting.produceType = nextProduceType;
    setting.priceUgx = validation.price;
    const saved = await setting.save();

    const updatedProcurements = await syncProcurementPrices(
      req.user.branch,
      nextProduceType,
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

    await setting.deleteOne();
    res.json({ message: 'Price setting deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export { getPrices, getPriceById, createPrice, updatePrice, deletePrice };





