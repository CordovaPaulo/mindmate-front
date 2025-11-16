import api from './axios';

interface AuthResponse {
  authenticated: boolean;
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
    accountStatus?: string;
  };
  message?: string;
  code: number;
}

/**
 * Check if user is authenticated by calling the backend /api/auth/check endpoint
 * This replaces the need to access document.cookie directly
 * The backend reads the httpOnly cookie and verifies the token
 */
export async function checkAuth(): Promise<AuthResponse> {
  try {
    const response = await api.get('/api/auth/check', {
      withCredentials: true,
    });
    
    return response.data;
  } catch (error: any) {
    // If request fails or returns 401, user is not authenticated
    return {
      authenticated: false,
      message: error.response?.data?.message || 'Authentication check failed',
      code: error.response?.status || 500
    };
  }
}

/**
 * Get authentication token for legacy API calls that need explicit Authorization header
 * Note: This should eventually be phased out in favor of relying on httpOnly cookies
 * For now, we return null and let axios automatically include cookies via withCredentials
 */
export function getAuthToken(): string | null {
  // No longer read from document.cookie - httpOnly cookies are sent automatically
  return null;
}

/**
 * Check if user has a specific role
 */
export async function hasRole(requiredRole: string): Promise<boolean> {
  const auth = await checkAuth();
  return auth.authenticated && auth.user?.role === requiredRole;
}

/**
 * Get current user information
 */
export async function getCurrentUser() {
  const auth = await checkAuth();
  return auth.authenticated ? auth.user : null;
}
