import pandas as pd
import numpy as np
import pickle
import xgboost as xgb
from sklearn.model_selection import TimeSeriesSplit, GridSearchCV
from sklearn.metrics import mean_squared_error, mean_absolute_error
from sklearn.pipeline import Pipeline

def train_model():
    print("Loading engineered features...")
    df = pd.read_csv('engineered_wnba_features.csv')
    
    # Ensure data is sorted by date for TimeSeriesSplit
    df['game_date'] = pd.to_datetime(df['game_date'])
    df = df.sort_values('game_date').reset_index(drop=True)
    
    # Identify target and features
    target_col = 'Point_Differential'
    
    # Drop identifiers and target from features
    exclude_cols = ['game_id', 'game_date', 'home_team_name', 'away_team_name', target_col]
    feature_cols = [c for c in df.columns if c not in exclude_cols]
    
    X = df[feature_cols]
    y = df[target_col]
    
    # Define TimeSeriesSplit (Walk-Forward Validation)
    tscv = TimeSeriesSplit(n_splits=5)
    
    # Define XGBoost Regressor
    model = xgb.XGBRegressor(objective='reg:squarederror', random_state=42)
    
    # Hyperparameter Grid
    param_grid = {
        'max_depth': [3, 4, 5],
        'learning_rate': [0.01, 0.05, 0.1],
        'n_estimators': [100, 200, 500]
    }
    
    print("Running GridSearchCV with TimeSeriesSplit...")
    grid_search = GridSearchCV(
        estimator=model,
        param_grid=param_grid,
        cv=tscv,
        scoring='neg_mean_squared_error',
        n_jobs=-1,
        verbose=1
    )
    
    grid_search.fit(X, y)
    
    best_model = grid_search.best_estimator_
    print(f"Best hyperparameters found: {grid_search.best_params_}")
    
    # Calculate performance across folds for the best estimator
    print("Evaluating across Walk-Forward Validation folds...")
    rmse_scores = []
    mae_scores = []
    
    for train_index, test_index in tscv.split(X):
        X_train, X_test = X.iloc[train_index], X.iloc[test_index]
        y_train, y_test = y.iloc[train_index], y.iloc[test_index]
        
        # Fit with best params on this fold
        fold_model = xgb.XGBRegressor(**grid_search.best_params_, random_state=42)
        fold_model.fit(X_train, y_train)
        
        preds = fold_model.predict(X_test)
        rmse_scores.append(np.sqrt(mean_squared_error(y_test, preds)))
        mae_scores.append(mean_absolute_error(y_test, preds))
        
    avg_rmse = np.mean(rmse_scores)
    avg_mae = np.mean(mae_scores)
    
    # Output metrics to file
    with open('model_performance.txt', 'w') as f:
        f.write("WNBA Point Spread Predictor - Model Performance\n")
        f.write("===============================================\n")
        f.write("Validation Strategy: TimeSeriesSplit (Walk-Forward Validation)\n")
        f.write(f"Number of Folds: {tscv.n_splits}\n")
        f.write(f"Best Hyperparameters: {grid_search.best_params_}\n")
        f.write(f"Average RMSE: {avg_rmse:.4f}\n")
        f.write(f"Average MAE:  {avg_mae:.4f}\n")
    print("Saved performance metrics to model_performance.txt.")
    
    # Append Feature Importances to performance file since matplotlib is blocked by system policy
    with open('model_performance.txt', 'a') as f:
        f.write("\nFeature Importances:\n")
        importances = best_model.feature_importances_
        indices = np.argsort(importances)[::-1]
        for i in indices:
            f.write(f"{feature_cols[i]}: {importances[i]:.4f}\n")
    print("Appended feature importances to model_performance.txt.")
    
    # Save the final model (trained on full dataset via GridSearchCV)
    with open('wnba_spread_model.pkl', 'wb') as f:
        pickle.dump(best_model, f)
    print("Saved model to wnba_spread_model.pkl.")

if __name__ == "__main__":
    train_model()
