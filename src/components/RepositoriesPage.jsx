import React, { useState, useEffect } from 'react';
import { Database, Filter, Plus, MoreHorizontal, Search, Pause, Check, AlertTriangle, Edit, Trash2, X, ChevronDown, PlayCircle, Archive, Users } from 'lucide-react';
import { repositoryApi, userApi } from '../services/svnService';
import { formatApiError } from '../utils/apiUtils';

const RepositoriesPage = () => {
  // State management
  const [repositories, setRepositories] = useState([]);
  const [filteredRepositories, setFilteredRepositories] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [currentRepo, setCurrentRepo] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    backupStatus: 'All',
    migrationStatus: 'All',
    member: 'All'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const reposPerPage = 5;

  // Fetch data on component mount
  useEffect(() => {
    fetchRepositories();
    fetchUsers();
  }, []);

  // Fetch repositories from API
  const fetchRepositories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get response from API
      const response = await repositoryApi.getAll();
      
      // Debug log to see response structure
      console.log('Repositories API response:', response);
      
      // Extract data from response
      const data = response.data || [];
      
      setRepositories(data);
      
      // Apply filters immediately
      applyFiltersAndSearch(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching repositories:", err);
      setError(formatApiError(err) || "Failed to load repositories. Please try again later.");
      setLoading(false);
    }
  };

  // Fetch users for member assignment
  const fetchUsers = async () => {
    try {
      // Get response from API
      const response = await userApi.getAll();
      
      // Extract data from response
      const data = response.data || [];
      
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      // Non-blocking error, don't stop the page from loading
    }
  };

  // Apply filters and search to repositories
  const applyFiltersAndSearch = (repos = repositories) => {
    let result = [...repos];
    
    // Apply tab filter
    switch (activeTab) {
      case 'active':
        result = result.filter(repo => repo.migrationStatus !== 'Archived' && repo.migrationStatus !== 'Completed');
        break;
      case 'migrated':
        result = result.filter(repo => repo.migrationStatus === 'Completed');
        break;
      case 'archived':
        result = result.filter(repo => repo.migrationStatus === 'Archived');
        break;
      default:
        // 'all' tab - no filtering
        break;
    }
    
    // Apply backup status filter
    if (filterOptions.backupStatus !== 'All') {
      result = result.filter(repo => repo.backupStatus === filterOptions.backupStatus);
    }
    
    // Apply migration status filter
    if (filterOptions.migrationStatus !== 'All') {
      result = result.filter(repo => repo.migrationStatus === filterOptions.migrationStatus);
    }
    
    // Apply team member filter
    if (filterOptions.member !== 'All') {
      result = result.filter(repo => {
        if (!repo.members) return false;
        return repo.members.some(member => {
          if (typeof member === 'object') {
            return member.username === filterOptions.member || member.fullName === filterOptions.member;
          }
          return member === filterOptions.member;
        });
      });
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(repo => 
        repo.name.toLowerCase().includes(query) || 
        repo.description.toLowerCase().includes(query) ||
        (repo.lastCommitBy && repo.lastCommitBy.toLowerCase().includes(query)) ||
        (repo.members && repo.members.some(member => {
          if (typeof member === 'object') {
            return member.username.toLowerCase().includes(query) || 
                   member.fullName.toLowerCase().includes(query);
          }
          return member.toLowerCase().includes(query);
        }))
      );
    }
    
    setFilteredRepositories(result);
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Update filters when tab changes
  useEffect(() => {
    applyFiltersAndSearch();
  }, [activeTab, filterOptions, searchQuery]);

  // Get current repositories for pagination
  const indexOfLastRepo = currentPage * reposPerPage;
  const indexOfFirstRepo = indexOfLastRepo - reposPerPage;
  const currentRepositories = filteredRepositories.slice(indexOfFirstRepo, indexOfLastRepo);
  const totalPages = Math.ceil(filteredRepositories.length / reposPerPage);

  // Get unique team members for filter dropdown
  const uniqueMembers = ['All'];
  repositories.forEach(repo => {
    if (repo.members) {
      repo.members.forEach(member => {
        const memberName = typeof member === 'object' ? member.username : member;
        if (!uniqueMembers.includes(memberName)) {
          uniqueMembers.push(memberName);
        }
      });
    }
  });

  // CRUD Operations
  const addRepository = async (repo, memberIds) => {
    try {
      setActionLoading(true);
      
      // Get response from API
      const response = await repositoryApi.create(repo, memberIds);
      
      // Extract data from response
      const createdRepo = response.data;
      
      setRepositories([createdRepo, ...repositories]);
      applyFiltersAndSearch([createdRepo, ...repositories]);
      setShowAddModal(false);
      setActionLoading(false);
    } catch (err) {
      console.error("Error creating repository:", err);
      alert(formatApiError(err) || "Failed to create repository. Please try again.");
      setActionLoading(false);
    }
  };

  const updateRepository = async (id, repoData, memberIds) => {
    try {
      setActionLoading(true);
      
      // Get response from API
      const response = await repositoryApi.update(id, repoData, memberIds);
      
      // Extract data from response
      const updatedRepo = response.data;
      
      const updatedRepos = repositories.map(r => r.id === id ? updatedRepo : r);
      setRepositories(updatedRepos);
      applyFiltersAndSearch(updatedRepos);
      setShowEditModal(false);
      setActionLoading(false);
    } catch (err) {
      console.error("Error updating repository:", err);
      alert(formatApiError(err) || "Failed to update repository. Please try again.");
      setActionLoading(false);
    }
  };

  const deleteRepository = async (id) => {
    try {
      setActionLoading(true);
      await repositoryApi.delete(id);
      const updatedRepos = repositories.filter(repo => repo.id !== id);
      setRepositories(updatedRepos);
      applyFiltersAndSearch(updatedRepos);
      setShowDeleteModal(false);
      setActionLoading(false);
    } catch (err) {
      console.error("Error deleting repository:", err);
      alert(formatApiError(err) || "Failed to delete repository. Please try again.");
      setActionLoading(false);
    }
  };

  const updateRepositoryMembers = async (id, memberIds) => {
    try {
      setActionLoading(true);
      
      // Get response from API
      const response = await repositoryApi.updateMembers(id, memberIds);
      
      // Extract data from response
      const updatedRepo = response.data;
      
      const updatedRepos = repositories.map(r => r.id === id ? updatedRepo : r);
      setRepositories(updatedRepos);
      applyFiltersAndSearch(updatedRepos);
      setShowMembersModal(false);
      setActionLoading(false);
    } catch (err) {
      console.error("Error updating repository members:", err);
      alert(formatApiError(err) || "Failed to update members. Please try again.");
      setActionLoading(false);
    }
  };

  const startMigration = async (id) => {
    try {
      setActionLoading(true);
      
      // Get response from API
      const response = await repositoryApi.updateMigrationStatus(id, "In Progress", 1);
      
      // Extract data from response
      const updatedRepo = response.data;
      
      const updatedRepos = repositories.map(r => r.id === id ? updatedRepo : r);
      setRepositories(updatedRepos);
      applyFiltersAndSearch(updatedRepos);
      setShowActionMenu(null);
      setActionLoading(false);
    } catch (err) {
      console.error("Error starting migration:", err);
      alert(formatApiError(err) || "Failed to start migration. Please try again.");
      setActionLoading(false);
    }
  };

  const archiveRepository = async (id) => {
    try {
      setActionLoading(true);
      
      // Get response from API
      const response = await repositoryApi.updateMigrationStatus(id, "Archived");
      
      // Extract data from response
      const updatedRepo = response.data;
      
      const updatedRepos = repositories.map(r => r.id === id ? updatedRepo : r);
      setRepositories(updatedRepos);
      applyFiltersAndSearch(updatedRepos);
      setShowActionMenu(null);
      setActionLoading(false);
    } catch (err) {
      console.error("Error archiving repository:", err);
      alert(formatApiError(err) || "Failed to archive repository. Please try again.");
      setActionLoading(false);
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

  // Render loading state
  if (loading && repositories.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Repository Management</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Repository Management</h1>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <button 
                className="mt-2 px-3 py-1 text-xs text-red-600 hover:text-red-800"
                onClick={fetchRepositories}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search repositories..."
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
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="p-4">
                  <h3 className="font-medium text-sm text-gray-700 mb-2">Backup Status</h3>
                  <div className="space-y-1 mb-4">
                    {['All', 'Complete', 'In Progress', 'Failed'].map(status => (
                      <div key={status} className="flex items-center">
                        <input
                          type="radio"
                          id={`backup-${status}`}
                          name="backupStatus"
                          checked={filterOptions.backupStatus === status}
                          onChange={() => setFilterOptions({...filterOptions, backupStatus: status})}
                          className="h-4 w-4 text-blue-600"
                        />
                        <label htmlFor={`backup-${status}`} className="ml-2 text-sm text-gray-700">{status}</label>
                      </div>
                    ))}
                  </div>
                  
                  <h3 className="font-medium text-sm text-gray-700 mb-2">Migration Status</h3>
                  <div className="space-y-1 mb-4">
                    {['All', 'Completed', 'In Progress', 'Not Started', 'Archived'].map(status => (
                      <div key={status} className="flex items-center">
                        <input
                          type="radio"
                          id={`migration-${status}`}
                          name="migrationStatus"
                          checked={filterOptions.migrationStatus === status}
                          onChange={() => setFilterOptions({...filterOptions, migrationStatus: status})}
                          className="h-4 w-4 text-blue-600"
                        />
                        <label htmlFor={`migration-${status}`} className="ml-2 text-sm text-gray-700">{status}</label>
                      </div>
                    ))}
                  </div>
                  
                  <h3 className="font-medium text-sm text-gray-700 mb-2">Team Member</h3>
                  <div className="space-y-1 mb-4 max-h-40 overflow-y-auto">
                    {uniqueMembers.map(member => (
                      <div key={member} className="flex items-center">
                        <input
                          type="radio"
                          id={`member-${member}`}
                          name="member"
                          checked={filterOptions.member === member}
                          onChange={() => setFilterOptions({...filterOptions, member})}
                          className="h-4 w-4 text-blue-600"
                        />
                        <label htmlFor={`member-${member}`} className="ml-2 text-sm text-gray-700">{member}</label>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between">
                    <button 
                      className="text-sm text-gray-500 hover:text-gray-700"
                      onClick={() => setFilterOptions({backupStatus: 'All', migrationStatus: 'All', member: 'All'})}
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
          
          {/* Add Repository Button */}
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded-md flex items-center hover:bg-blue-600"
            onClick={() => {
              setCurrentRepo(null);
              setShowAddModal(true);
            }}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 mr-2" />
                <span>Add Repository</span>
              </>
            )}
          </button>
          
          {/* Stats */}
          <div className="px-4 py-2 border border-gray-300 rounded-md">
            <div className="text-xs text-gray-500">Total Repos</div>
            <div className="text-base font-semibold text-gray-800">{filteredRepositories.length}</div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex mb-6 border-b border-gray-200">
        <TabButton label="All" active={activeTab === 'all'} onClick={() => setActiveTab('all')} />
        <TabButton label="Active" active={activeTab === 'active'} onClick={() => setActiveTab('active')} />
        <TabButton label="Migrated" active={activeTab === 'migrated'} onClick={() => setActiveTab('migrated')} />
        <TabButton label="Archived" active={activeTab === 'archived'} onClick={() => setActiveTab('archived')} />
      </div>
      
      {/* Repositories Table */}
      <div className="bg-white rounded-md shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {/* Table Header */}
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Repository Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Size</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Last Commit</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Project Members</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Backup Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Migration</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          
          {/* Table Body */}
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && repositories.length > 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                </td>
              </tr>
            ) : currentRepositories.length > 0 ? (
              currentRepositories.map(repo => (
                <tr key={repo.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full ${repo.colorCode || 'bg-gray-300'} flex items-center justify-center mr-3`}>
                        <span className="text-white text-xs">{repo.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">{repo.name}</div>
                        <div className="text-xs text-gray-500">Created: {repo.createdDate || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{repo.size || '0 KB'}</td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-800">{repo.lastCommit ? new Date(repo.lastCommit).toLocaleString() : 'Never'}</div>
                    <div className="text-xs text-gray-500">by {repo.lastCommitBy || 'Unknown'}</div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <MembersDisplay 
                      members={repo.members || []} 
                      onClick={() => {
                        setCurrentRepo(repo);
                        setShowMembersModal(true);
                      }} 
                    />
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <BackupStatusBadge status={repo.backupStatus || 'Not Started'} />
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <MigrationStatusBadge 
                      status={repo.migrationStatus || 'Not Started'} 
                      progress={repo.migrationProgress || 0} 
                    />
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="relative">
                      <button 
                        className="p-2 rounded-md hover:bg-gray-100"
                        onClick={() => setShowActionMenu(showActionMenu === repo.id ? null : repo.id)}
                        disabled={actionLoading}
                      >
                        <MoreHorizontal className="h-5 w-5 text-gray-500" />
                      </button>
                      
                      {/* Action Menu */}
                      {showActionMenu === repo.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                          <div className="py-1">
                            <button
                              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center"
                              onClick={() => {
                                setCurrentRepo(repo);
                                setShowEditModal(true);
                                setShowActionMenu(null);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2 text-gray-500" />
                              Edit Repository
                            </button>
                            
                            <button
                              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center"
                              onClick={() => {
                                setCurrentRepo(repo);
                                setShowMembersModal(true);
                                setShowActionMenu(null);
                              }}
                            >
                              <Users className="h-4 w-4 mr-2 text-gray-500" />
                              Manage Members
                            </button>
                            
                            {repo.migrationStatus === 'Not Started' && (
                              <button
                                className="px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 w-full text-left flex items-center"
                                onClick={() => startMigration(repo.id)}
                                disabled={actionLoading}
                              >
                                <PlayCircle className="h-4 w-4 mr-2 text-blue-500" />
                                Start Migration
                              </button>
                            )}
                            
                            {repo.migrationStatus !== 'Archived' && (
                              <button
                                className="px-4 py-2 text-sm text-amber-600 hover:bg-gray-100 w-full text-left flex items-center"
                                onClick={() => archiveRepository(repo.id)}
                                disabled={actionLoading}
                              >
                                <Archive className="h-4 w-4 mr-2 text-amber-500" />
                                Archive
                              </button>
                            )}
                            
                            <button
                              className="px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left flex items-center"
                              onClick={() => {
                                setCurrentRepo(repo);
                                setShowDeleteModal(true);
                                setShowActionMenu(null);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                              Delete Repository
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
                  No repositories found matching your criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {filteredRepositories.length > 0 && (
        <div className="bg-white rounded-md shadow p-4 mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {indexOfFirstRepo + 1}-{Math.min(indexOfLastRepo, filteredRepositories.length)} of {filteredRepositories.length} repositories
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
      
      {/* Add Repository Modal */}
      {showAddModal && (
        <RepositoryModal
          onClose={() => setShowAddModal(false)}
          onSave={addRepository}
          title="Add New Repository"
          availableUsers={users}
          isLoading={actionLoading}
        />
      )}
      
      {/* Edit Repository Modal */}
      {showEditModal && (
        <RepositoryModal
          repo={currentRepo}
          onClose={() => setShowEditModal(false)}
          onSave={(repoData, memberIds) => updateRepository(currentRepo.id, repoData, memberIds)}
          title="Edit Repository"
          availableUsers={users}
          isLoading={actionLoading}
        />
      )}
      
      {/* Manage Members Modal */}
      {showMembersModal && (
        <MembersModal
          repo={currentRepo}
          onClose={() => setShowMembersModal(false)}
          onSave={(memberIds) => updateRepositoryMembers(currentRepo.id, memberIds)}
          availableUsers={users}
          isLoading={actionLoading}
        />
      )}
      
      {/* Delete Repository Modal */}
      {showDeleteModal && (
        <DeleteModal
          repo={currentRepo}
          onClose={() => setShowDeleteModal(false)}
          onDelete={() => deleteRepository(currentRepo.id)}
          isLoading={actionLoading}
        />
      )}
      
      {/* Backdrop for modals and dropdowns */}
      {(showActionMenu || showFilters) && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => {
            setShowActionMenu(null);
            setShowFilters(false);
          }}
        ></div>
      )}
    </div>
  );
};

// Component for displaying repository members
const MembersDisplay = ({ members, onClick }) => {
  // Only display the first 2 members, then show a +X more indicator
  const displayCount = 2;
  let displayMembers = [];
  let additionalCount = 0;
  
  if (Array.isArray(members)) {
    if (members.length <= displayCount) {
      displayMembers = members;
    } else {
      displayMembers = members.slice(0, displayCount);
      additionalCount = members.length - displayCount;
    }
  }
  
  // Format member names based on object or string
  const formatMember = (member) => {
    if (typeof member === 'object') {
      return member.fullName || member.username;
    }
    return member;
  };
  
  return (
    <div 
      className="flex items-center cursor-pointer hover:text-blue-600" 
      onClick={onClick}
      title="Click to manage members"
    >
      <Users className="h-4 w-4 mr-1 text-gray-500" />
      <div>
        <div className="text-sm text-gray-800">
          {displayMembers.map(formatMember).join(', ')}
          {additionalCount > 0 && <span> +{additionalCount} more</span>}
        </div>
        <div className="text-xs text-gray-500">{members.length || 0} team member{members.length !== 1 ? 's' : ''}</div>
      </div>
    </div>
  );
};

// Tab button component
const TabButton = ({ label, active, onClick }) => {
  return (
    <button
      className={`px-4 py-2 text-sm font-medium border-b-2 ${
        active 
          ? 'border-blue-500 text-blue-600' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

// Backup status badge
const BackupStatusBadge = ({ status }) => {
  const getStatusClasses = () => {
    switch (status) {
      case 'Complete':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusIcon = () => {
    switch (status) {
      case 'Complete':
        return <Check className="h-4 w-4 mr-1" />;
      case 'In Progress':
        return <Pause className="h-4 w-4 mr-1" />;
      case 'Failed':
        return <AlertTriangle className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClasses()}`}>
      {getStatusIcon()}
      {status}
    </span>
  );
};

// Migration status badge with progress bar
const MigrationStatusBadge = ({ status, progress }) => {
  const getStatusClasses = () => {
    switch (status) {
      case 'Completed':
        return 'bg-teal-100 text-teal-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Not Started':
        return 'bg-amber-100 text-amber-800';
      case 'Archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // For In Progress status, show progress
  if (status === 'In Progress') {
    return (
      <div>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClasses()}`}>
          {status}
        </span>
        <div className="mt-1 flex items-center">
          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
            <div 
              className="bg-blue-500 h-2 rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="text-xs text-gray-500">{progress}%</span>
        </div>
      </div>
    );
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClasses()}`}>
      {status}
    </span>
  );
};

// Pagination button component
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

// Repository modal for adding/editing
const RepositoryModal = ({ repo = null, onClose, onSave, title, availableUsers = [], isLoading = false }) => {
  const [formData, setFormData] = useState({
    id: repo?.id || null,
    name: repo?.name || '',
    description: repo?.description || '',
    size: repo?.size || '0 MB',
    backupStatus: repo?.backupStatus || 'Complete',
    migrationStatus: repo?.migrationStatus || 'Not Started',
    migrationProgress: repo?.migrationProgress || 0,
    colorCode: repo?.colorCode || '',
  });
  
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  
  // Set initial selected members
  useEffect(() => {
    if (repo && repo.members) {
      const memberIds = repo.members
        .filter(member => typeof member === 'object' && member.id)
        .map(member => member.id);
      setSelectedMemberIds(memberIds);
    }
  }, [repo]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };
  
  const handleSubmit = () => {
    onSave(formData, selectedMemberIds);
  };
  
  const handleMemberChange = (e) => {
    const options = e.target.options;
    const selectedValues = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(Number(options[i].value));
      }
    }
    setSelectedMemberIds(selectedValues);
  };
  
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={onClose}></div>
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            <button className="text-gray-500 hover:text-gray-700" onClick={onClose} disabled={isLoading}>
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Repository Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Size (Optional)</label>
              <input
                type="text"
                name="size"
                value={formData.size}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Backup Status</label>
              <select
                name="backupStatus"
                value={formData.backupStatus}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="Complete">Complete</option>
                <option value="In Progress">In Progress</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Migration Status</label>
              <select
                name="migrationStatus"
                value={formData.migrationStatus}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
            
            {formData.migrationStatus === 'In Progress' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Migration Progress ({formData.migrationProgress}%)
                </label>
                <input
                  type="range"
                  name="migrationProgress"
                  min="0"
                  max="100"
                  value={formData.migrationProgress}
                  onChange={handleChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  disabled={isLoading}
                />
              </div>
            )}
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Project Members</label>
                <span className="text-xs text-gray-500">
                  {selectedMemberIds.length} selected
                </span>
              </div>
              <select
                multiple
                value={selectedMemberIds}
                onChange={handleMemberChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                disabled={isLoading}
              >
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.fullName} ({user.username})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple members</p>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
                disabled={isLoading}
              >
                {isLoading ? (
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

// Members management modal
const MembersModal = ({ repo, onClose, onSave, availableUsers = [], isLoading = false }) => {
  // Get current selected members from repo
  const getCurrentMemberIds = () => {
    if (!repo || !repo.members) return [];
    return repo.members
      .filter(member => typeof member === 'object' && member.id)
      .map(member => member.id);
  };
  
  const [selectedMembers, setSelectedMembers] = useState(getCurrentMemberIds());
  
  const toggleMember = (memberId) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };
  
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={onClose}></div>
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Manage Project Members - {repo.name}
            </h2>
            <button className="text-gray-500 hover:text-gray-700" onClick={onClose} disabled={isLoading}>
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Team Members</label>
              <div className="border border-gray-300 rounded-md h-64 overflow-y-auto p-2">
                {availableUsers.map(user => (
                  <div 
                    key={user.id} 
                    className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => toggleMember(user.id)}
                  >
                    <input
                      type="checkbox"
                      id={`member-${user.id}`}
                      checked={selectedMembers.includes(user.id)}
                      onChange={() => {}}
                      className="h-4 w-4 text-blue-600 rounded"
                      disabled={isLoading}
                    />
                    <label htmlFor={`member-${user.id}`} className="ml-2 text-sm text-gray-700 cursor-pointer">
                      {user.fullName} ({user.username})
                    </label>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {selectedMembers.length} of {availableUsers.length} members selected
                </span>
                <button
                  className="text-xs text-blue-500 hover:text-blue-700"
                  onClick={() => {
                    if (selectedMembers.length === availableUsers.length) {
                      setSelectedMembers([]);
                    } else {
                      setSelectedMembers(availableUsers.map(user => user.id));
                    }
                  }}
                  disabled={isLoading}
                >
                  {selectedMembers.length === availableUsers.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>
            
            <div className="mt-2">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Members</h3>
              <div className="flex flex-wrap gap-2">
                {selectedMembers.length > 0 ? (
                  selectedMembers.map(memberId => {
                    const user = availableUsers.find(u => u.id === memberId);
                    return user ? (
                      <div key={memberId} className="flex items-center bg-blue-50 px-2 py-1 rounded">
                        <span className="text-sm text-blue-700">{user.fullName}</span>
                        <button 
                          className="ml-1 text-blue-400 hover:text-blue-600"
                          onClick={() => toggleMember(memberId)}
                          disabled={isLoading}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : null;
                  })
                ) : (
                  <span className="text-sm text-gray-500">No members selected</span>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onSave(selectedMembers)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
                disabled={isLoading}
              >
                {isLoading ? (
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

// Delete confirmation modal
const DeleteModal = ({ repo, onClose, onDelete, isLoading = false }) => {
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={onClose}></div>
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-center text-gray-900 mb-4">Delete Repository</h3>
            <p className="text-sm text-gray-500 text-center">
              Are you sure you want to delete <span className="font-semibold">{repo?.name}</span>? This action cannot be undone.
            </p>
            <p className="text-sm text-gray-500 text-center mt-2">
              This will remove the repository and its {repo?.members?.length || 0} team member{repo?.members?.length !== 1 ? 's' : ''} from the system.
            </p>
            
            <div className="flex justify-center space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center"
                disabled={isLoading}
              >
                {isLoading ? (
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

export default RepositoriesPage;