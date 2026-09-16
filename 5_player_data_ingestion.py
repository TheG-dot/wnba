import pandas as pd
import requests
from io import BytesIO

def fetch_player_data(start_season=2020, end_season=2024):
    print(f"Fetching WNBA player box score data from {start_season} to {end_season}...")
    seasons = list(range(start_season, end_season + 1))
    frames = []
    
    for season in seasons:
        url = f"https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_wnba_player_boxscores/player_box_{season}.parquet"
        print(f"Downloading {url} ...")
        try:
            response = requests.get(url)
            response.raise_for_status()
            df_season = pd.read_parquet(BytesIO(response.content))
            frames.append(df_season)
        except Exception as e:
            print(f"Failed to fetch season {season}: {e}")
            
    if frames:
        df = pd.concat(frames, ignore_index=True)
        print(f"Loaded {len(df)} player box score rows. Columns: {df.columns.tolist()[:10]}...")
        
        date_col = 'game_date' if 'game_date' in df.columns else 'date' if 'date' in df.columns else 'game_date'
        
        if date_col in df.columns:
            df[date_col] = pd.to_datetime(df[date_col])
            df = df.sort_values(by=[date_col])
            
        output_path = 'raw_wnba_player_data.csv'
        df.to_csv(output_path, index=False)
        print(f"Player data ingestion complete. Saved to {output_path}.")
    else:
        print("Failed to fetch player data (frames empty).")

if __name__ == "__main__":
    fetch_player_data()
