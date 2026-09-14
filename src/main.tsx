import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import './styles/global.css'

const host = document.getElementById('root')
if (!host) throw new Error('#root missing in index.html')

createRoot(host).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

// Clear offscreen React roots on HMR so nothing leaks between edits.
if (import.meta.hot) import.meta.hot.dispose(() => void import('./services/renderOffscreen').then((m) => m.disposeOffscreen()))
