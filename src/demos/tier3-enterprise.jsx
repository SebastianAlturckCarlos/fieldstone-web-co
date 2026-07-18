import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import Tier3EnterpriseDemo from './Tier3EnterpriseDemo.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Tier3EnterpriseDemo />
  </StrictMode>
)
