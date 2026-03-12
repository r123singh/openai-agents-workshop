import requests
import webbrowser
from typing import List, Dict
import google.generativeai as genai
from dotenv import load_dotenv
import os
load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")   

class RadioService:
    """Free radio service using radio.io API"""
    
    def __init__(self):
        self.base_url = "https://radio.io/api"
        self.stations = []
    
    def search_stations(self, query: str = "", country: str = "", genre: str = "") -> List[Dict]:
        """Search for radio stations"""
        try:
            # Using radio.io's free API endpoint
            url = f"{self.base_url}/stations"
            params = {}
            
            if query:
                params['q'] = query
            if country:
                params['country'] = country
            if genre:
                params['genre'] = genre
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            self.stations = data.get('stations', [])
            return self.stations
            
        except requests.RequestException as e:
            print(f"Error fetching stations using radio.io API: {e}")
            return self.search_using_gemini(query, country, genre)
            
    
    def search_using_gemini(self, query: str, country: str, genre: str) -> List[Dict]:
        """Search for radio stations using Gemini"""
        response = model.generate_content(f"Search for radio stations in {country} with genre {genre}. Include station names, streaming urls and descriptions only.")

        return response.text
    
    def get_popular_stations(self) -> List[Dict]:
        """Get popular international radio stations"""
        popular_stations = [
            {
                "name": "Radio Mirchi India",
                "country": "India",
                "genre": "Indian Music",
                "url": "https://eu8.fastcast4u.com/proxy/clyedupq?mp=%2F1?aw_0_req_lsid=2c0fae177108c9a42a7cf24878625444",
                "description": "India's most popular music station"
            },
            {
                "name": "Radio France Inter",
                "country": "France", 
                "genre": "Talk",
                "url": "http://direct.franceinter.fr/live/franceinter-midfi.mp3",
                "description": "French national talk radio"
            },
            {
                "name": "Deutschlandfunk",
                "country": "Germany",
                "genre": "News",
                "url": "http://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3",
                "description": "German public radio news"
            },
            {
                "name": "Radio Nacional Argentina",
                "country": "Argentina",
                "genre": "Variety",
                "url": "http://sa.mp3.icecast.magma.edge-access.net:7200/sc_rad1",
                "description": "Argentine national radio"
            }
        ]
        return popular_stations
    
    def play_station(self, station_url: str, station_name: str = ""):
        """Play a radio station (opens in default media player)"""
        try:
            print(f"🎵 Playing: {station_name}")
            print(f"🔗 URL: {station_url}")
            
            # Try to open in default media player
            webbrowser.open(station_url)
            print("✅ Station opened in your default media player")
            
        except Exception as e:
            print(f"❌ Error playing station using radio.io API: {e}")
            print("💡 Try copying the URL and pasting it in your media player")
    
    def list_stations(self, stations: List[Dict] = None):
        """Display available stations"""
        if stations is None:
            stations = self.stations if self.stations else self.get_popular_stations()
        
        if not stations:
            print("No stations available")
            return
        
        print("\n📻 Available Radio Stations:")
        print("=" * 50)
        
        for i, station in enumerate(stations, 1):
            name = station.get('name', 'Unknown')
            country = station.get('country', 'Unknown')
            genre = station.get('genre', 'Unknown')
            description = station.get('description', 'No description')
            
            print(f"{i}. {name}")
            print(f"   🌍 Country: {country}")
            print(f"   🎵 Genre: {genre}")
            print(f"   📝 {description}")
            print()

def main():
    """Main function to demonstrate radio service"""
    radio = RadioService()
    
    print("🌍 International Radio Station Player")
    print("=" * 40)
    
    while True:
        print("\nOptions:")
        print("1. List popular international stations")
        print("2. Search stations by country")
        print("3. Search stations by genre")
        print("4. Play a station")
        print("5. Exit")
        
        choice = input("\nEnter your choice (1-5): ").strip()
        
        if choice == "1":
            stations = radio.get_popular_stations()
            radio.list_stations(stations)
            
        elif choice == "2":
            country = input("Enter country name: ").strip()
            if country:
                stations = radio.search_stations(country=country)
                radio.list_stations(stations)
            else:
                print("Please enter a valid country name")
                
        elif choice == "3":
            genre = input("Enter genre (pop, rock, jazz, news, etc.): ").strip()
            if genre:
                stations = radio.search_stations(genre=genre)
                radio.list_stations(stations)
            else:
                print("Please enter a valid genre")
                
        elif choice == "4":
            stations = radio.get_popular_stations()
            radio.list_stations(stations)
            
            try:
                station_num = int(input("\nEnter station number to play: ")) - 1
                if 0 <= station_num < len(stations):
                    station = stations[station_num]
                    radio.play_station(station['url'], station['name'])
                else:
                    print("Invalid station number")
            except ValueError:
                print("Please enter a valid number")
                
        elif choice == "5":
            print("👋 Thanks for listening!")
            break
            
        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    main()

    