export const TIME_PRESETS = [10, 30, 60, 120] as const

export const TRANSPORT_MODES = {
  walking: { label: "徒歩", icon: "🚶" },
  driving: { label: "車", icon: "🚗" },
  cycling: { label: "自転車", icon: "🚴" },
  transit: { label: "電車", icon: "🚆" },
} as const

export const PLACE_CATEGORIES = {
  tourist_attraction: { label: "観光スポット", icon: "🏛️" },
  leisure: { label: "レジャースポット", icon: "🎢" },
  park: { label: "公園", icon: "🌳" },
  restaurant: { label: "レストラン", icon: "🍽️" },
  cafe: { label: "カフェ", icon: "☕" },
} as const

export const PRICE_RANGES = {
  free: { label: "無料", min: 0, max: 0 },
  under_1000: { label: "〜1,000円", min: 1, max: 1000 },
  under_3000: { label: "〜3,000円", min: 1001, max: 3000 },
  over_3000: { label: "3,000円以上", min: 3001, max: Infinity },
} as const

export const FACILITIES = {
  child_friendly: { label: "子連れOK", icon: "👶" },
  pet_friendly: { label: "ペット可", icon: "🐕" },
  parking: { label: "駐車場あり", icon: "🅿️" },
  barrier_free: { label: "バリアフリー", icon: "♿" },
} as const