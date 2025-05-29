import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Database, CheckCircle, GitBranch } from 'lucide-react';
import { dashboardApi } from '../services/svnService';
import UsersPage from '../components/UsersPage';
import BackupPage from '../components/BackupPage';
import RepositoriesPage from '../components/RepositoriesPage';
import GitMigrationPage from '../components/GitMigrationPage';

// Dashboard component with fixed data handling
const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeRepositories: 0,
    backupSuccessRate: 0,
    gitMigrationProgress: 0,
    recentActivity: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Activity data (could be fetched from API in a real implementation)
  const [activityData] = useState([
    { name: 'Jan', commits: 65 },
    { name: 'Feb', commits: 80 },
    { name: 'Mar', commits: 100 },
    { name: 'Apr', commits: 130 },
    { name: 'May', commits: 90 },
    { name: 'Jun', commits: 120 },
  ]);

  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch dashboard metrics - FIXED: extract response.data
        const dashboardResponse = await dashboardApi.getMetrics();
        const dashboardMetrics = dashboardResponse.data;
        
        // Fetch recent activity - FIXED: extract response.data
        const activityResponse = await dashboardApi.getRecentActivity();
        const recentActivity = activityResponse.data || [];
        
        // Update state with fetched data
        setMetrics({
          totalUsers: dashboardMetrics.totalUsers || 0,
          activeRepositories: dashboardMetrics.activeRepositories || 0,
          backupSuccessRate: dashboardMetrics.backupSuccessRate || 0,
          gitMigrationProgress: dashboardMetrics.gitMigrationProgress || 0,
          recentActivity: recentActivity
        });
        
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
        <p>{error}</p>
        <button 
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <main className="p-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <MetricCard 
          title="Total Users" 
          value={metrics.totalUsers.toString()} 
          icon={<User className="w-6 h-6 text-blue-500" />}
          iconBg="bg-blue-100"
        />
        <MetricCard 
          title="Active Repositories" 
          value={metrics.activeRepositories.toString()} 
          icon={<Database className="w-6 h-6 text-teal-500" />}
          iconBg="bg-teal-100"
        />
        <MetricCard 
          title="Backup Status" 
          value={`${Math.round(metrics.backupSuccessRate)}%`} 
          icon={<CheckCircle className="w-6 h-6 text-green-500" />}
          iconBg="bg-green-100"
        />
        <MetricCard 
          title="Git Migration" 
          value={`${Math.round(metrics.gitMigrationProgress)}%`} 
          icon={<GitBranch className="w-6 h-6 text-red-500" />}
          iconBg="bg-red-100"
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Repository Activity Chart */}
        <div className="bg-white p-6 rounded-md shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Repository Activity</h2>
          <div className="h-64 flex items-center justify-center">
            <div className="text-lg text-gray-500">Activity Chart Visualization</div>
          </div>
        </div>

        {/* Migration Progress */}
        <div className="bg-white p-6 rounded-md shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Git Migration Progress</h2>
          <div className="flex items-center justify-center h-64">
            <div className="relative">
              <svg className="w-48 h-48" viewBox="0 0 100 100">
                <circle 
                  className="text-gray-200" 
                  strokeWidth="10" 
                  stroke="currentColor" 
                  fill="transparent" 
                  r="40" 
                  cx="50" 
                  cy="50" 
                />
                <circle 
                  className="text-blue-500" 
                  strokeWidth="10" 
                  strokeDasharray={`${Math.round(metrics.gitMigrationProgress) * 2.51327} ${100 * 2.51327}`} 
                  strokeLinecap="round" 
                  stroke="currentColor" 
                  fill="transparent" 
                  r="40" 
                  cx="50" 
                  cy="50" 
                  transform="rotate(-90 50 50)" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-semibold text-gray-800">{Math.round(metrics.gitMigrationProgress)}%</span>
                <span className="text-sm text-gray-500">Completed</span>
              </div>
            </div>
          </div>
          <div className="flex justify-center space-x-6 mt-6">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
              <span className="text-sm text-gray-600">Migrated</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
              <span className="text-sm text-gray-600">Pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-md shadow">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {metrics.recentActivity && metrics.recentActivity.length > 0 ? (
            metrics.recentActivity.map((activity, index) => (
              <div key={activity.id || index} className="flex items-center">
                <div className={`w-8 h-8 rounded-full ${activity.color || 'bg-blue-500'} flex items-center justify-center mr-3`}>
                  <span className="text-white text-xs">{activity.user?.substring(0, 2).toUpperCase() || 'UN'}</span>
                </div>
                <div>
                  <span className="text-gray-600">{activity.user || 'Unknown'} {activity.action || 'performed an action'} - {activity.time || 'recently'}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-500">No recent activity found</div>
          )}
        </div>
      </div>
    </main>
  );
};

// SvnDashboard component
const SvnDashboard = () => {
  const [activePage, setActivePage] = useState('dashboard');

  const handleNavigation = (page) => {
    setActivePage(page);
  };

  // Render the appropriate page based on the active page state
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'users':
        return <UsersPage />;
      case 'repositories':
        return <RepositoriesPage />;
      case 'backups':
        return <BackupPage />;
      case 'migration':
        return <GitMigrationPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-52 bg-gray-800 text-white">
        <div className="p-4 h-16 bg-gray-900 flex items-center">
          <span className="text-xl font-semibold">SVN Dashboard</span>
        </div>
        <nav className="mt-6">
          <NavItem 
            icon={<Calendar className="w-5 h-5" />} 
            title="Dashboard" 
            active={activePage === 'dashboard'} 
            onClick={() => handleNavigation('dashboard')} 
          />
          <NavItem 
            icon={<User className="w-5 h-5" />} 
            title="Users" 
            active={activePage === 'users'} 
            onClick={() => handleNavigation('users')} 
          />
          <NavItem 
            icon={<Database className="w-5 h-5" />} 
            title="Repositories" 
            active={activePage === 'repositories'} 
            onClick={() => handleNavigation('repositories')} 
          />
          <NavItem 
            icon={<CheckCircle className="w-5 h-5" />} 
            title="Backups" 
            active={activePage === 'backups'} 
            onClick={() => handleNavigation('backups')} 
          />
          <NavItem 
            icon={<GitBranch className="w-5 h-5" />} 
            title="Git Migration" 
            active={activePage === 'migration'} 
            onClick={() => handleNavigation('migration')} 
          />
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow h-16 flex items-center justify-between px-6">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-800">SVN Management Dashboard</h1>
          </div>
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-gray-500 mr-2" />
            <span className="text-sm text-gray-600">April 30, 2025</span>
          </div>
        </header>

        {/* Page Content */}
        {renderPage()}
      </div>
    </div>
  );
};

const NavItem = ({ icon, title, active, onClick }) => {
  return (
    <div 
      className={`flex items-center px-6 py-3 cursor-pointer ${active ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
      onClick={onClick}
    >
      {icon}
      <span className="ml-3">{title}</span>
    </div>
  );
};

const MetricCard = ({ title, value, icon, iconBg }) => {
  return (
    <div className="bg-white p-6 rounded-md shadow flex items-center justify-between">
      <div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center`}>
        {icon}
      </div>
    </div>
  );
};  

export default SvnDashboard;