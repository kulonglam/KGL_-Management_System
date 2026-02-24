import PriceSetting from '../models/PriceSetting.js';
import Procurement from '../models/Procurement.js';

const PRODUCE_TYPES = ['Beans', 'Grain Maize', 'Cow peas', 'G-nuts', 'Soybeans'];

const parseAndValidatePriceInput = (produceType, priceUgx) => {
  if (!produceType) {
    return { error: 'Produce type is required' };
  }

  if (!PRODUCE_TYPES.includes(produceType)) {
    return { error: 'Invalid produce type' };
  }

  const price = Number(priceUgx);
  if (!price || Number.isNaN(price) || price < 10000) {
    return { error: 'Price must be at least 10000 UGX' };
  }

  return { price };
};

const syncProcurementPrices = async (branch, produceType, priceUgx) => {
  const result = await Procurement.updateMany(
    { branch, type: produceType },
    { $set: { sellingPrice: priceUgx } }
  );

  return result.modifiedCount || 0;
};

// @desc    Get price settings for branch
// @route   GET /api/prices
// @access  Private (Manager only)
const getPrices = async (req, res) => {
  try {
    const settings = await PriceSetting.find({ branch: req.user.branch })
      .sort({ produceType: 1 });

    const priceMap = {};
    settings.forEach(s => {
      priceMap[s.produceType] = {
        _id: s._id,
        produceType: s.produceType,
        priceUgx: s.priceUgx,
        source: 'managed'
      };
    });

    const procurements = await Procurement.find({ branch: req.user.branch })
      .sort({ createdAt: -1 });
    procurements.forEach(p => {
      if (priceMap[p.type] === undefined) {
        priceMap[p.type] = {
          _id: null,
          produceType: p.type,
          priceUgx: p.sellingPrice,
          source: 'inferred'
        };
      }
    });

    PRODUCE_TYPES.forEach((type) => {
      if (!priceMap[type]) {
        priceMap[type] = {
          _id: null,
          produceType: type,
          priceUgx: null,
          source: 'unset'
        };
      }
    });

    const prices = PRODUCE_TYPES.map((type) => priceMap[type]);

    res.json(prices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single price setting
// @route   GET /api/prices/:id
// @access  Private (Manager only)
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

// @desc    Create price for produce type (applies globally to branch)
// @route   POST /api/prices
// @access  Private (Manager only)
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

// @desc    Update existing price setting
// @route   PUT /api/prices/:id
// @access  Private (Manager only)
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
        _id: { $ne: setting._id },
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

// @desc    Delete existing price setting
// @route   DELETE /api/prices/:id
// @access  Private (Manager only)
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

export {
  getPrices,
  getPriceById,
  createPrice,
  updatePrice,
  deletePrice
};
