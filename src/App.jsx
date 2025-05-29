
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import GitDashboard from './pages/GitDashboard ';
// import Register from './pages/Register';

import './App.css';
import ToolPage from './pages/ToolPage';
import Team from './pages/Team';
import LearnMorePage from './pages/LearnMorePage';
import BugzillDashboard from './pages/BugzillDashboard';
import SvnDashboard from './pages/SvnDashboard';
import InfrastructureDashboard from './pages/InfrastructureDashboard';

function App() {
  return (
    <AuthProvider>
      <div>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          {/* <Route path="/register" element={<Register />} /> */}
          
          {/* Protected routes with role checks */}
          <Route path="/dashboard/admin" element={
            <ProtectedRoute requiredRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard/user" element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          } />

          <Route path="/git" element={<GitDashboard />} />
          <Route path="/bugzilla" element={<BugzillDashboard />} />
    
          <Route path="/svn" element={<SvnDashboard />} />
          <Route path="/infraDashboard" element={<InfrastructureDashboard>  </InfrastructureDashboard>}/>
          
          {/* Other routes */}
          <Route path="/tool" element={
            <ProtectedRoute>
              <ToolPage />
            </ProtectedRoute>
          } />
             <Route path="/learn-more" element={
            <ProtectedRoute>
              <LearnMorePage/>
            </ProtectedRoute>
          } />
          {/* <Route path="/analytics" element={
            <ProtectedRoute>
              <h1>Analytics</h1>
            </ProtectedRoute>
          } />
          <Route path="/team" element={
            <ProtectedRoute>
              <Team />
            </ProtectedRoute>
          } /> */}
        </Routes>      
      </div>
    </AuthProvider>
  );
}

export default App;



// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import HomePage from './pages/HomePage';
// import Login from './pages/Login';
// import AdminDashboard from './pages/AdminDashboard';
// import UserDashboard from './pages/UserDashboard';

// import './App.css';
// import ToolPage from './pages/ToolPage';
// import Team from './pages/Team';

// function App() {
//   return (
  
//       <div>
//         <Routes>
//           <Route path="/" element={<HomePage />} />  
//           <Route path="/tool" element={<ToolPage/>} />
//           <Route path="/analytics" element={<h1>Analytics</h1>} />
//            <Route path="/team" element={<Team />} />
//           <Route path="/login" element={<Login />} />
//           <Route path="/dashboard/admin" element={<AdminDashboard />} />
//           <Route path="/dashboard/user" element={<UserDashboard />} />
//           {/* <Route path="/signup" element={<h1>Signup</h1>} />
//           <Route path="/dashboard" element={<h1>Dashboard</h1>} /> */}
//         </Routes>      
//       </div>
 
//   );
// }

// export default App;
