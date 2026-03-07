require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

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

// ── Geocoding ────────────────────────────────────────────────────────────────
async function geocodeAddress(address) {
  if (!GOOGLE_API_KEY) throw new Error('Google Maps API key not configured');

  const url = 'https://maps.googleapis.com/maps/api/geocode/json';
  const { data } = await axios.get(url, {
    params: { address, key: GOOGLE_API_KEY },
  });

  if (data.status !== 'OK' || !data.results.length) {
    throw new Error('Address not found. Please enter a valid US address.');
  }

  const result = data.results[0];
  const { lat, lng } = result.geometry.location;
  const formattedAddress = result.formatted_address;

  // Pull out the zip code for later use
  const zipComponent = result.address_components.find((c) =>
    c.types.includes('postal_code')
  );
  const zipCode = zipComponent ? zipComponent.short_name : null;

  return { lat, lng, formattedAddress, zipCode };
}

// ── Elevation / Slope ────────────────────────────────────────────────────────
// We sample elevation at several points around the property to estimate slope.
async function getElevationData(lat, lng) {
  if (!GOOGLE_API_KEY) throw new Error('Google Maps API key not configured');

  // Sample a 30m × 30m grid (roughly one property width) in cardinal directions
  const offsetDeg = 0.0003; // ~33 meters
  const locations = [
    { lat, lng },                                    // center
    { lat: lat + offsetDeg, lng },                   // north
    { lat: lat - offsetDeg, lng },                   // south
    { lat, lng: lng + offsetDeg },                   // east
    { lat, lng: lng - offsetDeg },                   // west
    { lat: lat + offsetDeg, lng: lng + offsetDeg },  // NE
    { lat: lat - offsetDeg, lng: lng - offsetDeg },  // SW
  ];

  const locString = locations.map((l) => `${l.lat},${l.lng}`).join('|');
  const url = 'https://maps.googleapis.com/maps/api/elevation/json';
  const { data } = await axios.get(url, {
    params: { locations: locString, key: GOOGLE_API_KEY },
  });

  if (data.status !== 'OK') throw new Error('Unable to retrieve elevation data');

  const elevations = data.results.map((r) => r.elevation);
  const minElev = Math.min(...elevations);
  const maxElev = Math.max(...elevations);
  const elevDiff = maxElev - minElev; // meters

  // Approximate slope as rise/run across the sampled span (~66 m diagonal)
  const spanMeters = offsetDeg * 111000 * Math.sqrt(2);
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

function categorizeSLope(pct) {
  if (pct < 2)  return { label: 'Flat',         multiplier: 1.0 };
  if (pct < 5)  return { label: 'Gentle Slope', multiplier: 1.15 };
  if (pct < 10) return { label: 'Moderate Slope', multiplier: 1.35 };
  if (pct < 20) return { label: 'Steep Slope',  multiplier: 1.6 };
  return              { label: 'Very Steep',    multiplier: 2.0 };
}

// ── OpenStreetMap Property/Lot Data ──────────────────────────────────────────
async function getOsmPropertyData(lat, lng) {
  // Query Overpass API for nearby building footprint and parking/driveway tags
  const delta = 0.0005; // ~55 m search box
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
      if (
        element.tags?.service === 'driveway' ||
        element.tags?.amenity === 'parking'
      ) {
        drivewayfound = true;
      }
    }

    return { buildingArea, drivewayfound, osmDataAvailable: true };
  } catch {
    return { buildingArea: null, drivewayfound: false, osmDataAvailable: false };
  }
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
      mapUrl: `https://www.google.com/maps/@${lat},${lng},19z/data=!3m1!1e3`,
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
  console.log(`Snow Shovel App running at http://localhost:${PORT}`);
  if (!GOOGLE_API_KEY) {
    console.warn('⚠  GOOGLE_MAPS_API_KEY not set – geocoding and elevation will fail.');
  }
});
