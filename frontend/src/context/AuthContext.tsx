import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole, Store } from '../types';
import axiosClient from '../api/axiosClient';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  currentStore: Store | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User, store?: Store) => void;
  logout: () => void;
  setCurrentStore: (store: Store | null) => void;
  refreshSellerStores: () => Promise<Store | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
  const [role, setRole] = useState<UserRole | null>((localStorage.getItem('user_role') as UserRole) || null);
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user_data');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentStore, setCurrentStoreState] = useState<Store | null>(() => {
    const saved = localStorage.getItem('current_store');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token && role === 'SELLER' && !currentStore) {
        await refreshSellerStores();
      }
      setIsLoading(false);
    };
    initAuth();
  }, [token, role]);

  const setCurrentStore = (store: Store | null) => {
    setCurrentStoreState(store);
    if (store) {
      localStorage.setItem('current_store', JSON.stringify(store));
    } else {
      localStorage.removeItem('current_store');
    }
  };

  const refreshSellerStores = async (): Promise<Store | null> => {
    try {
      const res = await axiosClient.get<Store[]>('/stores');
      if (res.data && res.data.length > 0) {
        const store = res.data[0];
        setCurrentStore(store);
        return store;
      }
    } catch (err) {
      console.error('Failed to fetch seller stores', err);
    }
    return null;
  };

  const login = (newToken: string, newUser: User, newStore?: Store) => {
    setToken(newToken);
    setUser(newUser);
    setRole(newUser.role);

    localStorage.setItem('access_token', newToken);
    localStorage.setItem('user_role', newUser.role);
    localStorage.setItem('user_data', JSON.stringify(newUser));

    if (newStore) {
      setCurrentStore(newStore);
    } else if (newUser.role === 'SELLER') {
      refreshSellerStores();
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setRole(null);
    setCurrentStoreState(null);

    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_data');
    localStorage.removeItem('current_store');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        currentStore,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        setCurrentStore,
        refreshSellerStores,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
