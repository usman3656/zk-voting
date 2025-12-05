import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Polyfills for Node.js modules in browser
import { Buffer } from 'buffer'
import process from 'process'

// Make Buffer and process available globally
declare global {
  interface Window {
    Buffer: typeof Buffer;
    process: typeof process;
  }
}

window.Buffer = Buffer
window.process = process

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
