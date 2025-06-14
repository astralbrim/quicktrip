'use client'

import { Place } from '@quicktrip/shared'

interface PlacesListProps {
  places: Place[]
  onPlaceClick?: (place: Place) => void
}

export function PlacesList({ places, onPlaceClick }: PlacesListProps) {
  if (places.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">🗺️</div>
          <div className="text-lg">場所が見つかりませんでした</div>
          <div className="text-sm mt-2">検索条件を変更してみてください</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {places.map((place) => (
            <PlaceCard 
              key={place.id} 
              place={place} 
              onClick={() => onPlaceClick?.(place)} 
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface PlaceCardProps {
  place: Place
  onClick?: () => void
}

function PlaceCard({ place, onClick }: PlaceCardProps) {
  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900 mb-1">
            {place.name}
          </h3>
          <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
            {getCategoryLabel(place.category)}
          </span>
        </div>
        
        {place.priceRange && (
          <div className="ml-2">
            <span className="text-sm text-gray-600">
              {getPriceRangeLabel(place.priceRange)}
            </span>
          </div>
        )}
      </div>

      {/* Description */}
      {place.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {place.description}
        </p>
      )}

      {/* Address */}
      {place.address && (
        <div className="flex items-start mb-3 text-sm text-gray-500">
          <span className="mr-2 mt-0.5">📍</span>
          <span className="line-clamp-2">{place.address}</span>
        </div>
      )}

      {/* Travel Info */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center text-primary-600">
          <span className="mr-1">🚶</span>
          <span className="font-medium">
            約{place.travelTime}分 ({place.distance}m)
          </span>
        </div>
        
        {place.isOpen !== undefined && (
          <div className={`text-xs ${place.isOpen ? 'text-green-600' : 'text-red-600'}`}>
            {place.isOpen ? '営業中' : '営業時間外'}
          </div>
        )}
      </div>

      {/* Opening Hours */}
      {place.openingHours && (
        <div className="mt-2 text-xs text-gray-500 flex items-center">
          <span className="mr-1">🕒</span>
          <span>{place.openingHours}</span>
        </div>
      )}

      {/* Facilities */}
      {place.facilities && place.facilities.length > 0 && (
        <div className="mt-2">
          <div className="flex flex-wrap gap-1">
            {place.facilities.slice(0, 3).map((facility) => (
              <span 
                key={facility}
                className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
              >
                {getFacilityLabel(facility)}
              </span>
            ))}
            {place.facilities.length > 3 && (
              <span className="text-xs text-gray-500">
                +{place.facilities.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Website Link */}
      {place.website && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <a 
            href={place.website} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline flex items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <span>詳細を見る</span>
            <span className="ml-1">→</span>
          </a>
        </div>
      )}
    </div>
  )
}

// Helper functions
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
    under_1000: '〜¥1,000',
    under_3000: '〜¥3,000',
    over_3000: '¥3,000〜'
  }
  return labels[priceRange] || priceRange
}

function getFacilityLabel(facility: string): string {
  const labels: Record<string, string> = {
    barrier_free: 'バリアフリー',
    parking: '駐車場',
    child_friendly: '子供歓迎',
    pet_friendly: 'ペット可',
    wifi: 'WiFi',
    credit_card: 'カード可'
  }
  return labels[facility] || facility
}