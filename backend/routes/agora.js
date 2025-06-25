import express from 'express';
import authenticate from '../middleware/auth.js';
import { createRequire } from 'module';
import User from '../models/User.js';
import Host from '../models/Host.js';

// Use createRequire to import the CommonJS 'agora-access-token' package
const require = createRequire(import.meta.url);
const { RtcTokenBuilder, RtmTokenBuilder, RtcRole, RtmRole } = require('agora-access-token');

const router = express.Router();

const generateRtcToken = async (req, res) => {
  const { channel, uid } = req.query;
  if (!channel) {
    return res.status(400).json({ error: 'Channel is required' , status: 'error' });
  }

  const appID = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERT;
  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600 * 24; // 24 hours
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(appID, appCertificate, channel, uid, role, privilegeExpiredTs);

  // Store RTC token in Host if uid matches
  if (uid) {
    let hostData=await Host.findOneAndUpdate({_id:uid }, { rtcToken: token });
    if (!hostData) {
      // If no host found, try to find by email
      let userData = await User.findOneAndUpdate({_id:uid }, { rtcToken: token });
      if (!userData) {
        return res.status(404).json({ error: 'User or Host not found', status: 'error' });
      }
  
    }
  }

  res.status(201).json({ token, channel, uid , status: 'success' });
};

const generateRtmToken = async (req, res) => {
    const { uid } = req.query;
    if (!uid) {
        return res.status(400).json({ 'error': 'uid is required', status: 'error' });
    }

    const appID = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERT;
    const expirationTimeInSeconds = 3600 * 24; // 24 hours
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Use RtmRole.Rtm_User which is correctly exported by 'agora-access-token'
    const role = RtmRole.Rtm_User;
    const token = RtmTokenBuilder.buildToken(appID, appCertificate, uid, role, privilegeExpiredTs);

    // Store RTM token in User if uid matches
    if (uid) {
      let userData=await User.findOneAndUpdate({ _id: uid }, { rtmToken: token });
      if (!userData) {
        // If no user found, try to find by _id
        let hostdata = await Host.findOneAndUpdate({ _id: uid }, { rtmToken: token });
        if (!hostdata) {
          return res.status(404).json({ error: 'User or Host not found' , status: 'error' });
        }
    }
  }

    res.status(201).json({ token, uid, status: 'success' });
};

router.get('/token', authenticate, generateRtcToken);
router.get('/rtm-token', authenticate, generateRtmToken);

export default router;
