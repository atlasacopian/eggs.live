export const getAllLAStoreLocations = () => {
  return [
    {
      name: "Ralphs",
      address: "123 Main St",
      zipCode: "90210",
      url: "https://www.ralphs.com/stores/grocery/ca/los-angeles/ralphs/703/00731",
      latitude: 34.0522,
      longitude: -118.2437,
    },
    {
      name: "Whole Foods Market",
      address: "456 Elm St",
      zipCode: "90001",
      url: "https://www.wholefoodsmarket.com/stores/dtla",
      latitude: 34.0522,
      longitude: -118.2437,
    },
    {
      name: "Trader Joe's",
      address: "789 Oak St",
      zipCode: "90002",
      url: "https://www.traderjoes.com/home/store/store-details?store=093",
      latitude: 34.0522,
      longitude: -118.2437,
    },
    {
      name: "Food 4 Less",
      address: "101 Pine St",
      zipCode: "90003",
      url: "https://www.food4less.com/stores/grocery/ca/los-angeles/food-4-less/705/00742",
      latitude: 34.0522,
      longitude: -118.2437,
    },
    {
      name: "Smart & Final",
      address: "222 Cedar St",
      zipCode: "90004",
      url: "https://www.smartandfinal.com/stores/grocery/ca/los-angeles/smart-final/401/00411",
      latitude: 34.0522,
      longitude: -118.2437,
    },
    {
      name: "Gelson's",
      address: "333 Maple St",
      zipCode: "90005",
      url: "https://www.gelsons.com/store/gelsons-market-silver-lake/",
      latitude: 34.0522,
      longitude: -118.2437,
    },
    {
      name: "Erewhon",
      address: "444 Birch St",
      zipCode: "90006",
      url: "https://www.erewhonmarket.com/locations/silver-lake/",
      latitude: 34.0522,
      longitude: -118.2437,
    },
  ]
}

export const getRepresentativeLAStoreLocations = (count: number) => {
  const allStores = getAllLAStoreLocations()
  const shuffled = [...allStores].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

