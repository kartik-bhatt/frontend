import React, { useState } from 'react';
import { 
  Server, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Search,
  Database,
  Activity,
  Grid,
  RefreshCw
} from 'lucide-react';

// Sample initial data
const initialServers = [
  {
    id: "srv-001",
    name: "api-prod-east-01",
    ipAddress: "10.0.5.12",
    status: "running",
    environment: "production",
    region: "us-east-1",
    serverType: "VM",
    operatingSystem: "Ubuntu",
    osVersion: "22.04 LTS",
    createdAt: "2024-08-15T12:00:00Z",
    updatedAt: "2025-04-02T09:17:23Z",
    hardware: {
      cpu: {
        model: "Intel Xeon E5-2680",
        cores: 8,
        speed: "2.4 GHz"
      },
      memory: {
        total: 32,
        used: 17.2
      },
      storage: [
        {
          name: "/dev/sda",
          capacity: 500,
          type: "SSD",
          used: 289
        }
      ],
      networkInterfaces: [
        {
          name: "eth0",
          bandwidth: "1 Gbps",
          publicIP: "54.32.101.143",
          privateIP: "10.0.5.12"
        }
      ]
    }
  },
  {
    id: "srv-002",
    name: "web-prod-west-01",
    ipAddress: "10.0.6.45",
    status: "maintenance",
    environment: "production",
    region: "us-west-1",
    serverType: "VM",
    operatingSystem: "Amazon Linux",
    osVersion: "2023.1",
    createdAt: "2024-09-22T08:30:00Z",
    updatedAt: "2025-03-15T16:42:10Z",
    hardware: {
      cpu: {
        model: "AMD EPYC 7002",
        cores: 16,
        speed: "3.0 GHz"
      },
      memory: {
        total: 64,
        used: 28.5
      },
      storage: [
        {
          name: "/dev/sda",
          capacity: 1000,
          type: "SSD",
          used: 412
        }
      ],
      networkInterfaces: [
        {
          name: "eth0",
          bandwidth: "10 Gbps",
          publicIP: "35.162.45.201",
          privateIP: "10.0.6.45"
        }
      ]
    }
  },
  {
    id: "srv-003",
    name: "db-prod-central-01",
    ipAddress: "10.0.8.72",
    status: "running",
    environment: "production",
    region: "us-central-1",
    serverType: "Bare Metal",
    operatingSystem: "CentOS",
    osVersion: "8.5",
    createdAt: "2024-07-10T15:45:00Z",
    updatedAt: "2025-04-01T11:28:37Z",
    hardware: {
      cpu: {
        model: "Intel Xeon Gold 6330",
        cores: 32,
        speed: "2.8 GHz"
      },
      memory: {
        total: 256,
        used: 198.2
      },
      storage: [
        {
          name: "/dev/sda",
          capacity: 2000,
          type: "SSD",
          used: 1842
        }
      ],
      networkInterfaces: [
        {
          name: "eth0",
          bandwidth: "25 Gbps",
          publicIP: "None (Private)",
          privateIP: "10.0.8.72"
        }
      ]
    }
  }
];

const initialApplications = [
  {
    id: "app-001",
    name: "Payment API",
    type: "REST API",
    description: "Handles all payment processing for the platform",
    techStack: "Node.js, Express",
    repositoryUrl: "github.com/company/payment-api",
    owner: "Payments Team",
    version: "3.5.2",
    status: "healthy",
    deployedOn: ["srv-001"],
    deployedAt: "2025-03-28T14:32:18Z",
    dependencies: [
      "Redis Cache",
      "PostgreSQL Database",
      "User Authentication Service"
    ],
    environmentVariables: {
      "API_KEY": "********",
      "DATABASE_URL": "postgres://user:pass@db-host:5432/payments",
      "REDIS_URL": "redis://redis-host:6379"
    }
  },
  {
    id: "app-002",
    name: "User Authentication Service",
    type: "Microservice",
    description: "Handles user authentication and authorization",
    techStack: "Java, Spring Boot",
    repositoryUrl: "github.com/company/auth-service",
    owner: "Security Team",
    version: "2.1.0",
    status: "degraded",
    deployedOn: ["srv-001", "srv-002"],
    deployedAt: "2025-04-01T09:12:54Z",
    dependencies: [
      "PostgreSQL Database",
      "Redis Cache"
    ],
    environmentVariables: {
      "JWT_SECRET": "********",
      "DATABASE_URL": "jdbc:postgresql://db-host:5432/users",
      "CACHE_URL": "redis://redis-host:6379"
    }
  },
  {
    id: "app-003",
    name: "Customer Database",
    type: "Database",
    description: "Primary customer data store",
    techStack: "PostgreSQL 15",
    repositoryUrl: "N/A",
    owner: "Data Team",
    version: "15.2",
    status: "healthy",
    deployedOn: ["srv-003"],
    deployedAt: "2025-02-15T08:45:30Z",
    dependencies: [],
    environmentVariables: {
      "POSTGRES_USER": "admin",
      "POSTGRES_PASSWORD": "********",
      "POSTGRES_DB": "customers"
    }
  }
];

// Status Badge Component
const StatusBadge = ({ status, type = "server" }) => {
  const getColorClass = () => {
    if (type === "server") {
      switch (status) {
        case "running": return "bg-green-100 text-green-800";
        case "stopped": return "bg-gray-100 text-gray-800";
        case "maintenance": return "bg-blue-100 text-blue-800";
        case "error": return "bg-red-100 text-red-800";
        default: return "bg-gray-100 text-gray-800";
      }
    } else {
      switch (status) {
        case "healthy": return "bg-green-100 text-green-800";
        case "degraded": return "bg-yellow-100 text-yellow-800";
        case "critical": return "bg-orange-100 text-orange-800";
        case "offline": return "bg-red-100 text-red-800";
        default: return "bg-gray-100 text-gray-800";
      }
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColorClass()}`}>
      {status}
    </span>
  );
};

// Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] my-4">
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10 rounded-t-lg">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1 max-h-[calc(90vh-8rem)]">
          {children}
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Confirmation</h3>
          <p className="text-sm text-gray-500 mb-4">
            Are you sure you want to delete <span className="font-semibold">{itemName}</span>? 
            This action cannot be undone.
          </p>
          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Server Form Component
const ServerForm = ({ server, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(
    server || {
      name: "",
      ipAddress: "",
      status: "running",
      environment: "production",
      region: "us-east-1",
      serverType: "VM",
      operatingSystem: "Ubuntu",
      osVersion: "",
      hardware: {
        cpu: {
          model: "",
          cores: 4,
          speed: ""
        },
        memory: {
          total: 16,
          used: 0
        },
        storage: [
          {
            name: "/dev/sda",
            capacity: 500,
            type: "SSD",
            used: 0
          }
        ],
        networkInterfaces: [
          {
            name: "eth0",
            bandwidth: "1 Gbps",
            publicIP: "",
            privateIP: ""
          }
        ]
      }
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      // Handle nested properties
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleHardwareChange = (e) => {
    const [hardware, component, property] = e.target.name.split('.');
    const value = e.target.value;
    
    setFormData({
      ...formData,
      hardware: {
        ...formData.hardware,
        [component]: {
          ...formData.hardware[component],
          [property]: component === 'cpu' && property === 'cores' ? parseInt(value, 10) : value
        }
      }
    });
  };

  const handleStorageChange = (e, index) => {
    const { name, value } = e.target;
    const storage = [...formData.hardware.storage];
    const numericValue = name === 'capacity' || name === 'used' ? parseInt(value, 10) : value;
    
    storage[index] = {
      ...storage[index],
      [name]: numericValue
    };
    
    setFormData({
      ...formData,
      hardware: {
        ...formData.hardware,
        storage
      }
    });
  };

  const handleNetworkChange = (e, index) => {
    const { name, value } = e.target;
    const networkInterfaces = [...formData.hardware.networkInterfaces];
    
    networkInterfaces[index] = {
      ...networkInterfaces[index],
      [name]: value
    };
    
    setFormData({
      ...formData,
      hardware: {
        ...formData.hardware,
        networkInterfaces
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="space-y-6 overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">IP Address</label>
          <input
            type="text"
            name="ipAddress"
            value={formData.ipAddress}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
          >
            <option value="running">Running</option>
            <option value="stopped">Stopped</option>
            <option value="maintenance">Maintenance</option>
            <option value="error">Error</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Environment</label>
          <select
            name="environment"
            value={formData.environment}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
          >
            <option value="development">Development</option>
            <option value="staging">Staging</option>
            <option value="production">Production</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Region</label>
          <select
            name="region"
            value={formData.region}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
          >
            <option value="us-east-1">US East 1</option>
            <option value="us-west-1">US West 1</option>
            <option value="us-central-1">US Central 1</option>
            <option value="eu-west-1">EU West 1</option>
            <option value="ap-southeast-1">AP Southeast 1</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Server Type</label>
          <select
            name="serverType"
            value={formData.serverType}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
          >
            <option value="VM">VM</option>
            <option value="Container">Container</option>
            <option value="Bare Metal">Bare Metal</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Operating System</label>
          <select
            name="operatingSystem"
            value={formData.operatingSystem}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
          >
            <option value="Ubuntu">Ubuntu</option>
            <option value="CentOS">CentOS</option>
            <option value="Windows Server">Windows Server</option>
            <option value="Amazon Linux">Amazon Linux</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">OS Version</label>
          <input
            type="text"
            name="osVersion"
            value={formData.osVersion}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
          />
        </div>
      </div>

      <h3 className="text-lg font-medium text-gray-700 mt-6">Hardware Configuration</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">CPU Model</label>
          <input
            type="text"
            name="hardware.cpu.model"
            value={formData.hardware.cpu.model}
            onChange={handleHardwareChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">CPU Cores</label>
          <input
            type="number"
            name="hardware.cpu.cores"
            value={formData.hardware.cpu.cores}
            onChange={handleHardwareChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            min="1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">CPU Speed</label>
          <input
            type="text"
            name="hardware.cpu.speed"
            value={formData.hardware.cpu.speed}
            onChange={handleHardwareChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            placeholder="e.g. 2.4 GHz"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Memory Total (GB)</label>
          <input
            type="number"
            name="hardware.memory.total"
            value={formData.hardware.memory.total}
            onChange={handleHardwareChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            min="1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Memory Used (GB)</label>
          <input
            type="number"
            name="hardware.memory.used"
            value={formData.hardware.memory.used}
            onChange={handleHardwareChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            min="0"
            step="0.1"
          />
        </div>
      </div>

      <h4 className="text-md font-medium text-gray-700">Storage</h4>
      {formData.hardware.storage.map((disk, index) => (
        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 pl-4 border-l-2 border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700">Disk Name</label>
            <input
              type="text"
              name="name"
              value={disk.name}
              onChange={(e) => handleStorageChange(e, index)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Capacity (GB)</label>
            <input
              type="number"
              name="capacity"
              value={disk.capacity}
              onChange={(e) => handleStorageChange(e, index)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              name="type"
              value={disk.type}
              onChange={(e) => handleStorageChange(e, index)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            >
              <option value="SSD">SSD</option>
              <option value="HDD">HDD</option>
              <option value="NVMe">NVMe</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Used (GB)</label>
            <input
              type="number"
              name="used"
              value={disk.used}
              onChange={(e) => handleStorageChange(e, index)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              min="0"
            />
          </div>
        </div>
      ))}

      <h4 className="text-md font-medium text-gray-700">Network</h4>
      {formData.hardware.networkInterfaces.map((nic, index) => (
        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 pl-4 border-l-2 border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700">NIC Name</label>
            <input
              type="text"
              name="name"
              value={nic.name}
              onChange={(e) => handleNetworkChange(e, index)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bandwidth</label>
            <input
              type="text"
              name="bandwidth"
              value={nic.bandwidth}
              onChange={(e) => handleNetworkChange(e, index)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              placeholder="e.g. 1 Gbps"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Public IP</label>
            <input
              type="text"
              name="publicIP"
              value={nic.publicIP}
              onChange={(e) => handleNetworkChange(e, index)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Private IP</label>
            <input
              type="text"
              name="privateIP"
              value={nic.privateIP}
              onChange={(e) => handleNetworkChange(e, index)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            />
          </div>
        </div>
      ))}

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {server ? 'Update Server' : 'Create Server'}
        </button>
      </div>
    </div>
  );
};

// Application Form Component
const ApplicationForm = ({ application, servers, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(
    application || {
      name: "",
      type: "REST API",
      description: "",
      techStack: "",
      repositoryUrl: "",
      owner: "",
      version: "1.0.0",
      status: "healthy",
      deployedOn: [],
      dependencies: [],
      environmentVariables: {}
    }
  );

  const [newDependency, setNewDependency] = useState("");
  const [newEnvKey, setNewEnvKey] = useState("");
  const [newEnvValue, setNewEnvValue] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleServerSelection = (e) => {
    const serverId = e.target.value;
    const isChecked = e.target.checked;
    
    if (isChecked) {
      setFormData({
        ...formData,
        deployedOn: [...formData.deployedOn, serverId]
      });
    } else {
      setFormData({
        ...formData,
        deployedOn: formData.deployedOn.filter(id => id !== serverId)
      });
    }
  };

  const addDependency = () => {
    if (newDependency.trim()) {
      setFormData({
        ...formData,
        dependencies: [...formData.dependencies, newDependency]
      });
      setNewDependency("");
    }
  };

  const removeDependency = (index) => {
    const updatedDependencies = [...formData.dependencies];
    updatedDependencies.splice(index, 1);
    setFormData({
      ...formData,
      dependencies: updatedDependencies
    });
  };

  const addEnvironmentVariable = () => {
    if (newEnvKey.trim()) {
      setFormData({
        ...formData,
        environmentVariables: {
          ...formData.environmentVariables,
          [newEnvKey]: newEnvValue
        }
      });
      setNewEnvKey("");
      setNewEnvValue("");
    }
  };

  const removeEnvironmentVariable = (key) => {
    const updatedEnvVars = { ...formData.environmentVariables };
    delete updatedEnvVars[key];
    setFormData({
      ...formData,
      environmentVariables: updatedEnvVars
    });
  };

  const handleSubmit = () => {
    // Set current timestamp for deployedAt
    const updatedFormData = {
      ...formData,
      deployedAt: new Date().toISOString()
    };
    onSubmit(updatedFormData);
  };

  return (
    <div className="space-y-6 overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
          >
            <option value="REST API">REST API</option>
            <option value="Microservice">Microservice</option>
            <option value="Web Application">Web Application</option>
            <option value="Database">Database</option>
            <option value="Background Service">Background Service</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Tech Stack</label>
          <input
            type="text"
            name="techStack"
            value={formData.techStack}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            placeholder="e.g. Node.js, Express"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Repository URL</label>
          <input
            type="text"
            name="repositoryUrl"
            value={formData.repositoryUrl}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Owner</label>
          <input
            type="text"
            name="owner"
            value={formData.owner}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Version</label>
          <input
            type="text"
            name="version"
            value={formData.version}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
          >
            <option value="healthy">Healthy</option>
            <option value="degraded">Degraded</option>
            <option value="critical">Critical</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      <div>
        <h4 className="text-md font-medium text-gray-700 mb-2">Deployed On</h4>
        <div className="bg-gray-50 p-3 rounded-lg">
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {servers.map(server => (
              <li key={server.id}>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    value={server.id}
                    checked={formData.deployedOn.includes(server.id)}
                    onChange={handleServerSelection}
                    className="rounded text-blue-600"
                  />
                  <span>{server.name} ({server.ipAddress})</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h4 className="text-md font-medium text-gray-700 mb-2">Dependencies</h4>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex space-x-2 mb-3">
            <input
              type="text"
              value={newDependency}
              onChange={(e) => setNewDependency(e.target.value)}
              placeholder="Add a dependency"
              className="flex-1 rounded-md border-gray-300 shadow-sm p-2 border"
            />
            <button
              type="button"
              onClick={addDependency}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          <ul className="space-y-2">
            {formData.dependencies.map((dep, index) => (
              <li key={index} className="flex justify-between items-center bg-white p-2 rounded-md">
                <span>{dep}</span>
                <button
                  type="button"
                  onClick={() => removeDependency(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h4 className="text-md font-medium text-gray-700 mb-2">Environment Variables</h4>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex space-x-2 mb-3">
            <input
              type="text"
              value={newEnvKey}
              onChange={(e) => setNewEnvKey(e.target.value)}
              placeholder="Key"
              className="flex-1 rounded-md border-gray-300 shadow-sm p-2 border"
            />
            <input
              type="text"
              value={newEnvValue}
              onChange={(e) => setNewEnvValue(e.target.value)}
              placeholder="Value"
              className="flex-1 rounded-md border-gray-300 shadow-sm p-2 border"
            />
            <button
              type="button"
              onClick={addEnvironmentVariable}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          <ul className="space-y-2">
            {Object.entries(formData.environmentVariables).map(([key, value]) => (
              <li key={key} className="flex justify-between items-center bg-white p-2 rounded-md">
                <span className="font-medium">{key}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">{value}</span>
                  <button
                    type="button"
                    onClick={() => removeEnvironmentVariable(key)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {application ? 'Update Application' : 'Create Application'}
        </button>
      </div>
    </div>
  );
};

// Usage meter component
const UsageMeter = ({ used, total, label }) => {
  const percentage = (used / total) * 100;
  const getColorClass = () => {
    if (percentage < 60) return "bg-green-500";
    if (percentage < 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="mt-1">
      <div className="flex justify-between text-xs text-gray-600">
        <span>{label}</span>
        <span>{used} / {total} GB ({percentage.toFixed(1)}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
        <div 
          className={`h-2.5 rounded-full ${getColorClass()}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

// Server List Component
const ServerList = ({ servers, onEdit, onDelete, onView }) => {
  return (
    <div className="space-y-4">
      {servers.map(server => (
        <div key={server.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-4">
                  <Server className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{server.name}</h3>
                  <div className="flex items-center mt-1 space-x-2">
                    <StatusBadge status={server.status} />
                    <span className="text-sm text-gray-500">{server.ipAddress}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {server.operatingSystem} {server.osVersion} • {server.region} • {server.environment}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => onView(server)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => onEdit(server)}
                  className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => onDelete(server)}
                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Application List Component
const ApplicationList = ({ applications, servers, onEdit, onDelete, onView }) => {
  const getServerNames = (serverIds) => {
    return serverIds.map(id => {
      const server = servers.find(s => s.id === id);
      return server ? server.name : 'Unknown';
    }).join(', ');
  };

  return (
    <div className="space-y-4">
      {applications.map(app => (
        <div key={app.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-4">
                  {app.type === 'Database' ? (
                    <Database className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Activity className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{app.name}</h3>
                  <div className="flex items-center mt-1 space-x-2">
                    <StatusBadge status={app.status} type="application" />
                    <span className="text-sm text-gray-500">{app.type}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {app.techStack} • v{app.version} • Deployed on: {getServerNames(app.deployedOn)}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => onView(app)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => onEdit(app)}
                  className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => onDelete(app)}
                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Server Detail View
const ServerDetailView = ({ server, applications, onClose }) => {
  const deployedApps = applications.filter(app => app.deployedOn.includes(server.id));

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Server Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">ID</p>
            <p className="text-sm font-medium">{server.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">IP Address</p>
            <p className="text-sm font-medium">{server.ipAddress}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <StatusBadge status={server.status} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Environment</p>
            <p className="text-sm font-medium">{server.environment}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Region</p>
            <p className="text-sm font-medium">{server.region}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Server Type</p>
            <p className="text-sm font-medium">{server.serverType}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Operating System</p>
            <p className="text-sm font-medium">{server.operatingSystem} {server.osVersion}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Last Updated</p>
            <p className="text-sm font-medium">{new Date(server.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Hardware</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">CPU</p>
              <p className="text-sm font-medium">{server.hardware.cpu.model} ({server.hardware.cpu.cores} cores @ {server.hardware.cpu.speed})</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Network</p>
              <p className="text-sm font-medium">{server.hardware.networkInterfaces[0].bandwidth}</p>
            </div>
          </div>
          
          <UsageMeter 
            used={server.hardware.memory.used} 
            total={server.hardware.memory.total} 
            label="Memory" 
          />
          
          {server.hardware.storage.map((disk, index) => (
            <UsageMeter 
              key={index}
              used={disk.used} 
              total={disk.capacity} 
              label={`Storage (${disk.name})`} 
            />
          ))}

          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">Network Interfaces</p>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bandwidth
                  </th>
                  <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Public IP
                  </th>
                  <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Private IP
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {server.hardware.networkInterfaces.map((nic, index) => (
                  <tr key={index}>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">{nic.name}</td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">{nic.bandwidth}</td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">{nic.publicIP || '-'}</td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">{nic.privateIP}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Deployed Applications ({deployedApps.length})</h3>
        {deployedApps.length > 0 ? (
          <div className="space-y-3">
            {deployedApps.map(app => (
              <div key={app.id} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h5 className="text-sm font-medium text-gray-800">{app.name}</h5>
                      <StatusBadge status={app.status} type="application" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{app.type} • {app.techStack}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Version</p>
                    <p className="text-sm font-medium">{app.version}</p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Deployed: {new Date(app.deployedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No applications deployed on this server.</p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          Close
        </button>
      </div>
    </div>
  );
};

// Application Detail View
const ApplicationDetailView = ({ application, servers, onClose }) => {
  const getServerNames = () => {
    return application.deployedOn.map(id => {
      const server = servers.find(s => s.id === id);
      return server ? server.name : 'Unknown Server';
    });
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Application Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">ID</p>
            <p className="text-sm font-medium">{application.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Type</p>
            <p className="text-sm font-medium">{application.type}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <StatusBadge status={application.status} type="application" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Version</p>
            <p className="text-sm font-medium">{application.version}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Owner</p>
            <p className="text-sm font-medium">{application.owner}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tech Stack</p>
            <p className="text-sm font-medium">{application.techStack}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-500">Repository</p>
            <p className="text-sm font-medium">{application.repositoryUrl || 'N/A'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-500">Description</p>
            <p className="text-sm font-medium">{application.description}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-500">Last Deployed</p>
            <p className="text-sm font-medium">{new Date(application.deployedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Deployed On</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          {getServerNames().length > 0 ? (
            <ul className="space-y-2">
              {getServerNames().map((name, index) => (
                <li key={index} className="flex items-center">
                  <Server className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm">{name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 italic">Not deployed on any server.</p>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Dependencies</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          {application.dependencies.length > 0 ? (
            <ul className="space-y-2">
              {application.dependencies.map((dep, index) => (
                <li key={index} className="text-sm">{dep}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 italic">No dependencies.</p>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Environment Variables</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          {Object.keys(application.environmentVariables).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Key
                    </th>
                    <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(application.environmentVariables).map(([key, value]) => (
                    <tr key={key}>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">{key}</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No environment variables.</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          Close
        </button>
      </div>
    </div>
  );
};

// Alert Component
const Alert = ({ alert, onDismiss }) => {
  const getAlertColor = () => {
    switch (alert.severity) {
      case "critical": return "bg-red-100 text-red-800 border-red-300";
      case "warning": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "info": return "bg-blue-100 text-blue-800 border-blue-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getAlertIcon = () => {
    switch (alert.severity) {
      case "critical": return <div className="rounded-full bg-red-200 p-1"><Activity className="h-4 w-4 text-red-600" /></div>;
      case "warning": return <div className="rounded-full bg-yellow-200 p-1"><Activity className="h-4 w-4 text-yellow-600" /></div>;
      case "info": return <div className="rounded-full bg-blue-200 p-1"><Activity className="h-4 w-4 text-blue-600" /></div>;
      default: return <div className="rounded-full bg-gray-200 p-1"><Activity className="h-4 w-4 text-gray-600" /></div>;
    }
  };

  return (
    <div className={`flex items-center justify-between p-3 mb-3 rounded-md border ${getAlertColor()}`}>
      <div className="flex items-center">
        {getAlertIcon()}
        <div className="ml-3">
          <div className="font-medium">{alert.title}</div>
          <div className="text-sm">{alert.message}</div>
        </div>
      </div>
      <button 
        onClick={() => onDismiss(alert.id)} 
        className="text-gray-500 hover:text-gray-700"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-500">{title}</div>
          <div className="text-xl font-semibold mt-1">{value}</div>
        </div>
        <div className={`p-2 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Resource Usage Chart
const ResourceUsageChart = ({ servers }) => {
  // Calculate average CPU, memory usage across servers
  const calculateAverages = () => {
    if (!servers.length) return { cpu: 0, memory: 0, storage: 0 };
    
    let cpuTotal = 0;
    let memoryTotal = 0;
    let storageTotal = 0;
    let storageCapacity = 0;
    
    servers.forEach(server => {
      // Estimate CPU usage (not available in original data, using a mock calculation)
      const cpuEstimate = server.status === "running" ? 
        (Math.random() * 50) + 20 : // 20-70% for running servers
        (Math.random() * 10); // 0-10% for non-running servers
      cpuTotal += cpuEstimate;
      
      // Memory usage
      memoryTotal += (server.hardware.memory.used / server.hardware.memory.total) * 100;
      
      // Storage usage
      server.hardware.storage.forEach(disk => {
        storageTotal += disk.used;
        storageCapacity += disk.capacity;
      });
    });
    
    return {
      cpu: cpuTotal / servers.length,
      memory: memoryTotal / servers.length,
      storage: (storageTotal / storageCapacity) * 100
    };
  };
  
  const averages = calculateAverages();
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-medium text-gray-700 mb-4">Resource Utilization</h3>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Average CPU</span>
            <span>{averages.cpu.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="h-2.5 rounded-full bg-blue-500" 
              style={{ width: `${averages.cpu}%` }}
            ></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Average Memory</span>
            <span>{averages.memory.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${averages.memory < 60 ? 'bg-green-500' : averages.memory < 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${averages.memory}%` }}
            ></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Average Storage</span>
            <span>{averages.storage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${averages.storage < 60 ? 'bg-green-500' : averages.storage < 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${averages.storage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Environment Distribution Chart
const EnvironmentDistribution = ({ servers }) => {
  // Count servers by environment
  const countByEnvironment = () => {
    const counts = { production: 0, staging: 0, development: 0 };
    
    servers.forEach(server => {
      if (counts[server.environment] !== undefined) {
        counts[server.environment]++;
      }
    });
    
    return [
      { name: 'Production', value: counts.production },
      { name: 'Staging', value: counts.staging },
      { name: 'Development', value: counts.development }
    ];
  };
  
  const data = countByEnvironment();
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-medium text-gray-700 mb-4">Servers by Environment</h3>
      <div className="flex h-40 items-end">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center justify-end h-full">
            <div 
              className={`w-16 ${
                index === 0 ? 'bg-blue-500' : 
                index === 1 ? 'bg-green-500' : 'bg-yellow-500'
              }`} 
              style={{ height: `${(item.value / servers.length) * 100}%` }}
            ></div>
            <div className="text-xs font-medium text-gray-600 mt-2">{item.name}</div>
            <div className="text-sm font-bold">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Server Status Summary
const ServerStatusSummary = ({ servers }) => {
  // Count servers by status
  const countByStatus = () => {
    const counts = { running: 0, stopped: 0, maintenance: 0, error: 0 };
    
    servers.forEach(server => {
      if (counts[server.status] !== undefined) {
        counts[server.status]++;
      }
    });
    
    return counts;
  };
  
  const statusCounts = countByStatus();
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-medium text-gray-700 mb-4">Server Status</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Running:</span>
          <span className="text-sm font-medium ml-auto">{statusCounts.running}</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Stopped:</span>
          <span className="text-sm font-medium ml-auto">{statusCounts.stopped}</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Maintenance:</span>
          <span className="text-sm font-medium ml-auto">{statusCounts.maintenance}</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Error:</span>
          <span className="text-sm font-medium ml-auto">{statusCounts.error}</span>
        </div>
      </div>
    </div>
  );
};

// Recent Activity Component
const RecentActivity = () => {
  const activities = [
    { id: 1, message: "Server api-prod-east-01 restarted", time: "2 hours ago", type: "server" },
    { id: 2, message: "Application Payment API deployed", time: "5 hours ago", type: "application" },
    { id: 3, message: "User Authentication Service reported degraded performance", time: "Yesterday", type: "alert" },
    { id: 4, message: "New server db-prod-central-02 added", time: "Yesterday", type: "server" },
    { id: 5, message: "Scheduled maintenance completed", time: "2 days ago", type: "maintenance" }
  ];
  
  const getActivityIcon = (type) => {
    switch (type) {
      case "server": return <Server className="h-4 w-4 text-blue-500" />;
      case "application": return <Activity className="h-4 w-4 text-green-500" />;
      case "alert": return <Activity className="h-4 w-4 text-red-500" />;
      case "maintenance": return <RefreshCw className="h-4 w-4 text-yellow-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-medium text-gray-700 mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {activities.map(activity => (
          <div key={activity.id} className="flex items-start">
            <div className="rounded-full bg-gray-100 p-1 mr-3">
              {getActivityIcon(activity.type)}
            </div>
            <div>
              <p className="text-sm text-gray-800">{activity.message}</p>
              <p className="text-xs text-gray-500">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Dashboard Component
const InfrastructureDashboard = () => {
  const [servers, setServers] = useState(initialServers);
  const [applications, setApplications] = useState(initialApplications);
  const [activeTab, setActiveTab] = useState("overview");
  const [serverModalOpen, setServerModalOpen] = useState(false);
  const [applicationModalOpen, setApplicationModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentServer, setCurrentServer] = useState(null);
  const [currentApplication, setCurrentApplication] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteType, setDeleteType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [alerts, setAlerts] = useState([
    { 
      id: 1, 
      severity: "critical", 
      title: "High CPU Usage", 
      message: "Server web-prod-west-01 is experiencing high CPU usage (92%)", 
      timestamp: new Date()
    },
    { 
      id: 2, 
      severity: "warning", 
      title: "Memory Utilization", 
      message: "Server api-prod-east-01 memory usage exceeded 75%", 
      timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
    },
    { 
      id: 3, 
      severity: "info", 
      title: "Deployment Successful", 
      message: "Application User Authentication Service was successfully deployed", 
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
    }
  ]);

  // Filter function for servers
  const filteredServers = servers.filter(server => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      server.name.toLowerCase().includes(query) ||
      server.ipAddress.toLowerCase().includes(query) ||
      server.environment.toLowerCase().includes(query) ||
      server.region.toLowerCase().includes(query) ||
      server.operatingSystem.toLowerCase().includes(query)
    );
  });

  // Filter function for applications
  const filteredApplications = applications.filter(app => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      app.name.toLowerCase().includes(query) ||
      app.type.toLowerCase().includes(query) ||
      app.techStack.toLowerCase().includes(query) ||
      app.owner?.toLowerCase().includes(query) ||
      app.description?.toLowerCase().includes(query)
    );
  });

  // Handler for server creation/update
  const handleServerSubmit = (serverData) => {
    if (serverData.id) {
      // Update existing server
      setServers(servers.map(server => 
        server.id === serverData.id ? {...serverData, updatedAt: new Date().toISOString()} : server
      ));
    } else {
      // Create new server
      const newServer = {
        ...serverData,
        id: `srv-${Math.floor(Math.random() * 10000).toString().padStart(3, '0')}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setServers([...servers, newServer]);
    }
    setServerModalOpen(false);
    setCurrentServer(null);
  };

  // Handler for application creation/update
  const handleApplicationSubmit = (appData) => {
    if (appData.id) {
      // Update existing application
      setApplications(applications.map(app => 
        app.id === appData.id ? {...appData, updatedAt: new Date().toISOString()} : app
      ));
    } else {
      // Create new application
      const newApp = {
        ...appData,
        id: `app-${Math.floor(Math.random() * 10000).toString().padStart(3, '0')}`,
        createdAt: new Date().toISOString(),
        deployedAt: new Date().toISOString()
      };
      setApplications([...applications, newApp]);
    }
    setApplicationModalOpen(false);
    setCurrentApplication(null);
  };

  // Handler for server deletion
  const handleServerDelete = (server) => {
    setDeleteItem(server);
    setDeleteType("server");
    setDeleteModalOpen(true);
  };

  // Handler for application deletion
  const handleApplicationDelete = (app) => {
    setDeleteItem(app);
    setDeleteType("application");
    setDeleteModalOpen(true);
  };

  // Confirm deletion handler
  const confirmDelete = () => {
    if (deleteType === "server") {
      setServers(servers.filter(server => server.id !== deleteItem.id));
      // Remove the server from all applications' deployedOn arrays
      setApplications(applications.map(app => ({
        ...app,
        deployedOn: app.deployedOn.filter(id => id !== deleteItem.id)
      })));
    } else if (deleteType === "application") {
      setApplications(applications.filter(app => app.id !== deleteItem.id));
    }
    setDeleteModalOpen(false);
    setDeleteItem(null);
    setDeleteType("");
  };

  // View server details
  const viewServerDetails = (server) => {
    setCurrentServer(server);
    setDetailModalOpen(true);
  };

  // View application details
  const viewApplicationDetails = (app) => {
    setCurrentApplication(app);
    setDetailModalOpen(true);
  };

  // Edit server
  const editServer = (server) => {
    setCurrentServer(server);
    setServerModalOpen(true);
  };

  // Edit application
  const editApplication = (app) => {
    setCurrentApplication(app);
    setApplicationModalOpen(true);
  };

  // Reset search
  const resetSearch = () => {
    setSearchQuery("");
  };

  // Dismiss alert handler
  const dismissAlert = (alertId) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  // Add a function to create a new alert
  const addAlert = (severity, title, message) => {
    const newAlert = {
      id: Date.now(),
      severity,
      title,
      message,
      timestamp: new Date()
    };
    setAlerts([newAlert, ...alerts]);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Infrastructure Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage servers and applications with full CRUD operations
          </p>
        </div>
      </header>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium text-gray-800">Alerts ({alerts.length})</h3>
              {alerts.length > 1 && (
                <button 
                  onClick={() => setAlerts([])} 
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Dismiss All
                </button>
              )}
            </div>
            <div className="space-y-2">
              {alerts.map(alert => (
                <Alert key={alert.id} alert={alert} onDismiss={dismissAlert} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs and Actions */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="flex space-x-4 mb-4 sm:mb-0">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === "overview"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center">
                <Grid className="h-4 w-4 mr-2" />
                Overview
              </div>
            </button>
            <button
              onClick={() => setActiveTab("servers")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === "servers"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center">
                <Server className="h-4 w-4 mr-2" />
                Servers ({servers.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab("applications")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === "applications"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center">
                <Activity className="h-4 w-4 mr-2" />
                Applications ({applications.length})
              </div>
            </button>
          </div>
          {activeTab !== "overview" && (
            <div className="w-full sm:w-auto flex">
              <div className="relative flex-1 mr-2">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={resetSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              <button
                onClick={() => {
                  if (activeTab === "servers") {
                    setCurrentServer(null);
                    setServerModalOpen(true);
                  } else {
                    setCurrentApplication(null);
                    setApplicationModalOpen(true);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add {activeTab === "servers" ? "Server" : "Application"}
              </button>
            </div>
          )}
        </div>

        {/* Overview Dashboard */}
        {activeTab === "overview" && (
          <>
            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <StatCard 
                title="Total Servers" 
                value={servers.length} 
                icon={<Server className="h-5 w-5 text-blue-500" />} 
                color="bg-blue-100"
              />
              <StatCard 
                title="Total Applications" 
                value={applications.length} 
                icon={<Activity className="h-5 w-5 text-green-500" />} 
                color="bg-green-100"
              />
              <StatCard 
                title="Healthy Applications" 
                value={applications.filter(app => app.status === "healthy").length} 
                icon={<Activity className="h-5 w-5 text-green-500" />} 
                color="bg-green-100"
              />
              <StatCard 
                title="Issues" 
                value={applications.filter(app => app.status !== "healthy").length + servers.filter(server => server.status !== "running").length} 
                icon={<Activity className="h-5 w-5 text-red-500" />} 
                color="bg-red-100"
              />
            </div>
            
            {/* Charts and Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <ResourceUsageChart servers={servers} />
              <EnvironmentDistribution servers={servers} />
              <ServerStatusSummary servers={servers} />
            </div>
            
            {/* Recent Activity */}
            <div className="grid grid-cols-1 gap-6">
              <RecentActivity />
            </div>
          </>
        )}

        {/* Server List */}
        {activeTab === "servers" && (
          <>
            <ServerList
              servers={filteredServers}
              onEdit={editServer}
              onDelete={handleServerDelete}
              onView={viewServerDetails}
            />
            {filteredServers.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <p className="text-gray-500">
                  {searchQuery ? "No servers match your search criteria." : "No servers yet. Add your first server!"}
                </p>
              </div>
            )}
          </>
        )}

        {/* Application List */}
        {activeTab === "applications" && (
          <>
            <ApplicationList
              applications={filteredApplications}
              servers={servers}
              onEdit={editApplication}
              onDelete={handleApplicationDelete}
              onView={viewApplicationDetails}
            />
            {filteredApplications.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <p className="text-gray-500">
                  {searchQuery ? "No applications match your search criteria." : "No applications yet. Add your first application!"}
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Server Form Modal */}
      <Modal
        isOpen={serverModalOpen}
        onClose={() => {
          setServerModalOpen(false);
          setCurrentServer(null);
        }}
        title={currentServer ? "Edit Server" : "Add New Server"}
      >
        <ServerForm
          server={currentServer}
          onSubmit={handleServerSubmit}
          onCancel={() => {
            setServerModalOpen(false);
            setCurrentServer(null);
          }}
        />
      </Modal>

      {/* Application Form Modal */}
      <Modal
        isOpen={applicationModalOpen}
        onClose={() => {
          setApplicationModalOpen(false);
          setCurrentApplication(null);
        }}
        title={currentApplication ? "Edit Application" : "Add New Application"}
      >
        <ApplicationForm
          application={currentApplication}
          servers={servers}
          onSubmit={handleApplicationSubmit}
          onCancel={() => {
            setApplicationModalOpen(false);
            setCurrentApplication(null);
          }}
        />
      </Modal>

      {/* Detail View Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setCurrentServer(null);
          setCurrentApplication(null);
        }}
        title={currentServer ? `Server Details: ${currentServer.name}` : currentApplication ? `Application Details: ${currentApplication.name}` : ""}
      >
        {currentServer && (
          <ServerDetailView
            server={currentServer}
            applications={applications}
            onClose={() => {
              setDetailModalOpen(false);
              setCurrentServer(null);
            }}
          />
        )}
        {currentApplication && (
          <ApplicationDetailView
            application={currentApplication}
            servers={servers}
            onClose={() => {
              setDetailModalOpen(false);
              setCurrentApplication(null);
            }}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteItem(null);
          setDeleteType("");
        }}
        onConfirm={confirmDelete}
        itemName={deleteItem ? deleteItem.name : ""}
      />
    </div>
  );
};

export default InfrastructureDashboard;