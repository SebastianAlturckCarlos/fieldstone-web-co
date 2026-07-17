import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import Tier1WedgeDemo from './Tier1WedgeDemo.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Tier1WedgeDemo />
  </StrictMode>
)
