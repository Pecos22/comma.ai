/* ── SnowPro – fully client-side (GitHub Pages build) ── */
(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────────────────────
  // Logic ported from server.js – runs entirely in the browser
  // ─────────────────────────────────────────────────────────────────────────────

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

  function geocodeAddress(address) {
    const norm = address.trim().toUpperCase();
    const stateMatch = norm.match(/,?\s+([A-Z]{2})[\s,]/);
    const stateCode = stateMatch ? stateMatch[1] : null;
    const base = stateCode && STATE_COORDS[stateCode]
      ? STATE_COORDS[stateCode]
      : [40.7128, -74.0060];

    const rng = seededRand(norm);
    const lat = +(base[0] + (rng() - 0.5) * 0.08).toFixed(6);
    const lng = +(base[1] + (rng() - 0.5) * 0.08).toFixed(6);

    const zipMatch = address.match(/\b\d{5}(-\d{4})?\b/);
    const formattedAddress = address.trim().replace(/\s+/g, ' ') +
      (zipMatch || stateCode ? '' : ', USA');

    return { lat, lng, formattedAddress, zipCode: zipMatch ? zipMatch[0] : null };
  }

  function categorizeSLope(pct) {
    if (pct < 2)  return { label: 'Flat',           multiplier: 1.0  };
    if (pct < 5)  return { label: 'Gentle Slope',   multiplier: 1.15 };
    if (pct < 10) return { label: 'Moderate Slope', multiplier: 1.35 };
    if (pct < 20) return { label: 'Steep Slope',    multiplier: 1.6  };
    return              { label: 'Very Steep',       multiplier: 2.0  };
  }

  function getElevationData(lat, lng) {
    const rng = seededRand(`${lat.toFixed(4)},${lng.toFixed(4)}`);

    let baseElev = 300;
    if (lng < -104) baseElev = 800 + (rng() * 2000);
    else if (lng < -90) baseElev = 200 + (rng() * 400);
    else baseElev = 50 + (rng() * 300);

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

  function getOsmPropertyData(lat, lng) {
    const rng = seededRand(`osm:${lat.toFixed(5)},${lng.toFixed(5)}`);
    if (rng() < 0.70) {
      const buildingArea = 111 + rng() * 149;
      const drivewayfound = rng() < 0.45;
      return { buildingArea, drivewayfound, osmDataAvailable: true };
    }
    return { buildingArea: null, drivewayfound: false, osmDataAvailable: true };
  }

  function estimateDrivewaySize(osmData) {
    if (osmData.buildingArea) {
      const sqft = osmData.buildingArea * 10.764;
      const drivewayEstimate = Math.round(sqft * 0.20);
      return {
        estimatedSqft: Math.max(200, Math.min(drivewayEstimate, 2000)),
        source: 'building footprint (OSM)',
        confidence: 'medium',
      };
    }
    return { estimatedSqft: 500, source: 'regional average', confidence: 'low' };
  }

  function calculateQuote(drivewayInfo, elevationInfo, snowDepthIn) {
    const BASE_RATE_PER_SQFT = 0.08;
    const BASE_MIN = 45;
    const DEEP_SNOW_THRESHOLD = 6;

    const sqft = drivewayInfo.estimatedSqft;
    const slopeMultiplier = elevationInfo.slopeCategory.multiplier;
    let basePrice = Math.max(BASE_MIN, sqft * BASE_RATE_PER_SQFT);

    let depthMultiplier = 1.0;
    if (snowDepthIn > DEEP_SNOW_THRESHOLD) {
      depthMultiplier = 1 + ((snowDepthIn - DEEP_SNOW_THRESHOLD) / 10) * 0.5;
    }

    const subtotal = basePrice * slopeMultiplier * depthMultiplier;

    let tier, turnaround;
    if (subtotal < 75)       { tier = 'Standard'; turnaround = '4–6 hours'; }
    else if (subtotal < 150) { tier = 'Priority';  turnaround = '2–3 hours'; }
    else                     { tier = 'Premium';   turnaround = '1–2 hours'; }

    return {
      basePriceUSD:      basePrice.toFixed(2),
      slopeMultiplier:   slopeMultiplier.toFixed(2),
      depthMultiplier:   depthMultiplier.toFixed(2),
      estimatedPriceUSD: subtotal.toFixed(2),
      priceLowUSD:       (subtotal * 0.9).toFixed(2),
      priceHighUSD:      (subtotal * 1.15).toFixed(2),
      tier, turnaround, sqft, snowDepthIn,
    };
  }

  function getQuote(address, snowDepthIn) {
    if (!address || address.trim().length < 5) {
      throw new Error('Please provide a valid address.');
    }
    const geocodeResult  = geocodeAddress(address.trim());
    const { lat, lng }   = geocodeResult;
    const elevationInfo  = getElevationData(lat, lng);
    const osmData        = getOsmPropertyData(lat, lng);
    const drivewayInfo   = estimateDrivewaySize(osmData);
    const quote          = calculateQuote(drivewayInfo, elevationInfo, snowDepthIn);

    return {
      success: true,
      mock: true,
      address: geocodeResult.formattedAddress,
      coordinates: { lat, lng },
      property: {
        estimatedDrivewaySqft: drivewayInfo.estimatedSqft,
        dataSource:            drivewayInfo.source,
        dataConfidence:        drivewayInfo.confidence,
        driveywayFoundInOSM:   osmData.drivewayfound,
        osmDataAvailable:      osmData.osmDataAvailable,
      },
      terrain: {
        centerElevationM:  elevationInfo.centerElevation,
        elevationChangeM:  elevationInfo.elevationChange,
        slopePercent:      elevationInfo.slopePercent,
        slopeCategory:     elevationInfo.slopeCategory.label,
      },
      quote,
      mapUrl: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=19/${lat}/${lng}&layers=C`,
    };
  }

  function bookService(name, email) {
    if (!name || !email) throw new Error('Name and email are required.');
    const bookingId = 'SNO-' + Date.now().toString(36).toUpperCase();
    return {
      success: true,
      bookingId,
      message: `Booking confirmed! Your booking ID is ${bookingId}. We'll contact you at ${email} to confirm the appointment.`,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────────────────────────────────────

  let currentQuote   = null;
  let currentAddress = null;

  const quoteSection        = document.getElementById('quoteSection');
  const resultsSection      = document.getElementById('resultsSection');
  const bookingSection      = document.getElementById('bookingSection');
  const confirmationSection = document.getElementById('confirmationSection');

  const quoteForm       = document.getElementById('quoteForm');
  const addressInput    = document.getElementById('address');
  const snowDepthInput  = document.getElementById('snowDepth');
  const snowDepthValue  = document.getElementById('snowDepthValue');
  const quoteBtn        = document.getElementById('quoteBtn');
  const quoteError      = document.getElementById('quoteError');

  const bookBtn         = document.getElementById('bookBtn');
  const newQuoteBtn     = document.getElementById('newQuoteBtn');

  const bookingForm      = document.getElementById('bookingForm');
  const cancelBookingBtn = document.getElementById('cancelBookingBtn');
  const bookingError     = document.getElementById('bookingError');
  const bookingAddress   = document.getElementById('bookingAddress');
  const bookDate         = document.getElementById('bookDate');

  const startOverBtn = document.getElementById('startOverBtn');

  snowDepthInput.addEventListener('input', () => {
    snowDepthValue.textContent = `${snowDepthInput.value}"`;
  });

  function showOnly(section) {
    [quoteSection, resultsSection, bookingSection, confirmationSection].forEach(
      (s) => (s.hidden = s !== section)
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  quoteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const address     = addressInput.value.trim();
    const snowDepthIn = parseInt(snowDepthInput.value, 10);

    if (!address) { showError(quoteError, 'Please enter a property address.'); return; }

    setLoading(quoteBtn, true);
    quoteError.hidden = true;

    // Small async delay for UX (mimics network call)
    setTimeout(() => {
      try {
        const data     = getQuote(address, snowDepthIn);
        currentQuote   = data.quote;
        currentAddress = data.address;
        renderResults(data);
        showOnly(resultsSection);
      } catch (err) {
        showError(quoteError, err.message);
      } finally {
        setLoading(quoteBtn, false);
      }
    }, 600);
  });

  function renderResults(data) {
    const { property, terrain, quote, address, mapUrl } = data;

    document.getElementById('addressDisplay').textContent = address;
    document.getElementById('mapLink').href = mapUrl;

    document.getElementById('drivewaySize').textContent =
      `${property.estimatedDrivewaySqft.toLocaleString()} ft²`;
    document.getElementById('drivewaySub').textContent =
      `Source: ${property.dataSource} (${property.dataConfidence} confidence)`;

    document.getElementById('terrainSlope').textContent =
      `${terrain.slopePercent}% – ${terrain.slopeCategory}`;
    document.getElementById('terrainSub').textContent =
      `Elevation change: ±${terrain.elevationChangeM} m`;

    document.getElementById('snowDepthResult').textContent = `${quote.snowDepthIn}"`;
    document.getElementById('turnaround').textContent      = quote.turnaround;

    document.getElementById('priceRange').textContent =
      `$${quote.priceLowUSD} – $${quote.priceHighUSD}`;
    document.getElementById('priceTier').textContent = `${quote.tier} Service`;

    document.getElementById('priceBreakdown').innerHTML = `
      <span>Base price:</span><span>$${quote.basePriceUSD}</span>
      <span>Slope factor:</span><span>×${quote.slopeMultiplier}</span>
      <span>Snow depth factor:</span><span>×${quote.depthMultiplier}</span>
      <span>Driveway area:</span><span>${quote.sqft} ft²</span>
    `;

    document.getElementById('sourcesList').innerHTML = [
      'Geocoding: deterministic mock (seeded from address string)',
      'Elevation: mock heuristic (latitude/longitude-based estimate)',
      property.osmDataAvailable ? 'Property data: mock building footprint (probabilistic model)' : null,
      !property.driveywayFoundInOSM ? 'Driveway size estimated from building footprint or US regional averages' : null,
    ].filter(Boolean).map((s) => `<li>${s}</li>`).join('');
  }

  bookBtn.addEventListener('click', () => {
    bookingAddress.textContent = currentAddress;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    bookDate.value = tomorrow.toISOString().split('T')[0];
    bookDate.min   = new Date().toISOString().split('T')[0];
    showOnly(bookingSection);
  });

  newQuoteBtn.addEventListener('click', () => {
    quoteForm.reset();
    snowDepthValue.textContent = '4"';
    quoteError.hidden = true;
    showOnly(quoteSection);
  });

  cancelBookingBtn.addEventListener('click', () => showOnly(resultsSection));

  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name  = document.getElementById('bookName').value.trim();
    const email = document.getElementById('bookEmail').value.trim();
    const phone = document.getElementById('bookPhone').value.trim();

    if (!name || !email) { showError(bookingError, 'Name and email are required.'); return; }
    if (!isValidEmail(email)) { showError(bookingError, 'Please enter a valid email address.'); return; }

    const confirmBtn = document.getElementById('confirmBtn');
    setLoading(confirmBtn, true);
    bookingError.hidden = true;

    setTimeout(() => {
      try {
        const data = bookService(name, email);
        document.getElementById('confirmMsg').textContent  = data.message;
        document.getElementById('bookingId').textContent   = data.bookingId;
        showOnly(confirmationSection);
      } catch (err) {
        showError(bookingError, err.message);
      } finally {
        setLoading(confirmBtn, false);
      }
    }, 400);
  });

  startOverBtn.addEventListener('click', () => {
    quoteForm.reset();
    bookingForm.reset();
    snowDepthValue.textContent = '4"';
    quoteError.hidden = true;
    bookingError.hidden = true;
    currentQuote = null;
    currentAddress = null;
    showOnly(quoteSection);
  });

  function setLoading(btn, loading) {
    const text    = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.btn-spinner');
    btn.disabled  = loading;
    if (text)    text.hidden    = loading;
    if (spinner) spinner.hidden = !loading;
  }

  function showError(el, msg) {
    el.textContent = msg;
    el.hidden = false;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
})();
