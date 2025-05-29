import React, { useState, useEffect } from 'react';
import { GitBranch, Calendar, Play, Pause, Filter, Search, Plus, AlertTriangle, CheckCircle, Clock, MoreHorizontal, Edit, Trash2, X, ChevronDown, RotateCcw } from 'lucide-react';
import { migrationApi, repositoryApi } from '../services/svnService';
import { formatApiError } from '../utils/apiUtils';

const GitMigrationPage = () => {
  // State management
  const [migrations, setMigrations] = useState([]);
  const [filteredMigrations, setFilteredMigrations] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentMigration, setCurrentMigration] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    assignedTo: 'All',
    estimatedTime: 'All'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchMigrations();
    fetchRepositories();
  }, []);

  // Fetch migrations with optional filters
  const fetchMigrations = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await migrationApi.getAll({
        ...filterOptions,
        ...filters
      });
      console.log('API Response (migrations):', response);  // Debug logging
      const data = response.data || [];  // Extract data with fallback
      
      setMigrations(data);
      applyFiltersAndSearch(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching migrations:", err);
      setError("Failed to load Git migrations. Please try again later.");
      setLoading(false);
    }
  };

  // Fetch repositories for selection
  const fetchRepositories = async () => {
    try {
      const response = await repositoryApi.getAll();
      console.log('API Response (repositories):', response);  // Debug logging
      const data = response.data || [];  // Extract data with fallback
      
      setRepositories(data);
    } catch (err) {
      console.error("Error fetching repositories:", err);
      // Non-critical error - don't block the UI
    }
  };

  // Apply filters and search
  const applyFiltersAndSearch = (data = migrations) => {
    let result = [...data];
    
    // Apply tab filter
    switch (activeTab) {
      case 'completed':
        result = result.filter(m => m.status === 'Completed');
        break;
      case 'inProgress':
        result = result.filter(m => m.status === 'In Progress');
        break;
      case 'notStarted':
        result = result.filter(m => m.status === 'Not Started');
        break;
      case 'failed':
        result = result.filter(m => m.status === 'Failed');
        break;
      // 'all' tab - no filtering
      default:
        break;
    }
    
    // Apply filter options
    if (filterOptions.assignedTo !== 'All') {
      result = result.filter(m => m.assignedTo === filterOptions.assignedTo);
    }
    
    if (filterOptions.estimatedTime !== 'All') {
      switch (filterOptions.estimatedTime) {
        case 'Short (<2h)':
          result = result.filter(m => {
            const hours = parseFloat(m.estimatedTime);
            return !isNaN(hours) && hours < 2;
          });
          break;
        case 'Medium (2-5h)':
          result = result.filter(m => {
            const hours = parseFloat(m.estimatedTime);
            return !isNaN(hours) && hours >= 2 && hours <= 5;
          });
          break;
        case 'Long (>5h)':
          result = result.filter(m => {
            const hours = parseFloat(m.estimatedTime);
            return !isNaN(hours) && hours > 5;
          });
          break;
        default:
          break;
      }
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m => 
        (m.name && m.name.toLowerCase().includes(query)) || 
        (m.description && m.description.toLowerCase().includes(query)) ||
        (m.assignedTo && m.assignedTo.toLowerCase().includes(query))
      );
    }
    
    setFilteredMigrations(result);
  };

  // Apply filters when dependencies change
  useEffect(() => {
    applyFiltersAndSearch();
  }, [activeTab, filterOptions, searchQuery, migrations]);

  // Calculate summary numbers
  const calculateSummary = () => {
    const completed = migrations.filter(m => m.status === 'Completed').length;
    const inProgress = migrations.filter(m => m.status === 'In Progress').length;
    const notStarted = migrations.filter(m => m.status === 'Not Started').length;
    const failed = migrations.filter(m => m.status === 'Failed').length;
    
    const totalMigrations = migrations.length;
    const progressPercentage = totalMigrations > 0 
      ? Math.round((completed + inProgress * 0.5) / totalMigrations * 100) 
      : 0;
    
    return {
      completed,
      inProgress,
      notStarted,
      failed,
      totalMigrations,
      progressPercentage
    };
  };

  const summary = calculateSummary();

  // CRUD Operations
  const addMigration = async (migrationData, repositoryId = null) => {
    try {
      setLoading(true);
      
      const response = await migrationApi.create(migrationData, repositoryId);
      console.log('API Response (create migration):', response);  // Debug logging
      const newMigration = response.data || {};  // Extract data with fallback
      
      setMigrations([...migrations, newMigration]);
      applyFiltersAndSearch([...migrations, newMigration]);
      setShowAddModal(false);
      setLoading(false);
    } catch (err) {
      console.error("Error creating migration:", err);
      alert("Failed to create migration: " + formatApiError(err));
      setLoading(false);
    }
  };

  const updateMigration = async (id, migrationData) => {
    try {
      setLoading(true);
      
      const response = await migrationApi.update(id, migrationData);
      console.log('API Response (update migration):', response);  // Debug logging
      const updatedMigration = response.data || {};  // Extract data with fallback
      
      const updatedMigrations = migrations.map(m => m.id === id ? updatedMigration : m);
      setMigrations(updatedMigrations);
      applyFiltersAndSearch(updatedMigrations);
      setShowEditModal(false);
      setLoading(false);
    } catch (err) {
      console.error("Error updating migration:", err);
      alert("Failed to update migration: " + formatApiError(err));
      setLoading(false);
    }
  };

  const deleteMigration = async (id) => {
    try {
      setLoading(true);
      
      const response = await migrationApi.delete(id);
      console.log('API Response (delete migration):', response);  // Debug logging
      
      const updatedMigrations = migrations.filter(m => m.id !== id);
      setMigrations(updatedMigrations);
      applyFiltersAndSearch(updatedMigrations);
      setShowDeleteModal(false);
      setLoading(false);
    } catch (err) {
      console.error("Error deleting migration:", err);
      alert("Failed to delete migration: " + formatApiError(err));
      setLoading(false);
    }
  };

  const startMigration = async (id) => {
    try {
      setLoading(true);
      
      const response = await migrationApi.start(id);
      console.log('API Response (start migration):', response);  // Debug logging
      const updatedMigration = response.data || {};  // Extract data with fallback
      
      const updatedMigrations = migrations.map(m => m.id === id ? updatedMigration : m);
      setMigrations(updatedMigrations);
      applyFiltersAndSearch(updatedMigrations);
      setShowActionMenu(null);
      setLoading(false);
    } catch (err) {
      console.error("Error starting migration:", err);
      alert("Failed to start migration: " + formatApiError(err));
      setLoading(false);
    }
  };

  const pauseMigration = async (id) => {
    try {
      setLoading(true);
      
      const response = await migrationApi.pause(id);
      console.log('API Response (pause migration):', response);  // Debug logging
      const updatedMigration = response.data || {};  // Extract data with fallback
      
      const updatedMigrations = migrations.map(m => m.id === id ? updatedMigration : m);
      setMigrations(updatedMigrations);
      applyFiltersAndSearch(updatedMigrations);
      setShowActionMenu(null);
      setLoading(false);
    } catch (err) {
      console.error("Error pausing migration:", err);
      alert("Failed to pause migration: " + formatApiError(err));
      setLoading(false);
    }
  };

  const completeMigration = async (id) => {
    try {
      setLoading(true);
      
      const response = await migrationApi.complete(id);
      console.log('API Response (complete migration):', response);  // Debug logging
      const updatedMigration = response.data || {};  // Extract data with fallback
      
      const updatedMigrations = migrations.map(m => m.id === id ? updatedMigration : m);
      setMigrations(updatedMigrations);
      applyFiltersAndSearch(updatedMigrations);
      setShowActionMenu(null);
      setLoading(false);
    } catch (err) {
      console.error("Error completing migration:", err);
      alert("Failed to complete migration: " + formatApiError(err));
      setLoading(false);
    }
  };

  const retryMigration = async (id) => {
    try {
      setLoading(true);
      
      const response = await migrationApi.retry(id);
      console.log('API Response (retry migration):', response);  // Debug logging
      const updatedMigration = response.data || {};  // Extract data with fallback
      
      const updatedMigrations = migrations.map(m => m.id === id ? updatedMigration : m);
      setMigrations(updatedMigrations);
      applyFiltersAndSearch(updatedMigrations);
      setShowActionMenu(null);
      setLoading(false);
    } catch (err) {
      console.error("Error retrying migration:", err);
      alert("Failed to retry migration: " + formatApiError(err));
      setLoading(false);
    }
  };

  // Get unique assignees for filter dropdown
  const assignees = ['All', ...Array.from(new Set(migrations.map(m => m.assignedTo).filter(Boolean)))];

  // Render loading state
  if (loading && migrations.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-2xl font-bold text-gray-800">SVN to Git Migration</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error && migrations.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-2xl font-bold text-gray-800">SVN to Git Migration</h1>
        </div>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p>{error}</p>
          <button 
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={() => fetchMigrations()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-2xl font-bold text-gray-800">SVN to Git Migration</h1>
        
        {summary.failed > 0 && (
          <div className="flex items-center text-red-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>{summary.failed} {summary.failed === 1 ? 'repository' : 'repositories'} with migration issues</span>
          </div>
        )}
      </div>
      
      {/* Progress Overview and Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {/* Migration Progress */}
        <div className="md:col-span-3 bg-white p-6 rounded-md shadow">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Migration Progress</h2>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-6 mb-4">
            <div 
              className="bg-blue-500 h-6 rounded-full flex items-center justify-center"
              style={{ width: `${summary.progressPercentage}%` }}
            >
              <span className="text-xs font-medium text-white">{summary.progressPercentage}% Complete</span>
            </div>
          </div>
          
          {/* Status Summary */}
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-sm font-medium text-gray-500">Completed</div>
              <div className="text-lg font-semibold text-gray-800">{summary.completed}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">In Progress</div>
              <div className="text-lg font-semibold text-gray-800">{summary.inProgress}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Not Started</div>
              <div className="text-lg font-semibold text-gray-800">{summary.notStarted}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Failed</div>
              <div className="text-lg font-semibold text-red-600">{summary.failed}</div>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="bg-white p-6 rounded-md shadow">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Actions</h2>
          <div className="space-y-4">
            <button 
              className="w-full py-2 bg-blue-500 text-white rounded-md flex items-center justify-center hover:bg-blue-600"
              onClick={() => {
                setCurrentMigration(null);
                setShowAddModal(true);
              }}
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>Add Migration</span>
            </button>
            <button 
              className="w-full py-2 border border-blue-500 text-blue-500 rounded-md flex items-center justify-center hover:bg-blue-50"
              disabled={loading}
            >
              <Calendar className="h-4 w-4 mr-2" />
              <span>Schedule Batch</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Tabs, Search, and Filter */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="flex overflow-x-auto">
          <TabButton label="All Repos" active={activeTab === 'all'} onClick={() => setActiveTab('all')} count={migrations.length} />
          <TabButton label="Completed" active={activeTab === 'completed'} onClick={() => setActiveTab('completed')} count={summary.completed} />
          <TabButton label="In Progress" active={activeTab === 'inProgress'} onClick={() => setActiveTab('inProgress')} count={summary.inProgress} />
          <TabButton label="Not Started" active={activeTab === 'notStarted'} onClick={() => setActiveTab('notStarted')} count={summary.notStarted} />
          <TabButton label="Failed" active={activeTab === 'failed'} onClick={() => setActiveTab('failed')} count={summary.failed} />
        </div>
        
        <div className="flex gap-2">
          {/* Filter Button */}
          <div className="relative">
            <button 
              className="px-4 py-2 rounded-md border border-gray-300 flex items-center"
              onClick={() => setShowFilters(!showFilters)}
              disabled={loading}
            >
              <Filter className="h-5 w-5 mr-2 text-gray-700" />
              <span>Filter</span>
              <ChevronDown className="h-4 w-4 ml-2 text-gray-700" />
            </button>
            
            {/* Filter Dropdown */}
            {showFilters && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="p-4">
                  <h3 className="font-medium text-sm text-gray-700 mb-2">Assigned To</h3>
                  <div className="space-y-1 mb-4">
                    {assignees.map(assignee => (
                      <div key={assignee} className="flex items-center">
                        <input
                          type="radio"
                          id={`assignee-${assignee}`}
                          name="assignedTo"
                          checked={filterOptions.assignedTo === assignee}
                          onChange={() => setFilterOptions({...filterOptions, assignedTo: assignee})}
                          className="h-4 w-4 text-blue-600"
                        />
                        <label htmlFor={`assignee-${assignee}`} className="ml-2 text-sm text-gray-700">{assignee}</label>
                      </div>
                    ))}
                  </div>
                  
                  <h3 className="font-medium text-sm text-gray-700 mb-2">Estimated Time</h3>
                  <div className="space-y-1 mb-4">
                    {['All', 'Short (<2h)', 'Medium (2-5h)', 'Long (>5h)'].map(time => (
                      <div key={time} className="flex items-center">
                        <input
                          type="radio"
                          id={`time-${time}`}
                          name="estimatedTime"
                          checked={filterOptions.estimatedTime === time}
                          onChange={() => setFilterOptions({...filterOptions, estimatedTime: time})}
                          className="h-4 w-4 text-blue-600"
                        />
                        <label htmlFor={`time-${time}`} className="ml-2 text-sm text-gray-700">{time}</label>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between">
                    <button 
                      className="text-sm text-gray-500 hover:text-gray-700"
                      onClick={() => setFilterOptions({assignedTo: 'All', estimatedTime: 'All'})}
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
          
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search repositories..."
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              disabled={loading}
            />
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>
      
      {/* Migration Table */}
      <div className="bg-white rounded-md shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Repository</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Progress</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Started</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Completed</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Assigned To</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && migrations.length > 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                </td>
              </tr>
            ) : filteredMigrations.length > 0 ? (
              filteredMigrations.map(migration => (
                <tr key={migration.id}>
                  {/* Repository */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full ${migration.colorCode || 'bg-gray-400'} flex items-center justify-center mr-3`}>
                        <span className="text-white text-xs">{migration.name?.charAt(0).toUpperCase() || 'M'}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">{migration.name}</div>
                        <div className="text-xs text-gray-500">Size: {migration.size}</div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <MigrationStatusBadge status={migration.status} />
                  </td>
                  
                  {/* Progress */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className={`${migration.status === 'Failed' ? 'bg-red-500' : 'bg-blue-500'} h-2 rounded-full`}
                          style={{ width: `${migration.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">{migration.progress}%</span>
                    </div>
                  </td>
                  
                  {/* Started Date */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {migration.startedDate || '--'}
                  </td>
                  
                  {/* Completed Date */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {migration.completedDate || '--'}
                  </td>
                  
                  {/* Assigned To */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {migration.assignedTo}
                  </td>
                  
                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="relative">
                      <button 
                        className="p-2 rounded-md hover:bg-gray-100"
                        onClick={() => setShowActionMenu(showActionMenu === migration.id ? null : migration.id)}
                        disabled={loading}
                      >
                        <MoreHorizontal className="h-5 w-5 text-gray-500" />
                      </button>
                      
                      {/* Action Menu */}
                      {showActionMenu === migration.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                          <div className="py-1">
                            {/* Edit option */}
                            <button
                              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center"
                              onClick={() => {
                                setCurrentMigration(migration);
                                setShowEditModal(true);
                                setShowActionMenu(null);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2 text-gray-500" />
                              Edit Migration
                            </button>
                            
                            {/* Status-specific actions */}
                            {migration.status === 'Not Started' && (
                              <button
                                className="px-4 py-2 text-sm text-green-600 hover:bg-gray-100 w-full text-left flex items-center"
                                onClick={() => startMigration(migration.id)}
                              >
                                <Play className="h-4 w-4 mr-2 text-green-500" />
                                Start Migration
                              </button>
                            )}
                            
                            {migration.status === 'In Progress' && (
                              <>
                                <button
                                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 w-full text-left flex items-center"
                                  onClick={() => pauseMigration(migration.id)}
                                >
                                  <Pause className="h-4 w-4 mr-2 text-gray-500" />
                                  Pause Migration
                                </button>
                                <button
                                  className="px-4 py-2 text-sm text-teal-600 hover:bg-gray-100 w-full text-left flex items-center"
                                  onClick={() => completeMigration(migration.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2 text-teal-500" />
                                  Mark as Completed
                                </button>
                              </>
                            )}
                            
                            {migration.status === 'Failed' && (
                              <button
                                className="px-4 py-2 text-sm text-amber-600 hover:bg-gray-100 w-full text-left flex items-center"
                                onClick={() => retryMigration(migration.id)}
                              >
                                <RotateCcw className="h-4 w-4 mr-2 text-amber-500" />
                                Retry Migration
                              </button>
                            )}
                            
                            {/* Delete option */}
                            <button
                              className="px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left flex items-center"
                              onClick={() => {
                                setCurrentMigration(migration);
                                setShowDeleteModal(true);
                                setShowActionMenu(null);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                              Delete Migration
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
                  No migrations found matching your criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Add Migration Modal */}
      {showAddModal && (
        <MigrationModal
          onClose={() => setShowAddModal(false)}
          onSave={addMigration}
          title="Add New Migration"
          repositories={repositories}
        />
      )}
      
      {/* Edit Migration Modal */}
      {showEditModal && (
        <MigrationModal
          migration={currentMigration}
          onClose={() => setShowEditModal(false)}
          onSave={(migrationData) => updateMigration(currentMigration.id, migrationData)}
          title="Edit Migration"
          repositories={repositories}
        />
      )}
      
      {/* Delete Migration Modal */}
      {showDeleteModal && (
        <DeleteModal
          migration={currentMigration}
          onClose={() => setShowDeleteModal(false)}
          onDelete={() => deleteMigration(currentMigration.id)}
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

const TabButton = ({ label, active, onClick, count }) => {
  return (
    <button
      className={`px-4 py-2 text-sm font-medium rounded-md mr-2 ${
        active 
          ? 'bg-blue-500 text-white' 
          : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
          {count}
        </span>
      )}
    </button>
  );
};

const MigrationStatusBadge = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'Completed':
        return { 
          classes: 'bg-teal-100 text-teal-800',
          icon: <CheckCircle className="h-4 w-4 mr-1" />
        };
      case 'In Progress':
        return { 
          classes: 'bg-blue-100 text-blue-800',
          icon: <Clock className="h-4 w-4 mr-1" />
        };
      case 'Not Started':
        return { 
          classes: 'bg-orange-100 text-orange-800',
          icon: <GitBranch className="h-4 w-4 mr-1" />
        };
      case 'Failed':
        return { 
          classes: 'bg-red-100 text-red-800',
          icon: <AlertTriangle className="h-4 w-4 mr-1" />
        };
      default:
        return { 
          classes: 'bg-gray-100 text-gray-800',
          icon: null
        };
    }
  };
  
  const { classes, icon } = getStatusConfig();
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${classes}`}>
      {icon}
      {status}
    </span>
  );
};

const MigrationModal = ({ migration = null, onClose, onSave, title, repositories = [] }) => {
  const [formData, setFormData] = useState({
    id: migration?.id || null,
    name: migration?.name || '',
    description: migration?.description || '',
    size: migration?.size || '0 MB',
    status: migration?.status || 'Not Started',
    progress: migration?.progress || 0,
    startedDate: migration?.startedDate || null,
    completedDate: migration?.completedDate || null,
    estimatedTime: migration?.estimatedTime || '0 hours',
    assignedTo: migration?.assignedTo || '',
    colorCode: migration?.colorCode || '',
    repositoryId: migration?.repository?.id || null
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Update progress if status changes
    if (name === 'status') {
      let progress = formData.progress;
      if (value === 'Completed') progress = 100;
      else if (value === 'Not Started') progress = 0;
      setFormData(prev => ({...prev, [name]: value, progress}));
    } else {
      setFormData(prev => ({...prev, [name]: value}));
    }
  };
  
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSave(formData, formData.repositoryId);
      setIsSubmitting(false);
    } catch (err) {
      setIsSubmitting(false);
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Repository Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
              <input
                type="text"
                name="size"
                value={formData.size}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              />
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
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
            
            {formData.status === 'In Progress' || formData.status === 'Failed' ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Progress ({formData.progress}%)
                </label>
                <input
                  type="range"
                  name="progress"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={handleChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  disabled={isSubmitting}
                />
              </div>
            ) : null}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Time</label>
              <input
                type="text"
                name="estimatedTime"
                value={formData.estimatedTime}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 2 hours"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
              <input
                type="text"
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Associated Repository</label>
              <select
                name="repositoryId"
                value={formData.repositoryId || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="">None</option>
                {repositories.map(repo => (
                  <option key={repo.id} value={repo.id}>{repo.name}</option>
                ))}
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

const DeleteModal = ({ migration, onClose, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete();
      setIsDeleting(false);
    } catch (err) {
      setIsDeleting(false);
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
            <h3 className="text-lg font-medium text-center text-gray-900 mb-4">Delete Migration</h3>
            <p className="text-sm text-gray-500 text-center">
              Are you sure you want to delete the migration for <span className="font-semibold">{migration?.name}</span>? This action cannot be undone.
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

export default GitMigrationPage;