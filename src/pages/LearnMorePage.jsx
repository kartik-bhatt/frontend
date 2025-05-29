import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, GitBranch, Server, Bug, Database, Code, Users, Shield, ChevronRight } from 'lucide-react';

const LearnMorePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-indigo-600 hover:text-indigo-800"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <div className="bg-indigo-700">
          <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
              About TTS Dashboard
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-indigo-200">
              A comprehensive platform that simplifies DevOps management and enhances team collaboration
            </p>
          </div>
        </div>

        {/* Overview Section */}
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Overview</h2>
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
                  Track and manage all your Git repositories from a single dashboard. Monitor pull requests, code reviews, and repository health metrics. Configure access controls and branch protection rules easily.
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
                  Maintain your SVN repositories with ease. Manage users, monitor repository status, and streamline the migration process from SVN to Git with built-in migration tools and progress tracking.
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
                  Keep track of bugs and issues with our seamless Bugzilla integration. Assign components, update statuses, and monitor critical issues. Create custom workflows and visualization dashboards to prioritize your team's work.
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
                  Monitor and manage your infrastructure resources including virtual machines, servers, and network components. Track uptime, resource utilization, and receive alerts for any potential issues before they impact your services.
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-gray-100 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Features</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Everything You Need in One Place
              </p>
            </div>

            <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-3">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
                <div className="mb-4 text-indigo-500">
                  <Database className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Unified Management</h3>
                <p className="text-gray-600">
                  Access all your tools from a single dashboard with consistent UI across different systems.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
                <div className="mb-4 text-indigo-500">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
                <p className="text-gray-600">
                  Enhance team productivity with shared workspaces, notification systems, and customizable dashboards.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
                <div className="mb-4 text-indigo-500">
                  <Shield className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Security & Compliance</h3>
                <p className="text-gray-600">
                  Maintain security with centralized access control, audit logs, and compliance reporting.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Section */}
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">
            How It Works
          </h2>

          <div className="relative">
            {/* Line connecting the steps */}
            <div className="hidden md:block absolute top-0 left-1/2 w-0.5 h-full bg-indigo-200 transform -translate-x-1/2" />

            {/* Step 1 */}
            <div className="relative md:flex md:items-center mb-12">
              <div className="md:w-1/2 md:pr-8 md:text-right">
                <h3 className="text-lg font-medium text-indigo-600">Step 1</h3>
                <p className="mt-2 text-xl font-bold tracking-tight text-gray-900">Access Your Dashboard</p>
                <p className="mt-3 text-base text-gray-500">
                  Log in to your TTS Dashboard to get a comprehensive overview of all your tools and systems in one place.
                </p>
              </div>
              <div className="mt-4 md:mt-0 md:w-1/2 md:pl-8 md:flex md:justify-start">
                <div className="h-12 w-12 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                  <span className="text-lg font-bold">1</span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative md:flex md:items-center mb-12">
              <div className="md:w-1/2 md:pr-8 md:text-right md:order-last">
                <h3 className="text-lg font-medium text-indigo-600">Step 2</h3>
                <p className="mt-2 text-xl font-bold tracking-tight text-gray-900">Select Your Tool</p>
                <p className="mt-3 text-base text-gray-500">
                  Choose which DevOps tool you want to work with - Git, SVN, Bugzilla, or Infrastructure management.
                </p>
              </div>
              <div className="mt-4 md:mt-0 md:w-1/2 md:pl-8 md:flex md:justify-end md:order-first">
                <div className="h-12 w-12 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                  <span className="text-lg font-bold">2</span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative md:flex md:items-center">
              <div className="md:w-1/2 md:pr-8 md:text-right">
                <h3 className="text-lg font-medium text-indigo-600">Step 3</h3>
                <p className="mt-2 text-xl font-bold tracking-tight text-gray-900">Manage and Monitor</p>
                <p className="mt-3 text-base text-gray-500">
                  Perform all management tasks, view analytics, and generate reports without switching between multiple platforms.
                </p>
              </div>
              <div className="mt-4 md:mt-0 md:w-1/2 md:pl-8 md:flex md:justify-start">
                <div className="h-12 w-12 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                  <span className="text-lg font-bold">3</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-indigo-700">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              <span className="block">Ready to get started?</span>
              <span className="block text-indigo-200">Explore the TTS Dashboard today.</span>
            </h2>
            <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
              <div className="inline-flex rounded-md shadow">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50"
                >
                  Get Started
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
              <div className="ml-3 inline-flex rounded-md shadow">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-base text-gray-400">
              &copy; {new Date().getFullYear()} TTS Group. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LearnMorePage;