import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import 'rsuite/dist/rsuite.min.css';
import { Provider } from 'react-redux'
import { store } from './redux/store.ts';
import { BrowserRouter } from 'react-router';
import { AuthProvider } from './context/AuthContext.tsx';
import ThemeProvider from './context/ThemeProvider.tsx';
import ThemedToaster from './components/ThemedToaster.tsx';

import "sweetalert2/dist/sweetalert2.min.css";
import "animate.css";
import './styles/themes.css'
import './index.css'
import './style.css'
import './features/notifications/notifications.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <QueryClientProvider client={queryClient}>
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <ThemedToaster />
            <App />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
    </QueryClientProvider>
  // </StrictMode>,
)
