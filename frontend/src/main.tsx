import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import 'rsuite/dist/rsuite.min.css';
import { Provider } from 'react-redux'
import { store } from './redux/store.ts';
import { BrowserRouter } from 'react-router';
import { AuthProvider } from './context/AuthContext.tsx';
import { Toaster } from 'react-hot-toast';

import "sweetalert2/dist/sweetalert2.min.css";
import "animate.css";
import './index.css'
import './style.css'

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <Provider store={store}>
      <BrowserRouter>

        <AuthProvider>
          <Toaster
            position="top-right"
            gutter={12}
            containerStyle={{
              top: 20,
              right: 20,
            }}
            toastOptions={{
              duration: 4000,
              style: {
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                color: "#0f172a",
                padding: "14px 16px",
                borderRadius: "16px",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow:
                  "0 20px 40px rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.04)",
                fontSize: "14px",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "10px",
              },

              success: {
                iconTheme: {
                  primary: "#16a34a",
                  secondary: "#ecfdf5",
                },
                style: {
                  border: "1px solid rgba(22,163,74,0.25)",
                },
              },

              error: {
                iconTheme: {
                  primary: "#dc2626",
                  secondary: "#fef2f2",
                },
                style: {
                  border: "1px solid rgba(220,38,38,0.25)",
                },
              },

              loading: {
                style: {
                  border: "1px solid rgba(59,130,246,0.25)",
                },
              },
            }}
          />
          <App />
        </AuthProvider>


      </BrowserRouter>
    </Provider>
  // </StrictMode>,
)
