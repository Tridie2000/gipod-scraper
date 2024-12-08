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

// Toggle the 'handled' state of a closure
async function toggleHandled(id) {
    const response = await fetch(`/api/closures/${id}/toggle`, {
        method: 'PATCH',
    });
    if (!response.ok) {
        throw new Error('Failed to toggle handled state');
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
    const toggleButton = document.getElementById('toggle-button');

    // Store active polygons to remove them when switching closures
    let activeLayers = [];

    closures.forEach((closure, index) => {
        const li = document.createElement('li');
        li.textContent = `${closure.description.slice(0, 20)} (${index + 1})`;
        li.addEventListener('click', async () => {
            // Display closure details
            descriptionEl.textContent = closure.description;
            hindranceEl.textContent = closure.hindrance;
            handledEl.textContent = closure.handled ? 'Yes' : 'No';

            // Update toggle button
            toggleButton.onclick = async () => {
                const updatedClosure = await toggleHandled(closure.id);
                handledEl.textContent = updatedClosure.handled ? 'Yes' : 'No';
                closure.handled = updatedClosure.handled;

                // Update polygon color
                removeActiveLayers(map, activeLayers);
                addPolygonLayer(map, closure, activeLayers);
            };

            // Remove all active polygons
            removeActiveLayers(map, activeLayers);

            // Add new GeoJSON layer
            addPolygonLayer(map, closure, activeLayers);

            // Zoom to fit the new polygon
            zoomToPolygon(map, closure);
        });

        closureList.appendChild(li);
    });
}

// Function to remove active layers
function removeActiveLayers(map, activeLayers) {
    activeLayers.forEach((layerId) => {
        if (map.getSource(layerId)) {
            map.removeLayer(layerId);
            map.removeSource(layerId);
        }
    });
    activeLayers.length = 0; // Clear the active layers array
}

// Function to add a polygon layer to the map
function addPolygonLayer(map, closure, activeLayers) {
    const geojsonData = {
        type: 'Feature',
        geometry: {
            type: 'MultiPolygon',
            coordinates: JSON.parse(closure.geometry),
        },
    };

    const layerId = `closure-${closure.id}`;
    map.addSource(layerId, {
        type: 'geojson',
        data: geojsonData,
    });

    map.addLayer({
        id: layerId,
        type: 'fill',
        source: layerId,
        paint: {
            'fill-color': closure.handled ? '#888888' : '#FF0000',
            'fill-opacity': 0.5,
        },
    });

    activeLayers.push(layerId); // Track this layer as active
}

// Function to zoom the map to fit the polygon
function zoomToPolygon(map, closure) {
    const geojsonData = JSON.parse(closure.geometry);
    const bounds = new mapboxgl.LngLatBounds();

    // Calculate bounds for all polygons
    geojsonData.forEach((polygon) =>
        polygon.forEach((ring) =>
            ring.forEach(([lng, lat]) => bounds.extend([lng, lat]))
        )
    );

    map.fitBounds(bounds, { padding: 20 });
}

// Initialize the map and closures
initializeMap();
