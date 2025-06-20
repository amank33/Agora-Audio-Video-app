import express from 'express';
import authenticate from '../middleware/auth.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { RtcTokenBuilder, RtmTokenBuilder, RtcRole, RtmRole } = require('agora-access-token');

const router = express.Router();

const generateRtcToken = (req, res) => {
  const { channel, uid } = req.query;
  if (!channel || !uid) {
    return res.status(400).json({ error: 'Channel and uid are required' });
  }

  const appID = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERT;
  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600 * 24; // 24 hours
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  // ✅ Use string-based UID generation
  const token = RtcTokenBuilder.buildTokenWithAccount(
    appID,
    appCertificate,
    channel,
    uid, // MongoDB _id (string)
    role,
    privilegeExpiredTs
  );

  res.json({ token });
};

const generateRtmToken = (req, res) => {
  const { uid } = req.query;
  if (!uid) {
    return res.status(400).json({ error: 'uid is required' });
  }

  const appID = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERT;
  const expirationTimeInSeconds = 3600 * 24; // 24 hours
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const role = RtmRole.Rtm_User;
  const token = RtmTokenBuilder.buildToken(appID, appCertificate, uid, role, privilegeExpiredTs);
  res.json({ token });
};

router.get('/token', authenticate, generateRtcToken);
router.get('/rtm-token', authenticate, generateRtmToken);

export default router;
