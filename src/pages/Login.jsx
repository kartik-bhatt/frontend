import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogIn, Lock, Mail, Headphones, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');

  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Use the authentication service
      await login(username, password);
      // Navigation is handled in the AuthContext after successful login
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-500 shadow-lg transform skew-y-0 rotate-6 rounded-3xl"></div>
        <div className="relative px-8 py-10 bg-white shadow-lg rounded-3xl sm:p-10">
          {/* Logo + Title */}
          <div className="flex items-center justify-center mb-6">
            <Headphones className="h-8 w-8 text-indigo-600" />
            <span className="ml-2 text-2xl font-bold text-gray-800">TTS Group Login</span>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <div className="flex items-center border rounded-md px-3 py-2 bg-gray-50">
                <Mail className="h-5 w-5 text-gray-400 mr-2" />
                <input
                  type="text" // Change from email to text
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full bg-transparent outline-none text-gray-700"
                  disabled={isLoading}
                    />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="flex items-center border rounded-md px-3 py-2 bg-gray-50">
                <Lock className="h-5 w-5 text-gray-400 mr-2" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-transparent outline-none text-gray-700"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow transition duration-200 disabled:bg-indigo-400"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <LogIn className="h-5 w-5 mr-2" />
              )}
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            © {new Date().getFullYear()} TTS Group. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;





// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { LogIn, Lock, Mail, Headphones } from 'lucide-react';

// const Login = () => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const navigate = useNavigate();

//   const handleLogin = (e) => {
//     e.preventDefault();

//     // Hardcoded users
//     if (email === 'admin@tts.com' && password === 'admin123') {
//       console.log('Admin logged in');
//       navigate('/dashboard/admin');
//     } else if (email === 'user@tts.com' && password === 'user123') {
//       console.log('User logged in');
//       navigate('/dashboard/user');
//     } else {
//       alert('Invalid credentials');
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-100 flex flex-col justify-center sm:py-12">
//       <div className="relative py-3 sm:max-w-xl sm:mx-auto">
//         <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-500 shadow-lg transform skew-y-0 rotate-6 rounded-3xl"></div>
//         <div className="relative px-8 py-10 bg-white shadow-lg rounded-3xl sm:p-10">
//           {/* Logo + Title */}
//           <div className="flex items-center justify-center mb-6">
//             <Headphones className="h-8 w-8 text-indigo-600" />
//             <span className="ml-2 text-2xl font-bold text-gray-800">TTS Group Login</span>
//           </div>

//           <form onSubmit={handleLogin}>
//             <div className="mb-5">
//               <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
//               <div className="flex items-center border rounded-md px-3 py-2 bg-gray-50">
//                 <Mail className="h-5 w-5 text-gray-400 mr-2" />
//                 <input
//                   type="email"
//                   placeholder="you@example.com"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   required
//                   className="w-full bg-transparent outline-none text-gray-700"
//                 />
//               </div>
//             </div>

//             <div className="mb-6">
//               <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
//               <div className="flex items-center border rounded-md px-3 py-2 bg-gray-50">
//                 <Lock className="h-5 w-5 text-gray-400 mr-2" />
//                 <input
//                   type="password"
//                   placeholder="••••••••"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   required
//                   className="w-full bg-transparent outline-none text-gray-700"
//                 />
//               </div>
//             </div>

//             <button
//               type="submit"
//               className="w-full flex items-center justify-center px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow transition duration-200"
//             >
//               <LogIn className="h-5 w-5 mr-2" />
//               Log In
//             </button>
//           </form>

//           <p className="text-center text-sm text-gray-500 mt-6">
//             © {new Date().getFullYear()} TTS Group. All rights reserved.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;
