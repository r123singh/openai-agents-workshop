// Dashboard state management
let dashboardState = {
    cities: [],
    settings: {
        refreshInterval: 10,
        temperatureUnit: 'celsius',
        enableNotifications: true,
        enableAlerts: true
    },
    refreshTimers: {},
    globalRefreshTimer: null
};

// DOM elements
const dashboardGrid = document.getElementById('dashboardGrid');
const addCityBtn = document.getElementById('addCityBtn');
const refreshAllBtn = document.getElementById('refreshAllBtn');
const settingsBtn = document.getElementById('settingsBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const alertsSection = document.getElementById('alertsSection');
const alertMessage = document.getElementById('alertMessage');

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadSavedCities();
    initializeDashboard();
    startGlobalRefreshTimer();
});

// Event listeners
addCityBtn.addEventListener('click', () => openModal('addCityModal'));
refreshAllBtn.addEventListener('click', refreshAllWidgets);
settingsBtn.addEventListener('click', () => openModal('settingsModal'));

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Initialize dashboard with default cities if none saved
function initializeDashboard() {
    if (dashboardState.cities.length === 0) {
        // Add default cities
        addCityWidget('London', dashboardState.settings.refreshInterval);
        addCityWidget('New York', dashboardState.settings.refreshInterval);
        addCityWidget('Tokyo', dashboardState.settings.refreshInterval);
    } else {
        // Load saved cities
        dashboardState.cities.forEach(city => {
            addCityWidget(city.name, city.refreshInterval);
        });
    }
}

// Add new city widget
function addNewCity() {
    const cityInput = document.getElementById('newCityInput');
    const refreshInterval = document.getElementById('refreshInterval');
    
    const cityName = cityInput.value.trim();
    const interval = parseInt(refreshInterval.value);
    
    if (cityName) {
        addCityWidget(cityName, interval);
        saveCities();
        closeModal('addCityModal');
        cityInput.value = '';
        showNotification('City added successfully!', 'success');
    } else {
        showNotification('Please enter a city name', 'error');
    }
}

// Create and add city widget
function addCityWidget(cityName, refreshInterval) {
    // Check if city already exists
    if (dashboardState.cities.find(city => city.name.toLowerCase() === cityName.toLowerCase())) {
        showNotification('City already exists in dashboard', 'error');
        return;
    }
    
    const cityData = {
        name: cityName,
        refreshInterval: refreshInterval
    };
    
    dashboardState.cities.push(cityData);
    
    // Create widget HTML
    const widgetHtml = createWidgetHTML(cityName);
    dashboardGrid.insertAdjacentHTML('beforeend', widgetHtml);
    
    // Load initial weather data
    loadWeatherData(cityName);
    
    // Start refresh timer for this city
    startCityRefreshTimer(cityName, refreshInterval);
}

// Create widget HTML
function createWidgetHTML(cityName) {
    return `
        <div class="weather-widget" id="widget-${cityName.toLowerCase().replace(/\s+/g, '-')}">
            <div class="widget-header">
                <h3 class="widget-title">${cityName}</h3>
                <div class="widget-controls">
                    <button class="widget-btn" onclick="refreshWidget('${cityName}')" title="Refresh">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    <button class="widget-btn" onclick="removeWidget('${cityName}')" title="Remove">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="widget-content">
                <div class="current-weather">
                    <div class="temperature-section">
                        <h2 class="temperature">--<span class="temperature-unit">°C</span></h2>
                        <p class="weather-description">Loading...</p>
                    </div>
                    <div class="weather-icon">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                </div>
                <div class="weather-details">
                    <div class="detail-item">
                        <span class="detail-icon"><i class="fas fa-tint"></i></span>
                        <span>Humidity: --%</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon"><i class="fas fa-wind"></i></span>
                        <span>Wind: -- km/h</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon"><i class="fas fa-eye"></i></span>
                        <span>Visibility: -- km</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon"><i class="fas fa-compress-alt"></i></span>
                        <span>Pressure: -- hPa</span>
                    </div>
                </div>
                <div class="forecast-preview">
                    <div class="forecast-item">
                        <div class="forecast-day">Today</div>
                        <div class="forecast-temp">--°</div>
                        <div class="forecast-icon"><i class="fas fa-question"></i></div>
                    </div>
                    <div class="forecast-item">
                        <div class="forecast-day">Tomorrow</div>
                        <div class="forecast-temp">--°</div>
                        <div class="forecast-icon"><i class="fas fa-question"></i></div>
                    </div>
                    <div class="forecast-item">
                        <div class="forecast-day">Day 3</div>
                        <div class="forecast-temp">--°</div>
                        <div class="forecast-icon"><i class="fas fa-question"></i></div>
                    </div>
                </div>
            </div>
            <div class="widget-footer">
                <div class="last-updated">
                    <i class="fas fa-clock"></i>
                    <span>Last updated: Never</span>
                </div>
                <div class="refresh-indicator">
                    <i class="fas fa-sync-alt"></i>
                    <span>${refreshInterval}m</span>
                </div>
            </div>
        </div>
    `;
}

// Load weather data for a city
async function loadWeatherData(cityName) {
    const widgetId = `widget-${cityName.toLowerCase().replace(/\s+/g, '-')}`;
    const widget = document.getElementById(widgetId);
    
    if (!widget) return;
    
    // Add loading state
    widget.classList.add('loading');
    
    try {
        // Get weather data using optimized dashboard endpoint
        const response = await fetch('/api/dashboard/weather', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                city: cityName
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            updateWidgetDisplay(cityName, data);
            checkForAlerts(cityName, data);
        } else {
            showWidgetError(cityName, data.error || 'Failed to load weather data');
        }
    } catch (error) {
        console.error('Error loading weather data:', error);
        showWidgetError(cityName, 'Network error');
    } finally {
        widget.classList.remove('loading');
    }
}

// Update widget display with weather data
function updateWidgetDisplay(cityName, data) {
    const widgetId = `widget-${cityName.toLowerCase().replace(/\s+/g, '-')}`;
    const widget = document.getElementById(widgetId);
    
    if (!widget) return;
    
    const currentWeather = data.currentWeather?.data;
    const forecast = data.forecast?.data;
    
    if (currentWeather) {
        // Update temperature
        const tempElement = widget.querySelector('.temperature');
        const temp = Math.round(currentWeather.temperature);
        tempElement.innerHTML = `${temp}<span class="temperature-unit">°C</span>`;
        
        // Update weather description
        const descElement = widget.querySelector('.weather-description');
        descElement.textContent = currentWeather.description;
        
        // Update weather icon
        const iconElement = widget.querySelector('.weather-icon i');
        iconElement.className = getWeatherIcon(currentWeather.description, currentWeather.icon);
        
        // Update details
        const details = widget.querySelectorAll('.detail-item span:last-child');
        details[0].textContent = `Humidity: ${currentWeather.humidity}%`;
        details[1].textContent = `Wind: ${currentWeather.wind_speed} km/h`;
        details[2].textContent = `Visibility: ${(currentWeather.visibility / 1000).toFixed(1)} km`;
        details[3].textContent = `Pressure: ${currentWeather.pressure} hPa`;
    }
    
    if (forecast && forecast.forecasts) {
        // Update forecast preview
        const forecastItems = widget.querySelectorAll('.forecast-item');
        const today = new Date();
        
        for (let i = 0; i < Math.min(3, forecastItems.length); i++) {
            const forecastData = forecast.forecasts[i * 8]; // Get one forecast per day
            if (forecastData) {
                const day = new Date(today);
                day.setDate(today.getDate() + i);
                
                const dayName = i === 0 ? 'Today' : day.toLocaleDateString('en-US', { weekday: 'short' });
                const temp = Math.round(forecastData.temperature);
                const icon = getWeatherIcon(forecastData.description, forecastData.icon);
                
                forecastItems[i].querySelector('.forecast-day').textContent = dayName;
                forecastItems[i].querySelector('.forecast-temp').textContent = `${temp}°`;
                forecastItems[i].querySelector('.forecast-icon i').className = icon;
            }
        }
    }
    
    // Update last updated time
    const lastUpdated = widget.querySelector('.last-updated span');
    lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
}

// Get weather icon based on description and icon code
function getWeatherIcon(description, iconCode) {
    const iconMap = {
        '01d': 'fas fa-sun',
        '01n': 'fas fa-moon',
        '02d': 'fas fa-cloud-sun',
        '02n': 'fas fa-cloud-moon',
        '03d': 'fas fa-cloud',
        '03n': 'fas fa-cloud',
        '04d': 'fas fa-cloud',
        '04n': 'fas fa-cloud',
        '09d': 'fas fa-cloud-rain',
        '09n': 'fas fa-cloud-rain',
        '10d': 'fas fa-cloud-sun-rain',
        '10n': 'fas fa-cloud-moon-rain',
        '11d': 'fas fa-bolt',
        '11n': 'fas fa-bolt',
        '13d': 'fas fa-snowflake',
        '13n': 'fas fa-snowflake',
        '50d': 'fas fa-smog',
        '50n': 'fas fa-smog'
    };
    
    return iconMap[iconCode] || 'fas fa-cloud';
}

// Show widget error state
function showWidgetError(cityName, error) {
    const widgetId = `widget-${cityName.toLowerCase().replace(/\s+/g, '-')}`;
    const widget = document.getElementById(widgetId);
    
    if (!widget) return;
    
    widget.classList.add('error');
    widget.querySelector('.temperature').innerHTML = 'Error<span class="temperature-unit"></span>';
    widget.querySelector('.weather-description').textContent = error;
    widget.querySelector('.weather-icon i').className = 'fas fa-exclamation-triangle';
}

// Refresh individual widget
function refreshWidget(cityName) {
    const widgetId = `widget-${cityName.toLowerCase().replace(/\s+/g, '-')}`;
    const widget = document.getElementById(widgetId);
    
    if (widget) {
        const refreshIndicator = widget.querySelector('.refresh-indicator');
        refreshIndicator.classList.add('loading');
        
        loadWeatherData(cityName).then(() => {
            refreshIndicator.classList.remove('loading');
        });
    }
}

// Remove widget
function removeWidget(cityName) {
    const widgetId = `widget-${cityName.toLowerCase().replace(/\s+/g, '-')}`;
    const widget = document.getElementById(widgetId);
    
    if (widget) {
        widget.remove();
        dashboardState.cities = dashboardState.cities.filter(city => city.name !== cityName);
        saveCities();
        
        // Clear refresh timer
        if (dashboardState.refreshTimers[cityName]) {
            clearInterval(dashboardState.refreshTimers[cityName]);
            delete dashboardState.refreshTimers[cityName];
        }
        
        showNotification('City removed from dashboard', 'info');
    }
}

// Refresh all widgets
async function refreshAllWidgets() {
    showLoadingOverlay();
    
    const refreshPromises = dashboardState.cities.map(city => loadWeatherData(city.name));
    
    try {
        await Promise.all(refreshPromises);
        showNotification('All weather data refreshed!', 'success');
    } catch (error) {
        showNotification('Some widgets failed to refresh', 'error');
    } finally {
        hideLoadingOverlay();
    }
}

// Start refresh timer for a city
function startCityRefreshTimer(cityName, intervalMinutes) {
    // Clear existing timer if any
    if (dashboardState.refreshTimers[cityName]) {
        clearInterval(dashboardState.refreshTimers[cityName]);
    }
    
    // Start new timer
    dashboardState.refreshTimers[cityName] = setInterval(() => {
        loadWeatherData(cityName);
    }, intervalMinutes * 60 * 1000);
}

// Start global refresh timer
function startGlobalRefreshTimer() {
    if (dashboardState.globalRefreshTimer) {
        clearInterval(dashboardState.globalRefreshTimer);
    }
    
    dashboardState.globalRefreshTimer = setInterval(() => {
        refreshAllWidgets();
    }, dashboardState.settings.refreshInterval * 60 * 1000);
}

// Check for weather alerts
function checkForAlerts(cityName, data) {
    if (!dashboardState.settings.enableAlerts) return;
    
    const alerts = data.currentWeather?.alerts?.alerts || [];
    
    if (alerts.length > 0) {
        const alertText = `Weather alert for ${cityName}: ${alerts[0].event}`;
        showAlert(alertText);
    }
}

// Show weather alert
function showAlert(message) {
    alertMessage.textContent = message;
    alertsSection.style.display = 'block';
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        hideAlerts();
    }, 10000);
}

// Hide alerts
function hideAlerts() {
    alertsSection.style.display = 'none';
}

// Show loading overlay
function showLoadingOverlay() {
    loadingOverlay.style.display = 'flex';
}

// Hide loading overlay
function hideLoadingOverlay() {
    loadingOverlay.style.display = 'none';
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Save settings
function saveSettings() {
    dashboardState.settings = {
        refreshInterval: parseInt(document.getElementById('defaultRefreshInterval').value),
        temperatureUnit: document.getElementById('temperatureUnit').value,
        enableNotifications: document.getElementById('enableNotifications').checked,
        enableAlerts: document.getElementById('enableAlerts').checked
    };
    
    localStorage.setItem('dashboardSettings', JSON.stringify(dashboardState.settings));
    startGlobalRefreshTimer();
    
    closeModal('settingsModal');
    showNotification('Settings saved successfully!', 'success');
}

// Load settings
function loadSettings() {
    const saved = localStorage.getItem('dashboardSettings');
    if (saved) {
        dashboardState.settings = { ...dashboardState.settings, ...JSON.parse(saved) };
    }
    
    // Update form values
    document.getElementById('defaultRefreshInterval').value = dashboardState.settings.refreshInterval;
    document.getElementById('temperatureUnit').value = dashboardState.settings.temperatureUnit;
    document.getElementById('enableNotifications').checked = dashboardState.settings.enableNotifications;
    document.getElementById('enableAlerts').checked = dashboardState.settings.enableAlerts;
}

// Save cities
function saveCities() {
    localStorage.setItem('dashboardCities', JSON.stringify(dashboardState.cities));
}

// Load saved cities
function loadSavedCities() {
    const saved = localStorage.getItem('dashboardCities');
    if (saved) {
        dashboardState.cities = JSON.parse(saved);
    }
}

// Update refresh timer display
function updateRefreshTimerDisplay() {
    const timerElement = document.getElementById('refreshTimer');
    if (timerElement) {
        timerElement.textContent = dashboardState.settings.refreshInterval;
    }
}

// Initialize refresh timer display
updateRefreshTimerDisplay();
