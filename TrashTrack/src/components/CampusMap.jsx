// Komponen Peta Resmi Google Maps JavaScript API (@vis.gl/react-google-maps)
// Menampilkan peta Kampus Universitas Klabat (Unklab) dengan poligon batas kampus (UNKLAB_POLYGON)
// serta AdvancedMarker untuk titik laporan sampah dan pemilih lokasi.
import React, { useEffect, useState } from 'react'
import { APIProvider, AdvancedMarker, Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps'
import { MapContainer, TileLayer, Polygon as LeafletPolygon, Marker as LeafletMarker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MAP_VIEW_BOUNDS, UNKLAB_CENTER, UNKLAB_POLYGON } from '../lib/ai'

export const GOOGLE_MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim()
export const GOOGLE_MAPS_MAP_ID = (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID').trim()

export function statusPinClass(status) {
  if (status === 'Menunggu') return 'waiting'
  if (status === 'Diproses') return 'progress'
  if (status === 'Ditolak') return 'rejected'
  return 'done'
}

function createLeafletPinIcon(status, isPicked = false) {
  const pinClass = isPicked ? 'pin-picked' : `pin-${statusPinClass(status)}`
  return L.divIcon({
    className: 'custom-leaflet-marker-div',
    html: `<div class="pin ${pinClass}"><span /></div>`,
    iconSize: [27, 34],
    iconAnchor: [13, 34]
  })
}

// Interaksi klik peta untuk memilih lokasi (Location Picker) pada mode Leaflet
function LeafletMapPickerEvents({ onPick }) {
  useMapEvents({
    click(e) {
      if (onPick && e?.latlng) {
        onPick({ latitude: e.latlng.lat, longitude: e.latlng.lng })
      }
    }
  })
  return null
}

// Peta Interaktif Mandiri (Leaflet/OpenStreetMap + Esri Satellite)
// Aktif otomatis ketika Google Maps API belum di-enable atau mengalami pembatasan di Google Cloud Console
export function InteractiveLeafletMap({
  className = '',
  reports = [],
  onMarkerClick,
  interactive = true,
  onPick,
  pickPosition,
  fillOpacity = 0.06,
  showControls = true
}) {
  const [layerType, setLayerType] = useState('m') // 'm' = Roadmap, 'y' = Satellite
  const tileUrl =
    layerType === 'y'
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  const tileAttr =
    layerType === 'y'
      ? '&copy; Esri World Imagery'
      : '&copy; OpenStreetMap contributors'

  const centerLat = pickPosition?.latitude ? Number(pickPosition.latitude) : UNKLAB_CENTER[0]
  const centerLng = pickPosition?.longitude ? Number(pickPosition.longitude) : UNKLAB_CENTER[1]

  return (
    <div className={`gmap-wrap ${className}`}>
      {showControls && (
        <div className="gmap-type-toggle" role="group" aria-label="Tipe tampilan peta">
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

      <MapContainer
        center={[centerLat, centerLng]}
        zoom={16}
        minZoom={14}
        maxZoom={19}
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={interactive}
        attributionControl={false}
        className="gmap-leaflet-inner"
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer url={tileUrl} attribution={tileAttr} maxZoom={19} />

        <LeafletPolygon
          positions={UNKLAB_POLYGON.map(p => [p.lat, p.lng])}
          pathOptions={{
            color: layerType === 'y' ? '#4ade80' : '#1b6943',
            fillColor: layerType === 'y' ? '#4ade80' : '#1b6943',
            fillOpacity: fillOpacity,
            weight: 2.5
          }}
        />

        {reports
          .filter(r => r && Number.isFinite(Number(r.latitude)) && Number.isFinite(Number(r.longitude)))
          .map(r => (
            <LeafletMarker
              key={r.id || r.report_code}
              position={[Number(r.latitude), Number(r.longitude)]}
              icon={createLeafletPinIcon(r.status)}
              eventHandlers={{
                click: () => onMarkerClick && onMarkerClick(r)
              }}
            />
          ))}

        {pickPosition &&
          Number.isFinite(Number(pickPosition.latitude)) &&
          Number.isFinite(Number(pickPosition.longitude)) && (
            <LeafletMarker
              position={[Number(pickPosition.latitude), Number(pickPosition.longitude)]}
              icon={createLeafletPinIcon(null, true)}
            />
          )}

        {interactive && onPick && <LeafletMapPickerEvents onPick={onPick} />}
      </MapContainer>

      <span className="gmap-badge" title="Peta Interaktif Kampus Unklab (Aktif)">
        <span className="gmap-dot" style={{ background: '#10b981' }} />
        {layerType === 'y' ? 'Satelit Unklab' : 'Peta Unklab'}
      </span>
    </div>
  )
}

// Komponen Poligon Batas Kampus Universitas Klabat (7 titik perimeter kampus) untuk Google Maps
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

function CampusMarkers({ reports = [], onMarkerClick, pickPosition }) {
  const map = useMap()
  if (!map) return null

  return (
    <>
      {reports
        .filter(r => r && Number.isFinite(Number(r.latitude)) && Number.isFinite(Number(r.longitude)))
        .map(r => (
          <AdvancedMarker
            key={r.id || r.report_code}
            position={{ lat: Number(r.latitude), lng: Number(r.longitude) }}
            onClick={() => onMarkerClick && onMarkerClick(r)}
            title={`${r.report_code} (${r.status})`}
          >
            <div className={`pin pin-${statusPinClass(r.status)}`}>
              <span />
            </div>
          </AdvancedMarker>
        ))}

      {pickPosition && Number.isFinite(Number(pickPosition.latitude)) && Number.isFinite(Number(pickPosition.longitude)) && (
        <AdvancedMarker
          position={{ lat: Number(pickPosition.latitude), lng: Number(pickPosition.longitude) }}
          title="Titik lokasi laporan"
        >
          <div className="pin pin-picked">
            <span />
          </div>
        </AdvancedMarker>
      )}
    </>
  )
}

// MapErrorBoundary: Mengalihkan ke Peta Interaktif Leaflet jika Google Maps gagal otorisasi
class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(err) {
    console.warn('Google Maps error caught, fallback to InteractiveLeafletMap:', err)
  }

  render() {
    if (this.state.hasError) {
      return <InteractiveLeafletMap {...this.props} />
    }
    return this.props.children
  }
}

export function GoogleMapsProvider({ children }) {
  if (!GOOGLE_MAPS_API_KEY) {
    return children
  }
  return <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>{children}</APIProvider>
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
        mapId={GOOGLE_MAPS_MAP_ID}
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
        <CampusMarkers reports={reports} onMarkerClick={onMarkerClick} pickPosition={pickPosition} />
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

export default function CampusGoogleMap(props) {
  // Jika Google Maps API Key belum diaktifkan atau gagal auth, langsung gunakan InteractiveLeafletMap
  return (
    <MapErrorBoundary {...props}>
      <CampusGoogleMapInner {...props} />
    </MapErrorBoundary>
  )
}
