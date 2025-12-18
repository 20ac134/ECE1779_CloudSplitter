import './Groups.css';
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Link } from 'react-router-dom';

export default function Groups(){
  const [groups, setGroups] = useState([]);
  const [name, setName] = useState('Thailand Trip');
  useEffect(()=>{ api('/groups').then(setGroups); },[]);
  return (
    <div className="groups-container">
      <h3>Your Groups</h3>
      <ul>
        {groups.map(g => <li key={g.id}><Link to={`/groups/${g.id}`}>{g.name}</Link></li>)}
      </ul>
      <h4>Create New Group</h4>
      <input value={name} onChange={e=>setName(e.target.value)} />
      <button onClick={async()=>{
        const g = await api('/groups', { method:'POST', body: JSON.stringify({ name }) });
        setGroups([g, ...groups]);
      }}>Create</button>
    </div>
  );
}
