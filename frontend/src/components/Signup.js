import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const navigate = useNavigate();
  let { type } = useParams();
  type = type || 'user';

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { name, email, password };
      if (type === 'host') {
        payload.bio = bio;
      }
      await axios.post(`${process.env.REACT_APP_API}/auth/signup/${type}`, payload);
      navigate(`/login/${type}`);
    } catch (error) {
      console.error('Signup failed', error);
      alert('Email already exists');
    }
  };

  return (
    <div>
      <h2>Signup as {type}</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name" required />
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
        {type === 'host' && (
          <input type="text" value={bio} onChange={e => setBio(e.target.value)} placeholder="Bio" />
        )}
        <button type="submit">Signup</button>
      </form>
      <p>
        Already have an account? 
        <Link to={`/login/${type}`}> Login</Link>
      </p>
       <div>
        <p>Signup as a:</p>
        <Link to="/signup/user">User</Link> | <Link to="/signup/host">Host</Link>
      </div>
    </div>
  );
}

export default Signup;
