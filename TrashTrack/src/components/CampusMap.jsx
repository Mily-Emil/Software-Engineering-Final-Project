// Komponen Peta Resmi Google Maps JavaScript API (@vis.gl/react-google-maps)
// Menampilkan peta Kampus Universitas Klabat (Unklab) dengan poligon batas kampus (UNKLAB_POLYGON)
// serta AdvancedMarker untuk titik laporan sampah dan pemilih lokasi.
// Komponen Peta Resmi Google Maps JavaScript API (@vis.gl/react-google-maps)
// Menampilkan peta Kampus Universitas Klabat (Unklab) dengan poligon batas kampus (UNKLAB_POLYGON)
// serta Marker untuk titik laporan sampah dan pemilih lokasi.
import React, { useEffect, useState } from 'react'
import { APIProvider, AdvancedMarker, Marker, Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps'
import { MAP_VIEW_BOUNDS, UNKLAB_CENTER, UNKLAB_POLYGON } from '../lib/ai'

export const GOOGLE_MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim()
export const GOOGLE_MAPS_MAP_ID = (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || '').trim()

export function statusPinClass(status) {
  if (status === 'Menunggu') return 'waiting'
  if (status === 'Diproses') return 'progress'
  if (status === 'Ditolak') return 'rejected'
  return 'done'
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

// Penanda Laporan Sampah pada Google Maps
function CampusMapMarkers({ reports = [], onMarkerClick, pickPosition }) {
  const map = useMap()
  if (!map) return null

  // Jika Map ID tersedia, gunakan AdvancedMarker dengan custom pin HTML.
  // Jika tanpa Map ID, gunakan Marker standar Google Maps agar tidak error.
  const hasMapId = Boolean(GOOGLE_MAPS_MAP_ID && GOOGLE_MAPS_MAP_ID !== 'DEMO_MAP_ID')

  return (
    <>
      {reports
        .filter(r => r && Number.isFinite(Number(r.latitude)) && Number.isFinite(Number(r.longitude)))
        .map(r => {
          const lat = Number(r.latitude)
          const lng = Number(r.longitude)
          const title = `${r.report_code} (${r.status})`

          if (hasMapId) {
            return (
              <AdvancedMarker
                key={r.id || r.report_code}
                position={{ lat, lng }}
                onClick={() => onMarkerClick && onMarkerClick(r)}
                title={title}
              >
                <div className={`pin pin-${statusPinClass(r.status)}`}>
                  <span />
                </div>
              </AdvancedMarker>
            )
          }

          return (
            <Marker
              key={r.id || r.report_code}
              position={{ lat, lng }}
              onClick={() => onMarkerClick && onMarkerClick(r)}
              title={title}
            />
          )
        })}

      {pickPosition &&
        Number.isFinite(Number(pickPosition.latitude)) &&
        Number.isFinite(Number(pickPosition.longitude)) && (
          hasMapId ? (
            <AdvancedMarker
              position={{ lat: Number(pickPosition.latitude), lng: Number(pickPosition.longitude) }}
              title="Titik lokasi laporan yang dipilih"
            >
              <div className="pin pin-picked">
                <span />
              </div>
            </AdvancedMarker>
          ) : (
            <Marker
              position={{ lat: Number(pickPosition.latitude), lng: Number(pickPosition.longitude) }}
              title="Titik lokasi laporan yang dipilih"
            />
          )
        )}
    </>
  )
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

// Komponen Utama Peta Google Maps Kampus Universitas Klabat
export default function CampusGoogleMap({
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

  // Parameter mapId hanya dioper jika bernilai sah agar Google Maps tidak crash
  const mapProps = {
    defaultCenter: { lat: UNKLAB_CENTER[0], lng: UNKLAB_CENTER[1] },
    defaultZoom: 16,
    minZoom: 14,
    maxZoom: 20,
    mapTypeId,
    gestureHandling: interactive ? 'greedy' : 'cooperative',
    disableDefaultUI: !interactive,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: interactive,
    zoomControl: interactive,
    clickableIcons: false,
    restriction: {
      latLngBounds: {
        south: MAP_VIEW_BOUNDS[0][0],
        west: MAP_VIEW_BOUNDS[0][1],
        north: MAP_VIEW_BOUNDS[1][0],
        east: MAP_VIEW_BOUNDS[1][1]
      },
      strictBounds: false
    },
    onClick: handleMapClick,
    className: 'gmap-leaflet-inner',
    style: { width: '100%', height: '100%' }
  }

  if (GOOGLE_MAPS_MAP_ID && GOOGLE_MAPS_MAP_ID !== 'DEMO_MAP_ID') {
    mapProps.mapId = GOOGLE_MAPS_MAP_ID
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

      <Map {...mapProps}>
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
