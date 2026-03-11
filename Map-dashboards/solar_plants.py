import folium
from folium import plugins
import pandas as pd
import math

# Sample data for the 30 largest solar power plants
data = {
    'Name': [
        'Talatan Solar Park', 'Ningdong Solar Park', 'Urtmorin Solar Park', 
        'Midong Solar Park', 'Golmud Solar Park', 'Hobq Solar Park', 
        'Ruoqiang Solar Park', 'Otog Front Banner Solar Park', 'Bhadla Solar Park', 
        'Pavagada Solar Park', 'Mohammed bin Rashid Al Maktoum Solar Park', 
        'Benban Solar Park', 'Al Dhafra Solar Project', 'Tengger Desert Solar Park', 
        'Datong Solar Power Top Runner Base', 'Jinchuan Solar Park', 
        'Kurnool Ultra Mega Solar Park', 'Yanchi Ningxia Solar Park', 
        'Noor Abu Dhabi', 'Villanueva Plant', 'Kamuthi Solar Power Station', 
        'Francisco Pizarro', 'Longyangxia Dam Solar Park', 'Dau Tieng Solar Power Complex',
        'Copper Mountain Solar Facility', 'Mount Signal Solar', 'Solar Star Projects',
        'Maritsa Solar Park', 'Rewa Ultra Mega Solar', 'Sarnia Photovoltaic Power Plant'
    ],
    'Country': [
        'China', 'China', 'China', 'China', 'China', 'China', 'China', 'China',
        'India', 'India', 'UAE', 'Egypt', 'UAE', 'China', 'China', 'China',
        'India', 'China', 'UAE', 'Mexico', 'India', 'Spain', 'China', 'Vietnam',
        'USA', 'USA', 'USA', 'Bulgaria', 'India', 'Canada'
    ],
    'Capacity': [
        15600, 13640, 6100, 5000, 2800, 4000, 4000, 4000, 2700, 2050, 2027, 
        1770, 2000, 1547, 1100, 1030, 1000, 1000, 1177, 754, 648, 590, 850, 
        420, 802, 794, 747, 250, 750, 97
    ],
    'Year': [
        '2011-2023', 'N/A', '2021', '2024', '2019', '2024', '2024', '2024',
        '2017-2018', '2018-2019', '2013-2022', '2019', '2023', '2017', 'N/A',
        '2013', '2017-2022', 'N/A', '2019', 'N/A', 'N/A', 'N/A', '2013-2015',
        '2019', '2010-2016', '2014-2018', '2015', 'N/A', '2018', '2010'
    ],
    'Latitude': [
        36.0, 38.2, 40.5, 44.3, 36.4, 40.6, 39.0, 39.5, 27.5, 14.2, 24.9,
        24.6, 24.0, 37.7, 40.0, 38.5, 15.7, 37.5, 24.4, 25.6, 9.3, 39.8,
        36.1, 11.3, 35.8, 32.7, 34.9, 42.1, 24.5, 42.9
    ],
    'Longitude': [
        97.5, 106.5, 107.2, 87.5, 94.9, 107.5, 88.2, 108.5, 71.8, 77.5, 55.3,
        32.8, 54.6, 107.6, 113.3, 102.2, 78.0, 107.3, 54.8, -103.0, 78.4,
        -6.4, 100.8, 106.4, -115.0, -115.7, -118.5, 25.8, 81.3, -82.4
    ],
    'Continent': [
        'Asia', 'Asia', 'Asia', 'Asia', 'Asia', 'Asia', 'Asia', 'Asia', 'Asia',
        'Asia', 'Asia', 'Africa', 'Asia', 'Asia', 'Asia', 'Asia', 'Asia', 'Asia',
        'Asia', 'North America', 'Asia', 'Europe', 'Asia', 'Asia', 'North America',
        'North America', 'North America', 'Europe', 'Asia', 'North America'
    ]
}

# Create DataFrame
df = pd.DataFrame(data)

# Calculate households powered (assuming 1 MW powers 250 homes)
df['Households'] = df['Capacity'] * 250

# Define colors for each continent
continent_colors = {
    'Asia': 'orange',
    'North America': 'green',
    'Europe': 'blue',
    'Africa': 'red',
    'South America': 'purple',
    'Oceania': 'pink'
}

# Create a base map
m = folium.Map(location=[30, 0], zoom_start=2, tiles='CartoDB positron')

# Create a feature group for each continent
feature_groups = {}
for continent in df['Continent'].unique():
    feature_groups[continent] = folium.FeatureGroup(name=continent)

# Add sun markers for each solar plant
for idx, row in df.iterrows():
    # Calculate marker size based on capacity (scaled for visibility)
    marker_size = math.log(row['Capacity']) * 3
    
    # Create custom sun icon
    sun_icon = folium.CustomIcon(
        icon_image='https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
        icon_size=(30, 30),
        icon_anchor=(15, 15),
        popup_anchor=(0, -15)
    )
    
    # Create marker with sun icon
    marker = folium.Marker(
        location=[row['Latitude'], row['Longitude']],
        popup=folium.Popup(
            f"<b>{row['Name']}</b><br>"
            f"Country: {row['Country']}<br>"
            f"Capacity: {row['Capacity']} MW<br>"
            f"Year: {row['Year']}<br>"
            f"Households Powered: {row['Households']:,.0f}",
            max_width=300
        ),
        tooltip=row['Name'],
        icon=folium.Icon(
            color=continent_colors[row['Continent']],
            icon='sun-o',
            prefix='fa'
        )
    )
    
    # Add marker to the appropriate feature group
    marker.add_to(feature_groups[row['Continent']])

# Add all feature groups to the map
for continent in feature_groups:
    feature_groups[continent].add_to(m)

# Add layer control to toggle continents
folium.LayerControl().add_to(m)

# Add a mini-map for better navigation
plugins.Fullscreen().add_to(m)
minimap = plugins.MiniMap()
m.add_child(minimap)

# Add a title to the map
title_html = '''
             <h3 align="center" style="font-size:20px"><b>World's 30 Largest Solar Power Plants</b></h3>
             '''
m.get_root().html.add_child(folium.Element(title_html))

# Add a legend
legend_html = '''
<div style="position: fixed; 
     bottom: 50px; left: 50px; width: 180px; height: 150px; 
     background-color: white; border:2px solid grey; z-index:9999;
     font-size:14px; padding: 10px;
     ">
     <b>Continent Legend</b><br>
     <i class="fa fa-circle" style="color:orange"></i> Asia<br>
     <i class="fa fa-circle" style="color:green"></i> North America<br>
     <i class="fa fa-circle" style="color:blue"></i> Europe<br>
     <i class="fa fa-circle" style="color:red"></i> Africa<br>
     <i class="fa fa-circle" style="color:purple"></i> South America<br>
     <i class="fa fa-circle" style="color:pink"></i> Oceania
</div>
'''
m.get_root().html.add_child(folium.Element(legend_html))

# Display the map
m.save('solar_plants.html')


