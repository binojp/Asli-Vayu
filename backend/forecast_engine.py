import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta

def predict_aqi_trend(historical_data: list):
    """
    Predicts the AQI for the next 7 days based on historical data.
    historical_data: list of dicts with {"timestamp": Date, "pm25": float}
    """
    if len(historical_data) < 5:
        return {"error": "Insufficient data for prediction"}

    df = pd.DataFrame(historical_data)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df['days_from_start'] = (df['timestamp'] - df['timestamp'].min()).dt.days

    X = df[['days_from_start']].values
    y = df['pm25'].values

    model = LinearRegression()
    model.fit(X, y)

    # Predict next 7 days
    last_day = df['days_from_start'].max()
    future_days = np.array([[last_day + i] for i in range(1, 8)])
    predictions = model.predict(future_days)

    forecast = []
    current_date = df['timestamp'].max()
    for i, pred in enumerate(predictions):
        forecast.append({
            "date": (current_date + timedelta(days=i+1)).strftime("%Y-%m-%d"),
            "predicted_pm25": round(max(0, float(pred)), 2)
        })

    return forecast

def evaluate_industrial_zoning(lat, lon, current_aqi, trend):
    """
    Evaluates if a factory can be opened based on AQI and trend.
    """
    if current_aqi > 150:
        return "Rejected: Current AQI is too high (Unhealthy)."
    
    if trend > 0: # AQI is increasing
        return "Rejected: Pollution levels are on a rising trend."
    
    return "Recommended: Area has stable and acceptable air quality for development."
