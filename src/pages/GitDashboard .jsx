
import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { dashboardApi, userApi, repositoryApi, backupApi } from '../services/apiService';

// Register ChartJS components
ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
);

function GitDashboard() {
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [backups, setBackups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorMessages, setErrorMessages] = useState({
    dashboard: null,
    repositories: null,
    users: null,
    backups: null
  });

  // Pagination states
  const [repoPage, setRepoPage] = useState(0);
  const [repoRowsPerPage, setRepoRowsPerPage] = useState(10);
  const [userPage, setUserPage] = useState(0);
  const [userRowsPerPage, setUserRowsPerPage] = useState(10);
  const [backupPage, setBackupPage] = useState(0);
  const [backupRowsPerPage, setBackupRowsPerPage] = useState(10);

  // Modal states
  const [repoModalOpen, setRepoModalOpen] = useState(false);
  const [editingRepo, setEditingRepo] = useState(null);
  const [repoForm, setRepoForm] = useState({
    projectName: '',
    department: '',
    gitUrl: '',
    description: ''
  });

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    username: '',
    employeeId: '',
    groupName: '',
    role: 'developer'
  });

  // Dashboard metrics
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalRepos: 0,
    totalBackupsCompleted: 0,
    backupCompletionRate: 0,
    usersByRole: {},
    reposByDepartment: {}
  });

  // Load data on component mount and tab change
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Fetch data based on active tab to optimize initial load
        if (tabValue === 0) {
          try {
            // For Overview tab
            const summary = await dashboardApi.getSummary();
            setDashboardData({
              totalUsers: summary.data.totalUsers,
              totalRepos: summary.data.totalRepositories,
              totalBackupsCompleted: summary.data.completedBackups,
              backupCompletionRate: summary.data.backupCompletionRate,
              usersByRole: summary.data.usersByRole,
              reposByDepartment: summary.data.repositoriesByDepartment
            });

            // Clear error if successful
            setErrorMessages(prev => ({ ...prev, dashboard: null }));
          } catch (err) {
            console.error("Error loading dashboard summary:", err);
            setErrorMessages(prev => ({
              ...prev,
              dashboard: "Unable to connect to the dashboard API. Using offline mode with sample data."
            }));
          }

          // Also fetch basic data needed for other tabs
          try {
            const [usersData, reposData, backupsData] = await Promise.allSettled([
              userApi.getAllUsers(),
              repositoryApi.getAllRepositories(),
              backupApi.getAllBackups()
            ]);

            // Handle each promise result, using the data if fulfilled or showing error if rejected
            if (usersData.status === 'fulfilled') {
              setUsers(usersData.value.data);
            } else {
              console.error("Error loading users data:", usersData.reason);
            }

            if (reposData.status === 'fulfilled') {
              setRepositories(reposData.value.data);
            } else {
              console.error("Error loading repositories data:", reposData.reason);
            }

            if (backupsData.status === 'fulfilled') {
              setBackups(backupsData.value.data);
            } else {
              console.error("Error loading backups data:", backupsData.reason);
            }

          } catch (err) {
            console.error("Error loading dashboard data:", err);
            setErrorMessages(prev => ({
              ...prev,
              dashboard: "Some dashboard data could not be loaded. Using available data."
            }));
          }
        }
        else if (tabValue === 1) {
          try {
            // For Repositories tab
            const reposData = await repositoryApi.getAllRepositories();
            setRepositories(reposData.data);
            setErrorMessages(prev => ({ ...prev, repositories: null }));

            // Get backup status for each repo
            const backupsData = await backupApi.getAllBackups();
            setBackups(backupsData.data);
          } catch (err) {
            console.error("Error loading repository data:", err);
            setErrorMessages(prev => ({
              ...prev,
              repositories: "Unable to connect to the repositories API. Using offline mode with sample data."
            }));
          }
        }
        else if (tabValue === 2) {
          try {
            // For Users tab
            const usersData = await userApi.getAllUsers();
            setUsers(usersData.data);
            setErrorMessages(prev => ({ ...prev, users: null }));
          } catch (err) {
            console.error("Error loading user data:", err);
            setErrorMessages(prev => ({
              ...prev,
              users: "Unable to connect to the users API. Using offline mode with sample data."
            }));
          }
        }
        else if (tabValue === 3) {
          try {
            // For Backups tab
            const [reposData, backupsData] = await Promise.allSettled([
              repositoryApi.getAllRepositories(),
              backupApi.getAllBackups()
            ]);

            if (reposData.status === 'fulfilled') {
              setRepositories(reposData.value.data);
            } else {
              console.error("Error loading repositories for backups:", reposData.reason);
            }

            if (backupsData.status === 'fulfilled') {
              setBackups(backupsData.value.data);
              setErrorMessages(prev => ({ ...prev, backups: null }));
            } else {
              console.error("Error loading backups data:", backupsData.reason);
              setErrorMessages(prev => ({
                ...prev,
                backups: "Unable to connect to the backups API. Using offline mode with sample data."
              }));
            }
          } catch (err) {
            console.error("Error loading backup data:", err);
            setErrorMessages(prev => ({
              ...prev,
              backups: "Unable to load backup data. Using offline mode with sample data."
            }));
          }
        }

        setError(null);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load some data. Application is running in offline mode with sample data.");
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Reset pagination when switching tabs
    setRepoPage(0);
    setUserPage(0);
    setBackupPage(0);
  }, [tabValue]);

  // Calculate metrics from API data or use fetched summaries
  const totalUsers = dashboardData.totalUsers || users.length;
  const totalRepos = dashboardData.totalRepos || repositories.length;
  const totalBackupsCompleted = dashboardData.totalBackupsCompleted ||
      backups.filter(b => b.backupStatus === "COMPLETE").length;
  const backupCompletionRate = dashboardData.backupCompletionRate ||
      Math.round((totalBackupsCompleted / (totalRepos || 1)) * 100);

  // Use fetched role count or calculate
  const usersByRole = dashboardData.usersByRole || {
    developer: users.filter(u => u.role === "developer").length,
    reviewer: users.filter(u => u.role === "reviewer").length,
    tester: users.filter(u => u.role === "tester").length,
    admin: users.filter(u => u.role === "admin").length,
  };

  // Use fetched department count or calculate
  const reposByDepartment = dashboardData.reposByDepartment ||
      repositories.reduce((acc, repo) => {
        acc[repo.department] = (acc[repo.department] || 0) + 1;
        return acc;
      }, {});

  // Chart data
  const roleChartData = {
    labels: ['Developers', 'Reviewers', 'Testers', 'Admins'],
    datasets: [
      {
        label: 'Users by Role',
        data: [usersByRole.developer, usersByRole.reviewer, usersByRole.tester, usersByRole.admin],
        backgroundColor: [
          'rgba(59, 130, 246, 0.6)', // blue-500
          'rgba(250, 204, 21, 0.6)', // yellow-400
          'rgba(20, 184, 166, 0.6)', // teal-500
          'rgba(139, 92, 246, 0.6)', // violet-500
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(250, 204, 21, 1)',
          'rgba(20, 184, 166, 1)',
          'rgba(139, 92, 246, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const backupChartData = {
    labels: ['Complete', 'Pending'],
    datasets: [
      {
        label: 'Backup Status',
        data: [
          backups.filter(b => b.backupStatus === "COMPLETE").length,
          backups.filter(b => b.backupStatus === "PENDING").length,
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.6)', // green-500
          'rgba(249, 115, 22, 0.6)', // orange-500
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(249, 115, 22, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const departmentChartData = {
    labels: Object.keys(reposByDepartment),
    datasets: [
      {
        label: 'Repositories by Department',
        data: Object.values(reposByDepartment),
        backgroundColor: 'rgba(59, 130, 246, 0.6)', // blue-500
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Tab change handler
  const handleTabChange = (newValue) => {
    setTabValue(newValue);
  };

  // Search handlers
  const handleSearch = async (event) => {
    const query = event.target.value;
    setSearchTerm(query);

    try {
      if (query.trim()) {
        const results = await repositoryApi.searchRepositories(query);
        setRepositories(results.data);
      } else {
        const allRepos = await repositoryApi.getAllRepositories();
        setRepositories(allRepos.data);
      }
    } catch (err) {
      console.error("Error searching:", err);
      setErrorMessages(prev => ({ ...prev, repositories: "Search failed. Using available data." }));
    }
  };

  // Pagination handlers
  const handleChangeRepoPage = (newPage) => {
    setRepoPage(newPage);
  };

  const handleChangeRepoRowsPerPage = (event) => {
    setRepoRowsPerPage(parseInt(event.target.value, 10));
    setRepoPage(0);
  };

  const handleChangeUserPage = (newPage) => {
    setUserPage(newPage);
  };

  const handleChangeUserRowsPerPage = (event) => {
    setUserRowsPerPage(parseInt(event.target.value, 10));
    setUserPage(0);
  };

  const handleChangeBackupPage = (newPage) => {
    setBackupPage(newPage);
  };

  const handleChangeBackupRowsPerPage = (event) => {
    setBackupRowsPerPage(parseInt(event.target.value, 10));
    setBackupPage(0);
  };

  // Repository modal handlers
  const handleOpenRepoModal = (repo = null) => {
    if (repo) {
      setEditingRepo(repo);
      setRepoForm({
        projectName: repo.projectName,
        department: repo.department,
        gitUrl: repo.gitUrl,
        description: repo.description || ''
      });
    } else {
      setEditingRepo(null);
      setRepoForm({
        projectName: '',
        department: '',
        gitUrl: '',
        description: ''
      });
    }
    setRepoModalOpen(true);
  };

  const handleCloseRepoModal = () => {
    setRepoModalOpen(false);
  };

  const handleRepoFormChange = (e) => {
    setRepoForm({
      ...repoForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveRepo = async () => {
    try {
      if (editingRepo) {
        await repositoryApi.updateRepository(editingRepo.id, repoForm);
        setRepositories(repositories.map(r =>
            r.id === editingRepo.id ? {...r, ...repoForm} : r
        ));
      } else {
        const newRepo = await repositoryApi.createRepository(repoForm);
        setRepositories([...repositories, newRepo.data]);
      }
      handleCloseRepoModal();
    } catch (err) {
      console.error("Error saving repository:", err);
      setErrorMessages(prev => ({ ...prev, repositories: "Failed to save repository. The change will be visible in the UI but may not be persisted to the server." }));
      // Still update the UI to keep the app functional in offline mode
      if (editingRepo) {
        setRepositories(repositories.map(r =>
            r.id === editingRepo.id ? {...r, ...repoForm} : r
        ));
      } else {
        const mockNewRepo = {
          ...repoForm,
          id: `repo-${Date.now()}`,
          createdDate: new Date().toISOString().split('T')[0],
          createdBy: 'current-user'
        };
        setRepositories([...repositories, mockNewRepo]);
      }
      handleCloseRepoModal();
    }
  };

  // User modal handlers
  const handleOpenUserModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        username: user.username,
        employeeId: user.employeeId,
        groupName: user.groupName,
        role: user.role
      });
    } else {
      setEditingUser(null);
      setUserForm({
        username: '',
        employeeId: '',
        groupName: '',
        role: 'developer'
      });
    }
    setUserModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setUserModalOpen(false);
  };

  const handleUserFormChange = (e) => {
    setUserForm({
      ...userForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        await userApi.updateUser(editingUser.id, userForm);
        setUsers(users.map(u =>
            u.id === editingUser.id ? {...u, ...userForm} : u
        ));
      } else {
        const newUser = await userApi.createUser(userForm);
        setUsers([...users, newUser.data]);
      }
      handleCloseUserModal();
    } catch (err) {
      console.error("Error saving user:", err);
      setErrorMessages(prev => ({ ...prev, users: "Failed to save user. The change will be visible in the UI but may not be persisted to the server." }));
      // Still update the UI to keep the app functional in offline mode
      if (editingUser) {
        setUsers(users.map(u =>
            u.id === editingUser.id ? {...u, ...userForm} : u
        ));
      } else {
        const mockNewUser = {
          ...userForm,
          id: `user-${Date.now()}`
        };
        setUsers([...users, mockNewUser]);
      }
      handleCloseUserModal();
    }
  };

  // Handle user actions
  const handleDeleteUser = async (userId) => {
    try {
      await userApi.deleteUser(userId);
      setUsers(users.filter(user => user.id !== userId));
    } catch (err) {
      console.error("Error deleting user:", err);
      setErrorMessages(prev => ({ ...prev, users: "Failed to delete user on the server, but removed from the UI." }));
      // Still update the UI to maintain functionality in offline mode
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  // Handle repository actions
  const handleDeleteRepository = async (repoId) => {
    try {
      await repositoryApi.deleteRepository(repoId);
      setRepositories(repositories.filter(repo => repo.id !== repoId));
    } catch (err) {
      console.error("Error deleting repository:", err);
      setErrorMessages(prev => ({ ...prev, repositories: "Failed to delete repository on the server, but removed from the UI." }));
      // Still update the UI to maintain functionality in offline mode
      setRepositories(repositories.filter(repo => repo.id !== repoId));
    }
  };

  // Handle backup actions
  const handleRunBackup = async (repositoryId) => {
    try {
      await backupApi.runBackup(repositoryId);
      // Refresh backups after running a backup
      const updatedBackups = await backupApi.getAllBackups();
      setBackups(updatedBackups.data);
    } catch (err) {
      console.error("Error running backup:", err);
      setErrorMessages(prev => ({ ...prev, backups: "Failed to run backup on the server, but the UI has been updated." }));

      // Update UI optimistically even if the server call failed
      setBackups(backups.map(backup =>
          backup.repositoryId === repositoryId
              ? { ...backup, backupStatus: 'COMPLETE', lastBackupTime: new Date().toISOString() }
              : backup
      ));
    }
  };

  // Get backup status for a repository
  const getBackupStatus = (repoId) => {
    return backups.find(b => b.repositoryId === repoId) || { backupStatus: "UNKNOWN", lastBackupTime: "N/A" };
  };

  // Render error alerts
  const renderErrorAlert = (errorKey) => {
    if (errorMessages[errorKey]) {
      const isOfflineMode = errorMessages[errorKey].includes('offline mode');

      return (
          <div className={`border px-4 py-3 rounded relative mb-4 ${
              isOfflineMode
                  ? "bg-blue-100 border-blue-400 text-blue-700"
                  : "bg-red-100 border-red-400 text-red-700"
          }`}>
            <span className="block sm:inline">{errorMessages[errorKey]}</span>
            <button
                className={`absolute top-0 right-0 px-4 py-3 ${
                    isOfflineMode ? "text-blue-500" : "text-red-500"
                }`}
                onClick={() => setErrorMessages(prev => ({ ...prev, [errorKey]: null }))}
            >
              <span>×</span>
            </button>
          </div>
      );
    }
    return null;
  };

  // Loading state
  if (loading) {
    return (
        <div className="flex justify-center items-center h-screen">
          <div className="text-xl">Loading data...</div>
        </div>
    );
  }

  // Error state
  if (error) {
    return (
        <div className="flex justify-center items-center h-screen">
          <div className="text-xl text-red-600">{error}</div>
        </div>
    );
  }

  return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-blue-600 text-white px-6 py-4 shadow-md">
          <h1 className="text-2xl font-semibold">Git Dashboard</h1>
        </header>

        {/* Main Content */}
        <main className="flex-grow container mx-auto px-4 py-6">
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <ul className="flex flex-wrap -mb-px">
              <li className="mr-2">
                <button
                    className={`inline-flex items-center px-4 py-2 font-medium text-sm rounded-t-lg ${
                        tabValue === 0
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => handleTabChange(0)}
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path>
                    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path>
                  </svg>
                  Overview
                </button>
              </li>
              <li className="mr-2">
                <button
                    className={`inline-flex items-center px-4 py-2 font-medium text-sm rounded-t-lg ${
                        tabValue === 1
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => handleTabChange(1)}
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"></path>
                  </svg>
                  Repositories
                </button>
              </li>
              <li className="mr-2">
                <button
                    className={`inline-flex items-center px-4 py-2 font-medium text-sm rounded-t-lg ${
                        tabValue === 2
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => handleTabChange(2)}
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
                  </svg>
                  Users
                </button>
              </li>
              <li className="mr-2">
                <button
                    className={`inline-flex items-center px-4 py-2 font-medium text-sm rounded-t-lg ${
                        tabValue === 3
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => handleTabChange(3)}
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z"></path>
                    <path d="M9 13h2v5a1 1 0 11-2 0v-5z"></path>
                  </svg>
                  Backups
                </button>
              </li>
            </ul>
          </div>

          {/* Tab Content */}
          {/* Overview Tab */}
          {tabValue === 0 && (
              <div>
                {renderErrorAlert('dashboard')}

                {/* Offline mode indicator for dashboard */}
                {errorMessages.dashboard && errorMessages.dashboard.includes('offline mode') && (
                    <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span>Dashboard is running in offline mode with sample data.</span>
                    </div>
                )}

                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                    <h3 className="text-gray-500 text-lg">Total Git Users</h3>
                    <p className="text-4xl font-bold text-blue-600 mt-2">{totalUsers}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                    <h3 className="text-gray-500 text-lg">Total Repositories</h3>
                    <p className="text-4xl font-bold text-blue-600 mt-2">{totalRepos}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                    <h3 className="text-gray-500 text-lg">Completed Backups</h3>
                    <p className="text-4xl font-bold text-blue-600 mt-2">{totalBackupsCompleted}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                    <h3 className="text-gray-500 text-lg">Backup Rate</h3>
                    <p className="text-4xl font-bold text-blue-600 mt-2">{backupCompletionRate}%</p>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium mb-4">User Roles</h3>
                    <div className="h-60">
                      <Pie data={roleChartData} options={{ maintainAspectRatio: false }} />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium mb-4">Backup Status</h3>
                    <div className="h-60">
                      <Pie data={backupChartData} options={{ maintainAspectRatio: false }} />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium mb-4">Repositories by Department</h3>
                    <div className="h-60">
                      <Bar
                          data={departmentChartData}
                          options={{
                            maintainAspectRatio: false,
                            indexAxis: 'y',
                            plugins: { legend: { display: false } }
                          }}
                      />
                    </div>
                  </div>
                </div>
              </div>
          )}

          {/* Repositories Tab */}
          {tabValue === 1 && (
              <div>
                {renderErrorAlert('repositories')}

                {/* Offline mode indicator for repositories */}
                {errorMessages.repositories && errorMessages.repositories.includes('offline mode') && (
                    <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span>Repositories are displayed in offline mode with sample data.</span>
                    </div>
                )}

                {/* Search box and Add button */}
                <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
                      </svg>
                    </div>
                    <input
                        type="text"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
                        placeholder="Search repositories..."
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                  </div>
                  <button
                      className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 flex items-center"
                      onClick={() => handleOpenRepoModal()}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Add Repository
                  </button>
                </div>

                {/* Repository table */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Git URL</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Backup Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                      {repositories
                          .slice(repoPage * repoRowsPerPage, repoPage * repoRowsPerPage + repoRowsPerPage)
                          .map((repo) => {
                            const backup = getBackupStatus(repo.id);
                            return (
                                <tr key={repo.id}>
                                  <td className="px-6 py-4 whitespace-nowrap">{repo.projectName}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">{repo.department}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                                        {repo.gitUrl}
                                      </div>
                                      <button
                                          className="ml-2 text-gray-500 hover:text-gray-700"
                                          onClick={() => navigator.clipboard.writeText(repo.gitUrl)}
                                      >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path>
                                          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path>
                                        </svg>
                                      </button>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">{repo.createdDate}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">{repo.createdBy}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 text-xs font-semibold rounded-full ${
                                  backup.backupStatus === 'COMPLETE'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {backup.backupStatus}
                              </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex space-x-2">
                                      <button className="text-blue-600 hover:text-blue-900">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path>
                                        </svg>
                                      </button>
                                      <button
                                          className="text-blue-600 hover:text-blue-900"
                                          onClick={() => handleOpenRepoModal(repo)}
                                      >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                                        </svg>
                                      </button>
                                      <button
                                          className="text-red-600 hover:text-red-900"
                                          onClick={() => handleDeleteRepository(repo.id)}
                                      >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path>
                                        </svg>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                          onClick={() => handleChangeRepoPage(Math.max(0, repoPage - 1))}
                          disabled={repoPage === 0}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <button
                          onClick={() => handleChangeRepoPage(Math.min(Math.ceil(repositories.length / repoRowsPerPage) - 1, repoPage + 1))}
                          disabled={repoPage >= Math.ceil(repositories.length / repoRowsPerPage) - 1}
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{repoPage * repoRowsPerPage + 1}</span> to{" "}
                          <span className="font-medium">
                        {Math.min((repoPage + 1) * repoRowsPerPage, repositories.length)}
                      </span>{" "}
                          of <span className="font-medium">{repositories.length}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                              onClick={() => handleChangeRepoPage(0)}
                              disabled={repoPage === 0}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                          >
                            <span className="sr-only">First</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                              onClick={() => handleChangeRepoPage(Math.max(0, repoPage - 1))}
                              disabled={repoPage === 0}
                              className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                          >
                            <span className="sr-only">Previous</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          {/* Page numbers would go here */}
                          <button
                              onClick={() => handleChangeRepoPage(Math.min(Math.ceil(repositories.length / repoRowsPerPage) - 1, repoPage + 1))}
                              disabled={repoPage >= Math.ceil(repositories.length / repoRowsPerPage) - 1}
                              className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                          >
                            <span className="sr-only">Next</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                              onClick={() => handleChangeRepoPage(Math.ceil(repositories.length / repoRowsPerPage) - 1)}
                              disabled={repoPage >= Math.ceil(repositories.length / repoRowsPerPage) - 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                          >
                            <span className="sr-only">Last</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 6.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0zm6 0a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          )}

          {/* Users Tab */}
          {tabValue === 2 && (
              <div>
                {renderErrorAlert('users')}

                {/* Offline mode indicator for users */}
                {errorMessages.users && errorMessages.users.includes('offline mode') && (
                    <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span>Users are displayed in offline mode with sample data.</span>
                    </div>
                )}

                {/* Add User button */}
                <div className="flex justify-end mb-6">
                  <button
                      className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 flex items-center"
                      onClick={() => handleOpenUserModal()}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Add User
                  </button>
                </div>

                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                      {users
                          .slice(userPage * userRowsPerPage, userPage * userRowsPerPage + userRowsPerPage)
                          .map((user) => (
                              <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{user.employeeId}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{user.groupName}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`capitalize px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.role === 'admin'
                                    ? 'bg-red-100 text-red-800'
                                    : user.role === 'developer'
                                        ? 'bg-blue-100 text-blue-800'
                                        : user.role === 'reviewer'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              {user.role}
                            </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex space-x-2">
                                    <button
                                        className="text-blue-600 hover:text-blue-900"
                                        onClick={() => handleOpenUserModal(user)}
                                    >
                                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                                      </svg>
                                    </button>
                                    <button
                                        className="text-red-600 hover:text-red-900"
                                        onClick={() => handleDeleteUser(user.id)}
                                    >
                                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path>
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {/* User pagination - similar to repo pagination */}
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    {/* Pagination controls similar to repositories tab */}
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                          onClick={() => handleChangeUserPage(Math.max(0, userPage - 1))}
                          disabled={userPage === 0}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <button
                          onClick={() => handleChangeUserPage(Math.min(Math.ceil(users.length / userRowsPerPage) - 1, userPage + 1))}
                          disabled={userPage >= Math.ceil(users.length / userRowsPerPage) - 1}
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{userPage * userRowsPerPage + 1}</span> to{" "}
                          <span className="font-medium">
                        {Math.min((userPage + 1) * userRowsPerPage, users.length)}
                      </span>{" "}
                          of <span className="font-medium">{users.length}</span> results
                        </p>
                      </div>
                      {/* Pagination navigation similar to repositories tab */}
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                              onClick={() => handleChangeUserPage(0)}
                              disabled={userPage === 0}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                          >
                            <span className="sr-only">First</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                              onClick={() => handleChangeUserPage(Math.max(0, userPage - 1))}
                              disabled={userPage === 0}
                              className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                          >
                            <span className="sr-only">Previous</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                              onClick={() => handleChangeUserPage(Math.min(Math.ceil(users.length / userRowsPerPage) - 1, userPage + 1))}
                              disabled={userPage >= Math.ceil(users.length / userRowsPerPage) - 1}
                              className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                          >
                            <span className="sr-only">Next</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                              onClick={() => handleChangeUserPage(Math.ceil(users.length / userRowsPerPage) - 1)}
                              disabled={userPage >= Math.ceil(users.length / userRowsPerPage) - 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                          >
                            <span className="sr-only">Last</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 6.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0zm6 0a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          )}

          {/* Backups Tab */}
          {tabValue === 3 && (
              <div>
                {renderErrorAlert('backups')}

                {/* Offline mode indicator for backups */}
                {errorMessages.backups && errorMessages.backups.includes('offline mode') && (
                    <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span>Backups are displayed in offline mode with sample data.</span>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium">Pending Backups</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Repository</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Backup Time</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {backups
                            .filter(b => b.backupStatus === "PENDING")
                            .map((backup) => {
                              const repo = repositories.find(r => r.id === backup.repositoryId);
                              return (
                                  <tr key={backup.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{repo?.projectName || 'Unknown'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{new Date(backup.lastBackupTime).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                  {backup.backupStatus}
                                </span>
                                    </td>
                                  </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium">Latest Completed Backups</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Repository</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Backup Time</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {backups
                            .filter(b => b.backupStatus === "COMPLETE")
                            .sort((a, b) => new Date(b.lastBackupTime) - new Date(a.lastBackupTime))
                            .slice(0, 5)
                            .map((backup) => {
                              const repo = repositories.find(r => r.id === backup.repositoryId);
                              return (
                                  <tr key={backup.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{repo?.projectName || 'Unknown'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{new Date(backup.lastBackupTime).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  {backup.backupStatus}
                                </span>
                                    </td>
                                  </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium">All Backup Status</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Repository</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Backup Time</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                      {backups
                          .slice(backupPage * backupRowsPerPage, backupPage * backupRowsPerPage + backupRowsPerPage)
                          .map((backup) => {
                            const repo = repositories.find(r => r.id === backup.repositoryId);
                            return (
                                <tr key={backup.id}>
                                  <td className="px-6 py-4 whitespace-nowrap">{repo?.projectName || 'Unknown'}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">{repo?.department || 'Unknown'}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">{new Date(backup.lastBackupTime).toLocaleString()}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  backup.backupStatus === 'COMPLETE'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {backup.backupStatus}
                              </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <button
                                        className={`inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md ${
                                            backup.backupStatus === 'COMPLETE'
                                                ? 'text-blue-700 bg-blue-100 hover:bg-blue-200'
                                                : 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200'
                                        }`}
                                        onClick={() => handleRunBackup(backup.repositoryId)}
                                    >
                                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                                      </svg>
                                      {backup.backupStatus === 'COMPLETE' ? 'Backup Again' : 'Run Backup'}
                                    </button>
                                  </td>
                                </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  {/* Backup pagination */}
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                          onClick={() => handleChangeBackupPage(Math.max(0, backupPage - 1))}
                          disabled={backupPage === 0}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <button
                          onClick={() => handleChangeBackupPage(Math.min(Math.ceil(backups.length / backupRowsPerPage) - 1, backupPage + 1))}
                          disabled={backupPage >= Math.ceil(backups.length / backupRowsPerPage) - 1}
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{backupPage * backupRowsPerPage + 1}</span> to{" "}
                          <span className="font-medium">
                        {Math.min((backupPage + 1) * backupRowsPerPage, backups.length)}
                      </span>{" "}
                          of <span className="font-medium">{backups.length}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                              onClick={() => handleChangeBackupPage(0)}
                              disabled={backupPage === 0}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                          >
                            <span className="sr-only">First</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                              onClick={() => handleChangeBackupPage(Math.max(0, backupPage - 1))}
                              disabled={backupPage === 0}
                              className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                          >
                            <span className="sr-only">Previous</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                              onClick={() => handleChangeBackupPage(Math.min(Math.ceil(backups.length / backupRowsPerPage) - 1, backupPage + 1))}
                              disabled={backupPage >= Math.ceil(backups.length / backupRowsPerPage) - 1}
                              className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                          >
                            <span className="sr-only">Next</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                              onClick={() => handleChangeBackupPage(Math.ceil(backups.length / backupRowsPerPage) - 1)}
                              disabled={backupPage >= Math.ceil(backups.length / backupRowsPerPage) - 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                          >
                            <span className="sr-only">Last</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 6.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0zm6 0a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          )}
        </main>

        {/* Repository Modal */}
        {repoModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300 scale-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {editingRepo ? 'Edit Repository' : 'Add Repository'}
                  </h3>
                  <button
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                      onClick={handleCloseRepoModal}
                      aria-label="Close modal"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Project Name
                    </label>
                    <input
                        type="text"
                        id="projectName"
                        name="projectName"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                        value={repoForm.projectName}
                        onChange={handleRepoFormChange}
                        placeholder="Enter project name"
                    />
                  </div>

                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Department
                    </label>
                    <div className="relative">
                      <select
                          id="department"
                          name="department"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none transition-colors duration-200"
                          value={repoForm.department}
                          onChange={handleRepoFormChange}
                      >
                        <option value="">Select a department</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Operations">Operations</option>
                        <option value="Finance">Finance</option>
                        <option value="HR">HR</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="gitUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Git URL
                    </label>
                    <input
                        type="text"
                        id="gitUrl"
                        name="gitUrl"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                        value={repoForm.gitUrl}
                        onChange={handleRepoFormChange}
                        placeholder="https://github.com/organization/repo"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 resize-none"
                        value={repoForm.description}
                        onChange={handleRepoFormChange}
                        placeholder="Brief description of the repository"
                    ></textarea>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                      onClick={handleCloseRepoModal}
                  >
                    Cancel
                  </button>
                  <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 border border-transparent rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      onClick={handleSaveRepo}
                      disabled={!repoForm.projectName || !repoForm.gitUrl || !repoForm.department}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* User Modal */}
        {userModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300 scale-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {editingUser ? 'Edit User' : 'Add User'}
                  </h3>
                  <button
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                      onClick={handleCloseUserModal}
                      aria-label="Close modal"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Username
                    </label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                        value={userForm.username}
                        onChange={handleUserFormChange}
                        placeholder="Enter username"
                    />
                  </div>

                  <div>
                    <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Employee ID
                    </label>
                    <input
                        type="text"
                        id="employeeId"
                        name="employeeId"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                        value={userForm.employeeId}
                        onChange={handleUserFormChange}
                        placeholder="EMP-12345"
                    />
                  </div>

                  <div>
                    <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Group
                    </label>
                    <input
                        type="text"
                        id="groupName"
                        name="groupName"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                        value={userForm.groupName}
                        onChange={handleUserFormChange}
                        placeholder="Team or department name"
                    />
                  </div>

                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Role
                    </label>
                    <div className="relative">
                      <select
                          id="role"
                          name="role"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none transition-colors duration-200"
                          value={userForm.role}
                          onChange={handleUserFormChange}
                      >
                        <option value="developer">Developer</option>
                        <option value="reviewer">Reviewer</option>
                        <option value="tester">Tester</option>
                        <option value="admin">Admin</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                      onClick={handleCloseUserModal}
                  >
                    Cancel
                  </button>
                  <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 border border-transparent rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      onClick={handleSaveUser}
                      disabled={!userForm.username || !userForm.employeeId || !userForm.groupName}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* Footer */}
      <footer>
          <div className="mt-12 border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} TTS Group. All rights reserved.
            </p>
          </div>
      </footer>
      </div>
  );
}

export default GitDashboard;