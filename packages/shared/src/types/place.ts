export interface Place {
  id: string
  name: string
  category: PlaceCategory
  latitude: number
  longitude: number
  address?: string
  description?: string
  website?: string
  openingHours?: string
  priceRange?: PriceRange
  facilities?: Facility[]
  isOpen?: boolean
  distance?: number
  travelTime?: number
}

export type PlaceCategory = 
  | "tourist_attraction"
  | "leisure"
  | "park"
  | "restaurant"
  | "cafe"

export type PriceRange = 
  | "free"
  | "under_1000"
  | "under_3000"
  | "over_3000"

export type Facility = 
  | "child_friendly"
  | "pet_friendly"
  | "parking"
  | "barrier_free"

export type TransportMode = 
  | "walking"
  | "driving"
  | "cycling"
  | "transit"

export interface SearchRequest {
  latitude: number
  longitude: number
  timeMinutes: number
  transport: TransportMode
  categories?: PlaceCategory[]
  priceRange?: PriceRange
  facilities?: Facility[]
  openNow?: boolean
}

export interface SearchResponse {
  places: Place[]
  center: {
    latitude: number
    longitude: number
  }
  radius: number
}