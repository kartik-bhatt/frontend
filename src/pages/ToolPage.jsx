import React from 'react';

const tools = [
  {
    name: 'Git',
    description: 'Manage your Git repositories, members, and backup status.',
    color: 'bg-red-100',
    textColor: 'text-red-700'
  },
  {
    name: 'Bugzilla',
    description: 'Track bugs, assign components, and monitor status updates.',
    color: 'bg-yellow-100',
    textColor: 'text-yellow-700'
  },
  {
    name: 'SVN',
    description: 'Manage SVN repositories, users, and handle Git migration.',
    color: 'bg-blue-100',
    textColor: 'text-blue-700'
  },
  {
    name: 'Infra',
    description: 'Monitor infrastructure, virtual machines, and downtime logs.',
    color: 'bg-green-100',
    textColor: 'text-green-700'
  },
];

const ToolPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-indigo-700 mb-6">Tools & Services</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        {tools.map((tool) => (
          <div
            key={tool.name}
            className={`p-6 rounded-lg shadow-md ${tool.color} border`}
          >
            <h2 className={`text-xl font-semibold mb-2 ${tool.textColor}`}>{tool.name}</h2>
            <p className="text-gray-700 mb-4">{tool.description}</p>
            <button className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700">
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToolPage;
