import pandas as pd
import numpy as np

def calculate_advanced_stats(df):
    # Sort chronologically just in case
    df = df.sort_values(by=['game_date', 'game_id'])
    
    # Calculate Possessions
    # Formula: FGA - ORB + TOV + (0.44 * FTA)
    df['possessions'] = df['field_goals_attempted'] - df['offensive_rebounds'] + df['turnovers'] + (0.44 * df['free_throws_attempted'])
    
    # Offensive Rating: Points per 100 possessions
    df['off_rtg'] = (df['team_score'] / df['possessions']) * 100
    
    # Defensive Rating: Opponent Points per 100 possessions
    df['def_rtg'] = (df['opponent_team_score'] / df['possessions']) * 100
    
    # Net Rating
    df['net_rtg'] = df['off_rtg'] - df['def_rtg']
    
    # Pace: Possessions per 40 minutes (standard WNBA game length)
    # Without minute data, we approximate assuming 40 min games.
    df['pace'] = df['possessions']
    
    # Total Rebound Percentage (TRB%)
    # We need opponent's total rebounds. We can self-merge on game_id.
    opponent_stats = df[['game_id', 'team_id', 'total_rebounds']].rename(
        columns={'team_id': 'opponent_team_id', 'total_rebounds': 'opp_total_rebounds'}
    )
    df = df.merge(opponent_stats, on=['game_id', 'opponent_team_id'], how='left')
    
    # TRB% = Team TRB / (Team TRB + Opponent TRB)
    df['trb_pct'] = df['total_rebounds'] / (df['total_rebounds'] + df['opp_total_rebounds']) * 100
    
    return df

def calculate_rolling_stats(df, stats_cols):
    # Sort strictly by date for valid rolling
    df = df.sort_values(by=['game_date'])
    
    features = []
    
    # Group by team
    for team, group in df.groupby('team_id'):
        group = group.copy()
        
        # Calculate days of rest (current game_date - previous game_date)
        group['days_rest'] = (group['game_date'] - group['game_date'].shift(1)).dt.days
        # Cap rest days at e.g. 14 for first game of season, fill NaN with 10 (average off-season start logic)
        group['days_rest'] = group['days_rest'].fillna(10).clip(upper=14)
        
        for col in stats_cols:
            # 5-game rolling average, strictly shifted to prevent leakage
            group[f'{col}_roll5'] = group[col].rolling(window=5, min_periods=1).mean().shift(1)
            # 10-game rolling average, strictly shifted
            group[f'{col}_roll10'] = group[col].rolling(window=10, min_periods=1).mean().shift(1)
            
        features.append(group)
        
    return pd.concat(features).sort_values(by=['game_date', 'game_id'])

def engineer_features():
    print("Loading raw WNBA data...")
    df = pd.read_csv('raw_wnba_data.csv')
    df['game_date'] = pd.to_datetime(df['game_date'])
    
    print("Calculating single-game advanced stats...")
    df = calculate_advanced_stats(df)
    
    stats_to_roll = ['off_rtg', 'def_rtg', 'net_rtg', 'pace', 'trb_pct']
    
    print("Calculating rolling averages and days of rest (with leakage prevention)...")
    df = calculate_rolling_stats(df, stats_to_roll)
    
    # We now have team-level features. We need to restructure to game-level
    # where row = [Date, Home_Stats, Away_Stats, Target]
    
    home_df = df[df['team_home_away'] == 'home'].copy()
    away_df = df[df['team_home_away'] == 'away'].copy()
    
    # Prefix columns to avoid collision
    home_cols = ['game_id', 'game_date', 'team_name', 'team_score', 'days_rest'] + [f'{c}_roll5' for c in stats_to_roll] + [f'{c}_roll10' for c in stats_to_roll]
    away_cols = ['game_id', 'team_name', 'team_score', 'days_rest'] + [f'{c}_roll5' for c in stats_to_roll] + [f'{c}_roll10' for c in stats_to_roll]
    
    home_df = home_df[home_cols].add_prefix('home_')
    away_df = away_df[away_cols].add_prefix('away_')
    
    # Rename join keys back
    home_df = home_df.rename(columns={'home_game_id': 'game_id', 'home_game_date': 'game_date'})
    away_df = away_df.rename(columns={'away_game_id': 'game_id'})
    
    print("Merging Home and Away matchups...")
    games_df = home_df.merge(away_df, on='game_id', how='inner')
    
    # Target variable: Home Score - Away Score
    games_df['Point_Differential'] = games_df['home_team_score'] - games_df['away_team_score']
    
    # Rest Advantage (Positive means Home team has more rest)
    games_df['rest_advantage'] = games_df['home_days_rest'] - games_df['away_days_rest']
    
    # Drop rows with NaN (which happens for the first few games of the season due to shifting/rolling)
    # Although we used min_periods=1, the .shift(1) introduces NaN for the first game of each team
    initial_len = len(games_df)
    games_df = games_df.dropna()
    print(f"Dropped {initial_len - len(games_df)} rows due to NaNs from shifting.")
    
    # Sort chronologically for TimeSeriesSplit
    games_df = games_df.sort_values('game_date')
    
    # Clean up columns for model
    drop_cols = ['home_team_score', 'away_team_score']
    games_df = games_df.drop(columns=drop_cols)
    
    output_path = 'engineered_wnba_features.csv'
    games_df.to_csv(output_path, index=False)
    print(f"Feature engineering complete. Saved {len(games_df)} game records to {output_path}.")
    
if __name__ == "__main__":
    engineer_features()
