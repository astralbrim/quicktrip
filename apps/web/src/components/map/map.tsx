'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Place } from '@quicktrip/shared'

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Helper functions for displaying place information
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    tourist_attraction: '観光スポット',
    restaurant: 'レストラン',
    cafe: 'カフェ',
    park: '公園',
    shopping: 'ショッピング',
    entertainment: 'エンターテイメント',
    other: 'その他'
  }
  return labels[category] || category
}

function getPriceRangeLabel(priceRange: string): string {
  const labels: Record<string, string> = {
    free: '無料',
    under_1000: '〜1,000円',
    under_3000: '〜3,000円',
    over_3000: '3,000円〜'
  }
  return labels[priceRange] || priceRange
}

interface MapProps {
  center: [number, number]
  places: Place[]
  radius?: number
  onPlaceClick?: (place: Place) => void
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap()
  
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])
  
  return null
}

export function Map({ center, places, radius, onPlaceClick }: MapProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
        <div className="text-gray-500">地図を読み込み中...</div>
      </div>
    )
  }

  return (
    <MapContainer
      center={center}
      zoom={13}
      className="w-full h-full"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapController center={center} />
      
      {/* Current location marker */}
      <Marker position={center}>
        <Popup>現在地</Popup>
      </Marker>
      
      {/* Search radius circle */}
      {radius && (
        <Circle
          center={center}
          radius={radius}
          pathOptions={{
            color: '#0ea5e9',
            fillColor: '#0ea5e9',
            fillOpacity: 0.1,
            weight: 2,
          }}
        />
      )}
      
      {/* Place markers */}
      {places.map((place) => (
        <Marker
          key={place.id}
          position={[place.latitude, place.longitude]}
          eventHandlers={{
            click: () => onPlaceClick?.(place),
          }}
        >
          <Popup>
            <div className="min-w-[240px] max-w-[280px]">
              <h3 className="font-semibold text-lg mb-1">{place.name}</h3>
              
              {/* Category badge */}
              <div className="mb-2">
                <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                  {getCategoryLabel(place.category)}
                </span>
              </div>
              
              {place.description && (
                <p className="text-sm text-gray-600 mb-2">{place.description}</p>
              )}
              
              {place.address && (
                <p className="text-xs text-gray-500 mb-2 flex items-start">
                  <span className="mr-1">📍</span>
                  {place.address}
                </p>
              )}
              
              <div className="flex items-center justify-between text-xs">
                <div>
                  {place.travelTime !== undefined && (
                    <span className="text-primary-600 font-medium">
                      約{place.travelTime}分 ({place.distance}m)
                    </span>
                  )}
                </div>
                
                {place.priceRange && (
                  <span className="text-gray-500">
                    {getPriceRangeLabel(place.priceRange)}
                  </span>
                )}
              </div>
              
              {place.openingHours && (
                <p className="text-xs text-gray-500 mt-1">
                  🕒 {place.openingHours}
                </p>
              )}
              
              {place.website && (
                <a 
                  href={place.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline mt-2 block"
                >
                  詳細を見る →
                </a>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}