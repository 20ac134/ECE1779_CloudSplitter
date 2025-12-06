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
// import { useEffect, useState } from 'react';
// import {
//   BrowserRouter,
//   Routes,
//   Route,
//   Navigate,
//   useLocation,
//   Outlet,
// } from 'react-router-dom';
// import { api } from './api.js';

// import Login from './pages/Login.jsx';
// import Register from './pages/Register.jsx';
// import Groups from './pages/Groups.jsx';
// import GroupDetail from './pages/GroupDetail.jsx';

// // 新的 Navbar 组件，替换原来的简单 Navbar
// function Navbar() {
//   const [currentUser, setCurrentUser] = useState(null);
//   const location = useLocation();

//   useEffect(() => {
//     // 如果没有 token，就不要去请求 /users/me 了（避免 401）
//     const token = localStorage.getItem('token');
//     if (!token) {
//       setCurrentUser(null);
//       return;
//     }

//     api('/users/me')
//       .then(setCurrentUser)
//       .catch(() => {
//         // 这里失败一般是 token 失效，可以视情况清空 token、跳回登录
//         setCurrentUser(null);
//       });
//   }, [location.pathname]); // 路由变化时顺手刷新一下用户信息

//   return (
//     <header
//       style={{
//         display: 'flex',
//         justifyContent: 'space-between',
//         alignItems: 'baseline',
//         marginBottom: 16,
//         borderBottom: '1px solid #eee',
//         paddingBottom: 8,
//       }}
//     >
//       <div style={{ fontSize: 20, fontWeight: 600 }}>
//         Cloud Splitter
//       </div>
//       <div style={{ fontSize: 14, color: '#555' }}>
//         {currentUser ? (
//           <>
//             当前用户：{currentUser.name}{' '}
//             <span style={{ fontSize: 12, color: '#999' }}>
//               ({currentUser.email})
//             </span>
//           </>
//         ) : (
//           ''
//         )}
//       </div>
//     </header>
//   );
// }

// // 简单的"登录保护"：如果没有 token，就跳回 /login
// function PrivateRoute({ children }) {
//   const token = localStorage.getItem('token');
//   if (!token) {
//     return <Navigate to="/login" replace />;
//   }
//   return children;
// }

// // 主布局组件
// function Layout() {
//   return (
//     <div style={{ fontFamily: 'system-ui', maxWidth: 960, margin: '0 auto', padding: 16 }}>
//       <Navbar />
//       <Outlet />
//     </div>
//   );
// }

// export default function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         {/* 登录/注册页不需要顶部导航栏 */}
//         <Route path="/login" element={<Login />} />
//         <Route path="/register" element={<Register />} />

//         {/* 登录后的页面统一使用 Layout 布局 */}
//         <Route path="/" element={
//           <PrivateRoute>
//             <Layout />
//           </PrivateRoute>
//         }>
//           <Route path="groups" element={<Groups />} />
//           <Route path="groups/:id" element={<GroupDetail />} />
          
//           {/* 默认重定向到 groups 页面 */}
//           <Route index element={<Navigate to="/groups" replace />} />
//         </Route>

//         {/* 其他未匹配的路由重定向 */}
//         <Route path="*" element={
//           localStorage.getItem('token') ? (
//             <Navigate to="/groups" replace />
//           ) : (
//             <Navigate to="/login" replace />
//           )
//         } />
//       </Routes>
//     </BrowserRouter>
//   );
// }