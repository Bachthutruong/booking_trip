'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AppContextType {
  cachedData: Record<string, any>;
  setCachedData: (key: string, data: any) => void;
  getCachedData: (key: string) => any;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [cachedData, setCachedDataState] = useState<Record<string, any>>({});

  const setCachedData = (key: string, data: any) => {
    setCachedDataState(prev => ({
      ...prev,
      [key]: {
        data,
        timestamp: Date.now()
      }
    }));
  };

  const getCachedData = (key: string) => {
    const cached = cachedData[key];
    if (!cached) return null;
    
    // Cache expires after 5 minutes
    if (Date.now() - cached.timestamp > 5 * 60 * 1000) {
      setCachedDataState(prev => {
        const { [key]: _, ...rest } = prev;
        return rest;
      });
      return null;
    }
    
    return cached.data;
  };

  return (
    <AppContext.Provider value={{ cachedData, setCachedData, getCachedData }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
} 