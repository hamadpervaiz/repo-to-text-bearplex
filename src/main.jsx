import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PasswordGate from './components/PasswordGate.jsx'
import { ThemeProvider } from './context/ThemeContext'

const HASH = '396c5323cba706a94f6bcb6ac71d0dc2d309ae92604f1949780c41be5e318c5e'

function Root() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('r2t-auth') === HASH)

  return authed ? <App /> : <PasswordGate onUnlock={() => setAuthed(true)} />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <Root />
    </ThemeProvider>
  </StrictMode>,
)
