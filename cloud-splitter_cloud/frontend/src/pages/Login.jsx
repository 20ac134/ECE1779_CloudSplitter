import { useState } from 'react';
import { api } from '../api.js';
import { useNavigate, Link } from 'react-router-dom';

export default function Login(){
  const nav = useNavigate();
  const [email,setEmail] = useState('alice@example.com');
  const [password,setPassword] = useState('password');
  const [err,setErr] = useState('');
  return (
    <div>
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
      {err && <p style={{color:'crimson'}}>{err}</p>}
      <p>New here? <Link to="/register">Create an account</Link></p>
    </div>
  );
}
