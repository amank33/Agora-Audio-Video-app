import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import AgoraRTM from 'agora-rtm-sdk'; // v1.5.1

function Dashboard() {
  const [list, setList] = useState([]);
  const [user, setUser] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isRtmLoggedIn, setIsRtmLoggedIn] = useState(false);
  const [rtmError, setRtmError] = useState('');
  const navigate = useNavigate();
  const rtmClient = useRef(null);
  const rtmLoginInitiated = useRef(false);

  const logout = useCallback(async () => {
    localStorage.removeItem('token');
    if (rtmClient.current) {
      await rtmClient.current.logout();
      rtmClient.current = null;
    }
    setIsRtmLoggedIn(false);
    navigate('/login/user');
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setRtmError('No authentication token found. Please log in again.');
      navigate('/login/user');
      return;
    }
    if (rtmLoginInitiated.current) return;
    rtmLoginInitiated.current = true;

    let decoded;
    try {
      decoded = jwtDecode(token);
      setUser(decoded);
    } catch {
      setRtmError('Invalid authentication token. Please log in again.');
      logout();
      return;
    }
    if (!decoded.id) {
      setRtmError('User ID missing in token. Cannot connect to RTM.');
      return;
    }

    const client = AgoraRTM.createInstance(
      process.env.REACT_APP_AGORA_APP_ID
    ); 
    rtmClient.current = client;

    client.on('ConnectionStateChanged', (state, reason) => {
      console.log('[RTM] State ->', state, 'Reason ->', reason);
      setIsRtmLoggedIn(state === 'CONNECTED');
      if (state !== 'CONNECTED') {
        setRtmError('Failed to connect to real-time service.');
      }
      if (reason === 'REMOTE_LOGIN') {
        alert('You have been logged out from another session.');
        logout();
      }
    });

    client.on('MessageFromPeer', (message, peerId) => {
      const msg = JSON.parse(message.text);
      switch (msg.type) {
        case 'call-invite':
          setIncomingCall({ ...msg, callerId: peerId });
          break;
        case 'call-accepted':
          navigate(`/call/${msg.channelName}/${msg.callType}`);
          break;
        case 'call-rejected':
          alert('Call rejected.');
          break;
      }
    });

    client.on('PeersOnlineStatusChanged', statuses => {
      console.log('You are', statuses[decoded.id] ? 'online' : 'offline');
    });

    (async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API}/agora/rtm-token`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { uid: decoded.id },
          }
        );
        await client.login({ token: res.data.token, uid: decoded.id });
        console.log('RTM login successful');
        await client.subscribePeersOnlineStatus([decoded.id]); 
      } catch (err) {
        setRtmError('RTM login failed. Please check your network.');
        console.error(err);
        rtmLoginInitiated.current = false;
      }
    })();

    axios
      .get(
        `${process.env.REACT_APP_API}${
          decoded.type === 'host' ? '/api/users' : '/api/hosts'
        }`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(res => setList(res.data))
      .catch(err => console.error(err));

    return () => {
      if (rtmClient.current) rtmClient.current.logout();
    };
  }, [navigate, logout]);

  const sendPeer = (peerId, obj) => {
    if (rtmClient.current) {
      rtmClient
        .current.sendMessageToPeer({ text: JSON.stringify(obj) }, peerId)
        .catch(console.error);
    }
  };

  const handleCall = (host, type) => {
    if (!isRtmLoggedIn || !user) return;
    const ch = [user.id, host._id].sort().join('-');
    sendPeer(host._id.toString(), {
      type: 'call-invite',
      channelName: ch,
      callerName: user.name,
      callType: type,
    });
    alert(`Calling ${host.name}...`);
  };

  const acceptCall = () => {
    const { channelName, callerId, callType } = incomingCall;
    sendPeer(callerId, {
      type: 'call-accepted',
      channelName,
      callType,
    });
    navigate(`/call/${channelName}/${callType}`);
    setIncomingCall(null);
  };

  const rejectCall = () => {
    sendPeer(incomingCall.callerId, { type: 'call-rejected' });
    setIncomingCall(null);
  };

  return (
    <div style={{ padding: '32px', maxWidth: 700, margin: '0 auto', fontFamily: 'Segoe UI, Arial, sans-serif', background: '#f8f9fa', borderRadius: 16, boxShadow: '0 2px 16px #0001' }}>
      {incomingCall && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 32, boxShadow: '0 2px 16px #0002', textAlign: 'center' }}>
            <h2 style={{ marginBottom: 16 }}>{incomingCall.callerName} is {incomingCall.callType} calling...</h2>
            <button onClick={acceptCall} style={{ background: '#28a745', color: 'white', border: 'none', borderRadius: 6, padding: '10px 24px', fontSize: 18, marginRight: 16, cursor: 'pointer' }}>Accept</button>
            <button onClick={rejectCall} style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: 6, padding: '10px 24px', fontSize: 18, cursor: 'pointer' }}>Reject</button>
          </div>
        </div>
      )}
      <h1 style={{ fontWeight: 700, fontSize: 36, marginBottom: 8 }}>Welcome, {user ? (user.name || user.email || user.id) : 'Unknown User'}!</h1>
      {rtmError && !isRtmLoggedIn && (
        <div style={{ color: 'red', marginBottom: 12, fontWeight: 500, fontSize: 18 }}>{rtmError}</div>
      )}
      {isRtmLoggedIn && (
        <div style={{ color: '#28a745', marginBottom: 12, fontWeight: 500, fontSize: 18 }}>
          Connected to real-time service. You can make video or audio calls.
        </div>
      )}
      <h2 style={{ fontWeight: 600, fontSize: 28, margin: '24px 0 12px' }}>
        {user && user.type === 'host' ? 'Available Users' : 'Available Hosts'}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {list.map((person) => (
          <div key={person._id} className="host-list-item" style={{ background: 'white', borderRadius: 8, padding: 16, boxShadow: '0 1px 4px #0001', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span><b>{person.name}</b> <span style={{ color: '#888' }}>({person.email})</span></span>
            <div>
              <button disabled={!isRtmLoggedIn || !user} onClick={() => handleCall(person, 'video')} style={{ marginRight: 8, background: '#007bff', color: 'white', border: 'none', borderRadius: 6, padding: '6px 16px', fontSize: 16, cursor: !isRtmLoggedIn || !user ? 'not-allowed' : 'pointer', opacity: !isRtmLoggedIn || !user ? 0.5 : 1 }}>Video Call</button>
              <button disabled={!isRtmLoggedIn || !user} onClick={() => handleCall(person, 'audio')} style={{ background: '#17a2b8', color: 'white', border: 'none', borderRadius: 6, padding: '6px 16px', fontSize: 16, cursor: !isRtmLoggedIn || !user ? 'not-allowed' : 'pointer', opacity: !isRtmLoggedIn || !user ? 0.5 : 1 }}>Audio Call</button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={logout} style={{ marginTop: 32, background: '#343a40', color: 'white', border: 'none', borderRadius: 6, padding: '10px 24px', fontSize: 18, cursor: 'pointer' }}>Logout</button>
    </div>
  );
}

export default Dashboard;
