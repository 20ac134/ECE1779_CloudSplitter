import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';

export default function App(){
  return (
    <div style={{ fontFamily: 'system-ui', maxWidth: 960, margin: '0 auto', padding: 16 }}>
      <Navbar />
      <Outlet />
    </div>
  );
}