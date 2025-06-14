import { TransportMode, PlaceCategory, PriceRange, Facility } from './place'

export interface SearchHistory {
  id: string
  userId: string
  timeMinutes: number
  transport: TransportMode
  latitude: number
  longitude: number
  address?: string
  filters?: SearchFilters
  createdAt: Date
}

export interface SearchFilters {
  categories?: PlaceCategory[]
  priceRange?: PriceRange
  facilities?: Facility[]
  openNow?: boolean
}

export interface Favorite {
  id: string
  userId: string
  placeId: string
  placeName: string
  category: PlaceCategory
  latitude: number
  longitude: number
  createdAt: Date
}