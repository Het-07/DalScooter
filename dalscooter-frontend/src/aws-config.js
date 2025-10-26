// src/aws-config.js
import { Amplify } from "aws-amplify";

// Get configuration from runtime environment or fallback to build-time env vars
const getConfig = () => {
  // First try to get from runtime config (injected by Docker entrypoint)
  if (typeof window !== 'undefined' && window.env) {
    return {
      region: window.env.VITE_AWS_REGION || 'us-east-1',
      userPoolId: window.env.VITE_COGNITO_USER_POOL_ID,
      userPoolWebClientId: window.env.VITE_COGNITO_CLIENT_ID,
      apiGatewayUrl: window.env.VITE_API_GATEWAY_URL
    };
  }
  
  // Fallback to build-time environment variables (for local development)
  return {
    region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
    userPoolWebClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
    apiGatewayUrl: import.meta.env.VITE_API_GATEWAY_URL
  };
};

const config = getConfig();

export const amplifyConfig = {
  Auth: {
    region: config.region,
    userPoolId: config.userPoolId,
    userPoolWebClientId: config.userPoolWebClientId,
    authenticationFlowType: 'CUSTOM_AUTH'
  }
};

// Export the API Gateway URL for use in api.js
export const apiGatewayUrl = config.apiGatewayUrl;

Amplify.configure(amplifyConfig);
