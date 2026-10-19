import jwt from 'jsonwebtoken';
import TrustedBuyer from '../models/TrustedBuyer.js';
import { getJwtAlgorithms, getJwtClaimOptions } from '../config/security.js';

const portalProtect = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token || !process.env.JWT_SECRET) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: getJwtAlgorithms(),
      ...getJwtClaimOptions()
    });
    if (decoded.typ !== 'portal') {
      return res.status(401).json({ message: 'Not authorized' });
    }
    const buyer = await TrustedBuyer.findById(decoded.id).lean();
    if (!buyer) return res.status(401).json({ message: 'Not authorized' });
    req.portalBuyer = buyer;
    return next();
  } catch {
    return res.status(401).json({ message: 'Not authorized' });
  }
};

export { portalProtect };
