// Mobile-First Disaster Management App JavaScript

// DOM Elements
const menuToggle = document.getElementById('menuToggle');
const sidePanel = document.getElementById('sidePanel');
const overlay = document.getElementById('overlay');
const rescueBtn = document.getElementById('rescueBtn');
const messageBox = document.getElementById('messageBox');
const messageTitle = document.getElementById('messageTitle');
const messageBody = document.getElementById('messageBody');
const closeMsgBtn = document.getElementById('closeMsgBtn');
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');

// Global Variables
let map = null;
let userLocation = null;
let emergencyContacts = [
    { name: 'Emergency Helpline', number: '112', type: 'emergency', icon: '🚨', description: 'All-in-one emergency' },
    { name: 'Fire Department', number: '101', type: 'fire', icon: '🔥', description: 'Fire emergencies' },
    { name: 'Police', number: '100', type: 'police', icon: '👮', description: 'Crime & safety' },
    { name: 'Ambulance', number: '108', type: 'medical', icon: '🚑', description: 'Medical emergencies' },
    { name: 'Disaster Management', number: '1077', type: 'disaster', icon: '🌪️', description: 'Natural disasters' },
    { name: 'Women Helpline', number: '181', type: 'women', icon: '👩', description: 'Women in distress' }
];

// Data Objects
const currentAlerts = [
    {
        type: 'Cyclone Warning',
        severity: 'high',
        location: 'Bay of Bengal Coast',
        time: '2 hours ago',
        description: 'Severe cyclonic storm approaching. Evacuate immediately from coastal areas.',
        icon: '🌪️'
    },
    {
        type: 'Flood Alert',
        severity: 'medium',
        location: 'Eastern Districts',
        time: '5 hours ago',
        description: 'Heavy rainfall causing water level rise in major rivers.',
        icon: '🌊'
    },
    {
        type: 'Heat Wave',
        severity: 'low',
        location: 'Northern Plains',
        time: '1 day ago',
        description: 'Temperature expected to reach 45°C. Stay hydrated and avoid outdoor activities.',
        icon: '☀️'
    }
];

const upcomingDisasters = [
    { type: 'Cyclone Watch', location: 'Bay of Bengal', timeline: '3-5 days', probability: '75%', icon: '🌀' },
    { type: 'Flood Warning', location: 'Eastern India', timeline: '1-2 weeks', probability: '60%', icon: '💧' },
    { type: 'Monsoon Alert', location: 'Central India', timeline: '3 weeks', probability: '85%', icon: '🌧️' }
];

const safePlaces = [
    {
        id: 1,
        name: 'Community Hall',
        type: 'Evacuation Shelter',
        distance: '0.5 km',
        capacity: '500 people',
        facilities: ['Water', 'Food', 'First Aid', 'Communications'],
        coordinates: [17.4065, 78.4772],
        icon: '🏢'
    },
    {
        id: 2,
        name: 'Local School',
        type: 'Designated Shelter',
        distance: '1.2 km',
        capacity: '300 people',
        facilities: ['Basic Shelter', 'Water', 'Communications'],
        coordinates: [17.4165, 78.4872],
        icon: '🏫'
    },
    {
        id: 3,
        name: 'District Hospital',
        type: 'Medical Center',
        distance: '1.8 km',
        capacity: 'Medical Aid Available',
        facilities: ['Emergency Care', 'Ambulance', 'Medical Staff'],
        coordinates: [17.4265, 78.4972],
        icon: '🏥'
    },
    {
        id: 4,
        name: 'Sports Complex',
        type: 'Large Shelter',
        distance: '2.5 km',
        capacity: '1000 people',
        facilities: ['Large Space', 'Water', 'Parking', 'Generator'],
        coordinates: [17.4365, 78.5072],
        icon: '🏟️'
    }
];

const precautions = [
    {
        title: 'Earthquake Safety',
        icon: '🏠',
        items: [
            'Drop, cover, and hold on immediately',
            'Stay away from windows, mirrors, and heavy objects',
            'If outdoors, move away from buildings and power lines',
            'Do not use elevators during or after earthquake',
            'Check for injuries and hazards after shaking stops'
        ]
    },
    {
        title: 'Flood Preparedness',
        icon: '🌊',
        items: [
            'Move to higher ground immediately',
            'Never walk or drive through flood waters',
            'Turn off utilities if time permits',
            'Listen to evacuation orders',
            'Avoid contact with electrical equipment'
        ]
    },
    {
        title: 'Cyclone Protection',
        icon: '🌪️',
        items: [
            'Stay indoors in strongest part of building',
            'Board up windows and secure loose objects',
            'Stock emergency supplies for 72 hours',
            'Listen to weather radio for updates',
            'Stay away from windows during eye of storm'
        ]
    },
    {
        title: 'Fire Safety',
        icon: '🔥',
        items: [
            'Evacuate immediately when alarm sounds',
            'Use stairs, never elevators',
            'Stay low if there is smoke',
            'Test doors before opening',
            'Have multiple escape routes planned'
        ]
    },
    {
        title: 'General Emergency',
        icon: '⚠️',
        items: [
            'Stay calm and assess the situation',
            'Call emergency services if needed',
            'Follow official instructions and evacuation orders',
            'Keep emergency kit easily accessible',
            'Stay informed through official channels'
        ]
    }
];

const emergencyKit = [
    'Water (1 gallon per person per day - 3 days)',
    'Non-perishable food (3-day supply)',
    'Battery-powered or hand crank radio',
    'Flashlight and extra batteries',
    'First aid kit and medications',
    'Whistle for signaling help',
    'Dust masks and plastic sheeting',
    'Moist towelettes and garbage bags',
    'Wrench or pliers to turn off utilities',
    'Manual can opener',
    'Cell phone with chargers and backup battery',
    'Cash and credit cards',
    'Emergency contact information',
    'Copies of important documents',
    'Sleeping bags and blankets',
    'Change of clothing and sturdy shoes',
    'Fire extinguisher',
    'Matches in waterproof container'
];

const importantDocuments = [
    'Driver\'s license and passport',
    'Insurance policies (home, auto, health)',
    'Bank account records',
    'Medical records and prescriptions',
    'Property deeds and mortgage papers',
    'Birth, marriage, death certificates',
    'Social security cards',
    'Emergency contact list',
    'Recent photos of family members',
    'Inventory of valuable household items'
];

// Utility Functions
function showMessage(title, body) {
    messageTitle.textContent = title;
    messageBody.textContent = body;
    messageBox.classList.remove('hidden');
    messageBox.classList.add('flex');
}

function hideMessage() {
    messageBox.classList.remove('flex');
    messageBox.classList.add('hidden');
}

function toggleSidePanel() {
    const isOpen = !sidePanel.classList.contains('-translate-x-full');
    
    if (isOpen) {
        sidePanel.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
    } else {
        sidePanel.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function switchTab(targetTab) {
    // Remove active class from all nav items and tab contents
    navItems.forEach(item => item.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Add active class to target nav item and content
    const targetNavItem = document.querySelector(`[data-tab="${targetTab}"]`);
    const targetContent = document.getElementById(`${targetTab}-tab`);
    
    if (targetNavItem && targetContent) {
        targetNavItem.classList.add('active');
        targetContent.classList.add('active');
    }
    
    // Close side panel on mobile
    toggleSidePanel();
}

function toggleBanner() {
    const banner = document.getElementById('emergencyBanner');
    banner.style.display = banner.style.display === 'none' ? 'flex' : 'none';
}

function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    resolve(userLocation);
                },
                error => {
                    console.error('Geolocation error:', error);
                    // Fallback to Hyderabad coordinates
                    userLocation = { lat: 17.4065, lng: 78.4772 };
                    resolve(userLocation);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
            );
        } else {
            userLocation = { lat: 17.4065, lng: 78.4772 };
            resolve(userLocation);
        }
    });
}

async function initMap() {
    try {
        const location = await getUserLocation();
        
        if (!map) {
            map = L.map('map').setView([location.lat, location.lng], 13);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18
            }).addTo(map);
        }
        
        // Clear existing markers
        map.eachLayer(layer => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });
        
        // Add user location marker
        const userIcon = L.divIcon({
            html: '<div style="background: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
            className: 'custom-div-icon',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
        
        L.marker([location.lat, location.lng], { icon: userIcon })
            .addTo(map)
            .bindPopup('<strong>Your Location</strong><br>Current position')
            .openPopup();
        
        // Add safe place markers
        safePlaces.forEach(place => {
            const safeIcon = L.divIcon({
                html: `<div style="background: #10b981; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${place.icon}</div>`,
                className: 'custom-div-icon',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });
            
            L.marker(place.coordinates, { icon: safeIcon })
                .addTo(map)
                .bindPopup(`
                    <div class="p-2">
                        <strong>${place.name}</strong><br>
                        <small>${place.type}</small><br>
                        <small>📍 ${place.distance}</small><br>
                        <small>👥 ${place.capacity}</small><br>
                        <button onclick="getDirections(${place.id})" class="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs">Get Directions</button>
                    </div>
                `);
        });
        
        // Update map container text
        document.querySelector('#map .text-center').innerHTML = '<p class="text-slate-400">Map loaded successfully!</p>';
        
    } catch (error) {
        console.error('Map initialization error:', error);
        showMessage('Map Error', 'Unable to load map. Please check your location settings.');
    }
}

function getDirections(placeId) {
    const place = safePlaces.find(p => p.id === placeId);
    if (place && userLocation) {
        const url = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${place.coordinates[0]},${place.coordinates[1]}`;
        window.open(url, '_blank');
    } else {
        showMessage('Directions', 'Please enable location services to get directions.');
    }
}

function updateKitProgress() {
    const checkboxes = document.querySelectorAll('#emergencyKit input[type="checkbox"]');
    const checkedBoxes = document.querySelectorAll('#emergencyKit input[type="checkbox"]:checked');
    const progress = (checkedBoxes.length / checkboxes.length) * 100;
    
    document.getElementById('kitProgress').textContent = `${checkedBoxes.length}/${checkboxes.length}`;
    document.getElementById('progressBar').style.width = `${progress}%`;
    
    // Change color based on progress
    const progressBar = document.getElementById('progressBar');
    if (progress < 30) {
        progressBar.className = 'bg-red-500 h-2 rounded-full transition-all duration-300';
    } else if (progress < 70) {
        progressBar.className = 'bg-yellow-500 h-2 rounded-full transition-all duration-300';
    } else {
        progressBar.className = 'bg-green-500 h-2 rounded-full transition-all duration-300';
    }
}

function toggleKitItem(checkbox) {
    const kitItem = checkbox.parentElement;
    if (checkbox.checked) {
        kitItem.classList.add('checked');
    } else {
        kitItem.classList.remove('checked');
    }
    updateKitProgress();
}

function callNumber(number) {
    if (confirm(`Call ${number}?`)) {
        window.location.href = `tel:${number}`;
    }
}

// Content Population Functions
function populateAlerts() {
    const alertsContainer = document.getElementById('currentAlerts');
    alertsContainer.innerHTML = '';
    
    currentAlerts.forEach(alert => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert-${alert.severity} p-4 rounded-2xl border hover-lift`;
        alertDiv.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="text-2xl">${alert.icon}</div>
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="font-bold text-lg">${alert.type}</h4>
                        <span class="text-xs px-2 py-1 rounded-full bg-black bg-opacity-20">${alert.severity.toUpperCase()}</span>
                    </div>
                    <p class="text-sm mb-2 opacity-90">${alert.description}</p>
                    <div class="flex justify-between text-xs opacity-75">
                        <span>📍 ${alert.location}</span>
                        <span>🕒 ${alert.time}</span>
                    </div>
                </div>
            </div>
        `;
        alertsContainer.appendChild(alertDiv);
    });
    
    const upcomingContainer = document.getElementById('upcomingDisasters');
    upcomingContainer.innerHTML = '';
    
    upcomingDisasters.forEach(disaster => {
        const disasterDiv = document.createElement('div');
        disasterDiv.className = 'bg-slate-800 p-4 rounded-xl border border-slate-700 hover-lift';
        disasterDiv.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="text-xl">${disaster.icon}</div>
                <div class="flex-1">
                    <div class="flex justify-between items-start mb-1">
                        <h5 class="font-semibold">${disaster.type}</h5>
                        <span class="text-xs text-blue-400">${disaster.timeline}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-slate-400">📍 ${disaster.location}</span>
                        <span class="text-xs px-2 py-1 bg-blue-600 bg-opacity-20 text-blue-300 rounded">${disaster.probability}</span>
                    </div>
                </div>
            </div>
        `;
        upcomingContainer.appendChild(disasterDiv);
    });
}

function populateSafePlaces() {
    const container = document.getElementById('safePlacesList');
    container.innerHTML = '';
    
    safePlaces.forEach(place => {
        const placeDiv = document.createElement('div');
        placeDiv.className = 'location-card p-4 hover-lift';
        placeDiv.innerHTML = `
            <div class="flex items-center space-x-4">
                <div class="location-type-icon">
                    <span class="text-xl">${place.icon}</span>
                </div>
                <div class="flex-1">
                    <div class="flex justify-between items-start mb-1">
                        <h4 class="font-semibold text-white">${place.name}</h4>
                        <span class="text-sm text-slate-400">${place.distance}</span>
                    </div>
                    <p class="text-sm text-purple-300 mb-2">${place.type}</p>
                    <p class="text-xs text-
