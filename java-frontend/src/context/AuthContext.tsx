import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, userService, User as BackendUser, SignupRequest } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  verified: boolean;
  joinDate: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  signup: (userData: SignupRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to transform backend user to frontend user format
const transformUser = (backendUser: BackendUser, isAdminUser: boolean = false): User => ({
  id: backendUser.userId.toString(),
  name: backendUser.uName,
  email: backendUser.uCusMail,
  avatar: null,
  verified: true, // You can implement a verified field in backend later
  joinDate: backendUser.dateJoined,
  isAdmin: isAdminUser // This will be determined by checking if the user exists in Admin entity
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing user session on app start
  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = authService.getStoredUser();
      const storedToken = authService.getStoredToken();
      
      if (storedUser && storedToken) {
        // Check if stored user is admin
        let isAdminUser = false;
        try {
          const adminCheck = await userService.checkIfUserIsAdmin();
          console.log('Admin check result on init:', adminCheck);
          isAdminUser = adminCheck.isAdmin;
        } catch (adminError) {
          console.log('Could not check admin status on init:', adminError);
          // If admin check fails, assume not admin
          isAdminUser = false;
        }
        
        console.log('Final isAdminUser status on init:', isAdminUser);
        
        setUser(transformUser(storedUser, isAdminUser));
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authService.login({ email, password });
      
      // Store JWT token
      localStorage.setItem('jwt', response.jwt);
      
      // Show warning if user is warned
      if (response.isWarned) {
        alert(`⚠️ Account Warning: ${response.warningReason || response.message}`);
      }
      
      // Fetch user profile after successful login
      try {
        const userData = await userService.getCurrentProfile();
        
        // Check if user is admin
        let isAdminUser = false;
        try {
          const adminCheck = await userService.checkIfUserIsAdmin();
          console.log('Admin check result:', adminCheck);
          isAdminUser = adminCheck.isAdmin;
        } catch (adminError) {
          console.log('Could not check admin status:', adminError);
          // If admin check fails (like 403 Forbidden), assume not admin
          isAdminUser = false;
        }
        
        console.log('Final isAdminUser status:', isAdminUser);
        
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(transformUser(userData, isAdminUser));
      } catch (profileError) {
        console.error('Failed to fetch user profile:', profileError);
        // If we can't fetch profile, at least set a basic user from the email
        const basicUserData: BackendUser = {
          userId: Date.now(), // Temporary ID
          uName: email.split('@')[0],
          uPhone: '',
          uCusMail: email,
          dateJoined: new Date().toISOString(),
          role: 'USER', // Default role for regular users
          address: ''
        };
        localStorage.setItem('user', JSON.stringify(basicUserData));
        setUser(transformUser(basicUserData, false));
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authService.adminLogin({ email, password });
      
      // Store JWT token
      localStorage.setItem('jwt', response.jwt);
      
      // Use real user data from backend response - admin login always returns admin user
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(transformUser(response.user, true)); // true = is admin
    } catch (error) {
      console.error('Admin login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData: SignupRequest) => {
    try {
      setLoading(true);
      const newUser = await authService.signup(userData);
      console.log('User registered successfully:', newUser.uCusMail);
      
      // Don't auto-login after signup - user needs to verify email first
      // The Login component will handle the signup flow
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    // Clear any cached admin status
    localStorage.removeItem('isAdmin');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      adminLogin,
      signup,
      logout, 
      isAuthenticated: !!user,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};