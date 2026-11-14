import '@fontsource/rubik/hebrew-500.css'
import '@fontsource/rubik/latin-500.css'
import '@fontsource/rubik/hebrew-700.css'
import '@fontsource/rubik/latin-700.css'
import '@fontsource/rubik/hebrew-900.css'
import '@fontsource/rubik/latin-900.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
