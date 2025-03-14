export interface EggPrice {
  price: number
  eggType: string
  inStock: boolean
  fromRealData?: boolean
}

export interface StoreLocation {
  name: string
  address?: string
  zipCode: string
  latitude?: number
  longitude?: number
  url: string
}

