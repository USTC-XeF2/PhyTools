import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { addStyles } from 'react-mathquill'
import './index.css'
import App from './App.tsx'

addStyles()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
