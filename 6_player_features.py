import pandas as pd
import numpy as np

def engineer_player_features():
    print("Loading player box score data...")
    # Load player data
    pdf = pd.read_csv('raw_wnba_player_data.csv')
    
    # Standardize columns (sportsdataverse often uses 'athlete_id', 'athlete_display_name', 'points', 'rebounds', etc.)
    # We will rename common ones to ensure consistency.
    col_mapping = {
        'athlete_id': 'player_id',
        'athlete_display_name': 'player_name',
        'points': 'pts',
        'total_rebounds': 'reb',
        'rebounds': 'reb',
        'assists': 'ast',
        'field_goals_made': 'fgm',
        'minutes': 'min'
    }
    pdf = pdf.rename(columns=col_mapping)
    
    # Ensure necessary columns exist
    required_cols = ['game_id', 'game_date', 'player_id', 'player_name', 'team_id', 'pts', 'reb', 'ast', 'fgm']
    missing = [c for c in required_cols if c not in pdf.columns]
    if missing:
        print(f"Warning: Missing columns in player data: {missing}")
        # Try to gracefully continue if it's just min/reb issues, etc.
        
    pdf['game_date'] = pd.to_datetime(pdf['game_date'])
    
    # Ensure numeric types
    for col in ['pts', 'reb', 'ast', 'fgm']:
        if col in pdf.columns:
            pdf[col] = pd.to_numeric(pdf[col], errors='coerce').fillna(0)
    
    print("Calculating player rolling stats (with leakage prevention)...")
    pdf = pdf.sort_values(by=['game_date', 'game_id'])
    
    features = []
    
    stats_to_roll = ['pts', 'reb', 'ast', 'fgm']
    
    for player, group in pdf.groupby('player_id'):
        group = group.copy()
        
        # Calculate days of rest (optional, similar to teams)
        group['player_days_rest'] = (group['game_date'] - group['game_date'].shift(1)).dt.days
        group['player_days_rest'] = group['player_days_rest'].fillna(10).clip(upper=14)
        
        for col in stats_to_roll:
            if col in group.columns:
                # 3-game and 5-game rolling, shifted
                group[f'{col}_roll3'] = group[col].rolling(window=3, min_periods=1).mean().shift(1)
                group[f'{col}_roll5'] = group[col].rolling(window=5, min_periods=1).mean().shift(1)
        
        features.append(group)
        
    final_pdf = pd.concat(features).sort_values(by=['game_date', 'game_id'])
    
    # Merge opponent's defensive rating from team features
    print("Merging opponent defensive context from team features...")
    tdf = pd.read_csv('engineered_wnba_features.csv')
    
    # tdf has game-level rows with home_... and away_... stats
    # We want to map game_id + player's team -> opponent's def_rtg_roll5
    
    # Build a lookup: for each game and team, what is the opponent's def rtg?
    home_lookup = tdf[['game_id', 'home_team_name', 'away_def_rtg_roll5']].rename(columns={'home_team_name': 'team_name', 'away_def_rtg_roll5': 'opp_def_rtg_roll5'})
    away_lookup = tdf[['game_id', 'away_team_name', 'home_def_rtg_roll5']].rename(columns={'away_team_name': 'team_name', 'home_def_rtg_roll5': 'opp_def_rtg_roll5'})
    
    team_opp_lookup = pd.concat([home_lookup, away_lookup])
    
    # We need player's team_name in pdf. If pdf has team_name, standardize it.
    if 'team_name' in pdf.columns:
        final_pdf['team_name'] = final_pdf['team_name'].astype(str).str.strip().str.upper()
        # Merge
        final_pdf = final_pdf.merge(team_opp_lookup, on=['game_id', 'team_name'], how='left')
    else:
        # Fallback if no team_name is in player box score (unlikely)
        final_pdf['opp_def_rtg_roll5'] = 100.0
        
    # Drop NaNs created by shifting
    initial_len = len(final_pdf)
    final_pdf = final_pdf.dropna(subset=[f'pts_roll5']) # At least the 5-game roll should exist
    print(f"Dropped {initial_len - len(final_pdf)} rows due to NaNs from shifting/joining.")
    
    output_path = 'engineered_player_features.csv'
    final_pdf.to_csv(output_path, index=False)
    print(f"Player feature engineering complete. Saved {len(final_pdf)} player-game records to {output_path}.")

if __name__ == "__main__":
    engineer_player_features()
