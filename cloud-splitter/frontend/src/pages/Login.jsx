import './Login.css';
import { useState } from 'react';
import { api } from '../api.js';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from "react";

export default function Login(){
  const nav = useNavigate();
  const [email,setEmail] = useState('alice@example.com');
  const [password,setPassword] = useState('password');
  const [err,setErr] = useState('');

  useEffect(() => {
    document.body.classList.add("login-page");
    return () => {
      document.body.classList.remove("login-page");
    };
  }, []);

  return (
    <div className="login-container">
      <h3>Login</h3>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button onClick={async()=>{
        try {
          const { token } = await api('/users/login', { method:'POST', body: JSON.stringify({ email, password }) });
          localStorage.setItem('token', token);
          nav('/');
        } catch (e) { setErr(e.message); }
      }}>Sign in</button>
      {err && <p className="error">{err}</p>}
      <p>New here? <Link to="/register">Create an account</Link></p>
    </div>
  );

}
