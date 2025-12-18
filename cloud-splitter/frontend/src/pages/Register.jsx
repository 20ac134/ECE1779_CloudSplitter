import './Register.css';
import { useState } from 'react';
import { api } from '../api.js';
import { useNavigate } from 'react-router-dom';
import { useEffect } from "react";

export default function Register(){
  const nav = useNavigate();
  const [name,setName] = useState('Charlie');
  const [email,setEmail] = useState('charlie@example.com');
  const [password,setPassword] = useState('password');
  const [err,setErr] = useState('');

  useEffect(() => {
    document.body.classList.add("register-page");
    return () => {
      document.body.classList.remove("registe-page");
     };
  }, []);

  return (
    <div className="register-container">
      <h3>Register</h3>
      <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button onClick={async()=>{
        try {
          await api('/users/register', { method:'POST', body: JSON.stringify({ name, email, password }) });
          const { token } = await api('/users/login', { method:'POST', body: JSON.stringify({ email, password }) });
          localStorage.setItem('token', token);
          nav('/');
        } catch (e) { setErr(e.message); }
      }}>Create account</button>
      {err && <p className="error">{err}</p>}
    </div>
  );
}
