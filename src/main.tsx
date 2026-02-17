import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  document.body.innerHTML =
    '<div style="padding: 20px; color: red;">Error: Root element not found</div>'
} else {
  const root = createRoot(rootElement)

  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  )

  // PWA install prompt handling
  let deferredPrompt: BeforeInstallPromptEvent | null = null

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    ;(window as unknown as Record<string, unknown>).deferredPrompt = deferredPrompt
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    ;(window as unknown as Record<string, unknown>).deferredPrompt = null
  })
}

// Type for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
