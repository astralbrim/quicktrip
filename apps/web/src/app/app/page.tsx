'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Map } from '@/components/map/map'
import { Place, SearchRequest, TIME_PRESETS, TRANSPORT_MODES } from '@quicktrip/shared'

export default function AppPage() {
  const { data: session, status } = useSession()
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null)
  const [places, setPlaces] = useState<Place[]>([])
  const [timeMinutes, setTimeMinutes] = useState(30)
  const [transport, setTransport] = useState<'walking' | 'driving' | 'cycling' | 'transit'>('walking')
  const [isLoading, setIsLoading] = useState(false)
  const [locationError, setLocationError] = useState('')

  // Get current location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setCurrentLocation([latitude, longitude])
          // Auto-search when location is obtained
          searchPlaces(latitude, longitude, timeMinutes, transport)
        },
        (error) => {
          console.error('Location error:', error)
          setLocationError('位置情報の取得に失敗しました。住所を入力してください。')
          // Default to Tokyo for demo
          setCurrentLocation([35.6762, 139.6503])
        }
      )
    } else {
      setLocationError('位置情報がサポートされていません')
      setCurrentLocation([35.6762, 139.6503])
    }
  }, [])

  const searchPlaces = async (lat: number, lng: number, time: number, transportMode: string) => {
    setIsLoading(true)
    try {
      const searchParams: SearchRequest = {
        latitude: lat,
        longitude: lng,
        timeMinutes: time,
        transport: transportMode as any,
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/places/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.accessToken && { 'Authorization': `Bearer ${session.accessToken}` }),
        },
        body: JSON.stringify(searchParams),
      })

      if (response.ok) {
        const data = await response.json()
        setPlaces(data.places)
        
        // Save search history if user is logged in
        if (session?.accessToken) {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/search-history`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.accessToken}`,
            },
            body: JSON.stringify({
              timeMinutes: time,
              transport: transportMode,
              latitude: lat,
              longitude: lng,
            }),
          })
        }
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    if (currentLocation) {
      searchPlaces(currentLocation[0], currentLocation[1], timeMinutes, transport)
    }
  }

  const handlePlaceClick = (place: Place) => {
    // TODO: Show place details modal
    console.log('Place clicked:', place)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    )
  }

  if (!currentLocation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg mb-4">位置情報を取得中...</div>
          {locationError && (
            <div className="text-red-500 text-sm">{locationError}</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">ちょいでかけ</h1>
            <div className="text-sm text-gray-500">
              {session?.user?.name || session?.user?.email}
            </div>
          </div>
        </div>
      </header>

      {/* Search Controls */}
      <div className="bg-white border-b p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Time selection */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">時間:</label>
              <select
                value={timeMinutes}
                onChange={(e) => setTimeMinutes(Number(e.target.value))}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                {TIME_PRESETS.map(time => (
                  <option key={time} value={time}>{time}分</option>
                ))}
              </select>
            </div>

            {/* Transport selection */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">移動手段:</label>
              <select
                value={transport}
                onChange={(e) => setTransport(e.target.value as any)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                {Object.entries(TRANSPORT_MODES).map(([key, { label, icon }]) => (
                  <option key={key} value={key}>
                    {icon} {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search button */}
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="bg-primary-600 text-white px-4 py-1 rounded text-sm hover:bg-primary-700 disabled:opacity-50"
            >
              {isLoading ? '検索中...' : '検索'}
            </button>

            {/* Results count */}
            <div className="text-sm text-gray-500">
              {places.length}件の場所が見つかりました
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="h-[calc(100vh-140px)]">
        <Map
          center={currentLocation}
          places={places}
          radius={timeMinutes * 83.33} // Rough walking speed approximation
          onPlaceClick={handlePlaceClick}
        />
      </div>
    </div>
  )
}