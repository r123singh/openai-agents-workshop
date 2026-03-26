// Alerts page functionality
let alertPreferences = {
    temperature: {
        maxTemp: null,
        minTemp: null
    },
    precipitation: {
        maxRain: null
    },
    wind: {
        maxWind: null
    },
    alertTypes: {
        STORM: true,
        FLOOD: true,
        TORNADO: true,
        HURRICANE: true,
        HEAT: true,
        COLD: true,
        SNOW: true,
        ICE: true,
        WIND: true,
        FOG: true,
        AIR_QUALITY: true,
        FIRE: true
    }
};

// DOM elements
const savePreferencesBtn = document.getElementById('savePreferencesBtn');
const checkAlertsBtn = document.getElementById('checkAlertsBtn');
const cityInput = document.getElementById('cityInput');
const quickBtns = document.querySelectorAll('.quick-btn');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');
const alertsGrid = document.getElementById('alertsGrid');
const analysisGrid = document.getElementById('analysisGrid');
const recommendationsContent = document.getElementById('recommendationsContent');

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadAlertPreferences();
    setupEventListeners();
    updatePreferencesDisplay();
});

function setupEventListeners() {
    // Save preferences button
    savePreferencesBtn.addEventListener('click', saveAlertPreferences);
    
    // Check alerts button
    checkAlertsBtn.addEventListener('click', () => {
        const city = cityInput.value.trim();
        if (city) {
            checkAlerts(city, 'Are there any weather alerts or warnings?');
        } else {
            showNotification('Please enter a city name', 'error');
        }
    });
    
    // Quick check buttons
    quickBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const city = cityInput.value.trim();
            const query = btn.dataset.query;
            if (city) {
                checkAlerts(city, query);
            } else {
                showNotification('Please enter a city name', 'error');
            }
        });
    });
    
    // City input enter key
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const city = cityInput.value.trim();
            if (city) {
                checkAlerts(city, 'Are there any weather alerts or warnings?');
            }
        }
    });
}

function loadAlertPreferences() {
    try {
        const saved = localStorage.getItem('alertPreferences');
        if (saved) {
            alertPreferences = { ...alertPreferences, ...JSON.parse(saved) };
        }
    } catch (error) {
        console.error('Error loading alert preferences:', error);
    }
}

function saveAlertPreferences() {
    try {
        // Get values from form
        alertPreferences.temperature.maxTemp = document.getElementById('maxTemp').value ? 
            parseFloat(document.getElementById('maxTemp').value) : null;
        alertPreferences.temperature.minTemp = document.getElementById('minTemp').value ? 
            parseFloat(document.getElementById('minTemp').value) : null;
        alertPreferences.precipitation.maxRain = document.getElementById('maxRain').value ? 
            parseFloat(document.getElementById('maxRain').value) : null;
        alertPreferences.wind.maxWind = document.getElementById('maxWind').value ? 
            parseFloat(document.getElementById('maxWind').value) : null;
        
        // Get alert type preferences
        alertPreferences.alertTypes.STORM = document.getElementById('alertStorm').checked;
        alertPreferences.alertTypes.FLOOD = document.getElementById('alertFlood').checked;
        alertPreferences.alertTypes.TORNADO = document.getElementById('alertTornado').checked;
        alertPreferences.alertTypes.HURRICANE = document.getElementById('alertHurricane').checked;
        alertPreferences.alertTypes.HEAT = document.getElementById('alertHeat').checked;
        alertPreferences.alertTypes.COLD = document.getElementById('alertCold').checked;
        alertPreferences.alertTypes.SNOW = document.getElementById('alertSnow').checked;
        alertPreferences.alertTypes.ICE = document.getElementById('alertIce').checked;
        alertPreferences.alertTypes.WIND = document.getElementById('alertWind').checked;
        alertPreferences.alertTypes.FOG = document.getElementById('alertFog').checked;
        alertPreferences.alertTypes.AIR_QUALITY = document.getElementById('alertAirQuality').checked;
        alertPreferences.alertTypes.FIRE = document.getElementById('alertFire').checked;
        
        // Save to localStorage
        localStorage.setItem('alertPreferences', JSON.stringify(alertPreferences));
        
        showNotification('Alert preferences saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving alert preferences:', error);
        showNotification('Error saving preferences', 'error');
    }
}

function updatePreferencesDisplay() {
    // Set threshold values
    if (alertPreferences.temperature.maxTemp) {
        document.getElementById('maxTemp').value = alertPreferences.temperature.maxTemp;
    }
    if (alertPreferences.temperature.minTemp) {
        document.getElementById('minTemp').value = alertPreferences.temperature.minTemp;
    }
    if (alertPreferences.precipitation.maxRain) {
        document.getElementById('maxRain').value = alertPreferences.precipitation.maxRain;
    }
    if (alertPreferences.wind.maxWind) {
        document.getElementById('maxWind').value = alertPreferences.wind.maxWind;
    }
    
    // Set alert type checkboxes
    document.getElementById('alertStorm').checked = alertPreferences.alertTypes.STORM;
    document.getElementById('alertFlood').checked = alertPreferences.alertTypes.FLOOD;
    document.getElementById('alertTornado').checked = alertPreferences.alertTypes.TORNADO;
    document.getElementById('alertHurricane').checked = alertPreferences.alertTypes.HURRICANE;
    document.getElementById('alertHeat').checked = alertPreferences.alertTypes.HEAT;
    document.getElementById('alertCold').checked = alertPreferences.alertTypes.COLD;
    document.getElementById('alertSnow').checked = alertPreferences.alertTypes.SNOW;
    document.getElementById('alertIce').checked = alertPreferences.alertTypes.ICE;
    document.getElementById('alertWind').checked = alertPreferences.alertTypes.WIND;
    document.getElementById('alertFog').checked = alertPreferences.alertTypes.FOG;
    document.getElementById('alertAirQuality').checked = alertPreferences.alertTypes.AIR_QUALITY;
    document.getElementById('alertFire').checked = alertPreferences.alertTypes.FIRE;
}

async function checkAlerts(city, query) {
    try {
        showLoading();
        hideError();
        
        const response = await fetch('/api/alerts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                city: city,
                query: query,
                alertPreferences: alertPreferences
            })
        });

        const data = await response.json();
        console.log(data);
        if (data.success) {
            displayAlerts(data);
        } else {
            showError(data.error || 'Failed to fetch alerts');
        }
    } catch (error) {
        console.error('Error checking alerts:', error);
        showError('Network error. Please try again.');
    } finally {
        hideLoading();
    }
}

function displayAlerts(data) {
    const alerts = data.alerts?.data;
    if (!alerts) {
        showError('No alert data received');
        return;
    }

    displayCurrentAlerts(alerts.processedAlerts || []);
    displayAlertAnalysis(alerts.alertAnalysis || {});
    displayRecommendations(alerts.alertRecommendations || {});
    
    showResults();
}

function displayCurrentAlerts(alerts) {
    alertsGrid.innerHTML = '';
    
    if (alerts.length === 0) {
        alertsGrid.innerHTML = `
            <div class="alert-card minor">
                <div class="alert-header">
                    <h3 class="alert-title">No Active Alerts</h3>
                    <span class="alert-severity minor">Clear</span>
                </div>
                <p class="alert-description">There are currently no weather alerts for this location.</p>
                <div class="alert-meta">
                    <span class="alert-time">
                        <i class="fas fa-clock"></i>
                        ${new Date().toLocaleString()}
                    </span>
                </div>
            </div>
        `;
        return;
    }
    
    alerts.forEach(alert => {
        const alertCard = document.createElement('div');
        alertCard.className = `alert-card ${alert.severity.toLowerCase()}`;
        
        const startTime = new Date(alert.start * 1000).toLocaleString();
        const endTime = new Date(alert.end * 1000).toLocaleString();
        
        alertCard.innerHTML = `
            <div class="alert-header">
                <h3 class="alert-title">${alert.title}</h3>
                <span class="alert-severity ${alert.severity.toLowerCase()}">${alert.severity}</span>
            </div>
            <p class="alert-description">${alert.description}</p>
            <div class="alert-meta">
                <span class="alert-time">
                    <i class="fas fa-clock"></i>
                    ${startTime} - ${endTime}
                </span>
                <span class="alert-sender">${alert.sender}</span>
            </div>
        `;
        
        alertsGrid.appendChild(alertCard);
    });
}

function displayAlertAnalysis(analysis) {
    analysisGrid.innerHTML = '';
    
    const analysisTypes = [
        { key: 'temperatureAlerts', title: 'Temperature Alerts', icon: 'fas fa-thermometer-half' },
        { key: 'precipitationAlerts', title: 'Precipitation Alerts', icon: 'fas fa-cloud-rain' },
        { key: 'windAlerts', title: 'Wind Alerts', icon: 'fas fa-wind' },
        { key: 'visibilityAlerts', title: 'Visibility Alerts', icon: 'fas fa-eye' },
        { key: 'uvAlerts', title: 'UV Alerts', icon: 'fas fa-sun' },
        { key: 'airQualityAlerts', title: 'Air Quality Alerts', icon: 'fas fa-smog' }
    ];
    
    analysisTypes.forEach(type => {
        const alerts = analysis[type.key] || [];
        if (alerts.length > 0) {
            const analysisCard = document.createElement('div');
            analysisCard.className = 'analysis-card';
            
            let alertsHtml = '';
            alerts.forEach(alert => {
                alertsHtml += `
                    <div class="analysis-item">
                        <span class="analysis-label">${alert.type.replace('_', ' ')}</span>
                        <span class="analysis-value">${alert.message}</span>
                    </div>
                `;
            });
            
            analysisCard.innerHTML = `
                <h4><i class="${type.icon}"></i> ${type.title}</h4>
                ${alertsHtml}
            `;
            
            analysisGrid.appendChild(analysisCard);
        }
    });
    
    if (analysisGrid.children.length === 0) {
        analysisGrid.innerHTML = `
            <div class="analysis-card">
                <h4><i class="fas fa-check-circle"></i> No Alert Conditions</h4>
                <div class="analysis-item">
                    <span class="analysis-label">Status</span>
                    <span class="analysis-value">All conditions normal</span>
                </div>
            </div>
        `;
    }
}

function displayRecommendations(recommendations) {
    recommendationsContent.innerHTML = '';
    
    if (!recommendations || Object.keys(recommendations).length === 0) {
        recommendationsContent.innerHTML = `
            <div class="recommendation-group">
                <h4><i class="fas fa-info-circle"></i> General Safety</h4>
                <ul class="recommendation-list">
                    <li>Stay informed about weather conditions</li>
                    <li>Follow local emergency instructions</li>
                    <li>Keep emergency supplies ready</li>
                </ul>
            </div>
        `;
        return;
    }
    
    // Immediate Actions
    if (recommendations.immediateActions && recommendations.immediateActions.length > 0) {
        const immediateGroup = document.createElement('div');
        immediateGroup.className = 'recommendation-group';
        immediateGroup.innerHTML = `
            <h4><i class="fas fa-exclamation-triangle"></i> Immediate Actions</h4>
            <ul class="recommendation-list">
                ${recommendations.immediateActions.map(action => `<li>${action}</li>`).join('')}
            </ul>
        `;
        recommendationsContent.appendChild(immediateGroup);
    }
    
    // Preparedness Steps
    if (recommendations.preparednessSteps && recommendations.preparednessSteps.length > 0) {
        const preparednessGroup = document.createElement('div');
        preparednessGroup.className = 'recommendation-group';
        preparednessGroup.innerHTML = `
            <h4><i class="fas fa-shield-alt"></i> Preparedness Steps</h4>
            <ul class="recommendation-list">
                ${recommendations.preparednessSteps.map(step => `<li>${step}</li>`).join('')}
            </ul>
        `;
        recommendationsContent.appendChild(preparednessGroup);
    }
    
    // Monitoring Advice
    if (recommendations.monitoringAdvice) {
        const monitoringGroup = document.createElement('div');
        monitoringGroup.className = 'recommendation-group';
        monitoringGroup.innerHTML = `
            <h4><i class="fas fa-eye"></i> Monitoring Advice</h4>
            <ul class="recommendation-list">
                <li>${recommendations.monitoringAdvice}</li>
            </ul>
        `;
        recommendationsContent.appendChild(monitoringGroup);
    }
    
    // Safety Tips
    if (recommendations.safetyTips && recommendations.safetyTips.length > 0) {
        const safetyGroup = document.createElement('div');
        safetyGroup.className = 'recommendation-group';
        safetyGroup.innerHTML = `
            <h4><i class="fas fa-heart"></i> Safety Tips</h4>
            <ul class="recommendation-list">
                ${recommendations.safetyTips.map(tip => `<li>${tip}</li>`).join('')}
            </ul>
        `;
        recommendationsContent.appendChild(safetyGroup);
    }
}

function showLoading() {
    loadingSection.style.display = 'flex';
    resultsSection.style.display = 'none';
    errorSection.style.display = 'none';
}

function hideLoading() {
    loadingSection.style.display = 'none';
}

function showResults() {
    resultsSection.style.display = 'block';
    errorSection.style.display = 'none';
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    errorSection.style.display = 'block';
    resultsSection.style.display = 'none';
    loadingSection.style.display = 'none';
}

function hideError() {
    errorSection.style.display = 'none';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
    
    // Remove on click
    notification.addEventListener('click', () => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    });
}
