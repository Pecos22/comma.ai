/* ── SnowPro frontend ── */
(function () {
  'use strict';

  // State
  let currentQuote = null;
  let currentAddress = null;

  // ── DOM refs ────────────────────────────────────────────────────────────────
  const quoteSection       = document.getElementById('quoteSection');
  const resultsSection     = document.getElementById('resultsSection');
  const bookingSection     = document.getElementById('bookingSection');
  const confirmationSection = document.getElementById('confirmationSection');

  const quoteForm          = document.getElementById('quoteForm');
  const addressInput       = document.getElementById('address');
  const snowDepthInput     = document.getElementById('snowDepth');
  const snowDepthValue     = document.getElementById('snowDepthValue');
  const quoteBtn           = document.getElementById('quoteBtn');
  const quoteError         = document.getElementById('quoteError');

  const bookBtn            = document.getElementById('bookBtn');
  const newQuoteBtn        = document.getElementById('newQuoteBtn');

  const bookingForm        = document.getElementById('bookingForm');
  const cancelBookingBtn   = document.getElementById('cancelBookingBtn');
  const bookingError       = document.getElementById('bookingError');
  const bookingAddress     = document.getElementById('bookingAddress');
  const bookDate           = document.getElementById('bookDate');

  const startOverBtn       = document.getElementById('startOverBtn');

  // ── Snow depth live update ───────────────────────────────────────────────
  snowDepthInput.addEventListener('input', () => {
    snowDepthValue.textContent = `${snowDepthInput.value}"`;
  });

  // ── Section visibility helpers ────────────────────────────────────────────
  function showOnly(section) {
    [quoteSection, resultsSection, bookingSection, confirmationSection].forEach(
      (s) => (s.hidden = s !== section)
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Quote form submission ─────────────────────────────────────────────────
  quoteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const address = addressInput.value.trim();
    const snowDepthIn = parseInt(snowDepthInput.value, 10);

    if (!address) {
      showError(quoteError, 'Please enter a property address.');
      return;
    }

    setLoading(quoteBtn, true);
    quoteError.hidden = true;

    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, snowDepthIn }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to get quote. Please try again.');
      }

      currentQuote   = data.quote;
      currentAddress = data.address;

      renderResults(data);
      showOnly(resultsSection);
    } catch (err) {
      showError(quoteError, err.message);
    } finally {
      setLoading(quoteBtn, false);
    }
  });

  // ── Render results ───────────────────────────────────────────────────────
  function renderResults(data) {
    const { property, terrain, quote, address, mapUrl } = data;

    document.getElementById('addressDisplay').textContent = address;
    document.getElementById('mapLink').href = mapUrl;

    // Stats
    document.getElementById('drivewaySize').textContent =
      `${property.estimatedDrivewaySqft.toLocaleString()} ft²`;
    document.getElementById('drivewaySub').textContent =
      `Source: ${property.dataSource} (${property.dataConfidence} confidence)`;

    document.getElementById('terrainSlope').textContent =
      `${terrain.slopePercent}% – ${terrain.slopeCategory}`;
    document.getElementById('terrainSub').textContent =
      `Elevation change: ±${terrain.elevationChangeM} m`;

    document.getElementById('snowDepthResult').textContent =
      `${quote.snowDepthIn}"`;

    document.getElementById('turnaround').textContent = quote.turnaround;

    // Price
    document.getElementById('priceRange').textContent =
      `$${quote.priceLowUSD} – $${quote.priceHighUSD}`;
    document.getElementById('priceTier').textContent =
      `${quote.tier} Service`;

    document.getElementById('priceBreakdown').innerHTML = `
      <span>Base price:</span><span>$${quote.basePriceUSD}</span>
      <span>Slope factor:</span><span>×${quote.slopeMultiplier}</span>
      <span>Snow depth factor:</span><span>×${quote.depthMultiplier}</span>
      <span>Driveway area:</span><span>${quote.sqft} ft²</span>
    `;

    // Sources
    const sources = [];
    sources.push('Google Maps Geocoding API – address coordinates');
    sources.push('Google Maps Elevation API – terrain slope (7-point grid sample)');
    if (property.osmDataAvailable) {
      sources.push('OpenStreetMap / Overpass API – building footprint & driveway data');
    }
    if (!property.driveywayFoundInOSM) {
      sources.push('Driveway size estimated from US regional averages (no OSM driveway data found)');
    }

    document.getElementById('sourcesList').innerHTML = sources
      .map((s) => `<li>${s}</li>`)
      .join('');
  }

  // ── Navigate to booking ───────────────────────────────────────────────────
  bookBtn.addEventListener('click', () => {
    bookingAddress.textContent = currentAddress;

    // Pre-fill tomorrow's date
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

  // ── Booking form ──────────────────────────────────────────────────────────
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name  = document.getElementById('bookName').value.trim();
    const email = document.getElementById('bookEmail').value.trim();
    const phone = document.getElementById('bookPhone').value.trim();
    const preferredDate = document.getElementById('bookDate').value;
    const notes = document.getElementById('bookNotes').value.trim();

    if (!name || !email) {
      showError(bookingError, 'Name and email are required.');
      return;
    }
    if (!isValidEmail(email)) {
      showError(bookingError, 'Please enter a valid email address.');
      return;
    }

    const confirmBtn = document.getElementById('confirmBtn');
    setLoading(confirmBtn, true);
    bookingError.hidden = true;

    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          preferredDate,
          notes,
          address: currentAddress,
          snowDepthIn: currentQuote?.snowDepthIn,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Booking failed.');

      document.getElementById('confirmMsg').textContent = data.message;
      document.getElementById('bookingId').textContent  = data.bookingId;
      showOnly(confirmationSection);
    } catch (err) {
      showError(bookingError, err.message);
    } finally {
      setLoading(confirmBtn, false);
    }
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

  // ── Helpers ───────────────────────────────────────────────────────────────
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
