import mongoose from 'mongoose';

const oidcLoginStateSchema = new mongoose.Schema({
  state: { type: String, required: true, unique: true },
  nonce: { type: String, required: true },
  codeVerifier: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 }
});

export default mongoose.model('OidcLoginState', oidcLoginStateSchema);
