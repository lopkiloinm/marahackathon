from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from dotenv import load_dotenv
from nixtla import NixtlaClient
import httpx
import requests
import logging

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="TimeGPT Forecast API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize TimeGPT client
TIME_GPT_API_KEY = os.getenv('TIME_GPT_API_KEY')
nixtla_client = None

if TIME_GPT_API_KEY:
    try:
        nixtla_client = NixtlaClient(api_key=TIME_GPT_API_KEY)
        print("✅ TimeGPT client initialized successfully!")
    except Exception as e:
        print(f"❌ Failed to initialize TimeGPT client: {e}")
else:
    print("⚠️ TimeGPT API key not found in environment variables")

# Pydantic models
class MarketDataPoint(BaseModel):
    timestamp: str
    energy_price: float
    hash_price: Optional[float] = None
    token_price: Optional[float] = None

class ForecastRequest(BaseModel):
    market_data: List[MarketDataPoint]
    horizon: int = 288  # 24 hours in 5-minute intervals
    interval_minutes: int = 5
    confidence_levels: List[int] = [80, 95]

class ForecastResponse(BaseModel):
    forecasts: List[Dict[str, Any]]
    analysis: str
    arbitrage_opportunities: int
    generated_at: str
    model: str
    statistics: Dict[str, float]
    interval_minutes: int

@app.get("/")
async def root():
    return {"message": "TimeGPT Forecast API is running!"}

def generate_energy_market_data(days=7, interval_minutes=5):
    """Read energy market data from CSV file"""
    import os
    
    # Path to the CSV file
    csv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'app', 'data', 'multi_market_data.csv')
    
    print(f"📊 Reading data from {csv_path}...")
    
    try:
        # Read the CSV file
        df = pd.read_csv(csv_path)
        
        # Convert timestamp to datetime
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Sort by timestamp (ascending - oldest first)
        df = df.sort_values('timestamp')
        
        # Calculate the date range for the requested days
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Filter data for the requested time period
        df = df[(df['timestamp'] >= start_date) & (df['timestamp'] <= end_date)]
        
        # Create list of data points
        data_points = []
        for _, row in df.iterrows():
            data_points.append({
                'timestamp': pd.to_datetime(row['timestamp']).strftime('%Y-%m-%dT%H:%M:%S'),
                'energy_price': float(row['energy_price']),
                'hash_price': float(row['hash_price']),
                'token_price': float(row['token_price'])
            })
        
        print(f"✅ Loaded {len(data_points)} data points from CSV")
        return data_points
        
    except FileNotFoundError:
        print(f"❌ CSV file not found at {csv_path}")
        print("Falling back to synthetic data generation...")
        return generate_synthetic_data_fallback(days, interval_minutes)
    except Exception as e:
        print(f"❌ Error reading CSV: {e}")
        print("Falling back to synthetic data generation...")
        return generate_synthetic_data_fallback(days, interval_minutes)

def generate_synthetic_data_fallback(days=7, interval_minutes=5):
    """Fallback synthetic data generation if CSV is not available"""
    
    # Calculate number of intervals
    intervals_per_day = (24 * 60) // interval_minutes
    total_intervals = days * intervals_per_day
    
    # Create date range - ensure we're generating historical data, not future data
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    dates = pd.date_range(start=start_date, end=end_date, freq=f'{interval_minutes}min')[:total_intervals]
    
    # Generate volatile prices with dramatic patterns
    np.random.seed(42)
    
    # Time array for calculations
    t = np.arange(len(dates))
    hours = dates.to_series().dt.hour + dates.to_series().dt.minute / 60
    days_elapsed = t / intervals_per_day
    
    # Base price much higher with more variation
    base_price = 2.5 + 0.5 * np.sin(2 * np.pi * days_elapsed / 3)  # 3-day cycle
    
    # Energy price: highly volatile with multiple frequencies
    energy_daily = 0.8 * np.sin(2 * np.pi * (hours - 6) / 24)  # Much larger daily swing
    energy_hourly = 0.3 * np.sin(2 * np.pi * hours / 6)  # 6-hour cycles
    energy_rapid = 0.2 * np.sin(2 * np.pi * t / (intervals_per_day * 0.25))  # Rapid oscillations
    energy_trend = 0.1 * days_elapsed  # Strong upward trend
    energy_volatility = np.random.normal(0, 0.15, len(dates))  # High volatility
    
    # Add occasional spikes
    spike_mask = np.random.random(len(dates)) < 0.02  # 2% chance of spike
    energy_spikes = spike_mask * np.random.uniform(0.5, 2.0, len(dates))
    
    energy_prices = base_price + energy_daily + energy_hourly + energy_rapid + energy_trend + energy_volatility + energy_spikes
    
    # Hash price: counter-oscillating with different patterns
    hash_base = 3.0 + 0.7 * np.sin(2 * np.pi * days_elapsed / 2.5 + np.pi/3)  # Different phase
    hash_oscillation = 1.0 * np.sin(2 * np.pi * t / (intervals_per_day * 0.4))  # Large swings
    hash_daily = 0.6 * np.sin(2 * np.pi * (hours - 10) / 24)  # Different peak time
    hash_rapid = 0.4 * np.sin(2 * np.pi * t / (intervals_per_day * 0.15) + np.pi/4)
    hash_volatility = np.random.normal(0, 0.2, len(dates))  # Even higher volatility
    hash_spikes = spike_mask * np.random.uniform(-1.0, 3.0, len(dates))
    
    hash_prices = hash_base + hash_oscillation + hash_daily + hash_rapid + hash_volatility + hash_spikes
    
    # Token price: chaotic pattern with extreme volatility
    token_base = 2.0 + 1.2 * np.sin(2 * np.pi * days_elapsed / 1.5 + np.pi/2)
    token_chaos = 0.5 * np.sin(2 * np.pi * t / (intervals_per_day * 0.3)) * np.sin(2 * np.pi * t / (intervals_per_day * 0.7))
    token_daily = -0.7 * np.sin(2 * np.pi * (hours - 6) / 24)  # Inverse of energy
    token_trend = -0.05 * days_elapsed + 0.3 * np.sin(2 * np.pi * days_elapsed)  # Complex trend
    token_volatility = np.random.normal(0, 0.25, len(dates))  # Extreme volatility
    token_jumps = (np.random.random(len(dates)) < 0.03) * np.random.uniform(-2.0, 4.0, len(dates))  # Random jumps
    
    token_prices = token_base + token_chaos + token_daily + token_trend + token_volatility + token_jumps
    
    # Convert to numpy arrays to avoid pandas indexing warnings
    energy_prices = np.array(energy_prices)
    hash_prices = np.array(hash_prices)
    token_prices = np.array(token_prices)
    
    # Add market events that affect all prices
    event_times = [0.15, 0.35, 0.55, 0.75, 0.9]
    for et in event_times:
        event_idx = int(et * len(dates))
        if event_idx < len(dates) - 20:
            # Market shock events
            shock_magnitude = np.random.uniform(-1.5, 1.5)
            for i in range(20):
                if event_idx + i < len(dates):
                    decay = np.exp(-i / 5)
                    energy_prices[event_idx + i] += shock_magnitude * decay * (1 + 0.3 * np.random.randn())
                    hash_prices[event_idx + i] += shock_magnitude * decay * 1.5 * (1 + 0.3 * np.random.randn())
                    token_prices[event_idx + i] += -shock_magnitude * decay * 0.8 * (1 + 0.3 * np.random.randn())
    
    # Ensure prices don't go negative but can go very high
    energy_prices = np.maximum(energy_prices, 0.1)
    hash_prices = np.maximum(hash_prices, 0.1)
    token_prices = np.maximum(token_prices, 0.1)
    
    # Create list of data points
    data_points = []
    
    for i in range(len(dates)):
        data_points.append({
            'timestamp': dates[i].strftime('%Y-%m-%dT%H:%M:%S'),
            'energy_price': float(energy_prices[i]),
            'hash_price': float(hash_prices[i]),
            'token_price': float(token_prices[i])
        })
    
    return data_points

@app.post("/api/timegpt/forecast", response_model=ForecastResponse)
async def generate_forecast(request: ForecastRequest):
    """
    Generate TimeGPT forecast based on historical market data.
    """
    try:
        # Generate 7 days of historical data instead of fetching from API
        print("📊 Generating 7 days of historical data...")
        historical_data = generate_energy_market_data(days=7, interval_minutes=request.interval_minutes)
        print(f"✅ Generated {len(historical_data)} historical data points")
        
        # Convert to DataFrames for each price type
        energy_data = []
        hash_data = []
        token_data = []
        
        for point in historical_data:
            timestamp = point['timestamp']
            energy_data.append({'ds': timestamp, 'y': point['energy_price']})
            hash_data.append({'ds': timestamp, 'y': point['hash_price']})
            token_data.append({'ds': timestamp, 'y': point['token_price']})
        
        energy_df = pd.DataFrame(energy_data)
        hash_df = pd.DataFrame(hash_data)
        token_df = pd.DataFrame(token_data)
        
        # Ensure we have unique timestamps
        energy_df = energy_df.drop_duplicates(subset=['ds'], keep='last')
        hash_df = hash_df.drop_duplicates(subset=['ds'], keep='last')
        token_df = token_df.drop_duplicates(subset=['ds'], keep='last')
        print(f"📈 Using {len(energy_df)} unique data points for forecast")
        
        # Check if we have enough data for TimeGPT
        if len(energy_df) < 100:
            print(f"⚠️ Only {len(energy_df)} data points available, generating more synthetic data...")
            # Generate more historical data if needed
            additional_days = max(1, (100 - len(energy_df)) // ((24 * 60) // request.interval_minutes))
            additional_data = generate_energy_market_data(days=additional_days, interval_minutes=request.interval_minutes)
            
            # Prepend the additional data
            for point in additional_data:
                timestamp = point['timestamp']
                energy_data.insert(0, {'ds': timestamp, 'y': point['energy_price']})
                hash_data.insert(0, {'ds': timestamp, 'y': point['hash_price']})
                token_data.insert(0, {'ds': timestamp, 'y': point['token_price']})
            
            energy_df = pd.DataFrame(energy_data)
            hash_df = pd.DataFrame(hash_data)
            token_df = pd.DataFrame(token_data)
            energy_df = energy_df.drop_duplicates(subset=['ds'], keep='last')
            hash_df = hash_df.drop_duplicates(subset=['ds'], keep='last')
            token_df = token_df.drop_duplicates(subset=['ds'], keep='last')
            print(f"✅ Extended to {len(energy_df)} total data points")
        
        if nixtla_client and len(energy_df) > 0:
            try:
                print(f"🔮 Generating forecasts for all price types...")
                
                # Add unique_id column
                energy_df['unique_id'] = 'energy_price'
                hash_df['unique_id'] = 'hash_price'
                token_df['unique_id'] = 'token_price'
                
                # Convert to datetime
                energy_df['ds'] = pd.to_datetime(energy_df['ds'])
                hash_df['ds'] = pd.to_datetime(hash_df['ds'])
                token_df['ds'] = pd.to_datetime(token_df['ds'])
                
                # Create frequency string
                freq = f'{request.interval_minutes}min'
                
                # Generate forecasts with TimeGPT
                energy_forecast = nixtla_client.forecast(
                    df=energy_df,
                    h=request.horizon,
                    freq=freq,
                    level=[float(level) for level in request.confidence_levels],
                    time_col='ds',
                    target_col='y'
                )
                
                hash_forecast = nixtla_client.forecast(
                    df=hash_df,
                    h=request.horizon,
                    freq=freq,
                    level=[float(level) for level in request.confidence_levels],
                    time_col='ds',
                    target_col='y'
                )
                
                token_forecast = nixtla_client.forecast(
                    df=token_df,
                    h=request.horizon,
                    freq=freq,
                    level=[float(level) for level in request.confidence_levels],
                    time_col='ds',
                    target_col='y'
                )
                
                # Prepare forecast data
                forecasts = []
                print(f"Energy forecast columns: {energy_forecast.columns.tolist()}")
                print(f"Sample forecast row: {energy_forecast.iloc[0].to_dict() if len(energy_forecast) > 0 else 'No data'}")
                
                # First, add the last 50 historical data points
                historical_points = min(50, len(energy_df))
                for i in range(len(energy_df) - historical_points, len(energy_df)):
                    hist_point = {
                        'timestamp': energy_df.iloc[i]['ds'].isoformat(),
                        'energy_price': float(energy_df.iloc[i]['y']),
                        'hash_price': float(hash_df.iloc[i]['y']),
                        'token_price': float(token_df.iloc[i]['y']),
                        'is_historical': True
                    }
                    
                    # Add empty confidence intervals for historical data
                    for level in request.confidence_levels:
                        hist_point[f'energy_price_lo_{level}'] = None
                        hist_point[f'energy_price_hi_{level}'] = None
                        hist_point[f'hash_price_lo_{level}'] = None
                        hist_point[f'hash_price_hi_{level}'] = None
                        hist_point[f'token_price_lo_{level}'] = None
                        hist_point[f'token_price_hi_{level}'] = None
                    
                    forecasts.append(hist_point)
                
                # Then add the forecast data
                for i in range(len(energy_forecast)):
                    forecast_point = {
                        'timestamp': energy_forecast.iloc[i]['ds'].isoformat(),  # type: ignore
                        'energy_price': float(energy_forecast.iloc[i]['TimeGPT']),
                        'hash_price': float(hash_forecast.iloc[i]['TimeGPT']),
                        'token_price': float(token_forecast.iloc[i]['TimeGPT']),
                        'is_historical': False
                    }
                    
                    # Add confidence intervals - check for different possible column names
                    for level in request.confidence_levels:
                        # Try different column name formats
                        lo_col_names = [f'TimeGPT-lo-{level}', f'TimeGPT-lo-{float(level)}', f'lo-{level}']
                        hi_col_names = [f'TimeGPT-hi-{level}', f'TimeGPT-hi-{float(level)}', f'hi-{level}']
                        
                        # Energy price intervals
                        for col_name in lo_col_names:
                            if col_name in energy_forecast.columns:
                                forecast_point[f'energy_price_lo_{level}'] = float(energy_forecast.iloc[i][col_name])
                                break
                        else:
                            forecast_point[f'energy_price_lo_{level}'] = float(energy_forecast.iloc[i]['TimeGPT']) * 0.9
                            
                        for col_name in hi_col_names:
                            if col_name in energy_forecast.columns:
                                forecast_point[f'energy_price_hi_{level}'] = float(energy_forecast.iloc[i][col_name])
                                break
                        else:
                            forecast_point[f'energy_price_hi_{level}'] = float(energy_forecast.iloc[i]['TimeGPT']) * 1.1
                            
                        # Hash price intervals
                        for col_name in lo_col_names:
                            if col_name in hash_forecast.columns:
                                forecast_point[f'hash_price_lo_{level}'] = float(hash_forecast.iloc[i][col_name])
                                break
                        else:
                            forecast_point[f'hash_price_lo_{level}'] = float(hash_forecast.iloc[i]['TimeGPT']) * 0.9
                            
                        for col_name in hi_col_names:
                            if col_name in hash_forecast.columns:
                                forecast_point[f'hash_price_hi_{level}'] = float(hash_forecast.iloc[i][col_name])
                                break
                        else:
                            forecast_point[f'hash_price_hi_{level}'] = float(hash_forecast.iloc[i]['TimeGPT']) * 1.1
                            
                        # Token price intervals
                        for col_name in lo_col_names:
                            if col_name in token_forecast.columns:
                                forecast_point[f'token_price_lo_{level}'] = float(token_forecast.iloc[i][col_name])
                                break
                        else:
                            forecast_point[f'token_price_lo_{level}'] = float(token_forecast.iloc[i]['TimeGPT']) * 0.9
                            
                        for col_name in hi_col_names:
                            if col_name in token_forecast.columns:
                                forecast_point[f'token_price_hi_{level}'] = float(token_forecast.iloc[i][col_name])
                                break
                        else:
                            forecast_point[f'token_price_hi_{level}'] = float(token_forecast.iloc[i]['TimeGPT']) * 1.1
                    
                    forecasts.append(forecast_point)
                
                # Calculate statistics
                energy_mean = energy_forecast['TimeGPT'].mean()
                energy_std = energy_forecast['TimeGPT'].std()
                energy_min = energy_forecast['TimeGPT'].min()
                energy_max = energy_forecast['TimeGPT'].max()
                
                # Detect arbitrage opportunities
                arbitrage_opportunities = detect_arbitrage_opportunities(energy_forecast['TimeGPT'].values)
                
                print(f"✅ TimeGPT forecast generated successfully")
                
                return ForecastResponse(
                    forecasts=forecasts,
                    analysis=f"Energy prices expected to range from ${energy_min:.4f} to ${energy_max:.4f} over the next {request.horizon * request.interval_minutes / 60:.1f} hours. Mean: ${energy_mean:.4f}, Volatility: {energy_std:.4f}",
                    arbitrage_opportunities=arbitrage_opportunities,
                    generated_at=datetime.now().isoformat(),
                    model="timegpt-1",
                    statistics={
                        "mean": float(energy_mean),
                        "std": float(energy_std),
                        "min": float(energy_min),
                        "max": float(energy_max)
                    },
                    interval_minutes=request.interval_minutes
                )
                
            except Exception as e:
                print(f"TimeGPT error: {e}")
                print(f"TimeGPT error details: {type(e).__name__}")
                import traceback
                traceback.print_exc()
                # Fall back to synthetic forecast
                df = pd.DataFrame(historical_data)
                print(f"Synthetic forecast dataframe columns: {df.columns.tolist()}")
                print(f"Synthetic forecast dataframe shape: {df.shape}")
                return generate_synthetic_forecast_all_types(df, request.horizon, request.interval_minutes, request.confidence_levels)
        else:
            # Use synthetic forecast
            df = pd.DataFrame(historical_data)
            return generate_synthetic_forecast_all_types(df, request.horizon, request.interval_minutes, request.confidence_levels)
        
    except Exception as e:
        print(f"TimeGPT error: {str(e)}")
        
        # Fallback to synthetic forecast if TimeGPT fails
        # First try to get data from MARA API
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get('https://mara-hackathon-api.onrender.com/prices')
                if response.status_code == 200:
                    mara_data = response.json()
                    df = pd.DataFrame(mara_data)
                    df['timestamp'] = pd.to_datetime(df['timestamp'])
                    df = df.sort_values('timestamp')
                    df = df.rename(columns={
                        'timestamp': 'ds',
                        'energy_price': 'y'
                    })
                else:
                    # Use request data as fallback
                    df = pd.DataFrame([
                        {'ds': pd.to_datetime(p.timestamp), 'y': p.energy_price}
                        for p in request.market_data
                    ])
        except:
            # Use request data as fallback
            df = pd.DataFrame([
                {'ds': pd.to_datetime(p.timestamp), 'y': p.energy_price}
                for p in request.market_data
            ])
        
        return generate_synthetic_forecast_all_types(df, request.horizon, request.interval_minutes, request.confidence_levels)

@app.post("/api/timegpt/anomaly-detection")
async def detect_anomalies(request: ForecastRequest):
    """Detect anomalies in energy price data using TimeGPT"""
    
    try:
        # Prepare data
        df_data = []
        for item in request.market_data:
            df_data.append({
                'ds': pd.to_datetime(item.timestamp),
                'y': item.energy_price,
                'unique_id': 'energy_price'
            })
        df = pd.DataFrame(df_data)
        
        if nixtla_client:
            try:
                # Use TimeGPT anomaly detection
                anomalies_df = nixtla_client.detect_anomalies(
                    df=df,
                    time_col='ds',
                    target_col='y'
                )
                
                # Convert to response format
                anomalies = []
                for idx, row in anomalies_df.iterrows():
                    if row.get('anomaly', 0) == 1:
                        anomalies.append({
                            'timestamp': row['ds'].isoformat(),
                            'value': float(row['y']),
                            'anomaly_score': 1.0
                        })
                
                return {
                    'anomalies': anomalies,
                    'total_anomalies': len(anomalies),
                    'anomaly_rate': len(anomalies) / len(df) if len(df) > 0 else 0
                }
                
            except Exception as e:
                print(f"TimeGPT anomaly detection error: {e}")
                # Return empty anomalies on error
                return {'anomalies': [], 'total_anomalies': 0, 'anomaly_rate': 0}
        else:
            # No TimeGPT available
            return {'anomalies': [], 'total_anomalies': 0, 'anomaly_rate': 0}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anomaly detection failed: {str(e)}")

def generate_synthetic_data(hours=168, interval_minutes=5):
    """Generate synthetic energy market data with specified interval"""
    points_per_hour = 60 // interval_minutes
    total_points = hours * points_per_hour
    
    now = datetime.now()
    dates = pd.date_range(
        start=now - timedelta(hours=hours), 
        end=now, 
        freq=f'{interval_minutes}T'
    )[:total_points]
    
    # Generate realistic energy prices
    hours_of_day = dates.to_series().dt.hour + dates.to_series().dt.minute / 60
    daily_pattern = 0.08 + 0.03 * np.sin(2 * np.pi * (hours_of_day - 6) / 24)
    
    # Add weekly pattern
    weekdays = dates.to_series().dt.weekday
    weekly_pattern = 0.01 * (weekdays < 5).astype(float)
    
    # Add noise
    noise = np.random.normal(0, 0.005, len(dates))
    
    # Combine patterns
    prices = daily_pattern + weekly_pattern + noise
    prices = np.maximum(prices, 0.01)  # Ensure positive prices
    
    return pd.DataFrame({
        'ds': dates,
        'y': prices,
        'unique_id': 'energy_price'
    })

def generate_synthetic_forecast(df, horizon, interval_minutes, confidence_levels):
    """Generate synthetic forecast when TimeGPT is not available"""
    last_date = df['ds'].max()
    last_price = df['y'].iloc[-1]
    
    # Generate forecast dates
    forecast_dates = pd.date_range(
        start=last_date + timedelta(minutes=interval_minutes),
        periods=horizon,
        freq=f'{interval_minutes}T'
    )
    
    # Generate forecast values with realistic patterns
    hours_of_day = forecast_dates.to_series().dt.hour + forecast_dates.to_series().dt.minute / 60
    daily_pattern = 0.08 + 0.03 * np.sin(2 * np.pi * (hours_of_day - 6) / 24)
    
    # Add trend from historical data
    if len(df) > 12:
        recent_trend = (df['y'].iloc[-1] - df['y'].iloc[-12]) / 12
    else:
        recent_trend = 0
    
    # Generate forecast
    trend_component = recent_trend * np.arange(1, horizon + 1) * 0.1
    noise = np.random.normal(0, 0.005, horizon)
    
    forecast_values = daily_pattern + trend_component + noise
    forecast_values = np.maximum(forecast_values, 0.01)
    
    # Create forecast DataFrame
    forecast_df = pd.DataFrame({
        'ds': forecast_dates,
        'forecast': forecast_values
    })
    
    # Add confidence intervals
    for level in confidence_levels:
        uncertainty = forecast_values * (1 - level/100) * 0.5
        forecast_df[f'forecast-lo-{level}'] = forecast_values - uncertainty
        forecast_df[f'forecast-hi-{level}'] = forecast_values + uncertainty
    
    return forecast_df

def generate_synthetic_forecast_all_types(df, horizon, interval_minutes, confidence_levels):
    """Generate synthetic forecast for all price types when TimeGPT is not available"""
    # Handle different column naming conventions
    if 'timestamp' in df.columns:
        time_col = 'timestamp'
        energy_col = 'energy_price'
        hash_col = 'hash_price'
        token_col = 'token_price'
    elif 'energyPrice' in df.columns:
        # This case shouldn't happen anymore, but keep for backward compatibility
        time_col = 'timestamp'
        energy_col = 'energyPrice'
        hash_col = 'hashPrice'
        token_col = 'tokenPrice'
    else:
        # Assume it's a simple df with ds and y columns
        time_col = 'ds'
        energy_col = 'y'
        hash_col = 'y'
        token_col = 'y'
    
    # Use the last timestamp from the DataFrame
    if time_col in df.columns:
        last_date = pd.to_datetime(df[time_col].max())
    else:
        last_date = datetime.now()
    
    # Get last values for each price type
    if energy_col in df.columns:
        last_energy = df[energy_col].iloc[-1]
    else:
        last_energy = 0.1
        
    if hash_col in df.columns:
        last_hash = df[hash_col].iloc[-1]
    else:
        last_hash = 4.0
        
    if token_col in df.columns:
        last_token = df[token_col].iloc[-1]
    else:
        last_token = 0.5
    
    # Calculate trends
    if len(df) > 12:
        energy_trend = (df[energy_col].iloc[-1] - df[energy_col].iloc[-12]) / 12 if energy_col in df.columns else 0
        hash_trend = (df[hash_col].iloc[-1] - df[hash_col].iloc[-12]) / 12 if hash_col in df.columns else 0
        token_trend = (df[token_col].iloc[-1] - df[token_col].iloc[-12]) / 12 if token_col in df.columns else 0
    else:
        energy_trend = hash_trend = token_trend = 0
    
    # Convert forecast to response format
    forecast_data = []
    
    # Add historical data first (if available and has all required columns)
    if all(col in df.columns for col in [time_col, energy_col, hash_col, token_col]):
        historical_points = min(50, len(df))
        for _, row in df.tail(historical_points).iterrows():
            timestamp = row[time_col]
            if hasattr(timestamp, 'isoformat'):
                timestamp_str = timestamp.isoformat()  # type: ignore
            else:
                timestamp_str = pd.to_datetime(timestamp).strftime('%Y-%m-%dT%H:%M:%S')
            
            forecast_data.append({
                'timestamp': timestamp_str,
                'energy_price': float(row[energy_col]),
                'hash_price': float(row[hash_col]),
                'token_price': float(row[token_col]),
                'is_historical': True
            })
    
    # Generate forecast dates
    forecast_dates = pd.date_range(
        start=last_date + timedelta(minutes=interval_minutes),
        periods=horizon,
        freq=f'{interval_minutes}min'
    )
    
    # Generate forecast for each timestamp
    for i, timestamp in enumerate(forecast_dates):
        # Daily pattern
        hour_of_day = timestamp.hour + timestamp.minute / 60
        daily_multiplier = 1 + 0.15 * np.sin(2 * np.pi * (hour_of_day - 6) / 24)
        
        # Add some randomness
        energy_noise = (np.random.random() - 0.5) * 0.01
        hash_noise = (np.random.random() - 0.5) * 0.1
        token_noise = (np.random.random() - 0.5) * 0.05
        
        # Calculate forecast values
        energy_forecast = max(0.01, last_energy * daily_multiplier + energy_trend * i * 0.1 + energy_noise)
        hash_forecast = max(0.1, last_hash * daily_multiplier + hash_trend * i * 0.1 + hash_noise)
        token_forecast = max(0.01, last_token * daily_multiplier + token_trend * i * 0.1 + token_noise)
        
        forecast_point = {
            'timestamp': timestamp.isoformat(),
            'energy_price': float(energy_forecast),
            'hash_price': float(hash_forecast),
            'token_price': float(token_forecast),
            'is_historical': False
        }
        
        # Add confidence intervals
        for level in confidence_levels:
            uncertainty = (100 - level) / 100 * 0.5
            forecast_point[f'energy_price_lo_{level}'] = float(energy_forecast * (1 - uncertainty))
            forecast_point[f'energy_price_hi_{level}'] = float(energy_forecast * (1 + uncertainty))
            forecast_point[f'hash_price_lo_{level}'] = float(hash_forecast * (1 - uncertainty))
            forecast_point[f'hash_price_hi_{level}'] = float(hash_forecast * (1 + uncertainty))
            forecast_point[f'token_price_lo_{level}'] = float(token_forecast * (1 - uncertainty))
            forecast_point[f'token_price_hi_{level}'] = float(token_forecast * (1 + uncertainty))
        
        forecast_data.append(forecast_point)
    
    # Calculate statistics
    forecast_only = [f for f in forecast_data if not f.get('is_historical', False)]
    energy_values = [f['energy_price'] for f in forecast_only]
    hash_values = [f['hash_price'] for f in forecast_only]
    token_values = [f['token_price'] for f in forecast_only]
    
    # Detect arbitrage opportunities
    opportunities = detect_arbitrage_opportunities(energy_values)
    
    stats = {
        'mean': float(np.mean(energy_values)),
        'std': float(np.std(energy_values)),
        'min': float(np.min(energy_values)),
        'max': float(np.max(energy_values)),
        'trend': float(energy_trend),
        'hash_mean': float(np.mean(hash_values)),
        'token_mean': float(np.mean(token_values))
    }
    
    return ForecastResponse(
        forecasts=forecast_data,
        analysis=f"Synthetic forecast with {len(forecast_only)} future points for all price types. Detected {opportunities} arbitrage opportunities.",
        arbitrage_opportunities=opportunities,
        generated_at=datetime.now().isoformat(),
        model="synthetic",
        statistics=stats,
        interval_minutes=interval_minutes
    )

def detect_arbitrage_opportunities(forecast_values):
    """Detect potential arbitrage opportunities in forecast"""
    if len(forecast_values) < 2:
        return 0
    
    # Look for significant price variations
    mean_price = np.mean(forecast_values)
    std_price = np.std(forecast_values)
    
    # Count periods with prices significantly above or below mean
    high_prices = sum(1 for p in forecast_values if p > mean_price + 1.5 * std_price)
    low_prices = sum(1 for p in forecast_values if p < mean_price - 1.5 * std_price)
    
    return high_prices + low_prices

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 