import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import MilkyWayPage from './pages/MilkyWayPage.jsx'
import './styles.css'

function RootRouter() {
  const [path, setPath] = useState(window.location.hash.slice(1))

  useEffect(() => {
    const updatePath = () => setPath(window.location.hash.slice(1))
    window.addEventListener('hashchange', updatePath)
    return () => window.removeEventListener('hashchange', updatePath)
  }, [])

  useEffect(() => {
    document.title = path === '/milky-way' ? '내가 살고 있는 우리은하 | 우주와 나' : '우주와 나'
  }, [path])

  return path === '/milky-way' ? <MilkyWayPage /> : <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootRouter />
  </StrictMode>,
)
