import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Download, Check, X, MoreHorizontal, PieChart, RefreshCw, AlertTriangle, Trash2, Edit, Plus, ChevronDown, FileText, Archive, Settings, Filter, Repeat, Search } from 'lucide-react';
import { backupApi, scheduleApi, repositoryApi } from '../services/svnService';
import { formatApiError } from '../utils/apiUtils';

const BackupPage = () => {
  // State for backup history
  const [backups, setBackups] = useState([]);
  const [filteredBackups, setFilteredBackups] = useState([]);
  
  // State for backup schedules
  const [schedules, setSchedules] = useState([]);
  
  // State for repositories (for selection in modals)
  const [repositories, setRepositories] = useState([]);
  
  // UI state
  const [activeTab, setActiveTab] = useState('history');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddBackupModal, setShowAddBackupModal] = useState(false);
  const [showViewBackupModal, setShowViewBackupModal] = useState(false);
  const [showDeleteBackupModal, setShowDeleteBackupModal] = useState(false);
  const [currentBackup, setCurrentBackup] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    type: 'All',
    status: 'All',
    dateRange: 'All'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [showDeleteScheduleModal, setShowDeleteScheduleModal] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState(null);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  
  // Statistics
  const [backupStats, setBackupStats] = useState({
    totalBackups: 0,
    completedBackups: 0,
    failedBackups: 0,
    inProgressBackups: 0,
    totalStorageGB: 0,
    lastFullBackupDate: 'None'
  });
  
  const backupsPerPage = 5;

  // Fetch data based on active tab
  useEffect(() => {
    if (activeTab === 'history') {
      fetchBackups();
      fetchBackupStatistics();
    } else if (activeTab === 'schedule') {
      fetchSchedules();
    }
    
    // Fetch repositories for dropdowns regardless of tab
    fetchRepositories();
  }, [activeTab]);

  // Fetch backups from API
  const fetchBackups = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await backupApi.getAll();
      console.log('API Response (backups):', response);  // Debug logging
      const data = response.data || [];  // Extract data with fallback
      
      setBackups(data);
      applyBackupFilters(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching backups:", err);
      setError(formatApiError(err) || "Failed to load backups. Please try again later.");
      setLoading(false);
    }
  };

  // Fetch backup statistics
  const fetchBackupStatistics = async () => {
    try {
      const response = await backupApi.getStatistics();
      console.log('API Response (statistics):', response);  // Debug logging
      const stats = response.data || {  // Extract data with fallback
        totalBackups: 0,
        completedBackups: 0,
        failedBackups: 0,
        inProgressBackups: 0,
        totalStorageGB: 0,
        lastFullBackupDate: 'None'
      };
      
      setBackupStats(stats);
    } catch (err) {
      console.error("Error fetching backup statistics:", err);
      // Non-critical error, don't show in UI
    }
  };

  // Fetch backup schedules
  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await scheduleApi.getAll();
      console.log('API Response (schedules):', response);  // Debug logging
      const data = response.data || [];  // Extract data with fallback
      
      setSchedules(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching schedules:", err);
      setError(formatApiError(err) || "Failed to load backup schedules. Please try again later.");
      setLoading(false);
    }
  };

  // Fetch repositories for selection in modals
  const fetchRepositories = async () => {
    try {
      const response = await repositoryApi.getAll();
      console.log('API Response (repositories):', response);  // Debug logging
      const data = response.data || [];  // Extract data with fallback
      
      setRepositories(data);
    } catch (err) {
      console.error("Error fetching repositories:", err);
      // Non-critical error, don't show in UI
    }
  };

  // Apply filters to backups
  const applyBackupFilters = (backupList = backups) => {
    let filtered = [...backupList];
    
    // Apply type filter
    if (filterOptions.type !== 'All') {
      filtered = filtered.filter(backup => backup.type === filterOptions.type);
    }
    
    // Apply status filter
    if (filterOptions.status !== 'All') {
      filtered = filtered.filter(backup => backup.status === filterOptions.status);
    }
    
    // Apply date range filter
    if (filterOptions.dateRange !== 'All') {
      const now = new Date();
      let startDate;
      
      switch (filterOptions.dateRange) {
        case 'Today':
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'Yesterday':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'Last 7 days':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'Last 30 days':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 30);
          break;
        default:
          break;
      }
      
      if (startDate) {
        filtered = filtered.filter(backup => {
          const backupDate = new Date(backup.date);
          return backupDate >= startDate;
        });
      }
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(backup => 
        backup.backupId.toLowerCase().includes(query) || 
        backup.initiatedBy.toLowerCase().includes(query) ||
        (backup.repos && backup.repos.toLowerCase().includes(query))
      );
    }
    
    setFilteredBackups(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Update filters when options change
  useEffect(() => {
    applyBackupFilters();
  }, [filterOptions, searchQuery]);

  // Pagination logic
  const indexOfLastBackup = currentPage * backupsPerPage;
  const indexOfFirstBackup = indexOfLastBackup - backupsPerPage;
  const currentBackups = filteredBackups.slice(indexOfFirstBackup, indexOfLastBackup);
  const totalPages = Math.ceil(filteredBackups.length / backupsPerPage);

  // CRUD Operations for Backups
  const addBackup = async (backup, repositoryIds) => {
    try {
      setActionInProgress(true);
      
      const response = await backupApi.create(backup, repositoryIds);
      console.log('API Response (create backup):', response);  // Debug logging
      const newBackup = response.data || {};  // Extract data with fallback
      
      setBackups([newBackup, ...backups]);
      applyBackupFilters([newBackup, ...backups]);
      setShowAddBackupModal(false);
      // Refetch stats
      fetchBackupStatistics();
      setActionInProgress(false);
    } catch (err) {
      console.error("Error creating backup:", err);
      alert("Failed to create backup: " + formatApiError(err));
      setActionInProgress(false);
    }
  };

  const deleteBackup = async (backupId) => {
    try {
      setActionInProgress(true);
      
      const response = await backupApi.delete(backupId);
      console.log('API Response (delete backup):', response);  // Debug logging
      
      const updatedBackups = backups.filter(backup => backup.id !== backupId);
      setBackups(updatedBackups);
      applyBackupFilters(updatedBackups);
      setShowDeleteBackupModal(false);
      // Refetch stats
      fetchBackupStatistics();
      setActionInProgress(false);
    } catch (err) {
      console.error("Error deleting backup:", err);
      alert("Failed to delete backup: " + formatApiError(err));
      setActionInProgress(false);
    }
  };

  const retryBackup = async (backupId) => {
    try {
      setActionInProgress(true);
      
      const response = await backupApi.retry(backupId);
      console.log('API Response (retry backup):', response);  // Debug logging
      const updatedBackup = response.data || {};  // Extract data with fallback
      
      const updatedBackups = backups.map(backup => 
        backup.id === backupId ? updatedBackup : backup
      );
      setBackups(updatedBackups);
      applyBackupFilters(updatedBackups);
      setShowActionMenu(null);
      // Refetch stats
      fetchBackupStatistics();
      setActionInProgress(false);
    } catch (err) {
      console.error("Error retrying backup:", err);
      alert("Failed to retry backup: " + formatApiError(err));
      setActionInProgress(false);
    }
  };

  // CRUD Operations for Schedules
  const addSchedule = async (schedule, repositoryIds) => {
    try {
      setActionInProgress(true);
      
      const response = await scheduleApi.create(schedule, repositoryIds);
      console.log('API Response (create schedule):', response);  // Debug logging
      const newSchedule = response.data || {};  // Extract data with fallback
      
      setSchedules([...schedules, newSchedule]);
      setShowAddScheduleModal(false);
      setActionInProgress(false);
    } catch (err) {
      console.error("Error creating schedule:", err);
      alert("Failed to create schedule: " + formatApiError(err));
      setActionInProgress(false);
    }
  };

  const updateSchedule = async (id, scheduleData, repositoryIds) => {
    try {
      setActionInProgress(true);
      
      const response = await scheduleApi.update(id, scheduleData, repositoryIds);
      console.log('API Response (update schedule):', response);  // Debug logging
      const updatedSchedule = response.data || {};  // Extract data with fallback
      
      setSchedules(schedules.map(schedule => schedule.id === id ? updatedSchedule : schedule));
      setShowEditScheduleModal(false);
      setActionInProgress(false);
    } catch (err) {
      console.error("Error updating schedule:", err);
      alert("Failed to update schedule: " + formatApiError(err));
      setActionInProgress(false);
    }
  };

  const deleteSchedule = async (id) => {
    try {
      setActionInProgress(true);
      
      const response = await scheduleApi.delete(id);
      console.log('API Response (delete schedule):', response);  // Debug logging
      
      setSchedules(schedules.filter(schedule => schedule.id !== id));
      setShowDeleteScheduleModal(false);
      setActionInProgress(false);
    } catch (err) {
      console.error("Error deleting schedule:", err);
      alert("Failed to delete schedule: " + formatApiError(err));
      setActionInProgress(false);
    }
  };

  const toggleScheduleStatus = async (id) => {
    try {
      setActionInProgress(true);
      
      const response = await scheduleApi.toggleStatus(id);
      console.log('API Response (toggle schedule status):', response);  // Debug logging
      const updatedSchedule = response.data || {};  // Extract data with fallback
      
      setSchedules(schedules.map(schedule => schedule.id === id ? updatedSchedule : schedule));
      setActionInProgress(false);
    } catch (err) {
      console.error("Error toggling schedule status:", err);
      alert("Failed to update schedule status: " + formatApiError(err));
      setActionInProgress(false);
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

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'history':
        return renderHistoryTab();
      case 'schedule':
        return renderScheduleTab();
      case 'restore':
        return renderRestoreTab();
      case 'settings':
        return renderSettingsTab();
      default:
        return renderHistoryTab();
    }
  };

  // Render History Tab
  const renderHistoryTab = () => {
    return (
      <>
        {/* Action Bar */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg font-medium text-gray-800">Backup History</div>
          <div className="flex items-center space-x-3">
            {/* Create Backup Button */}
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded-md flex items-center hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
              onClick={() => setShowAddBackupModal(true)}
              disabled={actionInProgress}
            >
              {actionInProgress ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  <span>New Backup</span>
                </>
              )}
            </button>
            
            {/* Filter Button */}
            <div className="relative">
              <button 
                className="px-4 py-2 rounded-md border border-gray-300 flex items-center"
                onClick={() => setShowFilters(!showFilters)}
                disabled={actionInProgress}
              >
                <Filter className="h-4 w-4 mr-2 text-gray-700" />
                <span>Filter</span>
                <ChevronDown className="h-4 w-4 ml-2 text-gray-700" />
              </button>
              
              {/* Filter Dropdown */}
              {showFilters && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <div className="p-4">
                    <h3 className="font-medium text-sm text-gray-700 mb-2">Backup Type</h3>
                    <div className="space-y-1 mb-4">
                      {['All', 'Full', 'Delta'].map(type => (
                        <div key={type} className="flex items-center">
                          <input
                            type="radio"
                            id={`type-${type}`}
                            name="type"
                            checked={filterOptions.type === type}
                            onChange={() => setFilterOptions({...filterOptions, type})}
                            className="h-4 w-4 text-blue-600"
                          />
                          <label htmlFor={`type-${type}`} className="ml-2 text-sm text-gray-700">{type}</label>
                        </div>
                      ))}
                    </div>
                    
                    <h3 className="font-medium text-sm text-gray-700 mb-2">Status</h3>
                    <div className="space-y-1 mb-4">
                      {['All', 'Complete', 'In Progress', 'Failed'].map(status => (
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
                    
                    <h3 className="font-medium text-sm text-gray-700 mb-2">Date Range</h3>
                    <div className="space-y-1 mb-4">
                      {['All', 'Today', 'Yesterday', 'Last 7 days', 'Last 30 days'].map(range => (
                        <div key={range} className="flex items-center">
                          <input
                            type="radio"
                            id={`range-${range}`}
                            name="dateRange"
                            checked={filterOptions.dateRange === range}
                            onChange={() => setFilterOptions({...filterOptions, dateRange: range})}
                            className="h-4 w-4 text-blue-600"
                          />
                          <label htmlFor={`range-${range}`} className="ml-2 text-sm text-gray-700">{range}</label>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-between">
                      <button 
                        className="text-sm text-gray-500 hover:text-gray-700"
                        onClick={() => setFilterOptions({type: 'All', status: 'All', dateRange: 'All'})}
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
                placeholder="Search backups..."
                className="w-64 px-4 py-2 pr-10 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                disabled={actionInProgress}
              />
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6">
            <p>{error}</p>
            <button 
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              onClick={() => fetchBackups()}
            >
              Retry
            </button>
          </div>
        )}
        
        {/* Backup History Table */}
        {!loading && !error && (
          <div className="bg-white rounded-md shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Backup ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date & Time</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Size</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Duration</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentBackups.length > 0 ? (
                  currentBackups.map(backup => (
                    <tr key={backup.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-800">{backup.backupId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-800">{backup.date}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <BackupTypeBadge type={backup.type} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <BackupStatusBadge status={backup.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-800">{backup.size}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-800">{backup.duration}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="relative">
                          <button 
                            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => setShowActionMenu(showActionMenu === backup.id ? null : backup.id)}
                            disabled={actionInProgress}
                          >
                            <MoreHorizontal className="h-5 w-5 text-gray-500" />
                          </button>
                          
                          {/* Action Menu */}
                          {showActionMenu === backup.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                              <div className="py-1">
                                {/* View details option */}
                                <button
                                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center"
                                  onClick={() => {
                                    setCurrentBackup(backup);
                                    setShowViewBackupModal(true);
                                    setShowActionMenu(null);
                                  }}
                                >
                                  <FileText className="h-4 w-4 mr-2 text-gray-500" />
                                  View Details
                                </button>
                                
                                {/* Download option */}
                                {backup.status === 'Complete' && (
                                  <button
                                    className="px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 w-full text-left flex items-center"
                                  >
                                    <Download className="h-4 w-4 mr-2 text-blue-500" />
                                    Download
                                  </button>
                                )}
                                
                                {/* Restore option */}
                                {backup.status === 'Complete' && (
                                  <button
                                    className="px-4 py-2 text-sm text-green-600 hover:bg-gray-100 w-full text-left flex items-center"
                                  >
                                    <Archive className="h-4 w-4 mr-2 text-green-500" />
                                    Restore
                                  </button>
                                )}
                                
                                {/* Retry option */}
                                {backup.status === 'Failed' && (
                                  <button
                                    className="px-4 py-2 text-sm text-amber-600 hover:bg-gray-100 w-full text-left flex items-center"
                                    onClick={() => {
                                      retryBackup(backup.id);
                                      setShowActionMenu(null);
                                    }}
                                  >
                                    <RefreshCw className="h-4 w-4 mr-2 text-amber-500" />
                                    Retry Backup
                                  </button>
                                )}
                                
                                {/* Delete option */}
                                <button
                                  className="px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left flex items-center"
                                  onClick={() => {
                                    setCurrentBackup(backup);
                                    setShowDeleteBackupModal(true);
                                    setShowActionMenu(null);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                                  Delete Backup
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
                      No backups found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {!loading && !error && filteredBackups.length > 0 && (
          <div className="bg-white rounded-md shadow p-4 mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {indexOfFirstBackup + 1}-{Math.min(indexOfLastBackup, filteredBackups.length)} of {filteredBackups.length} backup records
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
      </>
    );
  };

  // Render Schedule Tab
  const renderScheduleTab = () => {
    return (
      <>
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg font-medium text-gray-800">Backup Schedule</div>
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded-md flex items-center hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
            onClick={() => setShowAddScheduleModal(true)}
            disabled={actionInProgress}
          >
            {actionInProgress ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                <span>New Schedule</span>
              </>
            )}
          </button>
        </div>
        
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6">
            <p>{error}</p>
            <button 
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              onClick={() => fetchSchedules()}
            >
              Retry
            </button>
          </div>
        )}
        
        {/* Schedule Table */}
        {!loading && !error && (
          <div className="bg-white rounded-md shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Frequency</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Time</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Repositories</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Retention</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schedules.length > 0 ? (
                  schedules.map(schedule => (
                    <tr key={schedule.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-800">{schedule.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <BackupTypeBadge type={schedule.type} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-800">{schedule.frequency}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-800">{schedule.time}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-800 max-w-xs truncate">
                          {schedule.repos}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-800">{schedule.retention}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            schedule.status === 'Active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {schedule.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end">
                          <button 
                            className="p-2 rounded-md hover:bg-gray-100 mr-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => toggleScheduleStatus(schedule.id)}
                            disabled={actionInProgress}
                          >
                            {schedule.status === 'Active' ? (
                              <Pause className="h-5 w-5 text-gray-500" />
                            ) : (
                              <Play className="h-5 w-5 text-gray-500" />
                            )}
                          </button>
                          <button 
                            className="p-2 rounded-md hover:bg-gray-100 mr-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => {
                              setCurrentSchedule(schedule);
                              setShowEditScheduleModal(true);
                            }}
                            disabled={actionInProgress}
                          >
                            <Edit className="h-5 w-5 text-gray-500" />
                          </button>
                          <button 
                            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => {
                              setCurrentSchedule(schedule);
                              setShowDeleteScheduleModal(true);
                            }}
                            disabled={actionInProgress}
                          >
                            <Trash2 className="h-5 w-5 text-gray-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                      No backup schedules found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Scheduled backups require the backup service to be running. Check the Settings tab to ensure the service is active.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  };

  // Render Restore Tab
  const renderRestoreTab = () => {
    return (
      <div className="bg-white rounded-md shadow p-6">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Restore from Backup</h2>
        
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            Select a backup to restore from the list below. Only completed backups are available for restore operations.
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Backup</label>
            <select className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select a backup...</option>
              {backups
                .filter(backup => backup.status === 'Complete')
                .map(backup => (
                  <option key={backup.id} value={backup.id}>
                    {backup.backupId} - {backup.date} ({backup.type})
                  </option>
                ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Restore Target</label>
            <select className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="original">Original Location</option>
              <option value="custom">Custom Location</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Restore Options</label>
            <div className="mt-2">
              <label className="inline-flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" defaultChecked />
                <span className="ml-2 text-sm text-gray-700">Overwrite existing files</span>
              </label>
            </div>
            <div className="mt-2">
              <label className="inline-flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" />
                <span className="ml-2 text-sm text-gray-700">Restore permissions</span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Restore operations will overwrite data at the target location. This action cannot be undone.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
            disabled={actionInProgress}
          >
            Start Restore
          </button>
        </div>
      </div>
    );
  };

  // Render Settings Tab
  const renderSettingsTab = () => {
    return (
      <div className="bg-white rounded-md shadow p-6">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Backup Settings</h2>
        
        <div className="border-b border-gray-200 pb-4 mb-4">
          <h3 className="text-base font-medium text-gray-700 mb-3">Storage Settings</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Storage Location</label>
            <select className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="local">Local Storage</option>
              <option value="cloud">Cloud Storage</option>
              <option value="nas">Network Attached Storage</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Storage Quota</label>
            <div className="flex items-center">
              <input 
                type="number" 
                min="1" 
                max="1000" 
                defaultValue="40"
                className="rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-24"
              />
              <span className="ml-2 text-sm text-gray-700">GB</span>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Retention Policy</label>
            <select className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="30">Keep backups for 30 days</option>
              <option value="60">Keep backups for 60 days</option>
              <option value="90">Keep backups for 90 days</option>
              <option value="180">Keep backups for 6 months</option>
              <option value="365">Keep backups for 1 year</option>
              <option value="0">Keep backups indefinitely</option>
            </select>
          </div>
        </div>
        
        <div className="border-b border-gray-200 pb-4 mb-4">
          <h3 className="text-base font-medium text-gray-700 mb-3">Backup Service</h3>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium text-gray-800">Backup Service Status</div>
              <div className="text-xs text-gray-500">The backup service must be running for scheduled backups to work</div>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm font-medium text-green-700">Running</span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center">
              <RefreshCw className="h-4 w-4 mr-1" />
              <span>Restart Service</span>
            </button>
            <button className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 flex items-center">
              <X className="h-4 w-4 mr-1" />
              <span>Stop Service</span>
            </button>
          </div>
        </div>
        
        <div className="border-b border-gray-200 pb-4 mb-4">
          <h3 className="text-base font-medium text-gray-700 mb-3">Notification Settings</h3>
          
          <div className="mb-2">
            <label className="inline-flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Email notifications for failed backups</span>
            </label>
          </div>
          <div className="mb-2">
            <label className="inline-flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Email notifications for completed backups</span>
            </label>
          </div>
          <div className="mb-4">
            <label className="inline-flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" />
              <span className="ml-2 text-sm text-gray-700">System notifications</span>
            </label>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Recipients</label>
            <input 
              type="text" 
              defaultValue="admin@example.com, alerts@example.com"
              className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Separate multiple email addresses with commas</p>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
            disabled={actionInProgress}
          >
            Save Settings
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Backup Management</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Backup Status Card */}
        <div className="bg-white p-6 rounded-md shadow">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Overall Backup Status</h2>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
            <div 
              className={`${backupStats.failedBackups > 0 ? 'bg-yellow-500' : 'bg-green-500'} h-4 rounded-full`}
              style={{ width: `${Math.round((backupStats.completedBackups / Math.max(backupStats.totalBackups, 1)) * 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mb-4">
            <span>0%</span>
            <span>{Math.round((backupStats.completedBackups / Math.max(backupStats.totalBackups, 1)) * 100)}%</span>
            <span>100%</span>
          </div>
          <div className="text-sm text-gray-600">Last full backup: {backupStats.lastFullBackupDate}</div>
          {backupStats.failedBackups > 0 ? (
            <div className="text-sm text-red-600 mt-1">
              {backupStats.failedBackups} failed {backupStats.failedBackups === 1 ? 'backup' : 'backups'} detected
            </div>
          ) : (
            <div className="text-sm text-green-600 mt-1">All backups completed successfully</div>
          )}
        </div>
        
        {/* Storage Card */}
        <div className="bg-white p-6 rounded-md shadow">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Total Backup Storage</h2>
          <div className="flex items-center">
            <div className="mr-4">
              <div className="text-3xl font-bold text-gray-800">{backupStats.totalStorageGB} GB</div>
              <div className="text-sm text-gray-600 mt-1">Storage usage: {Math.min(Math.round((backupStats.totalStorageGB / 40) * 100), 100)}% of allocated</div>
            </div>
            <div className="relative w-16 h-16">
              <PieChart className="text-blue-500 w-full h-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Schedule Card */}
        <div className="bg-white p-6 rounded-md shadow">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Next Scheduled Backup</h2>
          <div className="text-2xl font-bold text-gray-800 mb-2">11:30 PM Today</div>
          <div className="text-sm text-gray-600 mb-4">Daily full backup (automated)</div>
          <div className="flex space-x-2">
            <button 
              className="px-4 py-1 bg-blue-500 text-white rounded-md flex items-center text-sm hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
              onClick={() => setShowAddBackupModal(true)}
              disabled={actionInProgress}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              <span>Run Now</span>
            </button>
            <button 
              className="px-4 py-1 border border-blue-500 text-blue-500 rounded-md flex items-center text-sm hover:bg-blue-50 disabled:border-blue-300 disabled:text-blue-300 disabled:cursor-not-allowed"
              onClick={() => {
                setActiveTab('schedule');
                if (schedules.length > 0) {
                  setCurrentSchedule(schedules[0]);
                  setShowEditScheduleModal(true);
                }
              }}
              disabled={actionInProgress || schedules.length === 0}
            >
              <Calendar className="h-4 w-4 mr-1" />
              <span>Reschedule</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-md shadow mb-6">
        <div className="flex flex-wrap p-2">
          <TabButton 
            icon={<Clock />}
            label="History" 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')} 
          />
          <TabButton 
            icon={<Calendar />}
            label="Schedule" 
            active={activeTab === 'schedule'} 
            onClick={() => setActiveTab('schedule')} 
          />
          <TabButton 
            icon={<Archive />}
            label="Restore" 
            active={activeTab === 'restore'} 
            onClick={() => setActiveTab('restore')} 
          />
          <TabButton 
            icon={<Settings />}
            label="Settings" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </div>
      </div>
      
      {/* Tab Content */}
      {renderTabContent()}
      
      {/* Add Backup Modal */}
      {showAddBackupModal && (
        <BackupModal
          onClose={() => setShowAddBackupModal(false)}
          onSave={addBackup}
          title="Create New Backup"
          repositories={repositories}
          isSubmitting={actionInProgress}
        />
      )}
      
      {/* View Backup Modal */}
      {showViewBackupModal && currentBackup && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={() => setShowViewBackupModal(false)}></div>
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
              <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Backup Details: {currentBackup.backupId}</h2>
                <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowViewBackupModal(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Date & Time</div>
                    <div className="text-sm text-gray-800 mt-1">{currentBackup.date}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Type</div>
                    <div className="text-sm text-gray-800 mt-1">
                      <BackupTypeBadge type={currentBackup.type} />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Status</div>
                    <div className="text-sm text-gray-800 mt-1">
                      <BackupStatusBadge status={currentBackup.status} />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Size</div>
                    <div className="text-sm text-gray-800 mt-1">{currentBackup.size}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Duration</div>
                    <div className="text-sm text-gray-800 mt-1">{currentBackup.duration}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Initiated By</div>
                    <div className="text-sm text-gray-800 mt-1">{currentBackup.initiatedBy}</div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-500">Repositories</div>
                  <div className="text-sm text-gray-800 mt-1">{currentBackup.repos}</div>
                </div>
                
                {currentBackup.notes && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-500">Notes</div>
                    <div className="text-sm text-gray-800 mt-1">{currentBackup.notes}</div>
                  </div>
                )}
                
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-500">Logs</div>
                  <div className="mt-1 bg-gray-100 p-3 rounded-md text-xs font-mono text-gray-800 h-32 overflow-y-auto">
                    {currentBackup.logs}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowViewBackupModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    disabled={actionInProgress}
                  >
                    Close
                  </button>
                  
                  {currentBackup.status === 'Complete' && (
                    <button
                      type="button"
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center disabled:bg-blue-300 disabled:cursor-not-allowed"
                      disabled={actionInProgress}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Backup
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Delete Backup Modal */}
      {showDeleteBackupModal && currentBackup && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={() => setShowDeleteBackupModal(false)}></div>
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-center text-gray-900 mb-4">Delete Backup</h3>
                <p className="text-sm text-gray-500 text-center mb-2">
                  Are you sure you want to delete backup <span className="font-semibold">{currentBackup.backupId}</span>?
                </p>
                <p className="text-sm text-gray-500 text-center">
                  This action cannot be undone.
                </p>
                
                <div className="flex justify-center space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowDeleteBackupModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    disabled={actionInProgress}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteBackup(currentBackup.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center"
                    disabled={actionInProgress}
                  >
                    {actionInProgress ? (
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
      )}
      
      {/* Add/Edit Schedule Modals */}
      {(showAddScheduleModal || showEditScheduleModal) && (
        <ScheduleModal
          schedule={showEditScheduleModal ? currentSchedule : null}
          onClose={() => showAddScheduleModal ? setShowAddScheduleModal(false) : setShowEditScheduleModal(false)}
          onSave={showAddScheduleModal 
            ? addSchedule 
            : (scheduleData, repositoryIds) => updateSchedule(currentSchedule.id, scheduleData, repositoryIds)}
          title={showAddScheduleModal ? "Create New Schedule" : "Edit Schedule"}
          repositories={repositories}
          isSubmitting={actionInProgress}
        />
      )}
      
      {/* Delete Schedule Modal */}
      {showDeleteScheduleModal && currentSchedule && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={() => setShowDeleteScheduleModal(false)}></div>
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-center text-gray-900 mb-4">Delete Schedule</h3>
                <p className="text-sm text-gray-500 text-center mb-2">
                  Are you sure you want to delete the schedule <span className="font-semibold">{currentSchedule.name}</span>?
                </p>
                <p className="text-sm text-gray-500 text-center">
                  This will stop all automated backups associated with this schedule.
                </p>
                
                <div className="flex justify-center space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowDeleteScheduleModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    disabled={actionInProgress}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSchedule(currentSchedule.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center"
                    disabled={actionInProgress}
                  >
                    {actionInProgress ? (
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
      )}
      
      {/* Backdrop for dropdowns */}
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

// Helper components

const TabButton = ({ icon, label, active, onClick }) => {
  return (
    <button
      className={`px-4 py-2 flex items-center text-sm font-medium rounded-md mr-2 mb-2 ${
        active 
          ? 'bg-blue-500 text-white' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
      onClick={onClick}
    >
      <span className="mr-2 w-4 h-4">{icon}</span>
      {label}
    </button>
  );
};

const BackupTypeBadge = ({ type }) => {
  const getTypeClasses = () => {
    switch (type) {
      case 'Full':
        return 'bg-blue-100 text-blue-800';
      case 'Delta':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getTypeClasses()}`}>
      {type}
    </span>
  );
};

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
        return <Clock className="h-4 w-4 mr-1" />;
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

// Backup Modal for creating new backups
const BackupModal = ({ onClose, onSave, title, repositories = [], isSubmitting = false }) => {
  const [formData, setFormData] = useState({
    type: 'Full',
    repos: 'All repositories',
    size: '',
    initiatedBy: 'Manual',
    notes: ''
  });
  
  const [selectedRepoIds, setSelectedRepoIds] = useState([]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };
  
  const handleRepoSelectionChange = (e) => {
    const value = e.target.value;
    if (value === 'all') {
      setSelectedRepoIds([]);
      setFormData(prev => ({...prev, repos: 'All repositories'}));
    } else if (value === 'selected') {
      // Keep the current selection if any
      if (selectedRepoIds.length === 0 && repositories.length > 0) {
        const firstId = repositories[0].id;
        setSelectedRepoIds([firstId]);
        setFormData(prev => ({...prev, repos: repositories[0].name}));
      }
    }
  };
  
  const handleCheckboxChange = (id) => {
    const isSelected = selectedRepoIds.includes(id);
    
    if (isSelected) {
      setSelectedRepoIds(selectedRepoIds.filter(repoId => repoId !== id));
    } else {
      setSelectedRepoIds([...selectedRepoIds, id]);
    }
    
    // Update repos string for display
    const selectedRepos = repositories
      .filter(repo => [...selectedRepoIds, id].includes(repo.id) && !isSelected)
      .map(repo => repo.name)
      .join(', ');
    
    setFormData(prev => ({...prev, repos: selectedRepos || 'No repositories selected'}));
  };
  
  const handleSubmit = () => {
    // If 'All repositories' is selected, pass empty array
    // Otherwise, pass the selected repository IDs
    const repoIds = formData.repos === 'All repositories' ? [] : selectedRepoIds;
    onSave(formData, repoIds);
  };
  
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={onClose}></div>
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            <button 
              className="text-gray-500 hover:text-gray-700" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Backup Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="Full">Full Backup</option>
                <option value="Delta">Delta Backup</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {formData.type === 'Full' 
                  ? 'Full backup includes all repositories and their complete history.' 
                  : 'Delta backup only includes changes since the last backup.'}
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Repositories</label>
              <div className="mb-2">
                <select
                  onChange={handleRepoSelectionChange}
                  value={formData.repos === 'All repositories' ? 'all' : 'selected'}
                  className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  <option value="all">All repositories</option>
                  <option value="selected">Selected repositories</option>
                </select>
              </div>
              
              {formData.repos !== 'All repositories' && (
                <div className="mt-2 border border-gray-200 rounded-md p-2 max-h-40 overflow-y-auto">
                  {repositories.map(repo => (
                    <div key={repo.id} className="flex items-center py-1">
                      <input
                        type="checkbox"
                        id={`repo-${repo.id}`}
                        checked={selectedRepoIds.includes(repo.id)}
                        onChange={() => handleCheckboxChange(repo.id)}
                        className="h-4 w-4 text-blue-600 rounded"
                        disabled={isSubmitting}
                      />
                      <label htmlFor={`repo-${repo.id}`} className="ml-2 text-sm text-gray-700">
                        {repo.name}
                      </label>
                    </div>
                  ))}
                  
                  {repositories.length === 0 && (
                    <div className="text-sm text-gray-500 py-1">No repositories available</div>
                  )}
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add any notes about this backup..."
                disabled={isSubmitting}
              ></textarea>
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
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Start Backup</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Schedule Modal for creating/editing backup schedules
const ScheduleModal = ({ schedule = null, onClose, onSave, title, repositories = [], isSubmitting = false }) => {
  const [formData, setFormData] = useState({
    id: schedule?.id || '',
    name: schedule?.name || '',
    type: schedule?.type || 'Full',
    frequency: schedule?.frequency || 'Daily',
    time: schedule?.time || '11:30 PM',
    repos: schedule?.repos || 'All repositories',
    retention: schedule?.retention || '30 days',
    status: schedule?.status || 'Active'
  });
  
  const [selectedRepoIds, setSelectedRepoIds] = useState(
    schedule?.repositoryIds || []
  );
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };
  
  const handleRepoSelectionChange = (e) => {
    const value = e.target.value;
    if (value === 'all') {
      setSelectedRepoIds([]);
      setFormData(prev => ({...prev, repos: 'All repositories'}));
    } else if (value === 'selected') {
      // Keep the current selection if any
      if (selectedRepoIds.length === 0 && repositories.length > 0) {
        const firstId = repositories[0].id;
        setSelectedRepoIds([firstId]);
        setFormData(prev => ({...prev, repos: repositories[0].name}));
      }
    }
  };
  
  const handleCheckboxChange = (id) => {
    const isSelected = selectedRepoIds.includes(id);
    
    let newSelectedIds;
    if (isSelected) {
      newSelectedIds = selectedRepoIds.filter(repoId => repoId !== id);
    } else {
      newSelectedIds = [...selectedRepoIds, id];
    }
    
    setSelectedRepoIds(newSelectedIds);
    
    // Update repos string for display
    const selectedRepos = repositories
      .filter(repo => newSelectedIds.includes(repo.id))
      .map(repo => repo.name)
      .join(', ');
    
    setFormData(prev => ({...prev, repos: selectedRepos || 'No repositories selected'}));
  };
  
  const handleSubmit = () => {
    // If 'All repositories' is selected, pass empty array
    // Otherwise, pass the selected repository IDs
    const repoIds = formData.repos === 'All repositories' ? [] : selectedRepoIds;
    onSave(formData, repoIds);
  };
  
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={onClose}></div>
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            <button 
              className="text-gray-500 hover:text-gray-700" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Daily Full Backup"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Backup Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="Full">Full Backup</option>
                <option value="Delta">Delta Backup</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
              <select
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="text"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 11:30 PM"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Repositories</label>
              <div className="mb-2">
                <select
                  onChange={handleRepoSelectionChange}
                  value={formData.repos === 'All repositories' ? 'all' : 'selected'}
                  className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  <option value="all">All repositories</option>
                  <option value="selected">Selected repositories</option>
                </select>
              </div>
              
              {formData.repos !== 'All repositories' && (
                <div className="mt-2 border border-gray-200 rounded-md p-2 max-h-40 overflow-y-auto">
                  {repositories.map(repo => (
                    <div key={repo.id} className="flex items-center py-1">
                      <input
                        type="checkbox"
                        id={`schedule-repo-${repo.id}`}
                        checked={selectedRepoIds.includes(repo.id)}
                        onChange={() => handleCheckboxChange(repo.id)}
                        className="h-4 w-4 text-blue-600 rounded"
                        disabled={isSubmitting}
                      />
                      <label htmlFor={`schedule-repo-${repo.id}`} className="ml-2 text-sm text-gray-700">
                        {repo.name}
                      </label>
                    </div>
                  ))}
                  
                  {repositories.length === 0 && (
                    <div className="text-sm text-gray-500 py-1">No repositories available</div>
                  )}
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Retention Period</label>
              <select
                name="retention"
                value={formData.retention}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="7 days">7 days</option>
                <option value="30 days">30 days</option>
                <option value="90 days">90 days</option>
                <option value="6 months">6 months</option>
                <option value="1 year">1 year</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="mt-2">
                <label className="inline-flex items-center">
                  <input 
                    type="radio" 
                    name="status" 
                    value="Active"
                    checked={formData.status === 'Active'}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" 
                    disabled={isSubmitting}
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
                <label className="inline-flex items-center ml-6">
                  <input 
                    type="radio" 
                    name="status" 
                    value="Inactive"
                    checked={formData.status === 'Inactive'}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" 
                    disabled={isSubmitting}
                  />
                  <span className="ml-2 text-sm text-gray-700">Inactive</span>
                </label>
              </div>
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
                  <span>Save Schedule</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BackupPage;