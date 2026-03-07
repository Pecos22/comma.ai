# SnowPro – Snow Shoveling Service App

A full-stack web app that lets users request snow shoveling services and get
instant quotes by pulling **real public data** about their property.

## How the Quote Works

| Data Point | Source |
|---|---|
| Address → Coordinates | Google Maps Geocoding API |
| Terrain slope | Google Maps Elevation API (7-point grid) |
| Building footprint / driveway | OpenStreetMap Overpass API |
| Driveway area fallback | US regional average (~500 ft²) |

**Pricing formula:**
```
price = max($45, sqft × $0.08) × slope_multiplier × snow_depth_multiplier
```

Slope multipliers: Flat 1.0 · Gentle 1.15 · Moderate 1.35 · Steep 1.6 · Very Steep 2.0
Snow depth surcharge kicks in above 6 inches.

## Setup

### 1. Get a Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable these APIs:
   - **Geocoding API**
   - **Elevation API**
   - **Maps JavaScript API** (optional – for the "View on Map" link)
3. Create an API key and restrict it to your server IP.

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env and paste your API key
```

### 3. Install & Run
```bash
npm install
npm start          # production
npm run dev        # development (auto-reload)
```

Visit `http://localhost:3000`

## API Endpoints

### `POST /api/quote`
Returns an instant quote for a given address.

**Request body:**
```json
{ "address": "123 Main St, Denver, CO 80202", "snowDepthIn": 6 }
```

**Response:**
```json
{
  "success": true,
  "address": "123 Main St, Denver, CO 80202, USA",
  "coordinates": { "lat": 39.7392, "lng": -104.9903 },
  "property": {
    "estimatedDrivewaySqft": 480,
    "dataSource": "building footprint (OSM)",
    "dataConfidence": "medium"
  },
  "terrain": {
    "slopePercent": "3.2",
    "slopeCategory": "Gentle Slope"
  },
  "quote": {
    "estimatedPriceUSD": "58.42",
    "priceLowUSD": "52.58",
    "priceHighUSD": "67.18",
    "tier": "Standard",
    "turnaround": "4–6 hours"
  }
}
```

### `POST /api/book`
Submits a service booking (returns a confirmation ID).

**Request body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "(555) 867-5309",
  "address": "123 Main St, Denver, CO 80202",
  "preferredDate": "2026-01-15",
  "snowDepthIn": 6
}
```

## Tech Stack

- **Backend:** Node.js + Express
- **Frontend:** Vanilla HTML/CSS/JavaScript (no framework)
- **APIs:** Google Maps (Geocoding + Elevation), OpenStreetMap Overpass
- **Rate limiting:** 30 requests / 15 min per IP
