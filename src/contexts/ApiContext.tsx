import { createContext, useContext, useState } from 'react';

type ApiProvider = 'gemini' | 'openai';

interface ApiContextType {
  provider: ApiProvider;
  setProvider: (provider: ApiProvider) => void;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<ApiProvider>(() => {
    const saved = localStorage.getItem('apiProvider');
    return (saved as ApiProvider) || 'gemini';
  });

  const handleSetProvider = (newProvider: ApiProvider) => {
    setProvider(newProvider);
    localStorage.setItem('apiProvider', newProvider);
  };

  return (
    <ApiContext.Provider value={{ provider, setProvider: handleSetProvider }}>
      {children}
    </ApiContext.Provider>
  );
}

export function useApiProvider() {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApiProvider must be used within ApiProvider');
  }
  return context;
}
