// Disaster Management Mobile App - Backend API
// Node.js + Express Server

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, query, validationResult } = require('express-validator');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.openweathermap.org"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
        },
    },
}));

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Rate limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { error: 'Too many requests, please try again later.' }
});

const sosLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3,
    message: { error: 'SOS rate limit exceeded. Please wait before sending another alert.' }
});

app.use('/api/', generalLimiter);

// In-memory storage (use database in production)
let sosAlerts = [];
let userReports = [];

// Mock data
const emergencyContacts = [
    { id: 1, name: 'Emergency Helpline', number: '112', type: 'emergency', priority: 1 },
    { id: 2, name: 'Fire Department', number: '101', type: 'fire', priority: 2 },
    { id: 3, name: 'Police', number: '100', type: 'police', priority: 3 },
    { id: 4, name: 'Ambulance', number: '108', type: 'medical', priority: 4 },
    { id: 5, name: 'Disaster Management', number: '1077', type: 'disaster', priority: 5 }
];

const safeLocations = [
    {
        id: 1,
        name: 'Community Hall',
        type: 'Evacuation Shelter',
        coordinates: { lat: 17.4065, lng: 78.4772 },
        capacity: 500,
        facilities: ['Water', 'Food', 'First Aid', 'Communications'],
        status: 'available',
        contactNumber: '+91-40-2345-6789'
    },
    {
        id: 2,
        name: 'Local School',
        type: 'Designated Shelter',
        coordinates: { lat: 17.4165, lng: 78.4872 },
        capacity: 300,
        facilities: ['Basic Shelter', 'Water', 'Communications'],
        status: 'available',
        contactNumber: '+91-40-2345-6790'
    },
    {
        id: 3,
        name: 'District Hospital',
        type: 'Medical Center',
        coordinates: { lat: 17.4265, lng: 78.4972 },
        capacity: null,
        facilities: ['Emergency Care', 'Ambulance', 'Medical Staff'],
        status: 'available',
        contactNumber: '+91-40-2345-6791'
    }
];

let currentAlerts = [
    {
        id: 1,
        type: 'Cyclone Warning',
        severity: 'high',
        title: 'Severe Cyclone Approaching',
        description: 'Cyclone Michaung approaching Bay of Bengal coast. Evacuate immediately from vulnerable areas.',
        location: 'Bay of Bengal Coast',
        affectedAreas: ['Chennai', 'Visakhapatnam', 'Puducherry'],
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        active: true,
        source: 'India Meteorological Department'
    },
    {
        id: 2,
        type: 'Flood Alert',
        severity: 'medium',
        title: 'Heavy Rainfall Warning',
        description: 'Heavy to very heavy rainfall expected. River levels rising in multiple districts.',
        location: 'Eastern Districts',
        affectedAreas: ['Krishna District', 'Guntur', 'Prakasam'],
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        active: true,
        source: 'State Disaster Management Authority'
    }
];

// Utility Functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

// API Routes

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// SOS Emergency Alert
app.post('/api/sos',
    sosLimiter,
    [
        body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
        body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
        body('message').optional().isLength({ max: 500 }).withMessage('Message too long'),
        body('contactNumber').optional().isMobilePhone('any').withMessage('Invalid phone number'),
        body('emergencyType').optional().isIn(['medical', 'fire', 'police', 'natural_disaster', 'other']).withMessage('Invalid emergency type')
    ],
    (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    success: false, 
                    errors: errors.array() 
                });
            }

            const { latitude, longitude, message, contactNumber, emergencyType } = req.body;
            const alertId = generateId();
            
            const sosAlert = {
                id: alertId,
                coordinates: {
                    lat: parseFloat(latitude),
                    lng: parseFloat(longitude)
                },
                message: message || 'Emergency SOS alert',
                contactNumber: contactNumber || null,
                emergencyType: emergencyType || 'other',
                timestamp: new Date(),
                status: 'active',
                priority: 'high',
                responderAssigned: false,
                estimatedResponseTime: Math.floor(Math.random() * 20) + 10, // 10-30 minutes
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            };

            sosAlerts.push(sosAlert);

            // Log the alert (in production, send to emergency services)
            console.log(`🚨 SOS ALERT RECEIVED: ${alertId}`);
            console.log(`Location: ${latitude}, ${longitude}`);
            console.log(`Type: ${emergencyType}`);
            console.log(`Message: ${message}`);

            // Simulate emergency services notification
            setTimeout(() => {
                console.log(`📞 Emergency services notified for alert: ${alertId}`);
            }, 1000);

            res.status(201).json({
                success: true,
                alertId: alertId,
                message: 'SOS alert sent successfully',
                estimatedResponseTime: `${sosAlert.estimatedResponseTime} minutes`,
                timestamp: sosAlert.timestamp,
                emergencyContacts: emergencyContacts.slice(0, 3) // Return top 3 emergency contacts
            });

        } catch (error) {
            console.error('SOS Alert Error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to send SOS alert. Please call emergency services directly.' 
            });
        }
    }
);

// Get SOS Alert Status
app.get('/api/sos/:alertId', (req, res) => {
    const { alertId } = req.params;
    const alert = sosAlerts.find(a => a.id === alertId);
    
    if (!alert) {
        return res.status(404).json({ 
            success: false, 
            message: 'Alert not found' 
        });
    }
    
    res.json({
        success: true,
        alert: alert
    });
});

// Get Current Alerts
app.get('/api/alerts', (req, res) => {
    const activeAlerts = currentAlerts
        .filter(alert => alert.active && new Date() < alert.expiresAt)
        .sort((a, b) => {
            const severityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
        });

    res.json({
        success: true,
        alerts: activeAlerts,
        total: activeAlerts.length,
        lastUpdated: new Date().toISOString()
    });
});

// Get Safe Locations
app.get('/api/safe-locations',
    [
        query('lat').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
        query('lng').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
        query('radius').optional().isFloat({ min: 1, max: 100 }).withMessage('Invalid radius (1-100 km)'),
        query('type').optional().isIn(['shelter', 'hospital', 'police', 'fire', 'all']).withMessage('Invalid location type')
    ],
    (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    success: false, 
                    errors: errors.array() 
                });
            }

            const { lat, lng, radius = 25, type = 'all' } = req.query;
            let locations = [...safeLocations];

            // Filter by type if specified
            if (type !== 'all') {
                locations = locations.filter(loc => 
                    loc.type.toLowerCase().includes(type.toLowerCase())
                );
            }

            // Calculate distances if user location provided
            if (lat && lng) {
                const userLat = parseFloat(lat);
                const userLng = parseFloat(lng);
                const searchRadius = parseFloat(radius);

                locations = locations
                    .map(location => ({
                        ...location,
                        distance: calculateDistance(
                            userLat, 
                            userLng, 
                            location.coordinates.lat, 
                            location.coordinates.lng
                        )
                    }))
                    .filter(location => location.distance <= searchRadius)
                    .sort((a, b) => a.distance - b.distance);
            }

            res.json({
                success: true,
                locations: locations,
                total: locations.length,
                searchRadius: parseFloat(radius),
                userLocation: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null
            });

        } catch (error) {
            console.error('Safe Locations Error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to retrieve safe locations' 
            });
        }
    }
);

// Get Emergency Contacts
app.get('/api/emergency-contacts', (req, res) => {
    res.json({
        success: true,
        contacts: emergencyContacts.sort((a, b) => a.priority - b.priority),
        total: emergencyContacts.length
    });
});

// Report Incident
app.post('/api/report',
    [
        body('type').isIn(['road_block', 'damage', 'need_help', 'safe_location', 'other']).withMessage('Invalid report type'),
        body('description').isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10-1000 characters'),
        body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
        body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
        body('severity').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid severity level')
    ],
    (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    success: false, 
                    errors: errors.array() 
                });
            }

            const { type, description, latitude, longitude, severity = 'medium' } = req.body;
            const reportId = generateId();

            const report = {
                id: reportId,
                type,
                description,
                coordinates: latitude && longitude ? {
                    lat: parseFloat(latitude),
                    lng: parseFloat(longitude)
                } : null,
                severity,
                timestamp: new Date(),
                status: 'pending',
                verified: false,
                ipAddress: req.ip
            };

            userReports.push(report);

            console.log(`📝 New report received: ${reportId} - ${type}`);

            res.status(201).json({
                success: true,
                reportId: reportId,
                message: 'Report submitted successfully',
                status: 'pending_review'
            });

        } catch (error) {
            console.error('Report Error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to submit report' 
            });
        }
    }
);

// Weather/Disaster Forecasts (Mock endpoint)
app.get('/api/forecasts', (req, res) => {
    const mockForecasts = [
        {
            type: 'Cyclone Watch',
            location: 'Bay of Bengal',
            timeline: '3-5 days',
            probability: 75,
            description: 'Low pressure system developing over Bay of Bengal',
            severity: 'medium'
        },
        {
            type: 'Heavy Rainfall',
            location: 'Coastal Andhra Pradesh',
            timeline: '24-48 hours',
            probability: 85,
            description: 'Monsoon intensification expected',
            severity: 'medium'
        }
    ];

    res.json({
        success: true,
        forecasts: mockForecasts,
        lastUpdated: new Date().toISOString(),
        source: 'India Meteorological Department'
    });
});

// Get App Statistics (for admin dashboard)
app.get('/api/stats', (req, res) => {
    const stats = {
        totalSOSAlerts: sosAlerts.length,
        activeAlerts: currentAlerts.filter(a => a.active).length,
        totalReports: userReports.length,
        safeLocationsAvailable: safeLocations.filter(l => l.status === 'available').length,
        lastSOSAlert: sosAlerts.length > 0 ? sosAlerts[sosAlerts.length - 1].timestamp : null,
        systemStatus: 'operational'
    };

    res.json({
        success: true,
        statistics: stats,
        timestamp: new Date().toISOString()
    });
});

// Serve the mobile app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server Error:', error);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Endpoint not found' 
    });
});

// Cleanup old alerts (run every hour)
setInterval(() => {
    const
