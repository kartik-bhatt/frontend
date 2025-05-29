import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { embedDashboard } from "@superset-ui/embedded-sdk";
import '../bugzilla.css';  

const FullScreenSupersetDashboard = ({ 
  dashboardId = "da799b5f-c752-4247-8574-91b04bb6b678",
  supersetUrl = 'http://10.226.30.123:8088',
  showHeader = false
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardRef, setDashboardRef] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  
  const supersetApiUrl = `${supersetUrl}/api/v1/security`;
  
  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // Enter fullscreen
      if (wrapperRef.current.requestFullscreen) {
        wrapperRef.current.requestFullscreen();
      } else if (wrapperRef.current.webkitRequestFullscreen) {
        wrapperRef.current.webkitRequestFullscreen();
      } else if (wrapperRef.current.msRequestFullscreen) {
        wrapperRef.current.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);
  
  // Enhanced function to get guest token with better error handling
  const fetchGuestToken = useCallback(async () => {
    try {
      setDebugInfo(null);
      
      // Step 1: Get access token via login
      const loginBody = {
        "password": "12345", // Use a secure method to handle passwords
        "provider": "db",
        "refresh": true,
        "username": "guest"
      };
      
      console.log('Attempting login to Superset...');
      const loginResponse = await axios.post(
        `${supersetApiUrl}/login`, 
        loginBody,
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      
      const accessToken = loginResponse.data.access_token;
      
      if (!accessToken) {
        throw new Error('Failed to obtain access token');
      }
      
      console.log('Login successful, fetching guest token...');
      
      // Step 2: Get guest token for embedding
      const guestTokenBody = {
        "subject": "guest-user", // This is required in newer versions
        "resources": [
          {
            "type": "dashboard",
            "id": dashboardId
          }
        ],
        "rls": [], // Row Level Security rules
        "user": {
          "username": "guest",
          "first_name": "Guest",
          "last_name": "User",
          "email": "guest@gmail.com" // Some versions require email
          //  "username": "admin",
          // "first_name": "admin",
          // "last_name": "admin",
          // "email": "admin"
        }
      };
      
      const guestTokenResponse = await axios.post(
        `${supersetApiUrl}/guest_token/`, 
        guestTokenBody,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
          }
        }
      );
      
      const guestToken = guestTokenResponse.data.token;
      
      if (!guestToken) {
        throw new Error('Failed to obtain guest token - no token in response');
      }
      
      console.log('Guest token obtained successfully');
      return guestToken;
      
    } catch (err) {
      console.error('Error fetching guest token:', err);
      
      // Enhanced error reporting
      let errorMessage = 'Failed to fetch guest token';
      let debugDetails = null;
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = `Server responded with ${err.response.status}: ${err.response.statusText}`;
        debugDetails = {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
          headers: err.response.headers
        };
        
        if (err.response.data && err.response.data.message) {
          errorMessage += ` - ${err.response.data.message}`;
        }
      } else if (err.request) {
        // The request was made but no response was received
        errorMessage = 'No response received from server';
        debugDetails = { request: err.request };
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = err.message;
      }
      
      setDebugInfo(debugDetails);
      throw new Error(errorMessage);
    }
  }, [supersetApiUrl, dashboardId]);
  
  useEffect(() => {
    const embedDashboardAsync = async () => {
      if (!containerRef.current || !dashboardId) {
        setError('Dashboard container or ID not available');
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        setDebugInfo(null);
        
        // Validate dashboard ID format (should be UUID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(dashboardId)) {
          throw new Error(`Invalid dashboard ID format: ${dashboardId}. Expected UUID format.`);
        }
        
        console.log('Embedding dashboard with ID:', dashboardId);
        
        // Step 3: Embed the dashboard
        const dashboard = await embedDashboard({
          id: dashboardId,
          supersetDomain: supersetUrl,
          mountPoint: containerRef.current,
          fetchGuestToken: fetchGuestToken,
          dashboardUiConfig: { 
            hideTitle: true,
            hideChartControls: false,
            hideTab: true,
          }
        });
        
        setDashboardRef(dashboard);
        setLoading(false);
        console.log('Dashboard embedded successfully');
        
      } catch (err) {
        console.error('Error embedding dashboard:', err);
        setError(err.message || 'Failed to load dashboard');
        setLoading(false);
      }
    };
    
    embedDashboardAsync();
    
    // Cleanup function
    return () => {
      if (dashboardRef && dashboardRef.unmount) {
        dashboardRef.unmount();
      }
    };
  }, [dashboardId, supersetUrl, fetchGuestToken]);
  
  // Token refresh mechanism
  useEffect(() => {
    if (!dashboardRef) return;
    
    const refreshInterval = setInterval(() => {
      console.log('Refreshing guest token...');
      // You could implement automatic token refresh here if needed
      fetchGuestToken().catch(err => {
        console.error('Failed to refresh token:', err);
      });
    }, 30 * 60 * 1000); // Every 30 minutes
    
    return () => clearInterval(refreshInterval);
  }, [dashboardRef, fetchGuestToken]);
  
  const handleRetry = () => {
    setError(null);
    setDebugInfo(null);
    setLoading(true);
    setDashboardRef(null);
    
    // Force re-mount of the component
    const container = containerRef.current;
    if (container) {
      // Clear the container
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    }
    
    // This will trigger the useEffect to run again
    setTimeout(() => {
      if (containerRef.current) {
        embedDashboard({
          id: dashboardId,
          supersetDomain: supersetUrl,
          mountPoint: containerRef.current,
          fetchGuestToken: fetchGuestToken,
          dashboardUiConfig: { 
            hideTitle: true,
            hideChartControls: false,
            hideTab: true,
          }
        }).then(dashboard => {
          setDashboardRef(dashboard);
          setLoading(false);
        }).catch(err => {
          setError(err.message || 'Failed to load dashboard');
          setLoading(false);
        });
      }
    }, 500);
  };
  
  return (
    <div className="superset-dashboard-wrapper" ref={wrapperRef}>
      {!isFullscreen && !showHeader && (
        <button className="fullscreen-button" onClick={toggleFullscreen}>
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </button>
      )}
      
      {loading && (
        <div className="loading-spinner-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      )}
      
      {error && (
        <div className="error-container">
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          
          {debugInfo && (
            <details className="debug-details">
              <summary>Debug Information</summary>
              <pre>
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          )}
          
          <button onClick={handleRetry} className="retry-button">
            Retry
          </button>
        </div>
      )}
      
      <div 
        ref={containerRef} 
        id="superset-container"
        style={{ 
          visibility: loading ? 'hidden' : 'visible',
        }}
      />
    </div>
  );
};

// Main App component
function BugzillaDashboard() {
  return (
    <div className="app-container">
      {/* You can remove this header if you want truly full screen */}
    
      <FullScreenSupersetDashboard 
        dashboardId="da799b5f-c752-4247-8574-91b04bb6b678"
        showHeader={false}
      />
    </div>
  );
}

export default BugzillaDashboard;















// import React, { useEffect, useState } from "react";


// const BugzillDashboard = () => {
//   const [iframeUrl, setIframeUrl] = useState("");

//   const supersetDomain = "http://10.226.30.123:8088"; // Change to your Superset URL
//   const dashboardUUID = "1c08c541-72bf-4325-83d5-a66c532c56f7"; // Replace with your dashboard UUID
//   const jwtSecret = "nXrwJPfm3qvELWFXuqRot/9u1n8t77qpHmZiWau7G7jTPEsWfQ6LOi0D"; // Must match Superset's config

//   useEffect(() => {
//     const payload = {
//       user: {
//         username: "admin",
//         first_name: "admin",
//         last_name: "admin",
//       },
//       resources: [
//         {
//           type: "dashboard",
//           id: dashboardUUID
//         }
//       ],
//       rls: [],
//       exp: Math.floor(Date.now() / 1000) + 600, // 10 minutes expiry
//       aud: "superset",
//       iss: "your-app"
//     };

//     const token = jwt.sign(payload, jwtSecret, { algorithm: "HS256" });
//     const embedUrl = `${supersetDomain}/superset/embed/dashboard/${dashboardUUID}/?token=${token}`;

//     setIframeUrl(embedUrl);
//   }, []);

//   return (
//     <div>
//       <h2 className="text-xl font-bold mb-4">Embedded Superset Dashboard</h2>
//       {iframeUrl ? (
//         <iframe
//           title="Superset Dashboard"
//           src={iframeUrl}
//           width="100%"
//           height="800px"
//           frameBorder="0"
//         ></iframe>
//       ) : (
//         <p>Loading dashboard...</p>
//       )}
//     </div>
//   );
// };

// export default BugzillDashboard;
