import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {LoaderProvider} from './common/Loader.tsx'
import { AllProvider } from './context/AllContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LoaderProvider>
      <AllProvider>
      <App />
      </AllProvider>
    </LoaderProvider>
  </StrictMode>,
)
