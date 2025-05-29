import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Menu, X, Headphones, GitBranch, Bug, Server, Code, Mail, MapPin, Phone } from 'lucide-react';

const HomePage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero'); // 'hero', 'tools', or 'about'
  const navigate = useNavigate();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleGetStarted = () => {
    navigate('/login');
  };

  const showSection = (section) => {
    setActiveSection(section);
  };

  const tools = [
    {
      name: 'Git',
      description: 'Manage your Git repositories, members, and backup status.',
      color: 'bg-red-100',
      textColor: 'text-red-700',
      icon: <GitBranch className="h-6 w-6" />
    },
    {
      name: 'Bugzilla',
      description: 'Track bugs, assign components, and monitor status updates.',
      color: 'bg-yellow-100',
      textColor: 'text-yellow-700',
      icon: <Bug className="h-6 w-6" />
    },
    {
      name: 'SVN',
      description: 'Manage SVN repositories, users, and handle Git migration.',
      color: 'bg-blue-100',
      textColor: 'text-blue-700',
      icon: <Code className="h-6 w-6" />
    },
    {
      name: 'Infra',
      description: 'Monitor infrastructure, virtual machines, and downtime logs.',
      color: 'bg-green-100',
      textColor: 'text-green-700',
      icon: <Server className="h-6 w-6" />
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Headphones className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-xl font-semibold text-gray-900">TTS Group</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button 
                  onClick={() => showSection('hero')}
                  className={`${activeSection === 'hero' ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Home
                </button>
                <button 
                  onClick={() => showSection('tools')}
                  className={`${activeSection === 'tools' ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Tools
                </button>
                <button 
                  onClick={() => showSection('about')}
                  className={`${activeSection === 'about' ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  About
                </button>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="ml-3 relative">
                <button
                  onClick={() => navigate('/login')}
                  className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </button>
              </div>
            </div>
            <div className="-mr-2 flex items-center sm:hidden">
              <button
                onClick={toggleMobileMenu}
                type="button"
                className="bg-white inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              <button
                onClick={() => {showSection('hero'); setIsMobileMenuOpen(false);}}
                className={`${activeSection === 'hero' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left`}
              >
                Home
              </button>
              <button
                onClick={() => {showSection('tools'); setIsMobileMenuOpen(false);}}
                className={`${activeSection === 'tools' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left`}
              >
                Tools
              </button>
              <button
                onClick={() => {showSection('about'); setIsMobileMenuOpen(false);}}
                className={`${activeSection === 'about' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left`}
              >
                About
              </button>
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Content Sections */}
      <div className="flex-grow">
        {activeSection === 'hero' && (
          <div className="bg-gray-50">
            <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
              <div className="text-center">
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block">Welcome to</span>
                  <span className="block text-indigo-600">TTS Group Dashboard</span>
                </h1>
                <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                  Your centralized platform for managing all DevOps tools, analytics, and team collaboration.
                </p>
                <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                  <div className="rounded-md shadow">
                    <button
                      onClick={handleGetStarted}
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                    >
                      Get started
                    </button>
                  </div>
                  <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                    <button
                      onClick={() => showSection('about')}
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                    >
                      Learn more
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tools Section */}
        {activeSection === 'tools' && (
          <div className="bg-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-extrabold text-gray-900">Our Tools & Services</h2>
                <p className="mt-4 text-lg text-gray-500">
                  Access everything you need from our comprehensive suite of DevOps tools
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                {tools.map((tool) => (
                  <div
                    key={tool.name}
                    className={`p-6 rounded-lg shadow-md ${tool.color} border transition-transform hover:scale-105`}
                  >
                    <div className={`${tool.textColor} mb-4`}>
                      {tool.icon}
                    </div>
                    <h2 className={`text-xl font-semibold mb-2 ${tool.textColor}`}>{tool.name}</h2>
                    <p className="text-gray-700 mb-4">{tool.description}</p>
                    <button className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700">
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* About Section */}
        {activeSection === 'about' && (
          <div className="bg-gray-50 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="lg:text-center">
                <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">About</h2>
                <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                  Streamline Your DevOps Workflow
                </p>
                <p className="mt-4 max-w-3xl mx-auto text-xl text-gray-500 lg:mx-auto">
                  The TTS Dashboard provides a centralized interface for managing all your development and infrastructure tools in one place, enabling teams to work more efficiently and collaboratively.
                </p>
              </div>

              <div className="mt-20">
                <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-12">
                  <div className="relative">
                    <dt>
                      <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                        <GitBranch className="h-6 w-6" />
                      </div>
                      <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Git Repository Management</p>
                    </dt>
                    <dd className="mt-2 ml-16 text-base text-gray-500">
                      Track and manage all your Git repositories from a single dashboard. Monitor pull requests, code reviews, and repository health metrics.
                    </dd>
                  </div>

                  <div className="relative">
                    <dt>
                      <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                        <Code className="h-6 w-6" />
                      </div>
                      <p className="ml-16 text-lg leading-6 font-medium text-gray-900">SVN Management</p>
                    </dt>
                    <dd className="mt-2 ml-16 text-base text-gray-500">
                      Maintain your SVN repositories with ease. Manage users, monitor repository status, and streamline the migration process from SVN to Git.
                    </dd>
                  </div>

                  <div className="relative">
                    <dt>
                      <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                        <Bug className="h-6 w-6" />
                      </div>
                      <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Bugzilla Integration</p>
                    </dt>
                    <dd className="mt-2 ml-16 text-base text-gray-500">
                      Keep track of bugs and issues with our seamless Bugzilla integration. Assign components, update statuses, and monitor critical issues.
                    </dd>
                  </div>

                  <div className="relative">
                    <dt>
                      <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                        <Server className="h-6 w-6" />
                      </div>
                      <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Infrastructure Monitoring</p>
                    </dt>
                    <dd className="mt-2 ml-16 text-base text-gray-500">
                      Monitor and manage your infrastructure resources including virtual machines, servers, and network components. Track uptime and resource utilization.
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}
      </div>

      

      {/* Improved Footer */}
      <footer>
          <div className="mt-12 border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} TTS Group. All rights reserved.
            </p>
          </div>
      </footer>
    </div>
  );
};

export default HomePage;