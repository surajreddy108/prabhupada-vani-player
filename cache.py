import pandas as pd
import requests
from io import BytesIO
import time
import os

class PrabhupadaDataFetcher:
    def __init__(self, github_url, cache_file='prabhupada_cache.xlsx', cache_timeout=3600):
        self.github_url = github_url
        self.cache_file = cache_file
        self.cache_timeout = cache_timeout  # 1 hour in seconds
    
    def fetch_data(self):
        """Fetch data with caching"""
        
        # Check cache first
        if self._is_cache_valid():
            print("Loading from cache...")
            try:
                return pd.read_excel(self.cache_file, sheet_name='Prabhupadvani')
            except Exception as e:
                print(f"Cache read failed: {e}")
        
        # Fetch from GitHub
        print("Fetching from GitHub...")
        try:
            response = requests.get(self.github_url)
            response.raise_for_status()
            
            # Load data
            data = pd.read_excel(BytesIO(response.content), sheet_name='Prabhupadvani')
            
            # Save to cache
            data.to_excel(self.cache_file, index=False, sheet_name='Prabhupadvani')
            print(f"Data cached to {self.cache_file}")
            
            return data
            
        except Exception as e:
            print(f"Error fetching data: {e}")
            return None
    
    def _is_cache_valid(self):
        """Check if cache file exists and is recent"""
        if not os.path.exists(self.cache_file):
            return False
        
        file_age = time.time() - os.path.getmtime(self.cache_file)
        return file_age < self.cache_timeout

# Usage
fetcher = PrabhupadaDataFetcher(
    github_url="https://github.com/yourusername/prabhupada-vani/raw/main/Srila%20Prabhupad%20Vani.xlsx"
)
data = fetcher.fetch_data()
