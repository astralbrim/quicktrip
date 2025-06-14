import type { Place, PlaceCategory, PriceRange, Facility } from '@quicktrip/shared'

export interface OverpassPlace {
  type: string
  id: number
  lat: number
  lon: number
  tags: {
    name?: string
    amenity?: string
    tourism?: string
    leisure?: string
    shop?: string
    cuisine?: string
    website?: string
    phone?: string
    opening_hours?: string
    addr?: {
      street?: string
      housenumber?: string
      city?: string
      postcode?: string
    }
    wheelchair?: string
    'addr:street'?: string
    'addr:housenumber'?: string
    'addr:city'?: string
    'addr:postcode'?: string
  }
}

export interface OverpassResponse {
  version: number
  generator: string
  elements: OverpassPlace[]
}

export class OverpassService {
  private readonly baseUrl = 'https://overpass-api.de/api/interpreter'

  async searchPlaces(
    latitude: number,
    longitude: number,
    radiusMeters: number,
    categories?: string[]
  ): Promise<Place[]> {
    try {
      const query = this.buildOverpassQuery(latitude, longitude, radiusMeters, categories)
      console.log('Overpass query:', query)

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        body: query,
        headers: {
          'Content-Type': 'text/plain',
          'User-Agent': 'QuickTrip/1.0'
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Overpass API error response:', errorText)
        throw new Error(`Overpass API error: ${response.status} - ${errorText}`)
      }

      const data: OverpassResponse = await response.json()
      console.log(`Overpass returned ${data.elements?.length || 0} elements`)
      return this.convertToPlaces(data.elements || [], latitude, longitude)
    } catch (error) {
      console.error('Overpass search error:', error)
      throw error
    }
  }

  private buildOverpassQuery(
    latitude: number,
    longitude: number,
    radiusMeters: number,
    categories?: string[]
  ): string {
    const bbox = this.calculateBoundingBox(latitude, longitude, radiusMeters)
    
    // Build category filters based on OpenStreetMap tags
    let categoryFilters = ''
    if (categories && categories.length > 0) {
      const filters = categories.map(category => {
        switch (category) {
          case 'tourist_attraction':
            return `node["tourism"="attraction"](${bbox});node["tourism"="museum"](${bbox});`
          case 'restaurant':
            return `node["amenity"="restaurant"](${bbox});`
          case 'cafe':
            return `node["amenity"="cafe"](${bbox});`
          case 'park':
            return `node["leisure"="park"](${bbox});`
          case 'leisure':
            return `node["amenity"="cinema"](${bbox});node["amenity"="bar"](${bbox});node["leisure"](${bbox});`
          default:
            return ''
        }
      }).filter(f => f.length > 0)
      
      if (filters.length > 0) {
        categoryFilters = `(${filters.join('')})`
      }
    }

    // If no specific categories, search for common POIs
    if (!categoryFilters) {
      categoryFilters = `(
        node["amenity"="restaurant"](${bbox});
        node["amenity"="cafe"](${bbox});
        node["amenity"="bar"](${bbox});
        node["amenity"="fast_food"](${bbox});
        node["tourism"="attraction"](${bbox});
        node["tourism"="museum"](${bbox});
        node["leisure"="park"](${bbox});
        node["shop"](${bbox});
      )`
    }

    return `[out:json][timeout:25];
${categoryFilters};
out geom;`
  }

  private calculateBoundingBox(lat: number, lng: number, radiusMeters: number): string {
    // Rough conversion: 1 degree ≈ 111km
    const latDelta = radiusMeters / 111000
    const lngDelta = radiusMeters / (111000 * Math.cos(lat * Math.PI / 180))

    const south = lat - latDelta
    const north = lat + latDelta
    const west = lng - lngDelta
    const east = lng + lngDelta

    return `${south},${west},${north},${east}`
  }

  private convertToPlaces(elements: OverpassPlace[], centerLat: number, centerLng: number): Place[] {
    return elements
      .filter((element) => element.tags?.name) // Only include places with names
      .map((element) => {
        const distance = this.calculateDistance(centerLat, centerLng, element.lat, element.lon)
        
        return {
          id: `osm_${element.type}_${element.id}`,
          name: element.tags.name || 'Unknown Place',
          category: this.mapCategory(element.tags),
          latitude: element.lat,
          longitude: element.lon,
          address: this.buildAddress(element.tags),
          description: this.buildDescription(element.tags),
          website: element.tags.website || undefined,
          openingHours: element.tags.opening_hours || undefined,
          priceRange: this.estimatePriceRange(element.tags),
          facilities: this.extractFacilities(element.tags),
          isOpen: true, // Would need opening hours parsing for accurate info
          distance: Math.round(distance),
          travelTime: 0, // Will be calculated later with routing service
        }
      })
      .sort((a, b) => a.distance - b.distance) // Sort by distance
      .slice(0, 50) // Limit results
  }

  private mapCategory(tags: OverpassPlace['tags']): PlaceCategory {
    if (tags.tourism) {
      return 'tourist_attraction'
    }
    if (tags.amenity === 'restaurant') {
      return 'restaurant'
    }
    if (tags.amenity === 'cafe') {
      return 'cafe'
    }
    if (tags.leisure === 'park' || tags.leisure === 'garden') {
      return 'park'
    }
    if (tags.shop) {
      return 'leisure'
    }
    if (tags.amenity && ['cinema', 'theatre', 'nightclub', 'bar', 'pub'].includes(tags.amenity)) {
      return 'leisure'
    }
    return 'tourist_attraction'
  }

  private buildAddress(tags: OverpassPlace['tags']): string {
    const parts = []
    
    if (tags['addr:housenumber']) parts.push(tags['addr:housenumber'])
    if (tags['addr:street']) parts.push(tags['addr:street'])
    if (tags['addr:city']) parts.push(tags['addr:city'])
    if (tags['addr:postcode']) parts.push(tags['addr:postcode'])
    
    return parts.length > 0 ? parts.join(' ') : ''
  }

  private buildDescription(tags: OverpassPlace['tags']): string {
    const parts = []
    
    if (tags.amenity) parts.push(tags.amenity)
    if (tags.tourism) parts.push(tags.tourism)
    if (tags.leisure) parts.push(tags.leisure)
    if (tags.shop) parts.push(`${tags.shop} shop`)
    if (tags.cuisine) parts.push(`Cuisine: ${tags.cuisine}`)
    
    return parts.join(', ')
  }

  private estimatePriceRange(tags: OverpassPlace['tags']): PriceRange {
    // Simple heuristic based on type
    if (tags.amenity === 'fast_food') return 'under_1000'
    if (tags.amenity === 'cafe') return 'under_1000'
    if (tags.amenity === 'restaurant') return 'under_3000'
    if (tags.leisure === 'park') return 'free'
    if (tags.tourism === 'museum') return 'under_3000'
    
    return 'under_1000'
  }

  private extractFacilities(tags: OverpassPlace['tags']): Facility[] {
    const facilities: Facility[] = []
    
    if (tags.wheelchair === 'yes') facilities.push('barrier_free')
    // Add more facility mappings as needed
    
    return facilities
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