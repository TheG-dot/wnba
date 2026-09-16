import json
import pickle
import pandas as pd
import numpy as np

def generate_live_dashboard():
    # Load Models
    with open('wnba_spread_model.pkl', 'rb') as f:
        spread_model = pickle.load(f)
    
    with open('wnba_player_pts_model.pkl', 'rb') as f:
        pts_model = pickle.load(f)
        
    with open('wnba_player_fgm_model.pkl', 'rb') as f:
        fgm_model = pickle.load(f)

    # Load Data for latest stats
    team_df = pd.read_csv('engineered_wnba_features.csv')
    player_df = pd.read_csv('engineered_player_features.csv')
    
    # Tomorrow's Games (from Google Search + Fever for Clark props)
    matchups = [
        {"away": "MERCURY", "home": "DREAM"},
        {"away": "STORM", "home": "LIBERTY"},
        {"away": "WINGS", "home": "MYSTICS"},
        {"away": "SPARKS", "home": "SKY"},
        {"away": "FEVER", "home": "ACES"} # Added for Clark
    ]
    
    dashboard_data = {
        "games": [],
        "best_bets": []
    }
    
    spread_features = spread_model.feature_names_in_
    pts_features = pts_model.feature_names_in_
    fgm_features = fgm_model.feature_names_in_
    
    for game in matchups:
        away = game['away']
        home = game['home']
        
        try:
            home_latest = team_df[team_df['home_team_name'] == home].sort_values('game_date').iloc[-1]
            away_latest = team_df[team_df['away_team_name'] == away].sort_values('game_date').iloc[-1]
            
            # Predict Spread
            f_vec = {}
            for col in spread_features:
                if col == 'rest_advantage':
                    f_vec[col] = 3 - 3 # Assume 3 days rest for both
                elif col.startswith('home_'):
                    f_vec[col] = home_latest[col]
                elif col.startswith('away_'):
                    f_vec[col] = away_latest[col]
                else:
                    f_vec[col] = 0
                    
            X_pred = pd.DataFrame([f_vec], columns=spread_features)
            pred_spread = float(spread_model.predict(X_pred)[0])
            
            if pred_spread > 0:
                winner = home
                margin = pred_spread
            else:
                winner = away
                margin = abs(pred_spread)
                
            dashboard_data['games'].append({
                "matchup": f"{away} @ {home}",
                "predicted_winner": winner,
                "margin": round(margin, 1)
            })
            
            # Player Props - Find a star player for this game
            # E.g. if Indiana is playing, get Caitlin Clark
            target_players = []
            if away == "FEVER" or home == "FEVER":
                target_players.append("Caitlin Clark")
            if away == "LIBERTY" or home == "LIBERTY":
                target_players.append("Breanna Stewart")
            if away == "ACES" or home == "ACES":
                target_players.append("A'ja Wilson")
                
            for p_name in target_players:
                p_latest = player_df[player_df['player_name'].str.contains(p_name, case=False, na=False)].sort_values('game_date').iloc[-1]
                
                # Predict Points
                p_vec_pts = {}
                for col in pts_features:
                    if col == 'player_days_rest': p_vec_pts[col] = 3
                    elif col == 'opp_def_rtg_roll5': 
                        p_vec_pts[col] = home_latest['home_def_rtg_roll5'] if p_latest['team_name'] == away else away_latest['away_def_rtg_roll5']
                    else:
                        p_vec_pts[col] = p_latest.get(col, 0)
                        
                pred_pts = float(pts_model.predict(pd.DataFrame([p_vec_pts], columns=pts_features))[0])
                
                # Predict FGM (Shots)
                p_vec_fgm = {}
                for col in fgm_features:
                    if col == 'player_days_rest': p_vec_fgm[col] = 3
                    elif col == 'opp_def_rtg_roll5': 
                        p_vec_fgm[col] = home_latest['home_def_rtg_roll5'] if p_latest['team_name'] == away else away_latest['away_def_rtg_roll5']
                    else:
                        p_vec_fgm[col] = p_latest.get(col, 0)
                        
                pred_fgm = float(fgm_model.predict(pd.DataFrame([p_vec_fgm], columns=fgm_features))[0])
                
                dashboard_data['best_bets'].append({
                    "player": p_name,
                    "prop_type": "Points",
                    "line": 20.5 if p_name == "Caitlin Clark" else 22.5,
                    "projection": round(pred_pts, 1),
                    "recommendation": "OVER" if pred_pts > (20.5 if p_name == "Caitlin Clark" else 22.5) else "UNDER"
                })
                
                dashboard_data['best_bets'].append({
                    "player": p_name,
                    "prop_type": "Shots Made (FGM)",
                    "line": 7.5,
                    "projection": round(pred_fgm, 1),
                    "recommendation": "OVER" if pred_fgm > 7.5 else "UNDER"
                })
                
        except Exception as e:
            print(f"Skipping {away} vs {home} due to error: {e}")
            
    with open('live_dashboard.json', 'w') as f:
        json.dump(dashboard_data, f, indent=4)
    print("Generated live_dashboard.json successfully.")

if __name__ == "__main__":
    generate_live_dashboard()
