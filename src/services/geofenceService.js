// CampusConnect Geofence Service
// Authoritative Haversine calculations, geofence boundary detection,
// configurable coordinates management, and status state machine.

class GeofenceService {
  constructor() {
    // Configurable Institution Coordinates:
    // Mysore–Ooty Road, just off NH 766, Nanjangud Taluk, Thandavapura, Karnataka 571302, India
    this.config = {
      institutionName: "CampusConnect Institute of Technology",
      campusName: "Thandavapura Main Campus",
      address: "Mysore–Ooty Road, just off NH 766, Nanjangud Taluk, Thandavapura, Karnataka 571302, India",
      latitude: 12.183700,
      longitude: 76.694200,
      geofenceRadiusMeters: 300,
      accuracyThresholdMeters: 80,
      maxAllowedSpeedMps: 15,
      antiSpoofingEnabled: true
    };

    this.isLoaded = false;
    this.listeners = new Set();
    this.fetchConfig();
  }

  /**
   * Fetches latest configurable coordinates and radius from backend
   */
  async fetchConfig() {
    try {
      const res = await fetch('/api/geofence/config');
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          this.config = { ...this.config, ...data.config };
          this.isLoaded = true;
          this.notifyChange();
          return this.config;
        }
      }
    } catch (err) {
      console.warn('Could not fetch geofence config from server, using local defaults:', err);
    }
    this.isLoaded = true;
    return this.config;
  }

  /**
   * Updates configurable institution parameters (Admin/HOD)
   */
  async updateConfig(newConfig, authHeaders = {}) {
    try {
      const res = await fetch('/api/geofence/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify(newConfig)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        this.config = { ...this.config, ...data.config };
        this.notifyChange();
        return { success: true, config: this.config };
      }
      return { success: false, error: data.error || 'Failed to update config' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * High-precision Haversine Distance Formula
   * @param {number} lat1 Latitude of point 1
   * @param {number} lon1 Longitude of point 1
   * @param {number} lat2 Latitude of point 2
   * @param {number} lon2 Longitude of point 2
   * @returns {number} Distance in meters
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
      return null;
    }

    const R = 6371000; // Mean Earth radius in meters
    const toRad = deg => (deg * Math.PI) / 180;

    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Calculate compass bearing from student to institution
   * @returns {number} Bearing in degrees (0-360)
   */
  calculateBearing(lat1, lon1, lat2, lon2) {
    const toRad = deg => (deg * Math.PI) / 180;
    const toDeg = rad => (rad * 180) / Math.PI;

    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δλ = toRad(lon2 - lon1);

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const θ = Math.atan2(y, x);

    return (toDeg(θ) + 360) % 360;
  }

  /**
   * Format compass bearing into directional label
   */
  getCompassDirection(bearingDeg) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(bearingDeg / 22.5) % 16;
    return directions[index];
  }

  /**
   * Format distance into human-friendly string
   * e.g. "14.2 m" or "1.85 km"
   */
  formatDistance(meters) {
    if (meters === null || meters === undefined || isNaN(meters)) {
      return '--';
    }
    if (meters < 1000) {
      return `${meters.toFixed(1)} m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
  }

  /**
   * Format coordinates to standard degree-minute-second or decimal format
   */
  formatCoordinates(lat, lon) {
    if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) {
      return '--';
    }
    const latDir = lat >= 0 ? 'N' : 'S';
    const lonDir = lon >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(6)}° ${latDir}, ${Math.abs(lon).toFixed(6)}° ${lonDir}`;
  }

  /**
   * Evaluates complete attendance state given current GPS status and position
   * Returns:
   * - status: 'PRESENT' | 'OUTSIDE_ATTENDANCE_AREA' | 'LOCATION_PERMISSION_REQUIRED' | 'GPS_ACCURACY_TOO_LOW' | 'LOCATION_UNAVAILABLE'
   * - statusLabel: Display title
   * - isEligibleToMark: Boolean indicating whether "Mark Attendance" button is enabled
   * - distanceMeters: Exact distance in meters
   * - isInsideGeofence: Boolean
   */
  evaluateAttendanceStatus(position, geoError, permissionState) {
    const radius = this.config.geofenceRadiusMeters || 300;
    const accuracyThreshold = this.config.accuracyThresholdMeters || 80;

    // 1. Check for Permission Denial
    if (permissionState === 'denied' || (geoError && geoError.code === 1)) {
      return {
        status: 'LOCATION_PERMISSION_REQUIRED',
        statusLabel: 'Location Permission Required',
        badgeVariant: 'warning',
        isEligibleToMark: false,
        distanceMeters: null,
        isInsideGeofence: false,
        message: 'Location access is required to verify your physical presence on campus. Please grant location permission in your browser.'
      };
    }

    // 2. Check for Hardware or Unavailable Position
    if (geoError && !position) {
      return {
        status: 'LOCATION_UNAVAILABLE',
        statusLabel: 'Location Unavailable',
        badgeVariant: 'danger',
        isEligibleToMark: false,
        distanceMeters: null,
        isInsideGeofence: false,
        message: geoError.message || 'Unable to establish GPS signal. Please check your device location settings.'
      };
    }

    // 3. Waiting for first GPS lock
    if (!position || position.latitude === undefined) {
      return {
        status: 'LOCATION_PERMISSION_REQUIRED',
        statusLabel: 'Acquiring GPS Signal...',
        badgeVariant: 'info',
        isEligibleToMark: false,
        distanceMeters: null,
        isInsideGeofence: false,
        message: 'Locating student coordinates via device GPS sensor...'
      };
    }

    const dist = this.calculateDistance(
      position.latitude,
      position.longitude,
      this.config.latitude,
      this.config.longitude
    );

    const isInside = dist <= radius;
    const accuracy = position.accuracy || 0;

    // 4. Check for GPS Accuracy Failure (Anti-Spoofing)
    if (accuracy > accuracyThreshold) {
      return {
        status: 'GPS_ACCURACY_TOO_LOW',
        statusLabel: 'GPS Accuracy Too Low',
        badgeVariant: 'danger',
        isEligibleToMark: false,
        distanceMeters: dist,
        isInsideGeofence: isInside,
        accuracy,
        accuracyThreshold,
        message: `Current GPS accuracy is ±${accuracy.toFixed(1)}m, which exceeds the required ±${accuracyThreshold}m limit. Please move outdoors or wait for a stronger GPS lock.`
      };
    }

    // 5. Check if Outside Attendance Area
    if (!isInside) {
      return {
        status: 'OUTSIDE_ATTENDANCE_AREA',
        statusLabel: 'Outside Attendance Area',
        badgeVariant: 'warning',
        isEligibleToMark: false,
        distanceMeters: dist,
        isInsideGeofence: false,
        accuracy,
        message: `You are currently ${this.formatDistance(dist)} from campus. Attendance can only be marked while inside the ${radius}m campus geofence.`
      };
    }

    // 6. Inside Geofence with Acceptable Accuracy -> Eligible to Mark Present!
    return {
      status: 'PRESENT',
      statusLabel: 'Inside Attendance Area',
      badgeVariant: 'success',
      isEligibleToMark: true,
      distanceMeters: dist,
      isInsideGeofence: true,
      accuracy,
      message: `You are verified inside the ${radius}m campus geofence (${dist.toFixed(1)}m from center). Press 'Mark Attendance' to record your presence.`
    };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyChange() {
    this.listeners.forEach(fn => {
      try { fn(this.config); } catch (e) { console.error(e); }
    });
  }
}

// Global Singleton Export
window.geofenceService = new GeofenceService();
