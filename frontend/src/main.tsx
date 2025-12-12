import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAccountStore } from "./store/accountStore";
import { useAuthStore } from "./store/authStore";
import { useInvoiceStore } from "./store/invoiceStore";
import { useOperatorAccountsStore } from "./store/operatorAccountsStore";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

export const queryClient = new QueryClient();

// Expose store states globally for debugging in console (read-only, lazy evaluation)
// Only enabled in development to avoid performance impact in production
if (typeof globalThis !== 'undefined' && import.meta.env.DEV) {
  // Helper to extract only data properties (exclude functions)
  const getDataOnly = (state: any) => {
    const dataOnly: any = {};
    for (const key in state) {
      if (typeof state[key] !== 'function') {
        dataOnly[key] = state[key];
      }
    }
    return dataOnly;
  };

  (globalThis as any).stores = {
    get account() {
      return getDataOnly(useAccountStore.getState());
    },
    get auth() {
      return getDataOnly(useAuthStore.getState());
    },
    get invoice() {
      return getDataOnly(useInvoiceStore.getState());
    },
    get operatorAccounts() {
      return getDataOnly(useOperatorAccountsStore.getState());
    },
  };
}

root.render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
