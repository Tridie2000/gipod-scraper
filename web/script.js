// Fetch the Mapbox token from the server
async function fetchMapboxToken() {
    const response = await fetch('/api/mapbox-token');
    if (!response.ok) {
        throw new Error('Failed to fetch Mapbox token');
    }
    const data = await response.json();
    return data.token;
}

// Fetch closures from the server
async function fetchClosures() {
    const response = await fetch('/api/closures');
    if (!response.ok) {
        throw new Error('Failed to fetch closures');
    }
    return response.json();
}

// Initialize the Mapbox map
async function initializeMap() {
    try {
        const token = await fetchMapboxToken();
        mapboxgl.accessToken = token;

        const closures = await fetchClosures();

        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [4.03379834, 50.93823027],
            zoom: 14,
        });

        populateClosureList(closures, map);
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

// Populate the closure list and handle map updates
function populateClosureList(closures, map) {
    const closureList = document.getElementById('closure-list');
    const descriptionEl = document.getElementById('description');
    const hindranceEl = document.getElementById('hindrance');
    const handledEl = document.getElementById('handled');

    closures.forEach((closure, index) => {
        const li = document.createElement('li');
        li.textContent = `Closure ${index + 1}`;
        li.addEventListener('click', () => {
            // Display closure details
            descriptionEl.textContent = closure.description;
            hindranceEl.textContent = closure.hindrance;
            handledEl.textContent = closure.handled ? 'Yes' : 'No';

            const layerId = `closure-${closure.id}`;

            // Check if a layer already exists, and remove it
            if (map.getSource(layerId)) {
                map.removeLayer(layerId);
                map.removeSource(layerId);
            }

            // Add new GeoJSON layer
            const geojsonData = {
                type: 'Feature',
                geometry: {
                    type: 'MultiPolygon',
                    coordinates: JSON.parse(closure.geometry),
                },
            };

            map.addSource(layerId, {
                type: 'geojson',
                data: geojsonData,
            });

            map.addLayer({
                id: layerId,
                type: 'fill',
                source: layerId,
                paint: {
                    'fill-color': '#888888',
                    'fill-opacity': 0.5,
                },
            });

            // Zoom to fit the polygon
            const bounds = new mapboxgl.LngLatBounds();
            geojsonData.geometry.coordinates[0].forEach((polygon) =>
                polygon.forEach(([lng, lat]) => bounds.extend([lng, lat]))
            );
            map.fitBounds(bounds, { padding: 20 });
        });

        closureList.appendChild(li);
    });
}


// Initialize the map and closures
initializeMap();
