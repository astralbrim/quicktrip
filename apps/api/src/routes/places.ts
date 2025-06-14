import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env } from '../index'
import { optionalAuthMiddleware } from '../middleware/auth'

const placeRoutes = new Hono<{ Bindings: Env }>()

// Search places validation schema
const searchSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timeMinutes: z.number().min(5).max(180),
  transport: z.enum(['walking', 'driving', 'cycling', 'transit']),
  categories: z.array(z.string()).optional(),
  priceRange: z.enum(['free', 'under_1000', 'under_3000', 'over_3000']).optional(),
  facilities: z.array(z.string()).optional(),
  openNow: z.boolean().optional(),
})

// Mock place data for development
const mockPlaces = [
  {
    id: 'place_1',
    name: '東京スカイツリー',
    category: 'tourist_attraction',
    latitude: 35.7101,
    longitude: 139.8107,
    address: '東京都墨田区押上1-1-2',
    description: '東京の新しいシンボルタワー',
    website: 'https://www.tokyo-skytree.jp/',
    openingHours: '8:00-22:00',
    priceRange: 'under_3000',
    facilities: ['barrier_free', 'parking'],
    isOpen: true,
    distance: 1200,
    travelTime: 15,
  },
  {
    id: 'place_2',
    name: '上野公園',
    category: 'park',
    latitude: 35.7148,
    longitude: 139.7739,
    address: '東京都台東区上野公園',
    description: '桜の名所として有名な公園',
    website: 'https://www.kensetsu.metro.tokyo.jp/jimusho/toubuk/ueno/',
    openingHours: '24時間',
    priceRange: 'free',
    facilities: ['child_friendly', 'pet_friendly'],
    isOpen: true,
    distance: 800,
    travelTime: 10,
  },
  {
    id: 'place_3',
    name: 'スターバックス 銀座店',
    category: 'cafe',
    latitude: 35.6762,
    longitude: 139.7639,
    address: '東京都中央区銀座',
    description: '銀座の中心にあるスターバックス',
    website: 'https://www.starbucks.co.jp/',
    openingHours: '7:00-22:00',
    priceRange: 'under_1000',
    facilities: ['child_friendly'],
    isOpen: true,
    distance: 1500,
    travelTime: 20,
  },
]

// Search places endpoint
placeRoutes.post('/search', optionalAuthMiddleware, zValidator('json', searchSchema), async (c) => {
  const searchParams = c.req.valid('json')
  
  try {
    // For now, return mock data
    // In production, this would call external APIs like Overpass API
    
    // Filter places based on search criteria
    let filteredPlaces = mockPlaces
    
    if (searchParams.categories && searchParams.categories.length > 0) {
      filteredPlaces = filteredPlaces.filter(place => 
        searchParams.categories!.includes(place.category)
      )
    }
    
    if (searchParams.priceRange) {
      filteredPlaces = filteredPlaces.filter(place => 
        place.priceRange === searchParams.priceRange
      )
    }
    
    if (searchParams.openNow) {
      filteredPlaces = filteredPlaces.filter(place => place.isOpen)
    }
    
    if (searchParams.facilities && searchParams.facilities.length > 0) {
      filteredPlaces = filteredPlaces.filter(place => 
        searchParams.facilities!.some(facility => place.facilities.includes(facility))
      )
    }
    
    // Filter by time (mock implementation)
    filteredPlaces = filteredPlaces.filter(place => 
      place.travelTime <= searchParams.timeMinutes
    )
    
    return c.json({
      places: filteredPlaces,
      center: {
        latitude: searchParams.latitude,
        longitude: searchParams.longitude,
      },
      radius: searchParams.timeMinutes * 1000, // Rough approximation
    })
  } catch (error) {
    console.error('Search places error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Get place details
placeRoutes.get('/:id', optionalAuthMiddleware, async (c) => {
  const placeId = c.req.param('id')
  
  try {
    // Find place in mock data
    const place = mockPlaces.find(p => p.id === placeId)
    
    if (!place) {
      return c.json({ error: 'Place not found' }, 404)
    }
    
    return c.json({ place })
  } catch (error) {
    console.error('Get place error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export { placeRoutes }