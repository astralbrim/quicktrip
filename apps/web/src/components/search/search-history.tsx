'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface SearchHistoryItem {
  id: string
  timeMinutes: number
  transport: string
  latitude: number
  longitude: number
  address?: string
  filters?: string
  createdAt: string
}

interface SearchHistoryProps {
  onHistoryClick?: (item: SearchHistoryItem) => void
}

export function SearchHistory({ onHistoryClick }: SearchHistoryProps) {
  const { data: session } = useSession()
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (session?.accessToken) {
      fetchHistory()
    }
  }, [session])

  const fetchHistory = async () => {
    if (!session?.accessToken) return

    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/search-history`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setHistory(data.searchHistory || [])
      }
    } catch (error) {
      console.error('Failed to fetch search history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTransportIcon = (transport: string) => {
    const icons = {
      walking: '🚶',
      cycling: '🚴',
      driving: '🚗',
      transit: '🚌'
    }
    return icons[transport as keyof typeof icons] || '🚶'
  }

  const getTransportLabel = (transport: string) => {
    const labels = {
      walking: '徒歩',
      cycling: '自転車',
      driving: '車',
      transit: '交通機関'
    }
    return labels[transport as keyof typeof labels] || transport
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'たった今'
    } else if (diffInHours < 24) {
      return `${diffInHours}時間前`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}日前`
    }
  }

  if (!session) {
    return null
  }

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-3 flex items-center justify-between text-sm text-gray-700 hover:text-gray-900"
        >
          <div className="flex items-center space-x-2">
            <span>🕐</span>
            <span>検索履歴 ({history.length}件)</span>
          </div>
          <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {isExpanded && (
          <div className="pb-4">
            {isLoading ? (
              <div className="text-center py-4 text-gray-500">
                読み込み中...
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                検索履歴がありません
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onHistoryClick?.(item)}
                    className="w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">
                          {getTransportIcon(item.transport)}
                        </span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.timeMinutes}分圏内 ({getTransportLabel(item.transport)})
                          </div>
                          {item.address && (
                            <div className="text-xs text-gray-500 truncate max-w-xs">
                              📍 {item.address}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDate(item.createdAt)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}