// DOM elements
const cityInput = document.getElementById('cityInput');
const queryInput = document.getElementById('queryInput');
const submitBtn = document.getElementById('submitBtn');
const clearBtn = document.getElementById('clearBtn');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');
const responseContent = document.getElementById('responseContent');
const analysisContent = document.getElementById('analysisContent');
const agentsContent = document.getElementById('agentsContent');
const metadataContent = document.getElementById('metadataContent');
const errorContent = document.getElementById('errorContent');
const agentStatus = document.getElementById('agentStatus');

// Tab functionality
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

// Event listeners
submitBtn.addEventListener('click', handleSubmit);
clearBtn.addEventListener('click', handleClear);
queryInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        handleSubmit();
    }
});

// Tab switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        
        // Remove active class from all tabs and panes
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding pane
        btn.classList.add('active');
        document.getElementById(targetTab).classList.add('active');
    });
});

async function handleSubmit() {
    const city = cityInput.value.trim();
    const query = queryInput.value.trim();
    
    if (!city || !query) {
        showError('Please enter both city and query.');
        return;
    }
    
    // Show loading state
    showLoading();
    
    try {
        const response = await fetch('/api/weather', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                city: city,
                query: query
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showResults(data);
        } else {
            showError(data.error || 'An error occurred while processing your request.');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to connect to the server. Please check your connection and try again.');
    }
}

function handleClear() {
    cityInput.value = '';
    queryInput.value = '';
    hideAllSections();
}

function showLoading() {
    hideAllSections();
    loadingSection.style.display = 'block';
    
    // Simulate agent status updates
    updateAgentStatus();
}

function updateAgentStatus() {
    const agents = ['CurrentWeatherAgent', 'ForecastAgent', 'HistoricalWeatherAgent'];
    let currentAgent = 0;
    
    const statusInterval = setInterval(() => {
        if (currentAgent < agents.length) {
            agentStatus.innerHTML = `
                <div class="agent-status-item active">
                    <i class="fas fa-cog fa-spin"></i> ${agents[currentAgent]}
                </div>
            `;
            currentAgent++;
        } else {
            clearInterval(statusInterval);
        }
    }, 1000);
}

function showResults(data) {
    hideAllSections();
    resultsSection.style.display = 'block';
    
    // Display main response
    responseContent.textContent = data.response;
    
    // Display query analysis
    displayQueryAnalysis(data.queryAnalysis);
    
    // Display agent responses
    displayAgentResponses(data.agentResponses);
    
    // Display metadata
    displayMetadata(data.metadata);
}

function displayQueryAnalysis(analysis) {
    if (!analysis) {
        analysisContent.innerHTML = '<p>No analysis data available.</p>';
        return;
    }
    
    const analysisHtml = `
        <div class="json-display">
            <strong>Query Analysis:</strong>
            <pre>${JSON.stringify(analysis, null, 2)}</pre>
        </div>
    `;
    
    analysisContent.innerHTML = analysisHtml;
}

function displayAgentResponses(agentResponses) {
    if (!agentResponses || Object.keys(agentResponses).length === 0) {
        agentsContent.innerHTML = '<p>No agent responses available.</p>';
        return;
    }
    
    let agentsHtml = '';
    
    Object.entries(agentResponses).forEach(([agentName, response]) => {
        const statusClass = response.error ? 'error' : 'success';
        const icon = response.error ? 'fas fa-exclamation-triangle' : 'fas fa-check-circle';
        
        agentsHtml += `
            <div class="agent-response ${statusClass}">
                <h5>
                    <i class="${icon}"></i>
                    ${agentName}
                </h5>
                ${response.error ? 
                    `<p><strong>Error:</strong> ${response.error}</p>` :
                    `<div class="json-display">${JSON.stringify(response, null, 2)}</div>`
                }
            </div>
        `;
    });
    
    agentsContent.innerHTML = agentsHtml;
}

function displayMetadata(metadata) {
    if (!metadata || Object.keys(metadata).length === 0) {
        metadataContent.innerHTML = '<p>No metadata available.</p>';
        return;
    }
    
    let metadataHtml = '';
    
    Object.entries(metadata).forEach(([key, value]) => {
        const displayValue = typeof value === 'object' ? 
            JSON.stringify(value, null, 2) : 
            String(value);
        
        metadataHtml += `
            <div class="metadata-item">
                <span class="metadata-label">${key}:</span>
                <span class="metadata-value">${displayValue}</span>
            </div>
        `;
    });
    
    metadataContent.innerHTML = metadataHtml;
}

function showError(message) {
    hideAllSections();
    errorSection.style.display = 'block';
    errorContent.textContent = message;
}

function hideAllSections() {
    loadingSection.style.display = 'none';
    resultsSection.style.display = 'none';
    errorSection.style.display = 'none';
    agentStatus.innerHTML = '';
}

// Add some example queries for quick testing
function addExampleQueries() {
    const examples = [
        {
            city: 'London',
            query: 'What\'s the current weather and temperature?'
        },
        {
            city: 'New York',
            query: 'Give me a 5-day weather forecast with precipitation chances.'
        },
        {
            city: 'Tokyo',
            query: 'What\'s the weather like today and what was it like yesterday?'
        },
        {
            city: 'Paris',
            query: 'Current conditions and weekend forecast please.'
        }
    ];
    
    // You could add a dropdown or quick-select buttons for these examples
    console.log('Example queries available:', examples);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    addExampleQueries();
    
    // Check if the server is running
    fetch('/api/health')
        .then(response => response.json())
        .then(data => {
            console.log('Server status:', data);
        })
        .catch(error => {
            console.warn('Server not responding:', error);
        });
});
