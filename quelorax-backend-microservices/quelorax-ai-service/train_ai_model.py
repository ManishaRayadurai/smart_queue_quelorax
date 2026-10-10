import mysql.connector
import pandas as pd
import numpy as np
import joblib
import os
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score, accuracy_score

def train_models():
    print("1. Fetching historical token dataset from MySQL quelorax_queue...")
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="Manisha@507",
        database="quelorax_queue"
    )

    query = """
    SELECT 
        t.id,
        t.department_id,
        d.name AS dept_name,
        d.avg_service_time AS dept_avg_service_time,
        d.counter AS active_counters,
        t.priority,
        t.status,
        t.created_at,
        t.called_at,
        t.completed_at
    FROM queue_tokens t
    JOIN departments d ON t.department_id = d.id
    WHERE t.status = 'completed' AND t.called_at IS NOT NULL AND t.created_at IS NOT NULL;
    """

    df = pd.read_sql(query, conn)
    conn.close()

    print(f"Loaded {len(df)} completed historical token records for training.")

    df['wait_time_mins'] = (df['called_at'] - df['created_at']) / (60 * 1000)
    df['service_time_mins'] = (df['completed_at'] - df['called_at']) / (60 * 1000)

    df['created_datetime'] = pd.to_datetime(df['created_at'], unit='ms')
    df['hour_of_day'] = df['created_datetime'].dt.hour
    df['day_of_week'] = df['created_datetime'].dt.dayofweek

    priority_map = {'normal': 1, 'senior': 2, 'vip': 3, 'emergency': 4}
    df['priority_code'] = df['priority'].map(priority_map).fillna(1)

    df['queue_position_ahead'] = df['wait_time_mins'] / (df['dept_avg_service_time'] / np.maximum(1, df['active_counters']))
    df['queue_position_ahead'] = df['queue_position_ahead'].round().astype(int)

    print("\n2. Training Model 1: Wait-Time Predictor (Random Forest Regressor)...")
    X_wait = df[['department_id', 'priority_code', 'hour_of_day', 'day_of_week', 'queue_position_ahead', 'active_counters', 'dept_avg_service_time']]
    y_wait = df['wait_time_mins']

    X_train_w, X_test_w, y_train_w, y_test_w = train_test_split(X_wait, y_wait, test_size=0.2 if len(df)>100 else 0.1, random_state=42)

    wait_model = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42)
    wait_model.fit(X_train_w, y_train_w)

    y_pred_w = wait_model.predict(X_test_w)
    mae_w = mean_absolute_error(y_test_w, y_pred_w)
    r2_w = r2_score(y_test_w, y_pred_w)

    print(f"   [Model 1 Results] MAE: {mae_w:.2f} minutes | R² Accuracy Score: {r2_w:.4f}")

    print("\n3. Training Model 2: Crowd Density Forecaster (Random Forest Classifier)...")
    df['date_hour'] = df['created_datetime'].dt.floor('h')
    hourly_df = df.groupby(['department_id', 'hour_of_day', 'day_of_week', 'date_hour']).size().reset_index(name='arrival_count')

    def get_density_level(count):
        if count < 8: return 'low'
        elif count <= 20: return 'medium'
        else: return 'high'

    hourly_df['crowd_level'] = hourly_df['arrival_count'].apply(get_density_level)

    X_crowd = hourly_df[['department_id', 'hour_of_day', 'day_of_week']]
    y_crowd = hourly_df['crowd_level']

    X_train_c, X_test_c, y_train_c, y_test_c = train_test_split(X_crowd, y_crowd, test_size=0.2, random_state=42)

    crowd_model = RandomForestClassifier(n_estimators=100, random_state=42)
    crowd_model.fit(X_train_c, y_train_c)

    y_pred_c = crowd_model.predict(X_test_c)
    acc_c = accuracy_score(y_test_c, y_pred_c)

    print(f"   [Model 2 Results] Crowd Density Classifier Accuracy: {acc_c * 100:.2f}%")

    models_dir = os.path.join(os.path.dirname(__file__), "ai_models")
    os.makedirs(models_dir, exist_ok=True)

    wait_model_path = os.path.join(models_dir, "wait_time_model.joblib")
    crowd_model_path = os.path.join(models_dir, "crowd_forecast_model.joblib")

    joblib.dump(wait_model, wait_model_path)
    joblib.dump(crowd_model, crowd_model_path)

    print(f"\nTrained models successfully saved to:\n - {wait_model_path}\n - {crowd_model_path}")

if __name__ == "__main__":
    train_models()
