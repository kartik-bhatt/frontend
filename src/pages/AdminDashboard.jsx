  import React, { useState, useEffect } from 'react';
  import { Users, Settings, BarChart2, Bell, Search, Menu, X, LogOut, ChevronDown, UserPlus, UserX, FileText, GitBranch, Code, Server, AlertCircle } from 'lucide-react';
  import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
    // State management
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All Roles');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [notification, setNotification] = useState(null);
    const [showAddUserForm, setShowAddUserForm] = useState(false);
    const [newUser, setNewUser] = useState({
      username: '',
      email: '',
      password: '',
      roles: ['user'] // Default role
    });
    const [showEditUserForm, setShowEditUserForm] = useState(false);
    const [editUser, setEditUser] = useState({
      id: '',
      username: '',
      email: '',
      roles: [],
      status: 'Active'
    });
  
    
    const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(5); // Show 5 users per page

// Modify the filtering and pagination logic
const filteredUsers = users.filter(user => {
  // Search filter
  const matchesSearch = searchTerm === '' || 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase());
  
  // Role filter
  const matchesRole = roleFilter === 'All Roles' || user.role === roleFilter;
  
  // Status filter
  const matchesStatus = statusFilter === 'All Status' || user.status === statusFilter;
  
  return matchesSearch && matchesRole && matchesStatus;
});

// Calculate pagination
const indexOfLastUser = currentPage * itemsPerPage;
const indexOfFirstUser = indexOfLastUser - itemsPerPage;
const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

// Function to change page
const paginate = (pageNumber) => setCurrentPage(pageNumber);

// Functions for previous and next page
const goToPreviousPage = () => {
  if (currentPage > 1) {
    setCurrentPage(currentPage - 1);
  }
};

const goToNextPage = () => {
  if (currentPage < totalPages) {
    setCurrentPage(currentPage + 1);
  }
};
    // Get auth context
    const { accessToken, logout, currentUser } = useAuth();

    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
    
    // Analytics data for dashboard
    const analyticsData = {
      totalUsers: users.length || 0,
      activeUsers: users.filter(user => user?.status === 'Active').length || 0,
      newUsersToday: 28, // This would be calculated from real data
      pendingApprovals: users.filter(user => user?.status === 'Pending').length || 0
    };

    // Fetch users when component mounts and when accessToken changes
    useEffect(() => {
      if (accessToken) {
        fetchUsers();
      }
    }, [accessToken]);

    const fetchUsers = async () => {
      setLoading(true);
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
      } finally {
        setLoading(false);
      }
  };
  
  

    const deleteUser = async (userId) => {
      if (!window.confirm('Are you sure you want to delete this user?')) {
        return;
      }
      
      try {
        // Use the API service
        await api.deleteUser(userId);
        
        // Remove user from state
        setUsers(users.filter(user => user.id !== userId));
        showNotification('User deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting user:', error);
        showNotification(`Error deleting user: ${error.message}`, 'error');
      }
    };

    const handleLogout = () => {
      // Use the logout function from AuthContext
      logout();
    };

    const showNotification = (message, type = 'info') => {
      setNotification({ message, type });
      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    };

    // Filter users based on search term and filters
    // const filteredUsers = users.filter(user => {
    //   // Search filter
    //   const matchesSearch = searchTerm === '' || 
    //     user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //     user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
    //   // Role filter
    //   const matchesRole = roleFilter === 'All Roles' || user.role === roleFilter;
      
    //   // Status filter
    //   const matchesStatus = statusFilter === 'All Status' || user.status === statusFilter;
      
    //   return matchesSearch && matchesRole && matchesStatus;
    // });

    // Component for quick action cards
    const QuickActionCard = ({ icon, title, description, onClick }) => {
      return (
        <div 
          className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
          onClick={onClick}
        >
          <div className="mb-3">{icon}</div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      );
    };

    // Component for user rows in user management
    const UserRow = ({ id, name, email, role, status, lastLogin }) => {
      const getStatusBadge = (status) => {
        const classes = {
          Active: "bg-green-100 text-green-800",
          Inactive: "bg-gray-100 text-gray-800",
          Pending: "bg-yellow-100 text-yellow-800"
        };
        
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${classes[status]}`}>
            {status}
          </span>
        );
      };
      
      const getRoleBadge = (role) => {
        const classes = {
          Admin: "bg-purple-100 text-purple-800",
          User: "bg-blue-100 text-blue-800",
          Manager: "bg-indigo-100 text-indigo-800"
        };
        
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${classes[role]}`}>
            {role}
          </span>
        );
      };
      
      return (
        <tr>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-medium">
                {name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="ml-3">
                <p className="font-medium">{name}</p>
              </div>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">{email}</td>
          <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(role)}</td>
          <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(status)}</td>
          <td className="px-6 py-4 whitespace-nowrap">{lastLogin}</td>
          <td className="px-6 py-4 whitespace-nowrap text-right">
            <button className="text-indigo-600 hover:text-indigo-900 mr-3" onClick={() => handleEditUser(id)}>Edit</button>
            <button className="text-red-600 hover:text-red-900" onClick={() => deleteUser(id)}>Delete</button>
          </td>
        </tr>
      );
    };

    const handleEditUser = (userId) => {
      // Find the user to edit
      const userToEdit = users.find(user => user.id === userId);
      if (!userToEdit) {
        showNotification(`User with ID: ${userId} not found`, 'error');
        return;
      }
      
      // Convert role to roles array for the form
      const roles = [];
      if (userToEdit.role === 'Admin') {
        roles.push('admin');
      }
      if (userToEdit.role === 'User' || userToEdit.role === 'Manager') {
        roles.push('user');
      }
      
      // Set the form data
      setEditUser({
        id: userToEdit.id,
        username: userToEdit.name,
        email: userToEdit.email,
        roles: roles,
        status: userToEdit.status
      });
      
      // Show the edit form
      setShowEditUserForm(true);
    };

    const handleUpdateUser = async (e) => {
      e.preventDefault();
      setLoading(true);
      
      try {
        // Validate form input
        if (!editUser.username || !editUser.email) {
          throw new Error('Please fill in all required fields');
        }
        
        // Use the API service to update the user
        await api.updateUser(editUser.id, {
          username: editUser.username,
          email: editUser.email,
          roles: editUser.roles,
          status: editUser.status.toLowerCase()
        });
        
        // Success
        showNotification('User updated successfully', 'success');
        
        // Close modal
        setShowEditUserForm(false);
        
        // Refresh user list
        fetchUsers();
        
      } catch (error) {
        console.error('Error updating user:', error);
        showNotification(error.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    const handleAddUser = () => {
      setShowAddUserForm(true);
    };
    
    const handleCreateUser = async (e) => {
      e.preventDefault();
      setLoading(true);
      
      try {
        // Validate form input
        if (!newUser.username || !newUser.email || !newUser.password) {
          throw new Error('Please fill in all required fields');
        }
        
        // Use the API service
        await api.register({
          username: newUser.username,
          email: newUser.email,
          password: newUser.password,
          roles: newUser.roles
        });
        
        // Success
        showNotification('User created successfully', 'success');
        
        // Reset form and close modal
        setNewUser({
          username: '',
          email: '',
          password: '',
          roles: ['user']
        });
        setShowAddUserForm(false);
        
        // Refresh user list
        fetchUsers();
        
      } catch (error) {
        console.error('Error creating user:', error);
        showNotification(error.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    // Component for sidebar items
    const SidebarItem = ({ icon, label, isOpen, isActive, onClick }) => {
      return (
        <button 
          onClick={onClick}
          className={`w-full flex items-center p-3 space-x-4 rounded-lg hover:bg-indigo-700 transition-colors ${isActive ? 'bg-indigo-700' : ''}`}
        >
          <div className="text-white">{icon}</div>
          {isOpen && <span className="text-white">{label}</span>}
        </button>
      );
    };

    // Component for dashboard stats
    const StatCard = ({ title, value, change, up }) => {
      return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold mt-1">{value.toLocaleString()}</p>
          <div className={`flex items-center mt-2 text-sm ${up ? 'text-green-600' : 'text-red-600'}`}>
            <span>{change}</span>
            <span className="ml-1">since last month</span>
          </div>
        </div>
      );
    };

    // Notification component
    const Notification = ({ message, type }) => {
      const bgColors = {
        success: 'bg-green-100 border-green-400 text-green-700',
        error: 'bg-red-100 border-red-400 text-red-700',
        info: 'bg-blue-100 border-blue-400 text-blue-700',
      };
      
      return (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded border ${bgColors[type]} max-w-md z-50`} role="alert">
          <div className="flex items-center">
            {type === 'error' && <AlertCircle className="mr-2" size={20} />}
            <span>{message}</span>
          </div>
        </div>
      );
    };

    return (
      <div className="fixed inset-0 flex h-screen w-screen bg-gray-100">
        {notification && <Notification message={notification.message} type={notification.type} />}
        
        {/* Add User Modal */}
        {showAddUserForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Add New User</h2>
            <button 
          onClick={() => setShowAddUserForm(false)}
          className="text-gray-500 hover:text-gray-700"
            >
          <X size={24} />
            </button>
          </div>
          
          <form onSubmit={handleCreateUser}>
            <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={newUser.username}
              onChange={(e) => setNewUser({...newUser, username: e.target.value})}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={newUser.email}
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={newUser.password}
              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <div className="space-y-2">
              <div className="flex items-center">
            <input
              type="checkbox"
              id="role-user"
              checked={newUser.roles.includes('user')}
              onChange={(e) => {
                if (e.target.checked) {
              setNewUser({...newUser, roles: [...newUser.roles.filter(r => r !== 'user'), 'user']});
                } else {
              setNewUser({...newUser, roles: newUser.roles.filter(r => r !== 'user')});
                }
              }}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="role-user" className="ml-2 block text-sm text-gray-700">
              User
            </label>
              </div>
              
              <div className="flex items-center">
            <input
              type="checkbox"
              id="role-admin"
              checked={newUser.roles.includes('admin')}
              onChange={(e) => {
                if (e.target.checked) {
              setNewUser({...newUser, roles: [...newUser.roles.filter(r => r !== 'admin'), 'admin']});
                } else {
              setNewUser({...newUser, roles: newUser.roles.filter(r => r !== 'admin')});
                }
              }}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="role-admin" className="ml-2 block text-sm text-gray-700">
                Admin
              </label>
            </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowAddUserForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
            </form>
          </div>
        </div>
          )}
          
          {/* Edit User Modal */}
          {showEditUserForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Edit User</h2>
                  <button 
                    onClick={() => setShowEditUserForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <form onSubmit={handleUpdateUser}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={editUser.username}
                        onChange={(e) => setEditUser({...editUser, username: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={editUser.email}
                        onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="edit-role-user"
                            checked={editUser.roles.includes('user')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditUser({...editUser, roles: [...editUser.roles.filter(r => r !== 'user'), 'user']});
                              } else {
                                setEditUser({...editUser, roles: editUser.roles.filter(r => r !== 'user')});
                              }
                            }}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <label htmlFor="edit-role-user" className="ml-2 block text-sm text-gray-700">
                            User
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="edit-role-admin"
                            checked={editUser.roles.includes('admin')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditUser({...editUser, roles: [...editUser.roles.filter(r => r !== 'admin'), 'admin']});
                              } else {
                                setEditUser({...editUser, roles: editUser.roles.filter(r => r !== 'admin')});
                              }
                            }}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <label htmlFor="edit-role-admin" className="ml-2 block text-sm text-gray-700">
                            Admin
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={editUser.status}
                        onChange={(e) => setEditUser({...editUser, status: e.target.value})}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowEditUserForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                    >
                      {loading ? 'Updating...' : 'Update User'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          
          {/* Sidebar */}
          <div className={`bg-indigo-800 text-white transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
            <div className="p-4 flex justify-between items-center">
              {isSidebarOpen && <h2 className="text-xl font-bold">AdminPanel</h2>}
              <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-indigo-700">
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
            
            <nav className="mt-8">
              <SidebarItem 
                icon={<BarChart2 size={20} />} 
                label="Dashboard" 
                isOpen={isSidebarOpen} 
                isActive={activeTab === 'dashboard'}
                onClick={() => setActiveTab('dashboard')}
              />
              <SidebarItem 
                icon={<Users size={20} />} 
                label="User Management" 
                isOpen={isSidebarOpen} 
                isActive={activeTab === 'users'}
                onClick={() => setActiveTab('users')}
              />
              <SidebarItem 
                icon={<Code size={20} />} 
                label="My Services" 
                isOpen={isSidebarOpen}
                isActive={activeTab === 'services'}
                onClick={() => setActiveTab('services')}
              />
              
              <div className="absolute bottom-0 left-0  p-4">
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
            {/* Top Header */}
            <header className="bg-white shadow-sm py-4 px-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-800">
                  {activeTab === 'dashboard' && 'Dashboard'}
                  {activeTab === 'users' && 'User Management'}
                  {activeTab === 'services' && 'My Services'}
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                {currentUser && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">Welcome, {currentUser.username}</span>
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center">
                      {currentUser.username?.substring(0, 1).toUpperCase()}
                    </div>
                  </div>
                )}
              </div>
            </header>
            
            {/* Content Area */}
            <main className="flex-1 overflow-y-auto p-6">
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    <StatCard title="Total Users" value={analyticsData.totalUsers} change="+12%" up={true} />
                    <StatCard title="Active Users" value={analyticsData.activeUsers} change="+5%" up={true} />
                    {/* <StatCard title="New Users Today" value={analyticsData.newUsersToday} change="+8%" up={true} />
                    <StatCard title="Pending Approvals" value={analyticsData.pendingApprovals} change="-3%" up={false} /> */}
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <QuickActionCard 
                        icon={<UserPlus className="text-green-600" size={24} />}
                        title="Create User"
                        description="Add new users and assign roles/services"
                        onClick={() => setActiveTab('users')}
                      />
                      <QuickActionCard 
                        icon={<Users className="text-blue-600" size={24} />}
                        title="User Management"
                        description="View, update, or delete existing users"
                        onClick={() => setActiveTab('users')}
                      />
                      {/* <QuickActionCard 
                        icon={<FileText className="text-purple-600" size={24} />}
                        title="View Logs"
                        description="Audit user activity and download reports"
                        onClick={() => showNotification('Logs feature coming soon', 'info')}
                      /> */}
                    </div>
                  </div>
                  
                  {/* Recent Activity section could go here */}
                </div>
              )}
              
              {activeTab === 'users' && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">User Management</h2>
                    <button 
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-indigo-700"
                      onClick={handleAddUser}
                    >
                      <UserPlus size={16} />
                      <span>Add User</span>
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center mb-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search users..."
                        className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <select 
                        className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                      >
                        <option>All Roles</option>
                        <option>Admin</option>
                        <option>User</option>
                      </select>
                      <select 
                        className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option>All Status</option>
                        <option>Active</option>
                        <option>Inactive</option>
                        <option>Pending</option>
                      </select>
                    </div>
                  </div>
                  
                  {loading ? (
                    <div className="text-center py-8">Loading users...</div>
                  ) : error ? (
                    <div className="text-center py-8 text-red-600">
                      Error: {error}. Please try again later.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentUsers.length > 0 ? (
                              currentUsers.map((user) => (
                                <UserRow 
                                  key={user.id} 
                                  id={user.id}
                                  name={user.name} 
                                  email={user.email} 
                                  role={user.role} 
                                  status={user.status} 
                                  lastLogin={user.lastLogin} 
                                />
                              ))
                            ) : (
                              <tr>
                                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                  No users found matching your criteria
                                </td>
                              </tr>
                            )}
                          </tbody>
                      </table>
                    </div>
                  )}
                  
                  <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Showing {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
                  </div>
                  <div className="flex space-x-1">
                    <button 
                      className={`px-3 py-1 border rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200'}`}
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    
                    {/* Generate page number buttons */}
                    {[...Array(totalPages).keys()].map(number => (
                      <button 
                        key={number + 1}
                        onClick={() => paginate(number + 1)}
                        className={`px-3 py-1 border rounded-md ${currentPage === number + 1 ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100'}`}
                      >
                        {number + 1}
                      </button>
                    ))}
                    
                    <button 
                      className={`px-3 py-1 border rounded-md ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200'}`}
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                </div>
                </div>
              )}
              
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
                       
                        // onClick={() => showNotification('SVN Portal feature coming soon', 'info')}
                      onClick={() => navigate('/svn')} 
                      >
                        Open SVN Portal →
                      </button>
                  </div>
                  
                   <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 mb-4">
                        <Code size={24} />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Bugzilla</h3>
                      <p className="text-gray-600 mb-4">Track the bugs in products</p>
                      <button 
                        className="text-indigo-600 font-medium hover:text-indigo-800"
                      // onClick={() => showNotification('Bugzilla Portal feature coming soon', 'info')}
              
                      onClick={() => navigate('/bugzilla')}
                      >
                        Open bugzilla Portal →
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
                      // onClick={() => showNotification('Infrastructure Portal feature coming soon', 'info')}
                      onClick={() => navigate('/InfraDashboard')}
                      >
                        Open Infra Portal →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      );
    };
    
    export default AdminDashboard;