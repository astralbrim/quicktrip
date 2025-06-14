import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env } from '../index'
import { optionalAuthMiddleware } from '../middleware/auth'
import { OverpassService } from '../services/overpass'
import { RoutingService } from '../services/routing'

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
    console.log('Environment variables:', {
      hasJWT: !!c.env.JWT_SECRET,
      hasOpenRoute: !!c.env.OPENROUTESERVICE_API_KEY,
      openRouteKeyLength: c.env.OPENROUTESERVICE_API_KEY?.length || 0
    })
    const overpassService = new OverpassService()
    
    // Calculate search radius based on time and transport mode
    const radiusMeters = calculateSearchRadius(searchParams.timeMinutes, searchParams.transport)
    
    // Search for places using Overpass API
    console.log(`Searching places near ${searchParams.latitude}, ${searchParams.longitude} within ${radiusMeters}m`)
    let places = await overpassService.searchPlaces(
      searchParams.latitude,
      searchParams.longitude,
      radiusMeters,
      searchParams.categories
    )
    
    // Calculate actual travel times if OpenRouteService API key is available
    console.log('OpenRouteService API key available:', !!c.env.OPENROUTESERVICE_API_KEY)
    if (c.env.OPENROUTESERVICE_API_KEY) {
      console.log('Using OpenRouteService for accurate travel times...')
      const routingService = new RoutingService(c.env.OPENROUTESERVICE_API_KEY)
      
      // Calculate travel times for each place (limit to first 20 for performance)
      const placesToCalculate = places.slice(0, 20)
      const travelTimePromises = placesToCalculate.map(async (place, index) => {
        try {
          console.log(`Calculating route ${index + 1}/${placesToCalculate.length} for ${place.name}`)
          const travelTime = await routingService.calculateTravelTime(
            searchParams.latitude,
            searchParams.longitude,
            place.latitude,
            place.longitude,
            searchParams.transport
          )
          console.log(`Route calculated: ${place.name} - ${travelTime} minutes (vs estimated: ${Math.ceil(place.distance / getTransportSpeed(searchParams.transport) / 60)} minutes)`)
          return { ...place, travelTime }
        } catch (error) {
          console.error(`Failed to calculate travel time for place ${place.id}:`, error)
          // Fallback to estimation based on distance
          const estimatedTime = Math.ceil(place.distance / getTransportSpeed(searchParams.transport) / 60)
          console.log(`Fallback to estimation for ${place.name}: ${estimatedTime} minutes`)
          return { ...place, travelTime: estimatedTime }
        }
      })
      
      const placesWithTravelTime = await Promise.all(travelTimePromises)
      
      // Add remaining places with estimated travel times
      const remainingPlaces = places.slice(20).map(place => ({
        ...place,
        travelTime: Math.ceil(place.distance / getTransportSpeed(searchParams.transport) / 60)
      }))
      
      places = [...placesWithTravelTime, ...remainingPlaces]
    } else {
      // Fallback to distance-based estimation
      places = places.map(place => ({
        ...place,
        travelTime: Math.ceil(place.distance / getTransportSpeed(searchParams.transport) / 60)
      }))
    }
    
    // Filter places by travel time
    let filteredPlaces = places.filter(place => place.travelTime <= searchParams.timeMinutes)
    
    // Apply additional filters
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
    
    // Sort by travel time, then by distance
    filteredPlaces.sort((a, b) => {
      if (a.travelTime !== b.travelTime) {
        return a.travelTime - b.travelTime
      }
      return a.distance - b.distance
    })
    
    // Limit results
    filteredPlaces = filteredPlaces.slice(0, 50)
    
    console.log(`Found ${filteredPlaces.length} places within ${searchParams.timeMinutes} minutes`)
    
    return c.json({
      places: filteredPlaces,
      center: {
        latitude: searchParams.latitude,
        longitude: searchParams.longitude,
      },
      radius: radiusMeters,
    })
  } catch (error) {
    console.error('Search places error:', error)
    
    // Fallback to mock data if external APIs fail
    console.log('Falling back to mock data due to API error')
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
    
    filteredPlaces = filteredPlaces.filter(place => 
      place.travelTime <= searchParams.timeMinutes
    )
    
    return c.json({
      places: filteredPlaces,
      center: {
        latitude: searchParams.latitude,
        longitude: searchParams.longitude,
      },
      radius: searchParams.timeMinutes * 1000,
    })
  }
})

// Helper functions
function calculateSearchRadius(timeMinutes: number, transport: string): number {
  const speeds = {
    walking: 5, // km/h
    cycling: 15,
    driving: 30,
    transit: 20
  }
  
  const speed = speeds[transport as keyof typeof speeds] || 5
  const radiusKm = (speed * timeMinutes) / 60
  return Math.round(radiusKm * 1000) // Convert to meters
}

function getTransportSpeed(transport: string): number {
  const speeds = {
    walking: 83.33, // meters per minute (5 km/h)
    cycling: 250,   // meters per minute (15 km/h)
    driving: 500,   // meters per minute (30 km/h)
    transit: 333.33 // meters per minute (20 km/h)
  }
  
  return speeds[transport as keyof typeof speeds] || 83.33
}

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