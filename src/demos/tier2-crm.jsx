import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import Tier2CRMDemo from './Tier2CRMDemo.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Tier2CRMDemo />
  </StrictMode>
)
