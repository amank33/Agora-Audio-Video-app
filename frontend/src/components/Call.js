import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AgoraRTC from 'agora-rtc-sdk-ng';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

function Call() {
  const { channelName, callType } = useParams();
  const navigate = useNavigate();
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [localTracks, setLocalTracks] = useState([]);
  const localVideoRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login/user');
      return;
    }

    let tracksToCleanUp = [];

    const joinChannel = async () => {
      try {
        const decoded = jwtDecode(token);
        const uid = decoded.id;

        client.on('user-published', async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          if (mediaType === 'video') {
            setRemoteUsers(prev => [...prev, user]);
          }
          if (mediaType === 'audio') {
            user.audioTrack.play();
          }
        });

        client.on('user-unpublished', (user, mediaType) => {
          if (mediaType === 'video') {
            setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
          }
        });

        const response = await axios.get(`${process.env.REACT_APP_API}/agora/token`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { channel: channelName, uid }
        });
        const { token: agoraToken } = response.data;

        await client.join(process.env.REACT_APP_AGORA_APP_ID, channelName, agoraToken, uid);

        const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
        tracksToCleanUp = tracks;
        setLocalTracks(tracks);

        const tracksToPublish = [];
        if (callType === 'audio') {
            tracksToPublish.push(tracks[0]); // Microphone track
        } else {
            tracksToPublish.push(...tracks); // Both tracks
            if (tracks[1]) {
              tracks[1].play(localVideoRef.current);
            }
        }
        
        await client.publish(tracksToPublish);
      } catch (error) {
        console.error('Failed to join channel', error);
      }
    };

    joinChannel();

    return () => {
      for (const track of tracksToCleanUp) {
        track.stop();
        track.close();
      }
      setRemoteUsers([]);
      client.removeAllListeners();
      client.leave();
    };
  }, [channelName, callType, navigate]);

  return (
    <div style={{ padding: '32px', maxWidth: 900, margin: '0 auto', fontFamily: 'Segoe UI, Arial, sans-serif', background: '#f8f9fa', borderRadius: 16, boxShadow: '0 2px 16px #0001' }}>
      <h2 style={{ fontWeight: 700, fontSize: 32, marginBottom: 24 }}>{callType === 'video' ? 'Video Call' : 'Audio Call'}</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'center' }}>
        <div style={{ margin: '10px', textAlign: 'center' }}>
          <h3 style={{ fontWeight: 600, fontSize: 22, marginBottom: 8 }}>You</h3>
          <div ref={localVideoRef} style={{ width: '320px', height: '240px', border: '2px solid #007bff', borderRadius: 12, backgroundColor: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}></div>
        </div>
        {remoteUsers.map(user => (
          <RemoteUser key={user.uid} user={user} callType={callType} />
        ))}
      </div>
      <button onClick={() => navigate('/dashboard')} style={{ marginTop: 40, background: '#dc3545', color: 'white', border: 'none', borderRadius: 8, padding: '14px 36px', fontSize: 22, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px #0002' }}>End Call</button>
    </div>
  );
}

const RemoteUser = ({ user, callType }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (callType === 'video' && user.videoTrack) {
      user.videoTrack.play(videoRef.current);
    }
    if (user.audioTrack) {
      user.audioTrack.play();
    }
    return () => {
      user.videoTrack?.stop();
    };
  }, [user, callType]);

  return (
    <div style={{ margin: '10px', textAlign: 'center' }}>
      <h3 style={{ fontWeight: 600, fontSize: 22, marginBottom: 8 }}>Remote User</h3>
      <div ref={videoRef} style={{ width: '320px', height: '240px', border: '2px solid #17a2b8', borderRadius: 12, backgroundColor: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}></div>
    </div>
  );
};

export default Call;
