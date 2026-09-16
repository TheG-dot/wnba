import pandas as pd
import numpy as np
import pickle
import xgboost as xgb
from sklearn.model_selection import TimeSeriesSplit, RandomizedSearchCV

def train_player_models():
    print("Loading engineered player features...")
    df = pd.read_csv('engineered_player_features.csv')
    
    df['game_date'] = pd.to_datetime(df['game_date'])
    df = df.sort_values('game_date').reset_index(drop=True)
    
    # We will train two models: Points and Field Goals Made
    targets = ['pts', 'fgm']
    
    # Base features available for all
    base_features = ['player_days_rest', 'opp_def_rtg_roll5']
    
    tscv = TimeSeriesSplit(n_splits=3) # Faster search for props
    
    for target in targets:
        print(f"--- Training Model for {target.upper()} ---")
        
        # Select target specific rolling features
        feature_cols = base_features + [f'{target}_roll3', f'{target}_roll5']
        
        # Drop rows missing features or targets
        temp_df = df.dropna(subset=feature_cols + [target]).copy()
        
        X = temp_df[feature_cols]
        y = temp_df[target]
        
        model = xgb.XGBRegressor(objective='reg:squarederror', random_state=42)
        
        # Smaller grid for speed
        param_grid = {
            'max_depth': [3, 4],
            'learning_rate': [0.05, 0.1],
            'n_estimators': [100, 200]
        }
        
        print(f"Running search for {target}...")
        search = RandomizedSearchCV(
            estimator=model,
            param_distributions=param_grid,
            n_iter=4, # random sample to save time
            cv=tscv,
            scoring='neg_mean_absolute_error',
            n_jobs=-1,
            random_state=42
        )
        
        search.fit(X, y)
        best_model = search.best_estimator_
        
        print(f"Best hyperparameters for {target}: {search.best_params_}")
        
        model_filename = f'wnba_player_{target}_model.pkl'
        with open(model_filename, 'wb') as f:
            pickle.dump(best_model, f)
            
        print(f"Saved {model_filename}\n")

if __name__ == "__main__":
    train_player_models()
