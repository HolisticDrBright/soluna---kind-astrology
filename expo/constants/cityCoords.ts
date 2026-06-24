// Lat/lng/timezone for the onboarding city list, so birth place resolves to the
// coordinates the backend needs. For cities not listed, the backend still
// computes sign-level data; add a geocoder (GEOCODER_API_KEY) for full coverage.
export interface CityCoord {
  lat: number;
  lng: number;
  timezone: string;
}

export const CITY_COORDS: Record<string, CityCoord> = {
  "New York, New York, USA": { lat: 40.7128, lng: -74.006, timezone: "America/New_York" },
  "Los Angeles, California, USA": { lat: 34.0522, lng: -118.2437, timezone: "America/Los_Angeles" },
  "Chicago, Illinois, USA": { lat: 41.8781, lng: -87.6298, timezone: "America/Chicago" },
  "Houston, Texas, USA": { lat: 29.7604, lng: -95.3698, timezone: "America/Chicago" },
  "Phoenix, Arizona, USA": { lat: 33.4484, lng: -112.074, timezone: "America/Phoenix" },
  "Philadelphia, Pennsylvania, USA": { lat: 39.9526, lng: -75.1652, timezone: "America/New_York" },
  "San Francisco, California, USA": { lat: 37.7749, lng: -122.4194, timezone: "America/Los_Angeles" },
  "Seattle, Washington, USA": { lat: 47.6062, lng: -122.3321, timezone: "America/Los_Angeles" },
  "Denver, Colorado, USA": { lat: 39.7392, lng: -104.9903, timezone: "America/Denver" },
  "Portland, Oregon, USA": { lat: 45.5152, lng: -122.6784, timezone: "America/Los_Angeles" },
  "Austin, Texas, USA": { lat: 30.2672, lng: -97.7431, timezone: "America/Chicago" },
  "Miami, Florida, USA": { lat: 25.7617, lng: -80.1918, timezone: "America/New_York" },
  "Atlanta, Georgia, USA": { lat: 33.749, lng: -84.388, timezone: "America/New_York" },
  "Boston, Massachusetts, USA": { lat: 42.3601, lng: -71.0589, timezone: "America/New_York" },
  "Nashville, Tennessee, USA": { lat: 36.1627, lng: -86.7816, timezone: "America/Chicago" },
  "London, England, UK": { lat: 51.5074, lng: -0.1278, timezone: "Europe/London" },
  "Paris, France": { lat: 48.8566, lng: 2.3522, timezone: "Europe/Paris" },
  "Berlin, Germany": { lat: 52.52, lng: 13.405, timezone: "Europe/Berlin" },
  "Tokyo, Japan": { lat: 35.6762, lng: 139.6503, timezone: "Asia/Tokyo" },
  "Sydney, Australia": { lat: -33.8688, lng: 151.2093, timezone: "Australia/Sydney" },
  "Toronto, Ontario, Canada": { lat: 43.6532, lng: -79.3832, timezone: "America/Toronto" },
  "Vancouver, British Columbia, Canada": { lat: 49.2827, lng: -123.1207, timezone: "America/Vancouver" },
  "Mexico City, Mexico": { lat: 19.4326, lng: -99.1332, timezone: "America/Mexico_City" },
  "São Paulo, Brazil": { lat: -23.5505, lng: -46.6333, timezone: "America/Sao_Paulo" },
  "Buenos Aires, Argentina": { lat: -34.6037, lng: -58.3816, timezone: "America/Argentina/Buenos_Aires" },
  "Mumbai, India": { lat: 19.076, lng: 72.8777, timezone: "Asia/Kolkata" },
  "Delhi, India": { lat: 28.7041, lng: 77.1025, timezone: "Asia/Kolkata" },
  "Cairo, Egypt": { lat: 30.0444, lng: 31.2357, timezone: "Africa/Cairo" },
  "Lagos, Nigeria": { lat: 6.5244, lng: 3.3792, timezone: "Africa/Lagos" },
  "Nairobi, Kenya": { lat: -1.2921, lng: 36.8219, timezone: "Africa/Nairobi" },
};
