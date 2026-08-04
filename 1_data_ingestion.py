import os
import pandas as pd
import sportsdataverse.wnba as wnba

def fetch_and_clean_wnba_data(start_season=2020, end_season=2024):
    print(f"Fetching WNBA team box score data from {start_season} to {end_season}...")
    
    # sportsdataverse allows loading multiple seasons. We pass a list of seasons.
    seasons = list(range(start_season, end_season + 1))
    
    # Load data (returns a polars DataFrame)
    pl_df = wnba.load_wnba_team_boxscore(seasons=seasons)
    
    # Convert to pandas DataFrame for our pipeline
    df = pl_df.to_pandas()
    print(f"Loaded {len(df)} rows. Columns: {df.columns.tolist()[:10]}...")

    # For WNBA data from espn, relevant columns usually include:
    # 'game_date', 'team_name', 'team_id', 'team_score', 'opponent_team_name', etc.
    # We will inspect the actual columns in the first run and adapt feature engineering.
    
    # We need a strict date column
    date_col = 'game_date' if 'game_date' in df.columns else 'date' if 'date' in df.columns else 'game_date'
    
    # If the exact column isn't found, let's print all columns and raise an error so we can fix it.
    if date_col not in df.columns:
        # Check if 'game_date_time' or something exists
        for col in df.columns:
            if 'date' in col.lower():
                date_col = col
                break
                
    print(f"Using '{date_col}' for sorting chronologically.")
    
    # Standardize Team Names (just ensuring it's uppercase and stripped)
    team_col = 'team_name' if 'team_name' in df.columns else 'team_display_name' if 'team_display_name' in df.columns else 'team'
    if team_col in df.columns:
        df[team_col] = df[team_col].astype(str).str.strip().str.upper()
    
    # Sort data strictly by game_date in ascending chronological order
    df[date_col] = pd.to_datetime(df[date_col])
    df = df.sort_values(by=[date_col])
    
    # Output to CSV
    output_path = 'raw_wnba_data.csv'
    df.to_csv(output_path, index=False)
    print(f"Data ingestion complete. Saved {len(df)} rows to {output_path}.")
    
    return df

if __name__ == "__main__":
    fetch_and_clean_wnba_data()
