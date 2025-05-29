import React, { useState, useEffect } from 'react';
import { User, Filter, Plus, MoreHorizontal, Search, Edit, Trash2, X, Check, ChevronDown, Users } from 'lucide-react';
import { userApi } from '../services/svnService';

const UsersPage = () => {
  // State management
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    role: 'All',
    status: 'All',
    group: 'All'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const usersPerPage = 5;

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Helper function to determine if a user is one of the last in the current page view
  const isLastUser = (userId) => {
    const userIndex = currentUsers.findIndex(user => user.id === userId);
    // Consider last 2 users as "bottom of the table"
    return userIndex >= currentUsers.length - 2;
  };

  // Fetch users with optional filters
  const fetchUsers = async (filters = {}) => {
    try {
      setLoading(true);
      
      // Get response from API
      const response = await userApi.getAll({
        ...filterOptions,
        ...filters
      });
      
      // Debug log to see response structure
      console.log('Users API response:', response);
      
      // Extract data from response
      const fetchedUsers = response.data || [];
      
      setUsers(fetchedUsers);
      setFilteredUsers(fetchedUsers);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to load users. Please try again later.");
      setLoading(false);
    }
  };

  // Apply filters and search
  useEffect(() => {
    const filterAndSearchUsers = async () => {
      try {
        // If we're just searching, filter locally
        if (searchQuery && filterOptions.role === 'All' &&
            filterOptions.status === 'All' && filterOptions.group === 'All') {
          const filtered = users.filter(user => {
            const query = searchQuery.toLowerCase();
            return (
                user.username?.toLowerCase().includes(query) ||
                user.fullName?.toLowerCase().includes(query) ||
                user.email?.toLowerCase().includes(query) ||
                user.group?.toLowerCase().includes(query)
            );
          });
          setFilteredUsers(filtered);
        }
        // If we're applying filters, fetch from API
        else if (filterOptions.role !== 'All' ||
            filterOptions.status !== 'All' ||
            filterOptions.group !== 'All') {
          setLoading(true);
          
          // Get response from API
          const response = await userApi.getAll(filterOptions);
          
          // Extract data from response
          const filtered = response.data || [];

          // Apply search on filtered results if needed
          if (searchQuery) {
            const searchFiltered = filtered.filter(user => {
              const query = searchQuery.toLowerCase();
              return (
                  user.username?.toLowerCase().includes(query) ||
                  user.fullName?.toLowerCase().includes(query) ||
                  user.email?.toLowerCase().includes(query) ||
                  user.group?.toLowerCase().includes(query)
              );
            });
            setFilteredUsers(searchFiltered);
          } else {
            setFilteredUsers(filtered);
          }
          setLoading(false);
        }
        // If no filters or search, show all users
        else {
          setFilteredUsers(users);
        }
      } catch (err) {
        console.error("Error applying filters:", err);
        setError("Failed to filter users. Please try again later.");
      }
    };

    filterAndSearchUsers();
  }, [searchQuery, filterOptions, users]);

  // Get current users for pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Get unique groups from users
  const uniqueGroups = ['All', ...Array.from(new Set(users.map(user => user.group).filter(Boolean)))];

  // CRUD Operations
  const addUser = async (userData) => {
    try {
      setLoading(true);
      
      // Get response from API
      const response = await userApi.create(userData);
      
      // Extract data from response
      const newUser = response.data;
      
      setUsers([...users, newUser]);
      setShowAddModal(false);
      setLoading(false);
    } catch (err) {
      console.error("Failed to create user:", err);
      alert("Failed to create user: " + (err.message || "Unknown error"));
      setLoading(false);
    }
  };

  const updateUser = async (id, userData) => {
    try {
      setLoading(true);
      
      // Get response from API
      const response = await userApi.update(id, userData);
      
      // Extract data from response
      const updatedUser = response.data;
      
      setUsers(users.map(user => user.id === id ? updatedUser : user));
      setShowEditModal(false);
      setLoading(false);
    } catch (err) {
      console.error("Failed to update user:", err);
      alert("Failed to update user: " + (err.message || "Unknown error"));
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    try {
      setLoading(true);
      await userApi.delete(id);
      setUsers(users.filter(user => user.id !== id));
      setShowDeleteModal(false);
      setLoading(false);
    } catch (err) {
      console.error("Failed to delete user:", err);
      alert("Failed to delete user: " + (err.message || "Unknown error"));
      setLoading(false);
    }
  };

  // Handle pagination
  const goToPage = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPagination = () => {
    const pages = [];

    // Always show first page
    pages.push(
        <PaginationButton
            key="first"
            page="1"
            active={currentPage === 1}
            onClick={() => goToPage(1)}
        />
    );

    // Logic for ellipsis and surrounding pages
    if (totalPages > 1) {
      if (currentPage > 3) {
        pages.push(<PaginationButton key="ellipsis1" page="..." />);
      }

      // Show current page and adjacent pages
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        if (i !== 1 && i !== totalPages) { // Skip first and last page as they're always shown
          pages.push(
              <PaginationButton
                  key={i}
                  page={i.toString()}
                  active={currentPage === i}
                  onClick={() => goToPage(i)}
              />
          );
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push(<PaginationButton key="ellipsis2" page="..." />);
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(
            <PaginationButton
                key="last"
                page={totalPages.toString()}
                active={currentPage === totalPages}
                onClick={() => goToPage(totalPages)}
            />
        );
      }
    }

    return pages;
  };

  return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">User Management</h1>

        {/* Error Message */}
        {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
              <p>{error}</p>
              <button
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  onClick={() => fetchUsers()}
              >
                Retry
              </button>
            </div>
        )}

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          {/* Search */}
          <div className="relative w-full md:w-72">
            <input
                type="text"
                placeholder="Search users..."
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
            />
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Filter Button */}
            <div className="relative">
              <button
                  className="px-4 py-2 rounded-md border border-gray-300 flex items-center"
                  onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-5 w-5 mr-2 text-gray-700" />
                <span>Filter</span>
                <ChevronDown className="h-4 w-4 ml-2 text-gray-700" />
              </button>

              {/* Filter Dropdown */}
              {showFilters && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                    <div className="p-4">
                      <h3 className="font-medium text-sm text-gray-700 mb-2">Role</h3>
                      <div className="space-y-1 mb-4">
                        {['All', 'Admin', 'Developer', 'ReadOnly'].map(role => (
                            <div key={role} className="flex items-center">
                              <input
                                  type="radio"
                                  id={`role-${role}`}
                                  name="role"
                                  checked={filterOptions.role === role}
                                  onChange={() => setFilterOptions({...filterOptions, role})}
                                  className="h-4 w-4 text-blue-600"
                              />
                              <label htmlFor={`role-${role}`} className="ml-2 text-sm text-gray-700">{role}</label>
                            </div>
                        ))}
                      </div>

                      <h3 className="font-medium text-sm text-gray-700 mb-2">Status</h3>
                      <div className="space-y-1 mb-4">
                        {['All', 'Active', 'Inactive', 'Locked'].map(status => (
                            <div key={status} className="flex items-center">
                              <input
                                  type="radio"
                                  id={`status-${status}`}
                                  name="status"
                                  checked={filterOptions.status === status}
                                  onChange={() => setFilterOptions({...filterOptions, status})}
                                  className="h-4 w-4 text-blue-600"
                              />
                              <label htmlFor={`status-${status}`} className="ml-2 text-sm text-gray-700">{status}</label>
                            </div>
                        ))}
                      </div>

                      <h3 className="font-medium text-sm text-gray-700 mb-2">Group</h3>
                      <div className="space-y-1 mb-4">
                        {uniqueGroups.map(group => (
                            <div key={group} className="flex items-center">
                              <input
                                  type="radio"
                                  id={`group-${group}`}
                                  name="group"
                                  checked={filterOptions.group === group}
                                  onChange={() => setFilterOptions({...filterOptions, group})}
                                  className="h-4 w-4 text-blue-600"
                              />
                              <label htmlFor={`group-${group}`} className="ml-2 text-sm text-gray-700">{group}</label>
                            </div>
                        ))}
                      </div>

                      <div className="flex justify-between">
                        <button
                            className="text-sm text-gray-500 hover:text-gray-700"
                            onClick={() => setFilterOptions({role: 'All', status: 'All', group: 'All'})}
                        >
                          Reset Filters
                        </button>
                        <button
                            className="text-sm text-blue-500 hover:text-blue-700"
                            onClick={() => setShowFilters(false)}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
              )}
            </div>

            {/* Add User Button */}
            <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md flex items-center hover:bg-blue-600"
                onClick={() => {
                  setCurrentUser(null);
                  setShowAddModal(true);
                }}
            >
              <Plus className="h-5 w-5 mr-2" />
              <span>Add User</span>
            </button>

            {/* Stats */}
            <div className="px-4 py-2 border border-gray-300 rounded-md">
              <div className="text-xs text-gray-500">Total Users</div>
              <div className="text-base font-semibold text-gray-800">{filteredUsers.length}</div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-md shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            {/* Table Header */}
            <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Username</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Full Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Group</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Role</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Last Activity</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
            </tr>
            </thead>

            {/* Table Body */}
            <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  </td>
                </tr>
            ) : currentUsers.length > 0 ? (
                currentUsers.map(user => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full ${user.colorCode || 'bg-gray-300'} flex items-center justify-center mr-3`}>
                            <span className="text-white text-xs">{user.initials || user.username?.substring(0, 2).toUpperCase()}</span>
                          </div>
                          <span className="text-sm text-gray-800">{user.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-800">{user.fullName}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <GroupBadge group={user.group} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {user.lastActivity || 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right relative">
                        <div className="relative">
                          <button
                              className="p-2 rounded-md hover:bg-gray-100"
                              onClick={(e) => {
                                e.stopPropagation(); // Stop event from reaching the backdrop
                                setShowActionMenu(showActionMenu === user.id ? null : user.id);
                              }}
                          >
                            <MoreHorizontal className="h-5 w-5 text-gray-500" />
                          </button>

                          {/* Action Menu with Fixed Positioning for Last Users */}
                          {showActionMenu === user.id && (
                              <div
                                  className="absolute z-50 w-48 bg-white rounded-md shadow-lg border border-gray-200"
                                  style={{
                                    // For users at the bottom of the list, position the menu above the button
                                    bottom: isLastUser(user.id) ? '100%' : 'auto',
                                    top: isLastUser(user.id) ? 'auto' : '100%',
                                    right: 0,
                                    marginBottom: isLastUser(user.id) ? '10px' : '0',
                                    marginTop: isLastUser(user.id) ? '0' : '10px'
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                              >
                                <div className="py-1">
                                  <button
                                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentUser(user);
                                        setShowEditModal(true);
                                        setShowActionMenu(null);
                                      }}
                                  >
                                    <Edit className="h-4 w-4 mr-2 text-gray-500" />
                                    Edit User
                                  </button>
                                  <button
                                      className="px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left flex items-center"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentUser(user);
                                        setShowDeleteModal(true);
                                        setShowActionMenu(null);
                                      }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                                    Delete User
                                  </button>
                                </div>
                              </div>
                          )}
                        </div>
                      </td>
                    </tr>
                ))
            ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No users found matching your criteria
                  </td>
                </tr>
            )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredUsers.length > 0 && (
            <div className="bg-white rounded-md shadow p-4 mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
              </div>
              <div className="flex space-x-2">
                <PaginationButton
                    page="<"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                />
                {renderPagination()}
                <PaginationButton
                    page=">"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                />
              </div>
            </div>
        )}

        {/* Add User Modal */}
        {showAddModal && (
            <UserModal
                onClose={() => setShowAddModal(false)}
                onSave={addUser}
                title="Add New User"
            />
        )}

        {/* Edit User Modal */}
        {showEditModal && (
            <UserModal
                user={currentUser}
                onClose={() => setShowEditModal(false)}
                onSave={(userData) => updateUser(currentUser.id, userData)}
                title="Edit User"
            />
        )}

        {/* Delete User Modal */}
        {showDeleteModal && (
            <DeleteModal
                user={currentUser}
                onClose={() => setShowDeleteModal(false)}
                onDelete={() => deleteUser(currentUser.id)}
            />
        )}

        {/* Backdrop for modals and dropdowns */}
        {(showActionMenu || showFilters) && (
            <div
                className="fixed inset-0 z-30"
                onClick={() => {
                  setShowActionMenu(null);
                  setShowFilters(false);
                }}
            ></div>
        )}
      </div>
  );
};

const GroupBadge = ({ group }) => {
  // Get color based on group name
  const getGroupColor = () => {
    switch (group) {
      case 'Engineering':
        return 'bg-indigo-100 text-indigo-800';
      case 'Development':
        return 'bg-blue-100 text-blue-800';
      case 'Operations':
        return 'bg-teal-100 text-teal-800';
      case 'Management':
        return 'bg-purple-100 text-purple-800';
      case 'QA':
        return 'bg-green-100 text-green-800';
      case 'Support':
        return 'bg-yellow-100 text-yellow-800';
      case 'Marketing':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
      <div className="flex items-center">
        <Users className="h-3 w-3 mr-1 text-gray-500" />
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getGroupColor()}`}>
        {group}
      </span>
      </div>
  );
};

const RoleBadge = ({ role }) => {
  const getColorClasses = () => {
    switch (role) {
      case 'Admin':
        return 'bg-blue-100 text-blue-800';
      case 'Developer':
        return 'bg-green-100 text-green-800';
      case 'ReadOnly':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColorClasses()}`}>
      {role}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const getStatusClasses = () => {
    switch (status) {
      case 'Active':
        return 'text-green-600';
      case 'Inactive':
        return 'text-gray-500';
      case 'Locked':
        return 'text-red-600';
      default:
        return 'text-gray-800';
    }
  };

  const getStatusDotClasses = () => {
    switch (status) {
      case 'Active':
        return 'bg-green-500';
      case 'Inactive':
        return 'bg-gray-400';
      case 'Locked':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  return (
      <div className="flex items-center">
        <div className={`h-2.5 w-2.5 rounded-full ${getStatusDotClasses()} mr-2`}></div>
        <span className={`text-sm ${getStatusClasses()}`}>{status}</span>
      </div>
  );
};

const PaginationButton = ({ page, active = false, onClick, disabled = false }) => {
  return (
      <button
          className={`w-8 h-8 flex items-center justify-center rounded-md border ${
              active
                  ? 'border-blue-500 bg-blue-50 text-blue-500'
                  : disabled
                      ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
          onClick={onClick}
          disabled={disabled}
      >
        {page}
      </button>
  );
};

const UserModal = ({ user = null, onClose, onSave, title }) => {
  const [formData, setFormData] = useState({
    id: user?.id || null,
    username: user?.username || '',
    fullName: user?.fullName || '',
    email: user?.email || '',
    role: user?.role || 'Developer',
    status: user?.status || 'Active',
    group: user?.group || 'Development'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSave(formData);
      setIsSubmitting(false);
    } catch (err) {
      setIsSubmitting(false);
      console.error("Error in form submission:", err);
    }
  };

  return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={onClose}></div>
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
              <button className="text-gray-500 hover:text-gray-700" onClick={onClose} disabled={isSubmitting}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
                <select
                    name="group"
                    value={formData.group}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Development">Development</option>
                  <option value="Operations">Operations</option>
                  <option value="Management">Management</option>
                  <option value="QA">QA</option>
                  <option value="Support">Support</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                >
                  <option value="Admin">Admin</option>
                  <option value="Developer">Developer</option>
                  <option value="ReadOnly">ReadOnly</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Locked">Locked</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
                    disabled={isSubmitting}
                >
                  {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        <span>Saving...</span>
                      </>
                  ) : (
                      <span>Save</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
  );
};

const DeleteModal = ({ user, onClose, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete();
      setIsDeleting(false);
    } catch (err) {
      setIsDeleting(false);
      console.error("Error deleting user:", err);
    }
  };

  return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={onClose}></div>
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-center text-gray-900 mb-4">Delete User</h3>
              <p className="text-sm text-gray-500 text-center">
                Are you sure you want to delete <span className="font-semibold">{user?.fullName}</span>? This action cannot be undone.
              </p>

              <div className="flex justify-center space-x-3 mt-6">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center"
                    disabled={isDeleting}
                >
                  {isDeleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        <span>Deleting...</span>
                      </>
                  ) : (
                      <span>Delete</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
  );
};

export default UsersPage;