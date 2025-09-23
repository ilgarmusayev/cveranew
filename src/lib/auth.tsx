// Authentication utilities for frontend
'use client';
import React, { useState, useEffect, useContext, createContext, useCallback } from 'react';
import jwt from 'jsonwebtoken';
import { performanceTracker, getConnectionSpeed } from './performance';
import { apiClient } from './api';
import { apiPost, apiGet } from '@/utils/apiClient';
import { useNotification } from '@/components/ui/Toast';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';
import { useLocalizedMessages } from '@/utils/errorMessages';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string; // Add avatar property as optional
  createdAt?: string;
  loginMethod?: string; // Add login method (linkedin, email)
  linkedinId?: string; // Add LinkedIn ID field
  linkedinUsername?: string; // Add LinkedIn username field (optional until database is updated)
  tier?: string; // Add tier field to match Prisma schema
  subscriptions: Array<{
    id: string;
    tier: string;
    status: string;
    provider: string;
    expiresAt: string;
    startedAt: string;
  }>;
}

export interface AuthTokens {
  accessToken: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  // LinkedIn auto-import functionality
  canAutoImportLinkedIn: () => boolean;
  importLinkedInProfile: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [linkedInLogoutModal, setLinkedInLogoutModal] = useState(false);
  const { showSuccess, showInfo, showWarning } = useNotification();
  const { siteLanguage } = useSiteLanguage();
  const { getSuccessMessage, getWarningMessage, getInfoMessage } = useLocalizedMessages();

  const getAuthLabels = () => {
    const labels = {
      azerbaijani: {
        loading: 'yüklənir...',
        name: 'Yüklənir...'
      },
      english: {
        loading: 'loading...',
        name: 'Loading...'
      },
      russian: {
        loading: 'загружается...',
        name: 'Загружается...'
      }
    };
    return labels[siteLanguage] || labels.azerbaijani;
  };

  const authLabels = getAuthLabels();

  const isValidToken = (token: string) => {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return false;
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  };

  const fetchCurrentUser = useCallback(async () => {
    if (typeof window === 'undefined') return;

    try {
      // Check if we're coming from a logout (URL parameter check)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('logout')) {
        console.log('Logout parameter detected, clearing everything');
        localStorage.clear();
        sessionStorage.clear();
        setUser(null);
        setLoading(false);
        setIsInitialized(true);
        return;
      }

      // OPTIMIZED: Fast token check without API call
      let token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('No token found - instant redirect');
        setUser(null);
        setLoading(false);
        setIsInitialized(true);
        return;
      }

      // OPTIMIZED: Quick token validation without network request
      if (!isValidToken(token)) {
        console.log('Token expired - instant cleanup');
        localStorage.removeItem('accessToken');
        setUser(null);
        setLoading(false);
        setIsInitialized(true);
        return;
      }

      // INSTANT: For valid tokens, set initialized immediately
      console.log('🔑 Valid token found, initializing...');
      setLoading(false);
      setIsInitialized(true);

      // IMMEDIATE: Try to get cached user or set temporary user
      try {
        // Decode token to get basic user info
        const decoded = jwt.decode(token) as any;
        if (decoded && decoded.userId) {
          // Set a minimal user object to prevent redirect loop
          const tempUser = {
            id: decoded.userId,
            email: decoded.email || authLabels.loading,
            name: authLabels.name,
            subscriptions: []
          };
          console.log('🔄 Setting temporary user from token:', tempUser.id);
          setUser(tempUser);
        }
      } catch (error) {
        console.log('Could not decode token for temp user');
      }

      // BACKGROUND: API call to get full user data
      apiGet('/api/users/me').then(response => {
        if (response.ok) {
          return response.json();
        } else {
          console.log('API call failed - token invalid');
          localStorage.removeItem('accessToken');
          setUser(null);
          throw new Error('Invalid token');
        }
      }).then(userData => {
        console.log('✅ Full user data loaded:', userData.email);
        setUser(userData);
        setIsInitialized(true);
      }).catch(error => {
        console.error('Background user fetch error:', error);
        localStorage.removeItem('accessToken');
        setUser(null);
        setLoading(false);
        setIsInitialized(true);
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('accessToken');
      setUser(null);
    } finally {
      // OPTIMIZED: Faster state updates
      setLoading(false);
      setIsInitialized(true);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    console.log('🔑 Login başladı:', email);

    // Start performance tracking
    performanceTracker.startMeasurement('api-login', 'api');
    const speed = getConnectionSpeed();
    console.log('🌐 Detected connection speed:', speed);

    try {
      const response = await apiPost('/api/auth/login', { email, password }, siteLanguage);

      console.log('📡 Login API response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Login API error:', error);
        throw new Error(error.error || 'Giriş uğursuz oldu');
      }

      const data = await response.json();
      console.log('✅ Login API success:', {
        hasAccessToken: !!data.accessToken,
        tokenLength: data.accessToken?.length,
        hasUser: !!data.user,
        userId: data.user?.id
      });

      // End performance tracking
      const apiDuration = performanceTracker.endMeasurement('api-login');
      console.log('⚡ API Performance:', {
        duration: `${apiDuration.toFixed(2)}ms`,
        speed: speed,
        status: apiDuration < 1000 ? 'fast' : apiDuration < 3000 ? 'medium' : 'slow'
      });

      // Validate and store token immediately
      if (data.accessToken && isValidToken(data.accessToken)) {
        console.log('💾 Storing token in localStorage');
        localStorage.setItem('accessToken', data.accessToken);

        // Set user data immediately from login response (no extra API call)
        if (data.user) {
          console.log('👤 Setting user data from login response');
          setUser(data.user);
          setIsInitialized(true);
        }

        // Redirect immediately without waiting for fetchCurrentUser
        console.log('🔄 Redirecting to dashboard immediately...');
        window.location.replace('/dashboard');

        return; // Exit early, don't wait for anything else
      } else {
        console.error('❌ Invalid token received');
        throw new Error('Yanlış token alındı');
      }
    } catch (error) {
      console.error('💥 Login error:', error);
      // End performance tracking even on error
      performanceTracker.endMeasurement('api-login');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const response = await apiPost('/api/auth/register', { name, email, password }, siteLanguage);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Qeydiyyat uğursuz oldu');
      }

      // After registration, automatically log in
      await login(email, password);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [login]);

  const logout = useCallback(() => {
    console.log('🚪 LOGOUT BAŞLADI - Dərhal təmizlik...');

    // Get user info before clearing to check login method
    const currentUser = user;
    const isLinkedInUser = currentUser?.loginMethod === 'linkedin';

    // 1. IMMEDIATE state clearing - keep main loader but clear user
    setUser(null);
    // Don't change loading state - let the main app loader handle it
    setIsInitialized(true); // Keep initialized true

    // 2. IMMEDIATE storage clearing - synchronous (but preserve site language)
    if (typeof window !== 'undefined') {
      try {
        // Save site language before clearing
        const savedSiteLanguage = localStorage.getItem('siteLanguage');
        console.log('🔧 Logout: Dil saxlanır:', savedSiteLanguage);
        
        // Clear all possible storage immediately
        localStorage.clear();
        sessionStorage.clear();

        // Restore site language after clearing
        if (savedSiteLanguage) {
          localStorage.setItem('siteLanguage', savedSiteLanguage);
          console.log('🔧 Logout: Dil restore edildi:', savedSiteLanguage);
          
          // Verify it was restored
          const verifyLanguage = localStorage.getItem('siteLanguage');
          console.log('🔧 Logout: Restore verify:', verifyLanguage);
        }

        // Clear specific items that might be cached (just in case)
        ['accessToken', 'refreshToken', 'user', 'auth-token', 'cvera-auth', 'cvera-token'].forEach(key => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        });

        console.log('✅ Storage təmizləndi (dil seçimi saxlanıldı)');
      } catch (e) {
        console.log('Storage clear error:', e);
      }
    }

    // 3. IMMEDIATE cookie clearing - synchronous
    if (typeof document !== 'undefined') {
      try {
        // More aggressive cookie clearing
        const cookiesToClear = [
          'accessToken', 'refreshToken', 'auth-token', 'session', 'token',
          'cvera-auth', 'cvera-token', 'next-auth.session-token', 'next-auth.csrf-token'
        ];

        cookiesToClear.forEach(name => {
          // Clear for current domain and path
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname};`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/api;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/auth;`;
        });

        console.log('✅ Cookies təmizləndi');
      } catch (e) {
        console.log('Cookie clear error:', e);
      }
    }

    // 4. Call logout API (fire and forget - don't wait or show loading)
    apiPost('/api/auth/logout', {}, siteLanguage).then(() => {
      console.log('✅ Logout API çağırıldı');
    }).catch((error) => {
      console.log('Logout API error (ignoring):', error);
    });

    // 5. Handle LinkedIn logout if user logged in via LinkedIn
    if (isLinkedInUser) {
      console.log('🔗 LinkedIn ilə giriş edən istifadəçi - LinkedIn logout edilir...');
      setLinkedInLogoutModal(true);
      showInfo(getInfoMessage('genericInfo'));
    } else {
      showSuccess(); // Will use default success message from notificationMessages
      window.location.href = '/';
    }
  }, [user, showSuccess, showInfo]);

  const handleLinkedInLogout = (shouldLogoutFromLinkedIn: boolean) => {
    setLinkedInLogoutModal(false);

    if (shouldLogoutFromLinkedIn) {
      // LinkedIn mobile logout URL
      const linkedinLogoutUrl = 'https://linkedin.com/m/logout';

      // Open LinkedIn logout in a popup
      const logoutWindow = window.open(
        linkedinLogoutUrl,
        'linkedin_logout',
        'width=600,height=400,left=' + (screen.width/2-300) + ',top=' + (screen.height/2-200)
      );

      if (logoutWindow) {
        // Simple monitoring without complex state changes
        setTimeout(() => {
          try {
            logoutWindow.close();
          } catch (e) {}
          showSuccess(); // Will use default success message from notificationMessages
          window.location.href = '/';
        }, 3000);
      } else {
  showWarning(); // Will use default warning message from notificationMessages
  window.location.href = '/';
      }
    } else {
  showSuccess(); // Will use default success message from notificationMessages
  window.location.href = '/';
    }
  };

  const canAutoImportLinkedIn = useCallback((): boolean => {
    return user?.loginMethod === 'linkedin' && !!(user?.linkedinUsername || user?.linkedinId);
  }, [user]);

  const importLinkedInProfile = useCallback(async () => {
    if (!canAutoImportLinkedIn()) {
      throw new Error('LinkedIn auto-import yalnız LinkedIn ilə giriş edən istifadəçilər üçündür');
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('Giriş tələb olunur');
    }

    setLoading(true);
    try {
      const response = await apiPost('/api/import/linkedin-auto', {}, siteLanguage);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'LinkedIn profil import xətası');
      }

      const result = await response.json();
      console.log('✅ LinkedIn profil uğurla import edildi:', result.profile?.name);

      return result;
    } catch (error) {
      console.error('❌ LinkedIn import xətası:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [canAutoImportLinkedIn]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      fetchCurrentUser();
    }
  }, [fetchCurrentUser]);

  const value = {
    user,
    loading,
    isInitialized,
    login,
    register,
    logout,
    fetchCurrentUser,
    canAutoImportLinkedIn,
    importLinkedInProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      
      {/* LinkedIn Logout Modal */}
      {linkedInLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              LinkedIn Çıxışı
            </h3>
            <p className="text-gray-600 mb-6">
              Siz LinkedIn ilə giriş etmişsiniz. LinkedIn-dən də çıxış etmək istəyirsiniz?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => handleLinkedInLogout(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Xeyr
              </button>
              <button
                onClick={() => handleLinkedInLogout(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Bəli, LinkedIn-dən də çıxış et
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth yalnız AuthProvider daxilində istifadə edilməlidir');
  }
  return context;
}

export function getUserTier(user: User): string {
  const activeSubscription = user.subscriptions?.find(sub => sub.status === 'active');
  return activeSubscription?.tier || 'Free';
}

// JWT functions for backend API use
export function verifyJWT(token: string): { userId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; email: string };
    return decoded;
  } catch {
    return null;
  }
}

export function generateJWT(payload: { userId: string; email: string }): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '1h',
  });
}

export function generateRefreshToken(payload: { userId: string; email: string }): string {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: '7d',
  });
}
