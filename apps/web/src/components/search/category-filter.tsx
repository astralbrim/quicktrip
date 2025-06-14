'use client'

import { useState } from 'react'

export interface CategoryFilterProps {
  selectedCategories: string[]
  onCategoriesChange: (categories: string[]) => void
}

const CATEGORIES = [
  {
    id: 'tourist_attraction',
    label: '観光スポット',
    icon: '🏛️',
    description: '博物館、名所、歴史的建造物'
  },
  {
    id: 'restaurant',
    label: 'レストラン',
    icon: '🍽️',
    description: '食事、グルメ、レストラン'
  },
  {
    id: 'cafe',
    label: 'カフェ',
    icon: '☕',
    description: 'コーヒーショップ、カフェ、軽食'
  },
  {
    id: 'park',
    label: '公園',
    icon: '🌳',
    description: '公園、庭園、自然スポット'
  },
  {
    id: 'shopping',
    label: 'ショッピング',
    icon: '🛍️',
    description: 'ショップ、買い物、商業施設'
  },
  {
    id: 'entertainment',
    label: 'エンターテイメント',
    icon: '🎭',
    description: '映画館、劇場、バー、クラブ'
  }
]

export function CategoryFilter({ selectedCategories, onCategoriesChange }: CategoryFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId]
    
    onCategoriesChange(newCategories)
  }

  const handleSelectAll = () => {
    onCategoriesChange(CATEGORIES.map(cat => cat.id))
  }

  const handleClearAll = () => {
    onCategoriesChange([])
  }

  const selectedCount = selectedCategories.length
  const isAllSelected = selectedCount === CATEGORIES.length

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-3 flex items-center justify-between text-sm text-gray-700 hover:text-gray-900"
        >
          <div className="flex items-center space-x-2">
            <span>🏷️</span>
            <span>
              カテゴリーフィルター
              {selectedCount > 0 && (
                <span className="ml-1 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs">
                  {selectedCount}個選択中
                </span>
              )}
            </span>
          </div>
          <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {isExpanded && (
          <div className="pb-4">
            {/* Quick actions */}
            <div className="flex space-x-2 mb-3">
              <button
                onClick={handleSelectAll}
                disabled={isAllSelected}
                className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                すべて選択
              </button>
              <button
                onClick={handleClearAll}
                disabled={selectedCount === 0}
                className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                すべて解除
              </button>
            </div>

            {/* Category grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CATEGORIES.map((category) => {
                const isSelected = selectedCategories.includes(category.id)
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryToggle(category.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 text-primary-900'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{category.label}</div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {category.description}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex-shrink-0">
                          <div className="w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Results info */}
            {selectedCount > 0 && (
              <div className="mt-3 text-xs text-gray-500">
                選択中のカテゴリー: {CATEGORIES.filter(cat => selectedCategories.includes(cat.id)).map(cat => cat.label).join(', ')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}