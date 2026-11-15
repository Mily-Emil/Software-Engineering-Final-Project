// Komponen Peta Resmi Google Maps JavaScript API (@vis.gl/react-google-maps)
// Menampilkan peta Kampus Universitas Klabat (Unklab) dengan poligon batas kampus (UNKLAB_POLYGON)
// serta Marker resmi Google Maps untuk titik laporan sampah dan pemilih lokasi.
import React, { useEffect, useState } from 'react'
import { APIProvider, Marker, Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps'
import { MAP_VIEW_BOUNDS, UNKLAB_CENTER, UNKLAB_POLYGON } from '../lib/ai'

export const GOOGLE_MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim()

// Ikon Pin Resmi Google Maps sesuai status laporan TrashTrack Unklab
const GOOGLE_PIN_ICONS = {
  Menunggu: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png',
  Diproses: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
  Ditolak: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
  Selesai: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
  picked: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
}

// Komponen Poligon Batas Kampus Universitas Klabat (7 titik perimeter kampus) pada Google Maps
function CampusBoundaryPolygon({ isHybrid, fillOpacity = 0.06 }) {
  const map = useMap()
  const mapsLib = useMapsLibrary('maps')

  useEffect(() => {
    if (!map || !mapsLib) return
    try {
      const strokeColor = isHybrid ? '#4ade80' : '#1b6943'
      const polygon = new mapsLib.Polygon({
        paths: UNKLAB_POLYGON,
        strokeColor,
        strokeOpacity: 0.92,
        strokeWeight: 2.5,
        fillColor: strokeColor,
        fillOpacity,
        clickable: false,
        map
      })
      return () => {
        try {
          polygon.setMap(null)
        } catch {}
      }
    } catch (e) {
      console.warn('CampusBoundaryPolygon failed to initialize:', e)
    }
  }, [map, mapsLib, isHybrid, fillOpacity])

  return null
}

// Penanda Titik Sampah pada Google Maps menggunakan Marker Resmi (stabil & kompatibel 100%)
function CampusMapMarkers({ reports = [], onMarkerClick, pickPosition }) {
  const map = useMap()
  if (!map) return null

  return (
    <>
      {reports
        .filter(r => r && Number.isFinite(Number(r.latitude)) && Number.isFinite(Number(r.longitude)))
        .map(r => {
          const lat = Number(r.latitude)
          const lng = Number(r.longitude)
          const title = `${r.report_code} (${r.status})`
          const iconUrl = GOOGLE_PIN_ICONS[r.status] || GOOGLE_PIN_ICONS.Menunggu

          return (
            <Marker
              key={r.id || r.report_code}
              position={{ lat, lng }}
              onClick={() => onMarkerClick && onMarkerClick(r)}
              title={title}
              icon={iconUrl}
            />
          )
        })}

      {pickPosition &&
        Number.isFinite(Number(pickPosition.latitude)) &&
        Number.isFinite(Number(pickPosition.longitude)) && (
          <Marker
            position={{ lat: Number(pickPosition.latitude), lng: Number(pickPosition.longitude) }}
            title="Titik lokasi laporan yang dipilih"
            icon={GOOGLE_PIN_ICONS.picked}
          />
        )}
    </>
  )
}

// MapErrorBoundary: Mengisolasi area peta agar error apapun dari Google Maps tidak menyebabkan blank/white screen pada aplikasi
class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(err) {
    console.warn('Google Maps error caught by MapErrorBoundary:', err)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className={`gmap-wrap ${this.props.className || ''}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '13px'
          }}
        >
          Memuat komponen peta Google Maps Kampus Unklab...
        </div>
      )
    }
    return this.props.children
  }
}

export function GoogleMapsProvider({ children }) {
  if (!GOOGLE_MAPS_API_KEY) {
    return children
  }
  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} solutionChannel="trashtrack-unklab">
      {children}
    </APIProvider>
  )
}

function CampusGoogleMapInner({
  className = '',
  reports = [],
  onMarkerClick,
  interactive = true,
  onPick,
  pickPosition,
  fillOpacity = 0.06,
  showControls = true
}) {
  // 'm' = Google Maps Standard Roadmap | 'y' = Google Maps Hybrid (Satelit + Label Gedung Kampus)
  const [layerType, setLayerType] = useState('m')
  const mapTypeId = layerType === 'y' ? 'hybrid' : 'roadmap'

  const handleMapClick = event => {
    if (!onPick) return
    const latLng = event?.detail?.latLng
    if (latLng && typeof latLng.lat === 'number' && typeof latLng.lng === 'number') {
      onPick({ latitude: latLng.lat, longitude: latLng.lng })
    }
  }

  return (
    <div className={`gmap-wrap ${className}`}>
      {showControls && (
        <div className="gmap-type-toggle" role="group" aria-label="Tipe tampilan Google Maps">
          <button
            type="button"
            className={layerType === 'm' ? 'active' : ''}
            onClick={e => {
              e.stopPropagation()
              setLayerType('m')
            }}
          >
            Peta
          </button>
          <button
            type="button"
            className={layerType === 'y' ? 'active' : ''}
            onClick={e => {
              e.stopPropagation()
              setLayerType('y')
            }}
          >
            Satelit
          </button>
        </div>
      )}

      <Map
        defaultCenter={{ lat: UNKLAB_CENTER[0], lng: UNKLAB_CENTER[1] }}
        defaultZoom={16}
        minZoom={14}
        maxZoom={20}
        mapTypeId={mapTypeId}
        gestureHandling={interactive ? 'greedy' : 'cooperative'}
        disableDefaultUI={!interactive}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={interactive}
        zoomControl={interactive}
        clickableIcons={false}
        restriction={{
          latLngBounds: {
            south: MAP_VIEW_BOUNDS[0][0],
            west: MAP_VIEW_BOUNDS[0][1],
            north: MAP_VIEW_BOUNDS[1][0],
            east: MAP_VIEW_BOUNDS[1][1]
          },
          strictBounds: false
        }}
        onClick={handleMapClick}
        className="gmap-leaflet-inner"
        style={{ width: '100%', height: '100%' }}
      >
        <CampusBoundaryPolygon isHybrid={layerType === 'y'} fillOpacity={fillOpacity} />
        <CampusMapMarkers reports={reports} onMarkerClick={onMarkerClick} pickPosition={pickPosition} />
      </Map>

      <a
        className="gmap-badge"
        href={`https://www.google.com/maps/@${UNKLAB_CENTER[0]},${UNKLAB_CENTER[1]},17z`}
        target="_blank"
        rel="noreferrer"
        title="Buka lokasi Kampus Universitas Klabat di Google Maps"
      >
        <span className="gmap-dot" />
        Google Maps API
      </a>
    </div>
  )
}

// Komponen Ekspor Utama: Dilindungi oleh MapErrorBoundary agar kegagalan script Google Maps tidak merembet ke seluruh aplikasi
export default function CampusGoogleMap(props) {
  return (
    <MapErrorBoundary className={props.className}>
      <CampusGoogleMapInner {...props} />
    </MapErrorBoundary>
  )
}
