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

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
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
  // </StrictMode>,
)
