import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import { ThemeProvider } from './context/ThemeContext'
import { ServiceProvider } from './context/ServiceContext'
import App from './App.jsx'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ServiceProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ServiceProvider>
  </StrictMode>,
)
