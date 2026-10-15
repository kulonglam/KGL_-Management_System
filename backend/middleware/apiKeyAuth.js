import { authenticateApiKey } from '../services/apiKeyService.js';

// Partner requests authenticate with `X-API-Key: kgl_<prefix>_<secret>`; cookies and JWTs are ignored.
const requireApiKey = (scope) => async (req, res, next) => {
  try {
    const key = await authenticateApiKey(req.get('x-api-key'), { ip: req.ip });
    if (!key) {
      return res.status(401).json({ message: 'A valid, unexpired API key is required in the X-API-Key header' });
    }
    if (scope && !key.scopes.includes(scope)) {
      return res.status(403).json({ message: `This API key does not have the ${scope} scope` });
    }
    req.apiKey = key;
    return next();
  } catch (error) {
    return next(error);
  }
};

export { requireApiKey };
