'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import { PlacesList } from '@/components/places/places-list'
import { SearchHistory } from '@/components/search/search-history'
import { CategoryFilter } from '@/components/search/category-filter'
import { DetailedFilter } from '@/components/search/detailed-filter'
import { Place, SearchRequest, TIME_PRESETS, TRANSPORT_MODES } from '@quicktrip/shared'

// Dynamically import Map component to avoid SSR issues
const Map = dynamic(() => import('@/components/map/map').then(mod => ({ default: mod.Map })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
      <div className="text-gray-500">地図を読み込み中...</div>
    </div>
  )
})

export default function AppPage() {
  const { data: session, status } = useSession()
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null)
  const [places, setPlaces] = useState<Place[]>([])
  const [timeMinutes, setTimeMinutes] = useState(30)
  const [transport, setTransport] = useState<'walking' | 'driving' | 'cycling' | 'transit'>('walking')
  const [isLoading, setIsLoading] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [showList, setShowList] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<string>()
  const [openNow, setOpenNow] = useState(false)
  const [facilities, setFacilities] = useState<string[]>([])

  // Get current location on mount
  useEffect(() => {
    const getLocation = async () => {
      console.log('Starting geolocation...')
      
      if (!navigator.geolocation) {
        console.log('Geolocation not supported')
        setLocationError('位置情報がサポートされていません')
        return
      }

      console.log('Geolocation is supported')

      // Check permission first
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' })
        console.log('Geolocation permission status:', permission.state)
        
        if (permission.state === 'denied') {
          setLocationError('位置情報の許可が拒否されています。ブラウザの設定から許可してください。')
          return
        }
      } catch (permissionError) {
        console.log('Permission API not available, proceeding with geolocation')
      }

      try {
        // More conservative options for better compatibility
        const options: PositionOptions = {
          enableHighAccuracy: false, // Less accurate but faster
          timeout: 15000, // 15 seconds
          maximumAge: 600000 // 10 minutes
        }

        console.log('Requesting location with options:', options)

        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              console.log('Geolocation success:', pos)
              resolve(pos)
            },
            (err) => {
              console.error('Geolocation error:', err)
              reject(err)
            },
            options
          )
        })

        const { latitude, longitude } = position.coords
        console.log('Location obtained:', { latitude, longitude, accuracy: position.coords.accuracy })
        setCurrentLocation([latitude, longitude])
        setLocationError('') // Clear any previous errors
        
        // Auto-search when location is obtained
        searchPlaces(latitude, longitude, timeMinutes, transport)
      } catch (error: any) {
        console.error('Location error details:', error)
        let errorMessage = '位置情報の取得に失敗しました。'
        
        if (error && typeof error === 'object' && 'code' in error) {
          switch (error.code) {
            case 1: // PERMISSION_DENIED
              errorMessage = '位置情報の許可が拒否されました。ブラウザのアドレスバーの位置情報アイコンをクリックして許可してください。'
              break
            case 2: // POSITION_UNAVAILABLE
              errorMessage = '位置情報が利用できません。GPS機能を確認してください。'
              break
            case 3: // TIMEOUT
              errorMessage = '位置情報の取得がタイムアウトしました。再試行してください。'
              break
            default:
              errorMessage = `位置情報エラー (コード: ${error.code}): ${error.message || '不明なエラー'}`
          }
        }
        
        setLocationError(errorMessage)
        console.log('Location error, user must choose manually')
        // Don't auto-set fallback location, let user choose
      }
    }

    getLocation()
  }, [])

  const searchPlaces = async (lat: number, lng: number, time: number, transportMode: string, categories?: string[], detailedFilters?: any) => {
    setIsLoading(true)
    try {
      const searchParams: SearchRequest = {
        latitude: lat,
        longitude: lng,
        timeMinutes: time,
        transport: transportMode as any,
        categories: categories || selectedCategories.length > 0 ? selectedCategories as any : undefined,
        priceRange: detailedFilters?.priceRange || priceRange,
        openNow: detailedFilters?.openNow !== undefined ? detailedFilters.openNow : openNow,
        facilities: detailedFilters?.facilities || facilities.length > 0 ? facilities as any : undefined,
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

  const handleHistoryClick = (historyItem: any) => {
    // Set search parameters from history
    setTimeMinutes(historyItem.timeMinutes)
    setTransport(historyItem.transport)
    
    // Set location and search
    const location: [number, number] = [historyItem.latitude, historyItem.longitude]
    setCurrentLocation(location)
    searchPlaces(location[0], location[1], historyItem.timeMinutes, historyItem.transport)
  }

  const handleCategoriesChange = (categories: string[]) => {
    setSelectedCategories(categories)
    // Auto-search when categories change
    if (currentLocation) {
      searchPlaces(currentLocation[0], currentLocation[1], timeMinutes, transport, categories)
    }
  }

  const handleDetailedFiltersChange = (filters: any) => {
    setPriceRange(filters.priceRange)
    setOpenNow(filters.openNow || false)
    setFacilities(filters.facilities || [])
    
    // Auto-search when detailed filters change
    if (currentLocation) {
      searchPlaces(currentLocation[0], currentLocation[1], timeMinutes, transport, undefined, filters)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    )
  }

  const retryLocationAccess = () => {
    setLocationError('')
    setCurrentLocation(null)
    // Re-trigger the location effect
    window.location.reload()
  }

  if (!currentLocation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-lg mb-4">
            {locationError ? '位置情報の取得に失敗しました' : '位置情報を取得中...'}
          </div>
          {locationError && (
            <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded">
              {locationError}
            </div>
          )}
          <div className="space-y-3">
            <button
              onClick={() => {
                setCurrentLocation([35.6762, 139.6503]) // Tokyo Station
                searchPlaces(35.6762, 139.6503, timeMinutes, transport)
              }}
              className="w-full bg-primary-600 text-white px-6 py-2 rounded hover:bg-primary-700 text-sm"
            >
              デモ位置（東京駅）を使用する
            </button>
            {locationError && (
              <button
                onClick={retryLocationAccess}
                className="w-full bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 text-sm"
              >
                位置情報の取得を再試行
              </button>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-4 space-y-1">
            <div>• 位置情報の許可を求められた場合は「許可」をクリック</div>
            <div>• アドレスバーの位置情報アイコン 📍 から許可設定を確認</div>
            <div>• Chrome: 設定 → プライバシーとセキュリティ → サイトの設定 → 位置情報</div>
          </div>
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

      {/* Search History */}
      <SearchHistory onHistoryClick={handleHistoryClick} />

      {/* Category Filter */}
      <CategoryFilter 
        selectedCategories={selectedCategories}
        onCategoriesChange={handleCategoriesChange}
      />

      {/* Detailed Filter */}
      <DetailedFilter
        priceRange={priceRange}
        openNow={openNow}
        facilities={facilities}
        onFiltersChange={handleDetailedFiltersChange}
      />

      {/* Search Controls */}
      <div className="bg-white border-b p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Time selection */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">時間:</label>
              <select
                value={timeMinutes}
                onChange={(e) => {
                  const newTime = Number(e.target.value)
                  setTimeMinutes(newTime)
                  // Auto-search when time changes
                  if (currentLocation) {
                    searchPlaces(currentLocation[0], currentLocation[1], newTime, transport)
                  }
                }}
                className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                onChange={(e) => {
                  const newTransport = e.target.value as any
                  setTransport(newTransport)
                  // Auto-search when transport changes
                  if (currentLocation) {
                    searchPlaces(currentLocation[0], currentLocation[1], timeMinutes, newTransport)
                  }
                }}
                className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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

            {/* View toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowList(false)}
                className={`px-3 py-1 text-sm rounded ${
                  !showList 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📍 地図
              </button>
              <button
                onClick={() => setShowList(true)}
                className={`px-3 py-1 text-sm rounded ${
                  showList 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📋 リスト
              </button>
            </div>

            {/* Results count */}
            <div className="text-sm text-gray-500">
              {places.length}件の場所が見つかりました
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="h-[calc(100vh-200px)]">
        {showList ? (
          <PlacesList places={places} onPlaceClick={handlePlaceClick} />
        ) : (
          <Map
            center={currentLocation}
            places={places}
            radius={timeMinutes * 83.33} // Rough walking speed approximation
            onPlaceClick={handlePlaceClick}
          />
        )}
      </div>
    </div>
  )
}