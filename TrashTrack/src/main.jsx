import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.jsx'
import { GoogleMapsProvider } from './components/CampusMap'

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.warn('Recovering from render error:', error)
    try {
      localStorage.removeItem('unklab_reports_cache_v1')
    } catch {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px 24px', textAlign: 'center', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          <h2 style={{ color: '#1b6943', marginBottom: '8px' }}>Memuat ulang data TrashTrack...</h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>
            Cache lokal telah dibersihkan agar sinkron dengan pembaruan database terbaru.
          </p>
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.removeItem('unklab_reports_cache_v1')
              } catch {}
              window.location.reload()
            }}
            style={{
              background: '#197b51',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Muat Ulang Halaman
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <GoogleMapsProvider>
        <App />
      </GoogleMapsProvider>
    </AppErrorBoundary>
  </React.StrictMode>
)
