import folium
from folium import plugins
import pandas as pd

# Sample data for the top 30 cities with UNESCO World Heritage Sites
data = {
    'City': ['Rome', 'Beijing', 'Paris', 'Istanbul', 'Kyoto', 'Berlin', 
             'Prague', 'St. Petersburg', 'Vienna', 'Florence', 'Cairo',
             'Athens', 'Mexico City', 'Delhi', 'Cusco', 'Budapest', 
             'Krakow', 'Jerusalem', 'Naples', 'Agra', 'Jaipur', 
             'Ahmedabad', 'Mumbai', 'Quito', 'Havana', 'Salvador',
             'Valletta', 'Edinburgh', 'Bruges', 'Luang Prabang'],
    
    'Country': ['Italy', 'China', 'France', 'Turkey', 'Japan', 'Germany',
                'Czech Republic', 'Russia', 'Austria', 'Italy', 'Egypt',
                'Greece', 'Mexico', 'India', 'Peru', 'Hungary', 'Poland',
                'Israel/Palestine', 'Italy', 'India', 'India', 'India',
                'India', 'Ecuador', 'Cuba', 'Brazil', 'Malta', 'UK',
                'Belgium', 'Laos'],
    
    'Lat': [41.9028, 39.9042, 48.8566, 41.0082, 35.0116, 52.5200,
            50.0755, 59.9343, 48.2082, 43.7696, 30.0444, 37.9838,
            19.4326, 28.6139, -13.5320, 47.4979, 50.0647, 31.7683,
            40.8518, 27.1767, 26.9124, 23.0225, 19.0760, -0.1807,
            23.1136, -12.9714, 35.8989, 55.9533, 51.2093, 19.8833],
    
    'Lon': [12.4964, 116.4074, 2.3522, 28.9784, 135.7681, 13.4050,
            14.4378, 30.3351, 16.3738, 11.2558, 31.2357, 23.7275,
            -99.1332, 77.2090, -71.9673, 19.0402, 19.9450, 35.2137,
            14.2681, 78.0081, 75.7873, 72.5714, 72.8777, -78.4678,
            -82.3666, -38.5014, 14.5146, -3.1883, 3.2242, 102.1333],
    
    'Sites': [4, 4, 4, 4, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1],
    
    'FamousSite': [
        "Historic Centre of Rome, home to Colosseum and Roman Forum",
        "Forbidden City, imperial palace of Ming and Qing dynasties",
        "Banks of the Seine with Eiffel Tower and Notre-Dame",
        "Historic Areas featuring Hagia Sophia and Topkapi Palace",
        "Historic Monuments of Ancient Kyoto including Kinkaku-ji",
        "Museum Island complex of five world-renowned museums",
        "Historic Centre with Prague Castle and Charles Bridge",
        "Historic Centre with Winter Palace and Hermitage Museum",
        "Historic Centre with Schönbrunn Palace and Hofburg",
        "Historic Centre with Duomo and Uffizi Gallery",
        "Historic Cairo with mosques, madrasas and ancient bazaars",
        "Acropolis of Athens with Parthenon and ancient temples",
        "Historic Centre built on Aztec capital of Tenochtitlan",
        "Qutb Minar complex and Humayun's Tomb",
        "City of Cuzco, ancient capital of Inca Empire",
        "Buda Castle Quarter and Banks of the Danube",
        "Medieval Old Town with Main Market Square",
        "Old City of Jerusalem with Western Wall and Dome of the Rock",
        "Historic Centre with Spaccanapoli and underground ruins",
        "Taj Mahal, iconic white marble mausoleum",
        "Jantar Mantar astronomical observatory and Jaipur City",
        "Historic City of Ahmadabad with Indo-Islamic architecture",
        "Victorian Gothic and Art Deco Ensembles of Mumbai",
        "City of Quito, best-preserved historic center in Americas",
        "Old Havana with colonial architecture and fortifications",
        "Historic Centre of Salvador de Bahia",
        "City of Valletta, fortress city built by the Knights of Malta",
        "Old and New Towns of Edinburgh with Edinburgh Castle",
        "Historic Centre of Brugge with medieval architecture",
        "Town of Luang Prabang with Buddhist temples and colonial architecture"
    ]
}

df = pd.DataFrame(data)

# Create a base map centered on Europe/Asia
m = folium.Map(location=[30, 0], zoom_start=2, tiles='OpenStreetMap')

# Create a feature group for the markers
feature_group = folium.FeatureGroup(name="UNESCO Cities")

# Color palette for different numbers of sites
color_palette = {
    1: 'green',
    2: 'orange',
    3: 'red',
    4: 'purple'
}

# Add markers for each city
for idx, row in df.iterrows():
    # Create popup content with HTML formatting
    popup_content = f"""
    <div style="width: 250px;">
        <h3 style="margin-bottom: 5px; color: #2c3e50;">{row['City']}</h3>
        <p style="margin: 2px 0;"><strong>Country:</strong> {row['Country']}</p>
        <p style="margin: 2px 0;"><strong>UNESCO Sites:</strong> {row['Sites']}</p>
        <hr style="margin: 8px 0;">
        <p style="margin: 2px 0; font-style: italic;"><strong>Famous Site:</strong><br>{row['FamousSite']}</p>
    </div>
    """
    
    # Create marker with different colors based on number of sites
    folium.Marker(
        location=[row['Lat'], row['Lon']],
        popup=folium.Popup(popup_content, max_width=300),
        tooltip=f"{row['City']} ({row['Sites']} sites)",
        icon=folium.Icon(
            color=color_palette.get(row['Sites'], 'blue'),
            icon='university',
            prefix='fa'
        )
    ).add_to(feature_group)

# Add the feature group to the map
feature_group.add_to(m)

# Add a layer control panel
folium.LayerControl().add_to(m)

# Add a mini-map for better navigation
minimap = plugins.MiniMap()
m.add_child(minimap)

# Add fullscreen button
plugins.Fullscreen().add_to(m)

# Add a legend
legend_html = '''
<div style="position: fixed; 
     bottom: 50px; left: 50px; width: 150px; height: 120px; 
     background-color: white; border:2px solid grey; z-index:9999; 
     font-size:14px; padding: 10px;">
     <p style="margin: 0 0 5px; font-weight: bold;">Number of Sites</p>
     <p style="margin: 2px 0;"><i class="fa fa-circle" style="color:purple"></i> 4 sites</p>
     <p style="margin: 2px 0;"><i class="fa fa-circle" style="color:red"></i> 3 sites</p>
     <p style="margin: 2px 0;"><i class="fa fa-circle" style="color:orange"></i> 2 sites</p>
     <p style="margin: 2px 0;"><i class="fa fa-circle" style="color:green"></i> 1 site</p>
</div>
'''

m.get_root().html.add_child(folium.Element(legend_html))

# Add title
title_html = '''
             <h3 align="center" style="font-size:20px"><b>Top 30 Cities with UNESCO World Heritage Sites</b></h3>
             '''
m.get_root().html.add_child(folium.Element(title_html))

# Display the map
m.save('unesco_cities_map.html')
m