export interface RouteResponse {
  routes: Array<{
    summary: {
      distance: number
      duration: number
    }
    geometry: string
  }>
}

export interface IsochroneResponse {
  features: Array<{
    type: string
    properties: {
      value: number
      center: [number, number]
    }
    geometry: {
      type: string
      coordinates: number[][][]
    }
  }>
}

export class RoutingService {
  private readonly baseUrl = 'https://api.openrouteservice.org/v2'
  private readonly apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async calculateTravelTime(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number,
    transport: 'walking' | 'driving' | 'cycling' | 'transit'
  ): Promise<number> {
    try {
      const profile = this.getRouteProfile(transport)
      const url = `${this.baseUrl}/directions/${profile}/geojson`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinates: [[fromLng, fromLat], [toLng, toLat]],
          format: 'geojson'
        }),
      })

      if (!response.ok) {
        throw new Error(`Routing API error: ${response.status}`)
      }

      const data: RouteResponse = await response.json()
      
      if (data.routes && data.routes.length > 0) {
        // Return duration in minutes
        return Math.ceil(data.routes[0].summary.duration / 60)
      }
      
      // Fallback to straight-line distance estimation
      return this.estimateTravelTime(fromLat, fromLng, toLat, toLng, transport)
    } catch (error) {
      console.error('Route calculation error:', error)
      // Fallback to estimation
      return this.estimateTravelTime(fromLat, fromLng, toLat, toLng, transport)
    }
  }

  async getIsochrone(
    latitude: number,
    longitude: number,
    timeMinutes: number,
    transport: 'walking' | 'driving' | 'cycling' | 'transit'
  ): Promise<number[][]> {
    try {
      const profile = this.getRouteProfile(transport)
      const url = `${this.baseUrl}/isochrones/${profile}`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locations: [[longitude, latitude]],
          range: [timeMinutes * 60], // Convert to seconds
          range_type: 'time'
        }),
      })

      if (!response.ok) {
        throw new Error(`Isochrone API error: ${response.status}`)
      }

      const data: IsochroneResponse = await response.json()
      
      if (data.features && data.features.length > 0) {
        const coordinates = data.features[0].geometry.coordinates[0]
        return coordinates.map(coord => [coord[1], coord[0]]) // Convert lng,lat to lat,lng
      }
      
      // Fallback to circular approximation
      return this.approximateCircularIsochrone(latitude, longitude, timeMinutes, transport)
    } catch (error) {
      console.error('Isochrone calculation error:', error)
      // Fallback to circular approximation
      return this.approximateCircularIsochrone(latitude, longitude, timeMinutes, transport)
    }
  }

  private getRouteProfile(transport: string): string {
    switch (transport) {
      case 'walking':
        return 'foot-walking'
      case 'driving':
        return 'driving-car'
      case 'cycling':
        return 'cycling-regular'
      case 'transit':
        return 'foot-walking' // OpenRouteService doesn't have public transit, fallback to walking
      default:
        return 'foot-walking'
    }
  }

  private estimateTravelTime(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number,
    transport: string
  ): number {
    const distance = this.calculateDistance(fromLat, fromLng, toLat, toLng)
    
    // Rough speed estimates (km/h)
    const speeds = {
      walking: 5,
      cycling: 15,
      driving: 30,
      transit: 20
    }
    
    const speed = speeds[transport as keyof typeof speeds] || 5
    return Math.ceil((distance / 1000) / speed * 60) // Convert to minutes
  }

  private approximateCircularIsochrone(
    latitude: number,
    longitude: number,
    timeMinutes: number,
    transport: string
  ): number[][] {
    // Rough speed estimates (km/h)
    const speeds = {
      walking: 5,
      cycling: 15,
      driving: 30,
      transit: 20
    }
    
    const speed = speeds[transport as keyof typeof speeds] || 5
    const radiusKm = (speed * timeMinutes) / 60
    const radiusDegrees = radiusKm / 111 // Rough conversion

    // Generate a circle with 16 points
    const points: number[][] = []
    for (let i = 0; i < 16; i++) {
      const angle = (i * 2 * Math.PI) / 16
      const lat = latitude + radiusDegrees * Math.cos(angle)
      const lng = longitude + radiusDegrees * Math.sin(angle) / Math.cos(latitude * Math.PI / 180)
      points.push([lat, lng])
    }
    
    // Close the polygon
    if (points.length > 0) {
      points.push(points[0])
    }
    
    return points
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000 // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }
}