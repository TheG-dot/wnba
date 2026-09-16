import os
import re
import pickle
import pandas as pd
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import xgboost as xgb

app = Flask(__name__)
CORS(app)

# Load the model
with open('wnba_spread_model.pkl', 'rb') as f:
    model = pickle.load(f)

# Load feature dataset for lookups
df_features = pd.read_csv('engineered_wnba_features.csv')
df_features['game_date'] = pd.to_datetime(df_features['game_date'])

# Extract stats from model_performance.txt
stats_cache = {}
def load_stats():
    global stats_cache
    if not stats_cache:
        importances = {}
        rmse = 0.0
        mae = 0.0
        try:
            with open('model_performance.txt', 'r') as f:
                lines = f.readlines()
                in_features = False
                for line in lines:
                    if 'Average RMSE:' in line:
                        rmse = float(line.split(':')[1].strip())
                    elif 'Average MAE:' in line:
                        mae = float(line.split(':')[1].strip())
                    elif 'Feature Importances:' in line:
                        in_features = True
                        continue
                    elif in_features and ':' in line:
                        parts = line.split(':')
                        if len(parts) == 2:
                            importances[parts[0].strip()] = float(parts[1].strip())
            
            # Sort importances
            sorted_imp = sorted(importances.items(), key=lambda x: x[1], reverse=True)
            labels = [x[0] for x in sorted_imp]
            values = [x[1] for x in sorted_imp]
            
            stats_cache = {
                'rmse': rmse,
                'mae': mae,
                'feature_labels': labels[:15], # Top 15
                'feature_values': values[:15]
            }
        except Exception as e:
            print("Error loading stats:", e)
    return stats_cache

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/stats')
def get_stats():
    return jsonify(load_stats())

@app.route('/api/teams')
def get_teams():
    teams = sorted(list(set(df_features['home_team_name'].dropna().unique()) | set(df_features['away_team_name'].dropna().unique())))
    return jsonify(teams)

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.json
    home_team = data.get('home')
    away_team = data.get('away')
    
    if not home_team or not away_team:
        return jsonify({'error': 'Missing home or away team'}), 400
        
    if home_team == away_team:
        return jsonify({'error': 'Home and Away teams must be different'}), 400
        
    try:
        # Find latest stats for Home Team (when they played at home)
        home_latest = df_features[df_features['home_team_name'] == home_team].sort_values('game_date').iloc[-1]
        
        # Find latest stats for Away Team (when they played away)
        away_latest = df_features[df_features['away_team_name'] == away_team].sort_values('game_date').iloc[-1]
        
        # We need to construct the exact feature vector
        # Let's get the feature names the model expects
        feature_names = model.feature_names_in_
        
        feature_vector = {}
        for col in feature_names:
            if col == 'rest_advantage':
                feature_vector[col] = home_latest['home_days_rest'] - away_latest['away_days_rest']
            elif col.startswith('home_'):
                feature_vector[col] = home_latest[col]
            elif col.startswith('away_'):
                feature_vector[col] = away_latest[col]
            else:
                feature_vector[col] = 0 # Fallback
                
        # Convert to DataFrame
        X_pred = pd.DataFrame([feature_vector], columns=feature_names)
        
        # Predict
        prediction = float(model.predict(X_pred)[0])
        
        # Format prediction
        # Target was Home_Score - Away_Score. 
        # Positive means Home wins by X. Negative means Away wins by X.
        if prediction > 0:
            winner = home_team
            margin = prediction
        else:
            winner = away_team
            margin = abs(prediction)
            
        return jsonify({
            'prediction_value': prediction,
            'predicted_winner': winner,
            'margin': round(margin, 2),
            'home_team': home_team,
            'away_team': away_team,
            'home_rest': int(home_latest['home_days_rest']),
            'away_rest': int(away_latest['away_days_rest'])
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/live')
def get_live_data():
    try:
        import json
        with open('live_dashboard.json', 'r') as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
