import express from 'express';
import authenticate from '../middleware/auth.js';
import { createRequire } from 'module';

// Use createRequire to import the CommonJS 'agora-access-token' package
const require = createRequire(import.meta.url);
const { RtcTokenBuilder, RtmTokenBuilder, RtcRole, RtmRole } = require('agora-access-token');

const router = express.Router();

const generateRtcToken = (req, res) => {
  const { channel, uid } = req.query;
  if (!channel) {
    return res.status(400).json({ error: 'Channel is required' });
  }

  const appID = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERT;
  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600 * 24; // 24 hours
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(appID, appCertificate, channel, uid, role, privilegeExpiredTs);
  res.json({ token });
};

const generateRtmToken = (req, res) => {
    const { uid } = req.query;
    if (!uid) {
        return res.status(400).json({ 'error': 'uid is required' });
    }

    const appID = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERT;
    const expirationTimeInSeconds = 3600 * 24; // 24 hours
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Use RtmRole.Rtm_User which is correctly exported by 'agora-access-token'
    const role = RtmRole.Rtm_User;
    const token = RtmTokenBuilder.buildToken(appID, appCertificate, uid, role, privilegeExpiredTs);
    res.json({ token });
};

router.get('/token', authenticate, generateRtcToken);
router.get('/rtm-token', authenticate, generateRtmToken);

export default router;
