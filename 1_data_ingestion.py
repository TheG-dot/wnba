import pandas as pd
import requests
from io import BytesIO

def fetch_and_clean_wnba_data(start_season=2020, end_season=2024):
    print(f"Fetching WNBA team box score data from {start_season} to {end_season}...")
    
    seasons = list(range(start_season, end_season + 1))
    frames = []
    
    for season in seasons:
        url = f"https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_wnba_team_boxscores/team_box_{season}.parquet"
        print(f"Downloading {url} ...")
        try:
            # We use requests to get the parquet data bytes, then read with pandas
            response = requests.get(url)
            response.raise_for_status()
            df_season = pd.read_parquet(BytesIO(response.content))
            frames.append(df_season)
        except Exception as e:
            print(f"Failed to fetch season {season}: {e}")
            
    if not frames:
        print("No data fetched.")
        return pd.DataFrame()
        
    df = pd.concat(frames, ignore_index=True)
    print(f"Loaded {len(df)} rows. Columns: {df.columns.tolist()[:10]}...")

    date_col = 'game_date' if 'game_date' in df.columns else 'date' if 'date' in df.columns else 'game_date'
    
    if date_col not in df.columns:
        for col in df.columns:
            if 'date' in col.lower():
                date_col = col
                break
                
    print(f"Using '{date_col}' for sorting chronologically.")
    
    team_col = 'team_name' if 'team_name' in df.columns else 'team_display_name' if 'team_display_name' in df.columns else 'team'
    if team_col in df.columns:
        df[team_col] = df[team_col].astype(str).str.strip().str.upper()
    
    df[date_col] = pd.to_datetime(df[date_col])
    df = df.sort_values(by=[date_col])
    
    output_path = 'raw_wnba_data.csv'
    df.to_csv(output_path, index=False)
    print(f"Data ingestion complete. Saved {len(df)} rows to {output_path}.")
    
    return df

if __name__ == "__main__":
    fetch_and_clean_wnba_data()
