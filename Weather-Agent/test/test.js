const WeatherTools = require('../agents/weatherTools');

// Simple test to verify the weather tools work
async function testWeatherTools() {
    console.log('🧪 Testing Weather Tools...');
    
    // Note: This test requires a valid OpenWeatherMap API key
    const apiKey = process.env.OPENWEATHER_API_KEY || 'test_key';
    const weatherTools = new WeatherTools(apiKey);
    
    try {
        // Test current weather (this will fail without a real API key, but that's expected)
        console.log('Testing current weather function...');
        const currentWeather = await weatherTools.getCurrentWeather('London');
        console.log('✅ Current weather test passed');
        console.log('Sample data:', JSON.stringify(currentWeather, null, 2));
    } catch (error) {
        console.log('⚠️  Current weather test failed (expected without real API key):', error.message);
    }
    
    try {
        // Test forecast (this will fail without a real API key, but that's expected)
        console.log('Testing forecast function...');
        const forecast = await weatherTools.getWeatherForecast('London', 3);
        console.log('✅ Forecast test passed');
        console.log('Sample data:', JSON.stringify(forecast, null, 2));
    } catch (error) {
        console.log('⚠️  Forecast test failed (expected without real API key):', error.message);
    }
    
    try {
        // Test historical weather (this should work as it's mocked)
        console.log('Testing historical weather function...');
        const historical = await weatherTools.getHistoricalWeather('London', '2024-01-01');
        console.log('✅ Historical weather test passed');
        console.log('Sample data:', JSON.stringify(historical, null, 2));
    } catch (error) {
        console.log('❌ Historical weather test failed:', error.message);
    }
    
    console.log('🏁 Test completed!');
}

// Run the test if this file is executed directly
if (require.main === module) {
    testWeatherTools().catch(console.error);
}

module.exports = { testWeatherTools };
