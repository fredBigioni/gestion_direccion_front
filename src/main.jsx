// src/main.jsx
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App.jsx'
import { RecoilRoot } from 'recoil'
import RecoilNexus from 'recoil-nexus'
import { BrowserRouter } from 'react-router-dom'

const container = document.getElementById('root')
const root = createRoot(container)

root.render(
  <RecoilRoot>
    <RecoilNexus />
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </RecoilRoot>
)
