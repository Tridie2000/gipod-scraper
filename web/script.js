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

        // Add filtering and populate the closure list
        initializeFilter(closures, map);
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

// Initialize filtering functionality
function initializeFilter(closures, map) {
    const filterSelect = document.getElementById('filter');

    // Populate the list initially with all closures
    updateClosureList(closures, map, 'open');

    // Update the list whenever the filter changes
    filterSelect.addEventListener('change', () => {
        const filter = filterSelect.value;
        updateClosureList(closures, map, filter);
    });
}

// Update the closure list based on the selected filter
function updateClosureList(closures, map, filter) {
    const closureList = document.getElementById('closure-list');
    closureList.innerHTML = ''; // Clear existing list

    const filteredClosures = closures.filter((closure) => {
        if (filter === 'open') return !closure.handled;
        if (filter === 'handled') return closure.handled;
        return true; // 'all' case
    });

    // Repopulate the list with filtered closures
    filteredClosures.forEach((closure, index) => {
        const li = document.createElement('li');
        li.textContent = `[${index + 1}] ${closure.description.slice(0, 32)}`;
        li.addEventListener('click', () => handleClosureClick(closure, map));
        closureList.appendChild(li);
    });
}

let activeLayers = [];

// Handle closure click to display details and polygon
function handleClosureClick(closure, map) {
    const descriptionEl = document.getElementById('description');
    const hindranceEl = document.getElementById('hindrance');
    const handledEl = document.getElementById('handled');
    const startEl = document.getElementById('start');
    const endEl = document.getElementById('end');
    const toggleButton = document.getElementById('toggle-button');

    // Display closure details
    descriptionEl.textContent = closure.description;
    hindranceEl.textContent = closure.hindrance;
    handledEl.textContent = closure.handled ? 'Yes' : 'No';
    startEl.textContent = new Date(closure.start).toLocaleString();
    endEl.textContent = new Date(closure.end).toLocaleString();

    // Update toggle button
    toggleButton.onclick = async () => {
        const updatedClosure = await toggleHandled(closure.id);
        handledEl.textContent = updatedClosure.handled ? 'Yes' : 'No';
        closure.handled = updatedClosure.handled;

        // Update polygon color immediately
        if (map.getLayer(`closure-${closure.id}`)) {
            map.setPaintProperty(
                `closure-${closure.id}`,
                'fill-color',
                updatedClosure.handled ? '#888888' : '#FF0000'
            );
        }
        initializeMap()
    };

    // Remove all active polygons
    removeActiveLayers(map, activeLayers);

    // Add new GeoJSON layer
    addPolygonLayer(map, closure, activeLayers);

    // Zoom to fit the new polygon
    zoomToPolygon(map, closure);
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

    map.fitBounds(bounds, { padding: 200 });
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

// Initialize the map and closures
initializeMap();
