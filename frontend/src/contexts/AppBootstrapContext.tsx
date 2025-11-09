import { createContext, useContext } from 'react';
import type { PropsWithChildren } from 'react';
import {
  useAppBootstrap,
  type AppBootstrapState,
} from '../hooks/bootstrap/useAppBootstrap';

const AppBootstrapContext = createContext<AppBootstrapState | undefined>(
  undefined,
);

export const AppBootstrapProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const bootstrapState = useAppBootstrap();

  return (
    <AppBootstrapContext.Provider value={bootstrapState}>
      {children}
    </AppBootstrapContext.Provider>
  );
};

export const useAppBootstrapContext = (): AppBootstrapState => {
  const context = useContext(AppBootstrapContext);
  if (!context) {
    throw new Error(
      'useAppBootstrapContext must be used within an AppBootstrapProvider',
    );
  }

  return context;
};

