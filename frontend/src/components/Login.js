import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  let { type } = useParams();
  type = type || 'user';

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${process.env.REACT_APP_API}/auth/login/${type}`, { email, password });
      console.log(res.data);
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed', error);
      alert('Invalid credentials');
    }
  };

  return (
    <div>
      <h2>Login as {type}</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
        <button type="submit">Login</button>
      </form>
       <p>
        Don't have an account? 
        <Link to={`/signup/${type}`}> Signup</Link>
      </p>
      <div>
        <p>Login as a:</p>
        <Link to="/login/user">User</Link> | <Link to="/login/host">Host</Link>
      </div>
    </div>
  );
}

export default Login;
