import React, { useState } from 'react';
import { UserPlus, X, ArrowLeft, Check, AlertCircle } from 'lucide-react';

const AddUserPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    roles: ['ROLE_USER']
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const availableRoles = [
    { value: 'ROLE_USER', label: 'User' },
    { value: 'ROLE_MODERATOR', label: 'Moderator' }, 
    { value: 'ROLE_ADMIN', label: 'Admin' }
  ];
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    
    // Password strength check
    if (name === 'password') {
      let strength = 0;
      if (value.length >= 8) strength += 1;
      if (/[A-Z]/.test(value)) strength += 1;
      if (/[0-9]/.test(value)) strength += 1;
      if (/[^A-Za-z0-9]/.test(value)) strength += 1;
      setPasswordStrength(strength);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }
    
    if (passwordStrength < 3) {
      setError("Please use a stronger password");
      setLoading(false);
      return;
    }
    
    if (formData.roles.length === 0) {
      setError("Please select at least one role");
      setLoading(false);
      return;
    }
    
    if (formData.username.length > 20) {
      setError("Username must be maximum 20 characters");
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/auth/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          roles: formData.roles
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }
      
      // Success
      setSuccess(true);
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        roles: ['ROLE_USER']
      });
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const getPasswordStrengthClass = () => {
    if (passwordStrength === 0) return 'bg-gray-200 w-1/4';
    if (passwordStrength === 1) return 'bg-red-500 w-1/4';
    if (passwordStrength === 2) return 'bg-yellow-500 w-2/4';
    if (passwordStrength === 3) return 'bg-blue-500 w-3/4';
    if (passwordStrength === 4) return 'bg-green-500 w-full';
  };
  
  const getPasswordStrengthText = () => {
    if (!formData.password) return '';
    if (passwordStrength === 1) return 'Weak';
    if (passwordStrength === 2) return 'Fair';
    if (passwordStrength === 3) return 'Good';
    if (passwordStrength === 4) return 'Strong';
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm py-4 px-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => window.history.back()} 
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Add New User</h1>
          </div>
        </div>
      </header>
      
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          {success ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-6">
                <Check size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-4">User Added Successfully</h2>
              <p className="text-gray-600 mb-6">
                The new user account has been created and an invitation email has been sent to their email address.
              </p>
              <div className="flex justify-center space-x-4">
                <button 
                  onClick={() => setSuccess(false)} 
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Add Another User
                </button>
                <button 
                  onClick={() => window.history.back()} 
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Back to User Management
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-indigo-600 p-6">
                <div className="flex items-center text-white">
                  <UserPlus className="mr-3" size={24} />
                  <h2 className="text-xl font-semibold">Create New User Account</h2>
                </div>
              </div>
              
              {error && (
                <div className="m-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-start">
                  <AlertCircle className="flex-shrink-0 mr-3" size={20} />
                  <div>
                    <h3 className="font-medium">Error</h3>
                    <p>{error}</p>
                  </div>
                  <button 
                    onClick={() => setError(null)} 
                    className="ml-auto"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    maxLength={20}
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Username must be unique and max 20 characters
                  </p>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    An invitation will be sent to this email address
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="mt-2">
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${getPasswordStrengthClass()}`}></div>
                      </div>
                      <p className="mt-1 text-sm flex justify-between">
                        <span className="text-gray-500">Password Strength</span>
                        <span className={passwordStrength >= 3 ? 'text-green-600 font-medium' : 'text-yellow-600'}>
                          {getPasswordStrengthText()}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <p className="mt-1 text-sm text-red-500">Passwords don't match</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User Roles <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {availableRoles.map((role) => (
                      <div key={role.value} className="flex items-center">
                        <input
                          id={role.value}
                          type="checkbox"
                          checked={formData.roles.includes(role.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                roles: [...formData.roles, role.value]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                roles: formData.roles.filter(r => r !== role.value)
                              });
                            }
                          }}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor={role.value} className="ml-3 text-sm text-gray-700">
                          {role.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  {formData.roles.length === 0 && (
                    <p className="mt-1 text-sm text-red-500">
                      Please select at least one role
                    </p>
                  )}
                </div>
                
                <div className="pt-4 border-t flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Creating User...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} />
                        <span>Create User</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AddUserPage;