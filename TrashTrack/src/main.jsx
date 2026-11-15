import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.jsx'
import { GoogleMapsProvider } from './components/CampusMap'

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by AppErrorBoundary:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      const errStr = this.state.error ? (this.state.error.stack || this.state.error.message || String(this.state.error)) : 'Unknown error'
      return (
        <div style={{ padding: '30px 20px', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
          <h2 style={{ color: '#1b6943', marginBottom: '8px' }}>Terjadi Kendala Memuat Data</h2>
          <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '14px' }}>
            Klik tombol di bawah untuk membersihkan seluruh cache lokal dan memuat ulang data segar dari server.
          </p>
          <div style={{ maxWidth: '750px', margin: '0 auto 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', textAlign: 'left', fontSize: '12px', color: '#991b1b', overflowX: 'auto', fontFamily: 'monospace' }}>
            <strong>Detail Masalah:</strong>
            <pre style={{ marginTop: '6px', whiteSpace: 'pre-wrap' }}>{errStr}</pre>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.clear()
                  sessionStorage.clear()
                } catch {}
                window.location.reload()
              }}
              style={{
                background: '#197b51',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Reset Cache & Muat Ulang Penuh
            </button>
          </div>
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
