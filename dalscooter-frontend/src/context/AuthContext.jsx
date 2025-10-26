import React, { createContext, useState, useEffect, useContext } from 'react';
import { Auth, Hub } from 'aws-amplify'; // Import Hub for listening to auth events
import { setAuthToken } from '../services/api'; // Import our API token setter
// import aws_exports from '../aws-exports'; // Import your Amplify configuration

// Configure Amplify (ensure this is done once, typically in App.jsx or main.jsx)
// We will ensure it's configured in App.jsx to avoid re-configuration issues.
// For now, keep it commented out here if you configure it elsewhere.
// Amplify.configure(aws_exports); 

// Create the Auth Context
const AuthContext = createContext(null);

// Custom hook to use the Auth Context
export const useAuth = () => useContext(AuthContext);

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCustomer, setIsCustomer] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // To track initial auth loading

  // Function to check current authentication status and user groups
  const checkAuthState = async () => {
    setIsLoading(true); // Start loading
    try {
      const cognitoUser = await Auth.currentAuthenticatedUser();
      setUser(cognitoUser);
      setIsAuthenticated(true);

      // Extract groups from the ID token claims
      const groups = cognitoUser.signInUserSession.accessToken.payload['cognito:groups'] || [];
      const userGroups = Array.isArray(groups) ? groups : [groups]; // Ensure it's an array

      setIsAdmin(userGroups.includes('AdminGroup'));
      setIsCustomer(userGroups.includes('CustomerGroup')); 

      // Set the JWT for Axios
      const jwtToken = cognitoUser.signInUserSession.idToken.jwtToken;
      setAuthToken(jwtToken);

      console.log("AuthContext: User authenticated:", cognitoUser.username);
      console.log("AuthContext: User groups:", userGroups);

    } catch (error) {
      console.log("AuthContext: Not authenticated or session expired:", error);
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setIsCustomer(false);
      setAuthToken(null); // Clear token if not authenticated
    } finally {
      setIsLoading(false); // Authentication check is complete
    }
  };

  useEffect(() => {
    checkAuthState(); // Initial check on mount

    // Listen for Amplify Hub auth events to react to login/logout from AuthHandler
    const listener = (data) => {
      switch (data.payload.event) {
        case 'signIn':
          console.log('AuthContext: signIn event detected');
          checkAuthState(); // Re-check state after sign in
          break;
        case 'signOut':
          console.log('AuthContext: signOut event detected');
          checkAuthState(); // Re-check state after sign out
          break;
        case 'signUp':
          console.log('AuthContext: signUp event detected');
          // No need to check auth state immediately, user needs to verify
          break;
        case 'confirmSignUp':
          console.log('AuthContext: confirmSignUp event detected');
          // User confirmed, now they can log in. No direct state change here.
          break;
        case 'customChallenge':
          console.log('AuthContext: customChallenge event detected');
          // Custom challenge, AuthHandler will handle the flow
          break;
        case 'customChallengeAnswer':
          console.log('AuthContext: customChallengeAnswer event detected');
          // If challenge answered successfully, AuthHandler will sign in, triggering 'signIn'
          break;
        default:
          break;
      }
    };

    Hub.listen('auth', listener);

    // Cleanup listener on unmount
    return () => Hub.remove('auth', listener);
  }, []); // Run once on component mount

  // Values provided by the context
  const authContextValue = {
    user,
    isAuthenticated,
    isAdmin,
    isCustomer,
    isLoading,
    // Expose a way to manually trigger state update if AuthHandler doesn't trigger Hub event immediately
    // (though Hub events should cover most cases)
    refreshAuthStatus: checkAuthState,
    // We will NOT expose login/logout directly here, as AuthHandler manages that.
    // The AuthHandler will call navigate directly after its successful operations.
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};