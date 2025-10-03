// Geocoding utility to convert ZIP codes to city names

export interface LocationData {
  city: string
  state: string
  zipCode: string
  lat: number
  lon: number
}

export async function getLocationFromZip(zipCode: string): Promise<LocationData | null> {
  try {
    // Use OpenWeatherMap Geocoding API (same as weather service)
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/zip?zip=${zipCode},US&appid=${process.env.OPENWEATHER_API_KEY}`
    )

    if (!response.ok) {
      throw new Error('Failed to geocode ZIP')
    }

    const data = await response.json()

    return {
      city: data.name,
      state: data.state || '',
      zipCode: zipCode,
      lat: data.lat,
      lon: data.lon
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

// Common ZIP to city mappings for instant display (backup)
export const commonZipMappings: { [key: string]: { city: string; state: string; lat: number; lon: number } } = {
  '10001': { city: 'New York', state: 'NY', lat: 40.7484, lon: -73.9967 },
  '90210': { city: 'Beverly Hills', state: 'CA', lat: 34.0901, lon: -118.4065 },
  '21286': { city: 'Towson', state: 'MD', lat: 39.4143, lon: -76.5761 },
  '33101': { city: 'Miami Beach', state: 'FL', lat: 25.7791, lon: -80.1978 },
  '80424': { city: 'Frisco', state: 'CO', lat: 39.4753, lon: -106.0225 },
  '12345': { city: 'Schenectady', state: 'NY', lat: 42.8142, lon: -73.9396 }
}

export function getQuickLocationName(zipCode: string): string {
  const mapping = commonZipMappings[zipCode]
  if (mapping) {
    return `${mapping.city}, ${mapping.state}`
  }
  return zipCode // Fallback to ZIP if not found
}