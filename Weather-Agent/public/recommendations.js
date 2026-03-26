// Recommendations page functionality
let userPreferences = {
    activities: ['hiking'],
    clothingStyle: 'casual',
    travelFrequency: 'daily',
    healthConsiderations: []
};

// DOM elements
const savePreferencesBtn = document.getElementById('savePreferences');
const getRecommendationsBtn = document.getElementById('getRecommendations');
const recommendationCity = document.getElementById('recommendationCity');
const recommendationQuery = document.getElementById('recommendationQuery');
const quickCards = document.querySelectorAll('.quick-card');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadUserPreferences();
    setupEventListeners();
    updatePreferencesDisplay();
});

function setupEventListeners() {
    // Save preferences
    savePreferencesBtn.addEventListener('click', saveUserPreferences);
    
    // Get recommendations
    getRecommendationsBtn.addEventListener('click', getRecommendations);
    
    // Quick recommendation cards
    quickCards.forEach(card => {
        card.addEventListener('click', () => {
            const query = card.getAttribute('data-query');
            recommendationQuery.value = query;
            getRecommendations();
        });
    });
    
    // Enter key in query textarea
    recommendationQuery.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            getRecommendations();
        }
    });
}

function loadUserPreferences() {
    const saved = localStorage.getItem('weatherUserPreferences');
    if (saved) {
        userPreferences = { ...userPreferences, ...JSON.parse(saved) };
    }
}

function saveUserPreferences() {
    // Collect activity preferences
    const activityCheckboxes = document.querySelectorAll('.activity-checkboxes input[type="checkbox"]:checked');
    userPreferences.activities = Array.from(activityCheckboxes).map(cb => cb.value);
    
    // Collect clothing style
    userPreferences.clothingStyle = document.getElementById('clothingStyle').value;
    
    // Collect travel frequency
    userPreferences.travelFrequency = document.getElementById('travelFrequency').value;
    
    // Collect health considerations
    const healthCheckboxes = document.querySelectorAll('.health-checkboxes input[type="checkbox"]:checked');
    userPreferences.healthConsiderations = Array.from(healthCheckboxes).map(cb => cb.value);
    
    // Save to localStorage
    localStorage.setItem('weatherUserPreferences', JSON.stringify(userPreferences));
    
    // Show success notification
    showNotification('Preferences saved successfully!', 'success');
    
    // Update display
    updatePreferencesDisplay();
}

function updatePreferencesDisplay() {
    // Update activity checkboxes
    document.querySelectorAll('.activity-checkboxes input[type="checkbox"]').forEach(cb => {
        cb.checked = userPreferences.activities.includes(cb.value);
    });
    
    // Update clothing style
    document.getElementById('clothingStyle').value = userPreferences.clothingStyle;
    
    // Update travel frequency
    document.getElementById('travelFrequency').value = userPreferences.travelFrequency;
    
    // Update health checkboxes
    document.querySelectorAll('.health-checkboxes input[type="checkbox"]').forEach(cb => {
        cb.checked = userPreferences.healthConsiderations.includes(cb.value);
    });
}

async function getRecommendations() {
    const city = recommendationCity.value.trim();
    const query = recommendationQuery.value.trim();
    
    if (!city || !query) {
        showNotification('Please enter both city and query', 'error');
        return;
    }
    
    // Show loading
    showLoading();
    
    try {
        const response = await fetch('/api/recommendations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                city: city,
                query: query,
                userPreferences: userPreferences
            })
        });
        
        const data = await response.json();
        console.log(data);
        if (data.success) {
            displayRecommendations(data);
        } else {
            showError(data.error || 'Failed to get recommendations');
        }
    } catch (error) {
        console.error('Error getting recommendations:', error);
        showError('Network error. Please try again.');
    }
}

function showLoading() {
    loadingSection.style.display = 'block';
    resultsSection.style.display = 'none';
    errorSection.style.display = 'none';
}

function displayRecommendations(data) {
    loadingSection.style.display = 'none';
    resultsSection.style.display = 'block';
    errorSection.style.display = 'none';
    
    // Display weather summary
    displayWeatherSummary(data);
    
    // Display recommendations
    displayRecommendationsGrid(data);
    
    // Display detailed response
    displayDetailedResponse(data);
}

function displayWeatherSummary(data) {
    const weatherSummary = document.getElementById('weatherSummary');
    const currentWeather = data.currentWeather?.data;
    
    if (currentWeather) {
        weatherSummary.innerHTML = `
            <i class="fas fa-thermometer-half"></i>
            <span>${currentWeather.temperature}°C, ${currentWeather.description}</span>
        `;
    } else {
        weatherSummary.innerHTML = `
            <i class="fas fa-cloud"></i>
            <span>Weather data available</span>
        `;
    }
}

function displayRecommendationsGrid(data) {
    const grid = document.getElementById('recommendationsGrid');
    const recommendations = data.recommendations?.data?.recommendations;
    
    if (!recommendations) {
        grid.innerHTML = '<p>No structured recommendations available</p>';
        return;
    }
    
    let html = '';
    
    // Activities recommendations
    if (recommendations.activities && Object.keys(recommendations.activities).some(key => recommendations.activities[key].length > 0)) {
        html += createRecommendationCard('activities', 'Activities', recommendations.activities);
    }
    
    // Clothing recommendations
    if (recommendations.clothing && Object.keys(recommendations.clothing).some(key => recommendations.clothing[key].length > 0)) {
        html += createRecommendationCard('clothing', 'Clothing', recommendations.clothing);
    }
    
    // Travel recommendations
    if (recommendations.travel && Object.keys(recommendations.travel).some(key => recommendations.travel[key].length > 0)) {
        html += createRecommendationCard('travel', 'Travel & Planning', recommendations.travel);
    }
    
    // Health recommendations
    if (recommendations.health && Object.keys(recommendations.health).some(key => recommendations.health[key].length > 0)) {
        html += createRecommendationCard('health', 'Health & Safety', recommendations.health);
    }
    
    // Insights
    if (recommendations.insights && Object.keys(recommendations.insights).some(key => recommendations.insights[key].length > 0)) {
        html += createRecommendationCard('insights', 'Insights & Trends', recommendations.insights);
    }
    
    // Activity scores
    if (data.currentWeather?.data) {
        html += createActivityScoresCard(data.currentWeather.data);
    }
    
    grid.innerHTML = html;
}

function createRecommendationCard(type, title, data) {
    const icons = {
        activities: 'fas fa-hiking',
        clothing: 'fas fa-tshirt',
        travel: 'fas fa-car',
        health: 'fas fa-heartbeat',
        insights: 'fas fa-chart-line'
    };
    
    let items = [];
    
    // Collect all items from different categories
    Object.keys(data).forEach(category => {
        if (Array.isArray(data[category]) && data[category].length > 0) {
            items = items.concat(data[category]);
        }
    });
    
    if (items.length === 0) return '';
    
    const itemsHtml = items.map(item => `
        <li>
            <i class="fas fa-check"></i>
            <span>${item}</span>
        </li>
    `).join('');
    
    return `
        <div class="recommendation-card ${type}">
            <h3><i class="${icons[type]}"></i> ${title}</h3>
            <ul class="recommendation-list">
                ${itemsHtml}
            </ul>
        </div>
    `;
}

function createActivityScoresCard(weatherData) {
    const activities = [
        { name: 'Hiking', icon: 'fas fa-mountain', score: calculateActivityScore(weatherData, 'hiking') },
        { name: 'Beach', icon: 'fas fa-umbrella-beach', score: calculateActivityScore(weatherData, 'beach') },
        { name: 'Cycling', icon: 'fas fa-bicycle', score: calculateActivityScore(weatherData, 'cycling') },
        { name: 'Dining', icon: 'fas fa-utensils', score: calculateActivityScore(weatherData, 'dining') },
        { name: 'Shopping', icon: 'fas fa-shopping-bag', score: calculateActivityScore(weatherData, 'shopping') }
    ];
    
    const activitiesHtml = activities.map(activity => {
        const scoreClass = activity.score >= 70 ? 'score-excellent' : 
                          activity.score >= 40 ? 'score-good' : 'score-poor';
        
        return `
            <li>
                <i class="${activity.icon}"></i>
                <span>${activity.name}</span>
                <span class="activity-score ${scoreClass}">${activity.score}/100</span>
            </li>
        `;
    }).join('');
    
    return `
        <div class="recommendation-card insights">
            <h3><i class="fas fa-chart-bar"></i> Activity Scores</h3>
            <ul class="recommendation-list">
                ${activitiesHtml}
            </ul>
        </div>
    `;
}

function calculateActivityScore(weatherData, activity) {
    let score = 50;
    const temp = weatherData.temperature;
    const description = weatherData.description.toLowerCase();
    
    switch (activity) {
        case 'hiking':
            if (temp >= 15 && temp <= 25) score += 30;
            else if (temp >= 10 && temp <= 30) score += 15;
            if (description.includes('rain')) score -= 40;
            if (description.includes('snow')) score -= 30;
            break;
            
        case 'beach':
            if (temp >= 25 && temp <= 35) score += 30;
            else if (temp >= 20 && temp <= 40) score += 15;
            if (description.includes('rain')) score -= 50;
            if (description.includes('storm')) score -= 60;
            break;
            
        case 'cycling':
            if (temp >= 15 && temp <= 25) score += 25;
            else if (temp >= 10 && temp <= 30) score += 10;
            if (description.includes('rain')) score -= 30;
            if (description.includes('snow')) score -= 40;
            break;
            
        case 'dining':
            score = 70; // Base score
            if (temp >= 15 && temp <= 25) score += 20;
            else if (temp < 10 || temp > 35) score -= 10;
            if (description.includes('rain')) score -= 20;
            if (description.includes('storm')) score -= 30;
            break;
            
        case 'shopping':
            score = 60; // Base score
            if (description.includes('rain')) score += 20;
            if (description.includes('storm')) score += 10;
            if (temp < 5 || temp > 35) score += 15;
            break;
    }
    
    return Math.max(0, Math.min(100, score));
}

function displayDetailedResponse(data) {
    const detailedResponse = document.getElementById('detailedResponse');
    const summary = data.recommendations?.data?.recommendations?.summary;
    
    if (summary) {
        detailedResponse.textContent = summary;
    } else {
        detailedResponse.textContent = 'Detailed analysis not available.';
    }
}

function showError(message) {
    loadingSection.style.display = 'none';
    resultsSection.style.display = 'none';
    errorSection.style.display = 'block';
    
    document.getElementById('errorContent').textContent = message;
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Add notification styles
const notificationStyles = `
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notification-content i {
        font-size: 1.2rem;
    }
    
    .notification.success .notification-content i {
        color: #28a745;
    }
    
    .notification.error .notification-content i {
        color: #dc3545;
    }
    
    .notification.info .notification-content i {
        color: #17a2b8;
    }
`;

// Inject notification styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);
