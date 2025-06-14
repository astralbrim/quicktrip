'use client'

import { useState } from 'react'

export interface DetailedFilterProps {
  priceRange?: string
  openNow?: boolean
  facilities?: string[]
  onFiltersChange: (filters: {
    priceRange?: string
    openNow?: boolean
    facilities?: string[]
  }) => void
}

const PRICE_RANGES = [
  { id: 'free', label: '無料', icon: '🆓' },
  { id: 'under_1000', label: '〜1,000円', icon: '💰' },
  { id: 'under_3000', label: '〜3,000円', icon: '💰💰' },
  { id: 'over_3000', label: '3,000円以上', icon: '💰💰💰' }
]

const FACILITIES = [
  { id: 'barrier_free', label: 'バリアフリー', icon: '♿' },
  { id: 'parking', label: '駐車場', icon: '🅿️' },
  { id: 'child_friendly', label: '子供歓迎', icon: '👶' },
  { id: 'pet_friendly', label: 'ペット可', icon: '🐕' },
  { id: 'wifi', label: 'WiFi', icon: '📶' },
  { id: 'credit_card', label: 'カード可', icon: '💳' }
]

export function DetailedFilter({ 
  priceRange, 
  openNow, 
  facilities = [], 
  onFiltersChange 
}: DetailedFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handlePriceRangeChange = (newPriceRange: string) => {
    const finalPriceRange = newPriceRange === priceRange ? undefined : newPriceRange
    onFiltersChange({
      priceRange: finalPriceRange,
      openNow,
      facilities
    })
  }

  const handleOpenNowToggle = () => {
    onFiltersChange({
      priceRange,
      openNow: !openNow,
      facilities
    })
  }

  const handleFacilityToggle = (facilityId: string) => {
    const newFacilities = facilities.includes(facilityId)
      ? facilities.filter(id => id !== facilityId)
      : [...facilities, facilityId]
    
    onFiltersChange({
      priceRange,
      openNow,
      facilities: newFacilities
    })
  }

  const handleClearAll = () => {
    onFiltersChange({
      priceRange: undefined,
      openNow: false,
      facilities: []
    })
  }

  const activeFiltersCount = [
    priceRange,
    openNow,
    ...(facilities || [])
  ].filter(Boolean).length

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-3 flex items-center justify-between text-sm text-gray-700 hover:text-gray-900"
        >
          <div className="flex items-center space-x-2">
            <span>🔧</span>
            <span>
              詳細フィルター
              {activeFiltersCount > 0 && (
                <span className="ml-1 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs">
                  {activeFiltersCount}個適用中
                </span>
              )}
            </span>
          </div>
          <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {isExpanded && (
          <div className="pb-4 space-y-6">
            {/* Clear all button */}
            {activeFiltersCount > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={handleClearAll}
                  className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  すべてクリア
                </button>
              </div>
            )}

            {/* Price Range */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">価格帯</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRICE_RANGES.map((range) => {
                  const isSelected = priceRange === range.id
                  return (
                    <button
                      key={range.id}
                      onClick={() => handlePriceRangeChange(range.id)}
                      className={`p-2 rounded-lg border text-center text-sm transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 text-primary-900'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-lg mb-1">{range.icon}</div>
                      <div className="text-xs">{range.label}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Opening Hours */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">営業時間</h3>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={openNow || false}
                  onChange={handleOpenNowToggle}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">現在営業中の場所のみ表示</span>
              </label>
            </div>

            {/* Facilities */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">設備・サービス</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FACILITIES.map((facility) => {
                  const isSelected = facilities.includes(facility.id)
                  return (
                    <button
                      key={facility.id}
                      onClick={() => handleFacilityToggle(facility.id)}
                      className={`p-2 rounded-lg border text-left text-sm transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 text-primary-900'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{facility.icon}</span>
                        <span className="text-xs">{facility.label}</span>
                        {isSelected && (
                          <div className="ml-auto">
                            <div className="w-3 h-3 bg-primary-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Active filters summary */}
            {activeFiltersCount > 0 && (
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-xs font-medium text-gray-900 mb-2">適用中のフィルター</h4>
                <div className="flex flex-wrap gap-1">
                  {priceRange && (
                    <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded text-xs">
                      {PRICE_RANGES.find(r => r.id === priceRange)?.label}
                    </span>
                  )}
                  {openNow && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      営業中
                    </span>
                  )}
                  {facilities.map(facilityId => (
                    <span key={facilityId} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {FACILITIES.find(f => f.id === facilityId)?.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}