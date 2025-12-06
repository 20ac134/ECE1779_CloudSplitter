// import { Link, useNavigate } from 'react-router-dom';

// export default function Navbar(){
//   const nav = useNavigate();
//   const loggedIn = !!localStorage.getItem('token');
//   return (
//     <nav style={{ display:'flex', gap:12, alignItems:'center', marginBottom:16 }}>
//       <h2 style={{ marginRight: 'auto' }}>Cloud Splitter</h2>
//       {loggedIn ? (
//         <>
//           <Link to="/">Groups</Link>
//           <button onClick={()=>{ localStorage.removeItem('token'); nav('/login'); }}>Logout</button>
//         </>
//       ) : (
//         <>
//           <Link to="/login">Login</Link>
//           <Link to="/register">Register</Link>
//         </>
//       )}
//     </nav>
//   );
// }
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js'; // Adjust path according to your actual location: if Navbar and api are at same level, use './api.js'

export default function Navbar() {
  const nav = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  const loggedIn = !!localStorage.getItem('token');

  useEffect(() => {
    if (!loggedIn) {
      setCurrentUser(null);
      return;
    }

    // Try to get current user information
    api('/users/me')
      .then((u) => setCurrentUser(u))
      .catch((err) => {
        console.error('Failed to load /users/me in Navbar', err);
        setCurrentUser(null);
      });
  }, [loggedIn]);

  function logout() {
    localStorage.removeItem('token');
    setCurrentUser(null);
    nav('/login');
  }

  return (
    <nav
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        marginBottom: 16,
      }}
    >
      <h2 style={{ marginRight: 'auto' }}>Cloud Splitter</h2>

      {loggedIn ? (
        <>
          <Link to="/">Groups</Link>

          {currentUser && (
            <span style={{ fontSize: 14, color: '#555' }}>
              Current user: {currentUser.name}
            </span>
          )}

          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </>
      )}
    </nav>
  );
}