export function groceryMapsUrl(area) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`grocery stores near ${area}`)}`;
}

export function initStoreFinder(root = document, geolocation = navigator.geolocation) {
  const locate = root.querySelector('[data-locate-stores]');
  const form = root.querySelector('[data-store-search]');
  const area = root.querySelector('#store-area');
  const status = root.querySelector('[data-store-status]');
  const results = root.querySelector('[data-store-results]');
  let request = 0;

  const reset = () => {
    request += 1;
    results.hidden = true;
    results.removeAttribute('href');
    locate.disabled = false;
    locate.removeAttribute('aria-busy');
    return request;
  };
  const showResults = (place, message) => {
    results.href = groceryMapsUrl(place);
    results.hidden = false;
    status.textContent = message;
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    reset();
    const place = area.value.trim();
    if (!place) {
      status.textContent = 'Enter a city or ZIP code to find stores.';
      area.focus();
      return;
    }
    showResults(place, `Ready to find grocery stores near ${place}. Open the results below.`);
  });

  locate.addEventListener('click', () => {
    const current = reset();
    if (!geolocation) {
      status.textContent = 'Location is unavailable in this browser. Enter a city or ZIP code instead.';
      return;
    }
    locate.disabled = true;
    locate.setAttribute('aria-busy', 'true');
    status.textContent = 'Finding your location… Allow location access when your browser asks.';
    const fail = (error) => {
      if (current !== request) return;
      reset();
      status.textContent = error?.code === 1
        ? 'Location access was denied. Enter a city or ZIP code instead.'
        : 'We couldn’t find your location. Try again or enter a city or ZIP code.';
    };
    try {
      geolocation.getCurrentPosition(({ coords }) => {
        if (current !== request) return;
        reset();
        showResults(`${coords.latitude.toFixed(3)},${coords.longitude.toFixed(3)}`,
          'Location found. Open Google Maps below to see nearby grocery stores, hours and directions.');
      }, fail, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
    } catch (error) {
      fail(error);
    }
  });
}
