import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import ScrollRestoration from './components/ScrollRestoration.jsx'
// import StartupCheck from './components/StartupCheck.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { CartProvider } from './contexts/CartContext.jsx'
import { SettingsProvider } from './contexts/SettingsContext.jsx'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* <StartupCheck> */}
      <BrowserRouter>
        <ScrollRestoration />
        <AuthProvider>
          <SettingsProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </SettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    {/* </StartupCheck> */}
  </React.StrictMode>,
)
