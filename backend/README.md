# TimeGPT FastAPI Backend

This FastAPI backend provides direct access to TimeGPT forecasting capabilities, similar to the Jupyter notebooks but running as a REST API.

## Features

- **5-minute interval forecasting**: Generate high-resolution energy price forecasts
- **TimeGPT integration**: Uses the official Nixtla TimeGPT API when available
- **Confidence intervals**: Returns 80% and 95% confidence bands
- **Anomaly detection**: Detect unusual patterns in energy prices
- **Synthetic fallback**: Generates realistic forecasts when TimeGPT is unavailable

## Setup

1. **Install Python 3.8+** (if not already installed)

2. **Start the backend server**:
   ```bash
   cd backend
   chmod +x start.sh
   ./start.sh
   ```

   Or manually:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r ../requirements.txt
   uvicorn main:app --reload --port 8000
   ```

3. **Configure TimeGPT API key** (optional):
   - Add your TimeGPT API key to the `.env` file:
     ```
     TIME_GPT_API_KEY=your_api_key_here
     ```

## API Endpoints

### 1. Generate Forecast
**POST** `/api/timegpt/forecast`

Request body:
```json
{
  "market_data": [
    {
      "timestamp": "2024-01-01T00:00:00Z",
      "energy_price": 0.12
    }
  ],
  "horizon": 288,  // Number of intervals to forecast
  "interval_minutes": 5,  // Interval size in minutes
  "confidence_levels": [80, 95]
}
```

Response:
```json
{
  "forecasts": [
    {
      "timestamp": "2024-01-01T00:05:00Z",
      "energy_forecast": 0.123,
      "energy_forecast_lo_80": 0.110,
      "energy_forecast_hi_80": 0.136,
      "energy_forecast_lo_95": 0.105,
      "energy_forecast_hi_95": 0.141
    }
  ],
  "analysis": "TimeGPT 24.0-hour forecast: Mean $0.1234/kWh, Range $0.0987-$0.1456/kWh",
  "arbitrage_opportunities": 5,
  "model": "TimeGPT",
  "statistics": {
    "mean": 0.1234,
    "min": 0.0987,
    "max": 0.1456,
    "std": 0.0123
  },
  "interval_minutes": 5
}
```

### 2. Anomaly Detection
**POST** `/api/timegpt/anomaly-detection`

Request body:
```json
{
  "market_data": [
    {
      "timestamp": "2024-01-01T00:00:00Z",
      "energy_price": 0.12
    }
  ]
}
```

Response:
```json
{
  "anomalies": [
    {
      "timestamp": "2024-01-01T12:00:00Z",
      "value": 0.25,
      "anomaly_score": 1.0
    }
  ],
  "total_anomalies": 3,
  "anomaly_rate": 0.025
}
```

## Running without Jupyter Notebooks

This backend replaces the need for Jupyter notebooks by:
1. Directly executing TimeGPT Python code via REST API
2. Handling data preparation and formatting automatically
3. Providing fallback synthetic forecasts when TimeGPT is unavailable
4. Supporting configurable forecast intervals (5-minute default)

The frontend automatically uses this backend when available, falling back to local generation if the backend is not running.

## Development

- The backend auto-reloads on code changes
- Logs are printed to the console
- FastAPI provides automatic API documentation at http://localhost:8000/docs 