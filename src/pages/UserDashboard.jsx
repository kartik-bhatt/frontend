import React, { useState, useEffect } from 'react';
import { User, Folder, GitBranch, Server, Code, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const navigate = useNavigate();
  // State management
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('services');
  const { accessToken, logout, currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  
  // Simple notification function
  const showNotification = (message, type) => {
    console.log(`${type}: ${message}`);
    // Replace with your actual notification implementation if you have one
  };
  
  // Fetch users when component mounts and when accessToken changes
  useEffect(() => {
    if (accessToken) {
      fetchUsers();
    }
  }, [accessToken]);
  
  const fetchUsers = async () => {
    try {
      // Use the API service instead of direct fetch
      const data = await api.getUsers();
      
      // Transform the data to match our component needs
      const transformedUsers = data.map(user => ({
        id: user.id,
        name: user.username,
        email: user.email,
        role: user.roles?.includes('ROLE_ADMIN') ? 'Admin' : 'User',
        status: 'Active', // This should come from the API
        lastLogin: 'Apr 10, 2025' // This should come from the API
      }));
      
      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message);
      showNotification(`Error fetching users: ${error.message}`, 'error');
      
      // Set example data for development/testing purposes
      setUsers([
        { id: "1", name: "Sarah Johnson", email: "sarah.j@example.com", role: "Admin", status: "Active", lastLogin: "Apr 11, 2025 (Today)" },
        { id: "2", name: "Michael Brown", email: "m.brown@example.com", role: "Manager", status: "Active", lastLogin: "Apr 10, 2025" },
        { id: "3", name: "Emily Williams", email: "emily.w@example.com", role: "User", status: "Inactive", lastLogin: "Mar 28, 2025" },
        { id: "4", name: "David Miller", email: "d.miller@example.com", role: "User", status: "Pending", lastLogin: "Never" },
        { id: "5", name: "James Wilson", email: "j.wilson@example.com", role: "Manager", status: "Active", lastLogin: "Apr 9, 2025" }
      ]);
    }
  };
  
  const handleLogout = () => {
    // Use the logout function from AuthContext
    logout();
  };

  // Redirect to dashboard if user navigates to removed tabs
  if (activeTab === 'profile' || activeTab === 'settings' || activeTab === 'notifications') {
    setActiveTab('dashboard');
  }

  // Handle sidebar toggle
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  // Component for sidebar items
  const SidebarItem = ({ icon, label, isOpen, isActive, onClick }) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center p-3 space-x-4 rounded-lg hover:bg-indigo-700 transition-colors ${isActive ? 'bg-indigo-700' : ''}`}
    >
      <div className="text-white">{icon}</div>
      {isOpen && <span className="text-white">{label}</span>}
    </button>
  );

  // Stats card for dashboard
  const StatCard = ({ icon, bgColor, iconColor, title, value }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center">
        <div className={`h-12 w-12 rounded-lg ${bgColor} flex items-center justify-center ${iconColor} mr-4`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );

  // Service card component
  const ServiceCard = ({ icon, title, description, buttonText, onClick }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className={`h-12 w-12 rounded-lg ${icon.props.bgColor} flex items-center justify-center ${icon.props.iconColor} mb-4`}>
        {icon.props.children}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <button 
        className="text-indigo-600 font-medium hover:text-indigo-800"
        onClick={onClick}
      >
        {buttonText}
      </button>
    </div>
  );

  return (
    <div className="h-screen fixed inset-0 flex w-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`bg-indigo-800 text-white transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        {/* Sidebar header */}
        <div className="p-4 flex justify-between items-center">
          {isSidebarOpen && <h2 className="text-xl font-bold">UserPanel</h2>}
          <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-indigo-700">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        
        {/* User profile in sidebar */}
        <div className="p-4 flex flex-col items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center mb-2">
            <User size={24} />
          </div>
          {isSidebarOpen && (
            <div className="text-center">
              <h2 className="font-bold">{currentUser.username}</h2>
              <p className="text-xs text-indigo-300">{currentUser.role}</p>
            </div>
          )}
        </div>
        
        {/* Sidebar navigation */}
        <nav className="mt-8">
          {/* <SidebarItem 
            icon={<Folder size={20} />} 
            label="Dashboard" 
            isOpen={isSidebarOpen} 
            isActive={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
          /> */}
          <SidebarItem 
            icon={<Code size={20} />} 
            label="My Services" 
            isOpen={isSidebarOpen} 
            isActive={activeTab === 'services'}
            onClick={() => setActiveTab('services')}
          />
          
          {/* Logout button at bottom */}
          <div className={`absolute bottom-0 left-0 right-0 p-4 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
            <SidebarItem 
              icon={<LogOut size={20} />} 
              label="Logout" 
              isOpen={isSidebarOpen}
              onClick={handleLogout}
            />
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-800">
              {/* {activeTab === 'dashboard' && 'Dashboard'} */}
              {activeTab === 'services' && 'My Services'}
            </h1>
          </div>
          
          {/* User welcome in header */}
          <div className="flex items-center space-x-4">
            {currentUser && (
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2">Welcome, {currentUser.username}</span>
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                  {currentUser.username.substring(0, 1).toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Dashboard Tab */}
          {/* {activeTab === 'dashboard' && (
            <div className="space-y-6"> */}
              {/* Stats Cards */}
              {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <StatCard 
                  icon={<GitBranch size={24} />}
                  bgColor="bg-blue-100"
                  iconColor="text-blue-600"
                  title="Git Repositories"
                  value="12"
                />
                
                <StatCard 
                  icon={<Server size={24} />}
                  bgColor="bg-green-100"
                  iconColor="text-green-600"
                  title="Active Servers"
                  value="3"
                />
                
                <StatCard 
                  icon={<Code size={24} />}
                  bgColor="bg-purple-100"
                  iconColor="text-purple-600"
                  title="Security Status"
                  value="Secure"
                />
              </div> */}
              
              {/* Activity and Status Section */}
              {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> */}
                {/* Recent Activity */}
                {/* <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h2 className="text-lg font-semibold mb-4">Recent Activity</h2> */}
                  {/* <div className="space-y-4"> */}
                    {/* <div className="flex items-start pb-4 border-b border-gray-100">
                      <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                        <GitBranch size={16} />
                      </div>
                      <div>
                        <p className="font-medium">Created new branch</p>
                        <p className="text-sm text-gray-500">feature/user-auth in project-alpha</p>
                        <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                      </div>
                    </div> */}
                    {/* <div className="flex items-start pb-4 border-b border-gray-100">
                      <div className="h-8 w-8 rounded bg-green-100 flex items-center justify-center text-green-600 mr-3">
                        <Server size={16} />
                      </div>
                      <div>
                        <p className="font-medium">Server deployment</p>
                        <p className="text-sm text-gray-500">api-gateway updated to v2.3.1</p>
                        <p className="text-xs text-gray-400 mt-1">Yesterday</p>
                      </div>
                    </div> */}
                    {/* <div className="flex items-start">
                      <div className="h-8 w-8 rounded bg-purple-100 flex items-center justify-center text-purple-600 mr-3">
                        <User size={16} />
                      </div>
                      <div>
                        <p className="font-medium">Profile updated</p>
                        <p className="text-sm text-gray-500">Changed contact information</p>
                        <p className="text-xs text-gray-400 mt-1">3 days ago</p>
                      </div>
                    </div> */}
                  {/* </div> */}
                {/* </div> */}
                
                {/* Service Status */}
                {/* <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h2 className="text-lg font-semibold mb-4">Service Status</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-green-500 mr-3"></div>
                        <span>Git Version Control</span>
                      </div>
                      <span className="text-sm text-green-600 font-medium">Online</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-green-500 mr-3"></div>
                        <span>SVN Repository</span>
                      </div>
                      <span className="text-sm text-green-600 font-medium">Online</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-yellow-500 mr-3"></div>
                        <span>CI/CD Pipeline</span>
                      </div>
                      <span className="text-sm text-yellow-600 font-medium">Degraded</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-green-500 mr-3"></div>
                        <span>Infrastructure Access</span>
                      </div>
                      <span className="text-sm text-green-600 font-medium">Online</span>
                    </div>
                  </div>
                </div> */}
              {/* </div>
            </div>
          )} */}

          {/* Services Tab */}
          {activeTab === 'services' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">My Services</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                    <GitBranch size={24} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Git</h3>
                  <p className="text-gray-600 mb-4">Access your Git repositories and manage code.</p>
                  <button 
                    className="text-indigo-600 font-medium hover:text-indigo-800"
                    onClick={() => navigate('/git')}
                  >
                    Open Git Portal →
                  </button>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 mb-4">
                    <Code size={24} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">SVN</h3>
                  <p className="text-gray-600 mb-4">Access legacy code through Subversion control.</p>
                  <button 
                    className="text-indigo-600 font-medium hover:text-indigo-800"
                    onClick={() => navigate('/svn')}
                  >
                    Open SVN Portal →
                  </button>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center text-green-600 mb-4">
                    <Server size={24} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Infrastructure</h3>
                  <p className="text-gray-600 mb-4">Manage servers, databases and cloud resources.</p>
                  <button 
                    className="text-indigo-600 font-medium hover:text-indigo-800"
                    onClick={() => navigate('/infrastructure')}
                  >
                    Open Infra Portal →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Fallback for removed notification tab */}
          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Notifications</h2>
              <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
                <p className="text-gray-500">Notifications feature has been removed</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;