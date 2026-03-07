require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Set MOCK_MODE=false in .env when real external APIs are reachable.
const MOCK_MODE = process.env.MOCK_MODE !== 'false';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting: 30 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ── Deterministic seeded RNG (no deps) ───────────────────────────────────────
// Lets us derive "realistic" but repeatable mock values from an address string.
function seededRand(seed) {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return () => {
    h ^= h << 13; h ^= h >> 17; h ^= h << 5;
    return (h >>> 0) / 0xffffffff;
  };
}

// ── US state → approximate center coordinates ─────────────────────────────────
const STATE_COORDS = {
  AL:[32.8,-86.8],AK:[64.2,-153.4],AZ:[34.3,-111.1],AR:[34.8,-92.2],
  CA:[36.8,-119.4],CO:[39.0,-105.5],CT:[41.6,-72.7],DE:[39.0,-75.5],
  FL:[27.8,-81.6],GA:[32.2,-83.4],HI:[20.8,-156.3],ID:[44.1,-114.5],
  IL:[40.0,-89.2],IN:[40.3,-86.1],IA:[42.0,-93.2],KS:[38.5,-98.4],
  KY:[37.5,-85.3],LA:[31.2,-91.8],ME:[45.3,-69.4],MD:[39.0,-76.8],
  MA:[42.3,-71.8],MI:[43.3,-84.5],MN:[46.4,-93.1],MS:[32.7,-89.7],
  MO:[38.5,-92.5],MT:[47.0,-110.5],NE:[41.5,-99.9],NV:[38.5,-117.1],
  NH:[43.7,-71.6],NJ:[40.1,-74.5],NM:[34.5,-106.0],NY:[42.2,-74.9],
  NC:[35.6,-79.4],ND:[47.5,-100.5],OH:[40.4,-82.8],OK:[35.6,-97.5],
  OR:[43.9,-120.6],PA:[40.9,-77.8],RI:[41.7,-71.5],SC:[33.9,-80.9],
  SD:[44.4,-100.2],TN:[35.9,-86.7],TX:[31.5,-99.3],UT:[39.3,-111.1],
  VT:[44.0,-72.7],VA:[37.8,-78.2],WA:[47.4,-120.5],WV:[38.6,-80.6],
  WI:[44.3,-89.8],WY:[43.0,-107.6],DC:[38.9,-77.0],
};

// ── Mock Geocoding ────────────────────────────────────────────────────────────
async function geocodeAddress(address) {
  if (!MOCK_MODE) {
    const axios = require('axios');
    const { data } = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q: address, format: 'json', addressdetails: 1, limit: 1 },
      headers: { 'User-Agent': 'SnowProApp/1.0 (snow-shovel-service)' },
      timeout: 10000,
    });
    if (!data.length) throw new Error('Address not found. Please enter a valid address.');
    const r = data[0];
    return {
      lat: parseFloat(r.lat), lng: parseFloat(r.lon),
      formattedAddress: r.display_name,
      zipCode: r.address?.postcode || null,
    };
  }

  // ── Mock path ──
  const norm = address.trim().toUpperCase();

  // Detect state abbreviation (e.g. ", CO " or " CO 80202")
  const stateMatch = norm.match(/,?\s+([A-Z]{2})[\s,]/);
  const stateCode = stateMatch ? stateMatch[1] : null;
  const base = stateCode && STATE_COORDS[stateCode]
    ? STATE_COORDS[stateCode]
    : [40.7128, -74.0060]; // default: NYC

  // Sprinkle a small deterministic offset so different streets differ
  const rng = seededRand(norm);
  const lat = +(base[0] + (rng() - 0.5) * 0.08).toFixed(6);
  const lng = +(base[1] + (rng() - 0.5) * 0.08).toFixed(6);

  // Build a cleaned-up display address
  const zipMatch = address.match(/\b\d{5}(-\d{4})?\b/);
  const formattedAddress = address.trim().replace(/\s+/g, ' ') +
    (zipMatch ? '' : (stateCode ? '' : ', USA'));

  return { lat, lng, formattedAddress, zipCode: zipMatch ? zipMatch[0] : null };
}

// ── Elevation / Slope ─────────────────────────────────────────────────────────
async function getElevationData(lat, lng) {
  if (!MOCK_MODE) {
    const axios = require('axios');
    const offsetDeg = 0.0003;
    const points = [
      { latitude: lat,             longitude: lng },
      { latitude: lat + offsetDeg, longitude: lng },
      { latitude: lat - offsetDeg, longitude: lng },
      { latitude: lat,             longitude: lng + offsetDeg },
      { latitude: lat,             longitude: lng - offsetDeg },
      { latitude: lat + offsetDeg, longitude: lng + offsetDeg },
      { latitude: lat - offsetDeg, longitude: lng - offsetDeg },
    ];
    const { data } = await axios.post(
      'https://api.open-elevation.com/api/v1/lookup',
      { locations: points },
      { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
    );
    if (!data.results?.length) throw new Error('Unable to retrieve elevation data');
    const elevations = data.results.map((r) => r.elevation);
    const minElev = Math.min(...elevations);
    const maxElev = Math.max(...elevations);
    const elevDiff = maxElev - minElev;
    const spanMeters = 0.0003 * 111000 * Math.sqrt(2);
    const slopePct = (elevDiff / spanMeters) * 100;
    return {
      centerElevation: elevations[0].toFixed(1),
      minElevation: minElev.toFixed(1),
      maxElevation: maxElev.toFixed(1),
      elevationChange: elevDiff.toFixed(1),
      slopePercent: slopePct.toFixed(1),
      slopeCategory: categorizeSLope(slopePct),
    };
  }

  // ── Mock path: derive plausible elevation from lat/lng ──
  // Mountains in the west, flat in the midwest/east — rough heuristic
  const rng = seededRand(`${lat.toFixed(4)},${lng.toFixed(4)}`);

  // Base elevation heuristic: western US tends to be higher
  let baseElev = 300; // meters
  if (lng < -104) baseElev = 800 + (rng() * 2000);       // Rockies / west
  else if (lng < -90) baseElev = 200 + (rng() * 400);    // midwest
  else baseElev = 50 + (rng() * 300);                    // east

  // Random elevation diff across the 7-point grid (0–12 m typical residential)
  const elevDiff = rng() * 12;
  const spanMeters = 0.0003 * 111000 * Math.sqrt(2);
  const slopePct = (elevDiff / spanMeters) * 100;

  return {
    centerElevation: baseElev.toFixed(1),
    minElevation: (baseElev - elevDiff * 0.3).toFixed(1),
    maxElevation: (baseElev + elevDiff * 0.7).toFixed(1),
    elevationChange: elevDiff.toFixed(1),
    slopePercent: slopePct.toFixed(1),
    slopeCategory: categorizeSLope(slopePct),
  };
}

function categorizeSLope(pct) {
  if (pct < 2)  return { label: 'Flat',         multiplier: 1.0 };
  if (pct < 5)  return { label: 'Gentle Slope', multiplier: 1.15 };
  if (pct < 10) return { label: 'Moderate Slope', multiplier: 1.35 };
  if (pct < 20) return { label: 'Steep Slope',  multiplier: 1.6 };
  return              { label: 'Very Steep',    multiplier: 2.0 };
}

// ── OpenStreetMap Property/Lot Data ──────────────────────────────────────────
async function getOsmPropertyData(lat, lng) {
  if (!MOCK_MODE) {
    const axios = require('axios');
    const delta = 0.0005;
    const bbox = `${lat - delta},${lng - delta},${lat + delta},${lng + delta}`;
    const query = `
      [out:json][timeout:10];
      (
        way["building"](${bbox});
        way["amenity"="parking"](${bbox});
        way["service"="driveway"](${bbox});
        way["highway"="service"](${bbox});
      );
      out geom;
    `;
    try {
      const { data } = await axios.post(
        'https://overpass-api.de/api/interpreter',
        `data=${encodeURIComponent(query)}`,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 12000 }
      );
      let buildingArea = null;
      let drivewayfound = false;
      for (const element of data.elements || []) {
        if (element.tags?.building && element.geometry) {
          buildingArea = approximatePolygonArea(element.geometry);
        }
        if (element.tags?.service === 'driveway' || element.tags?.amenity === 'parking') {
          drivewayfound = true;
        }
      }
      return { buildingArea, drivewayfound, osmDataAvailable: true };
    } catch {
      return { buildingArea: null, drivewayfound: false, osmDataAvailable: false };
    }
  }

  // ── Mock path: generate realistic building footprint ──
  const rng = seededRand(`osm:${lat.toFixed(5)},${lng.toFixed(5)}`);

  // 70% chance we "find" a building footprint (suburban single-family)
  if (rng() < 0.70) {
    // Typical US single-family home: 1200–2800 ft² footprint (111–260 m²)
    const buildingArea = 111 + rng() * 149; // m²
    const drivewayfound = rng() < 0.45;     // 45% chance OSM has a driveway way
    return { buildingArea, drivewayfound, osmDataAvailable: true };
  }

  // 30% — no building found (new construction, rural lot, etc.)
  return { buildingArea: null, drivewayfound: false, osmDataAvailable: true };
}

// Shoelace formula for approximate polygon area (meters²) from lat/lng nodes
function approximatePolygonArea(nodes) {
  if (!nodes || nodes.length < 3) return null;
  let area = 0;
  const n = nodes.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    // Convert degrees to meters (approx)
    const xi = nodes[i].lon * 111320 * Math.cos((nodes[i].lat * Math.PI) / 180);
    const yi = nodes[i].lat * 110540;
    const xj = nodes[j].lon * 111320 * Math.cos((nodes[j].lat * Math.PI) / 180);
    const yj = nodes[j].lat * 110540;
    area += xi * yj - xj * yi;
  }
  return Math.abs(area / 2);
}

// ── Driveway Estimation ──────────────────────────────────────────────────────
// When OSM doesn't have explicit driveway data we use regional heuristics
// based on property type (single-family, townhouse, etc.) derived from the
// geocoded address components, plus the building footprint if available.
function estimateDrivewaySize(osmData, geocodeResult) {
  // If OSM has a building footprint use ~20% of it as driveway estimate
  if (osmData.buildingArea) {
    const sqft = osmData.buildingArea * 10.764; // m² → ft²
    // Driveway is typically 15-25% of building footprint for single-family
    const drivewayEstimate = Math.round(sqft * 0.20);
    return {
      estimatedSqft: Math.max(200, Math.min(drivewayEstimate, 2000)),
      source: 'building footprint (OSM)',
      confidence: 'medium',
    };
  }

  // Fallback: US average single-family driveway = 480–600 ft²
  return {
    estimatedSqft: 500,
    source: 'regional average',
    confidence: 'low',
  };
}

// ── Quote Calculation ────────────────────────────────────────────────────────
function calculateQuote(drivewayInfo, elevationInfo, snowDepthIn) {
  const BASE_RATE_PER_SQFT = 0.08; // $0.08 per sq ft base
  const BASE_MIN = 45;             // $45 minimum
  const DEEP_SNOW_THRESHOLD = 6;   // inches – extra charge above this

  const sqft = drivewayInfo.estimatedSqft;
  const slopeMultiplier = elevationInfo.slopeCategory.multiplier;

  let basePrice = Math.max(BASE_MIN, sqft * BASE_RATE_PER_SQFT);

  // Snow depth surcharge
  let depthMultiplier = 1.0;
  if (snowDepthIn > DEEP_SNOW_THRESHOLD) {
    depthMultiplier = 1 + ((snowDepthIn - DEEP_SNOW_THRESHOLD) / 10) * 0.5;
  }

  const subtotal = basePrice * slopeMultiplier * depthMultiplier;

  // Tiers
  let tier, turnaround;
  if (subtotal < 75) {
    tier = 'Standard';
    turnaround = '4–6 hours';
  } else if (subtotal < 150) {
    tier = 'Priority';
    turnaround = '2–3 hours';
  } else {
    tier = 'Premium';
    turnaround = '1–2 hours';
  }

  return {
    basePriceUSD: basePrice.toFixed(2),
    slopeMultiplier: slopeMultiplier.toFixed(2),
    depthMultiplier: depthMultiplier.toFixed(2),
    estimatedPriceUSD: subtotal.toFixed(2),
    priceLowUSD: (subtotal * 0.9).toFixed(2),
    priceHighUSD: (subtotal * 1.15).toFixed(2),
    tier,
    turnaround,
    sqft,
    snowDepthIn,
  };
}

// ── Main API Route ────────────────────────────────────────────────────────────
app.post('/api/quote', async (req, res) => {
  const { address, snowDepthIn = 4 } = req.body;

  if (!address || typeof address !== 'string' || address.trim().length < 5) {
    return res.status(400).json({ error: 'Please provide a valid address.' });
  }
  if (typeof snowDepthIn !== 'number' || snowDepthIn < 0 || snowDepthIn > 60) {
    return res.status(400).json({ error: 'Snow depth must be between 0 and 60 inches.' });
  }

  try {
    // Run geocoding first (required), then elevation + OSM in parallel
    const geocodeResult = await geocodeAddress(address.trim());
    const { lat, lng } = geocodeResult;

    const [elevationInfo, osmData] = await Promise.all([
      getElevationData(lat, lng),
      getOsmPropertyData(lat, lng),
    ]);

    const drivewayInfo = estimateDrivewaySize(osmData, geocodeResult);
    const quote = calculateQuote(drivewayInfo, elevationInfo, snowDepthIn);

    res.json({
      success: true,
      mock: MOCK_MODE,
      address: geocodeResult.formattedAddress,
      coordinates: { lat, lng },
      property: {
        estimatedDrivewaySqft: drivewayInfo.estimatedSqft,
        dataSource: drivewayInfo.source,
        dataConfidence: drivewayInfo.confidence,
        driveywayFoundInOSM: osmData.drivewayfound,
        osmDataAvailable: osmData.osmDataAvailable,
      },
      terrain: {
        centerElevationM: elevationInfo.centerElevation,
        elevationChangeM: elevationInfo.elevationChange,
        slopePercent: elevationInfo.slopePercent,
        slopeCategory: elevationInfo.slopeCategory.label,
      },
      quote,
      mapUrl: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=19/${lat}/${lng}&layers=C`,
    });
  } catch (err) {
    console.error('Quote error:', err.message);
    const status = err.message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

// ── Service booking route ─────────────────────────────────────────────────────
app.post('/api/book', (req, res) => {
  const { address, name, email, phone, preferredDate, snowDepthIn, quoteId } = req.body;

  if (!name || !email || !address) {
    return res.status(400).json({ error: 'Name, email, and address are required.' });
  }

  // In a real app this would persist to a database and send confirmation email.
  const bookingId = `SNO-${Date.now().toString(36).toUpperCase()}`;
  res.json({
    success: true,
    bookingId,
    message: `Booking confirmed! Your booking ID is ${bookingId}. We'll contact you at ${email} to confirm the appointment.`,
    details: { name, email, phone, address, preferredDate, snowDepthIn },
  });
});

app.listen(PORT, () => {
  console.log(`\nSnowPro app running → http://localhost:${PORT}`);
  if (MOCK_MODE) {
    console.log('Mode: MOCK  (no API keys needed – set MOCK_MODE=false in .env for live data)');
  } else {
    console.log('Mode: LIVE  (Nominatim geocoding + Open-Elevation + OSM Overpass)');
  }
});
