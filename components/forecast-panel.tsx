'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Sparkles, TrendingUp, Activity, Clock } from 'lucide-react';

interface MarketData {
  timestamp: string;
  energy_price: number;
  hash_price: number;
  token_price: number;
}

interface TimeGPTForecast {
  timestamp: string;
  TimeGPT: number;
  'TimeGPT-lo-80': number;
  'TimeGPT-hi-80': number;
  'TimeGPT-lo-95': number;
  'TimeGPT-hi-95': number;
}

interface ForecastPanelProps {
  marketData: MarketData[];
  onStatusUpdate: (status: any) => void;
}

export function ForecastPanel({ marketData, onStatusUpdate }: ForecastPanelProps) {
  const [forecasts, setForecasts] = useState<TimeGPTForecast[]>([]);
  const [selectedHorizon, setSelectedHorizon] = useState('24');
  const [isForecasting, setIsForecasting] = useState(false);
  const [lastForecastTime, setLastForecastTime] = useState<Date | null>(null);

  const generateTimeGPTForecast = async () => {
    setIsForecasting(true);
    try {
      const response = await fetch('/api/forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marketData: marketData.slice(0, 168), // Last week of data
          horizon: parseInt(selectedHorizon)
        }),
      });

      const result = await response.json();
      
      // Convert to TimeGPT format
      const timeGPTForecasts: TimeGPTForecast[] = result.forecasts?.map((f: any) => ({
        timestamp: f.timestamp,
        TimeGPT: f.energy_forecast,
        'TimeGPT-lo-80': f.energy_forecast_lo_80,
        'TimeGPT-hi-80': f.energy_forecast_hi_80,
        'TimeGPT-lo-95': f.energy_forecast_lo_95,
        'TimeGPT-hi-95': f.energy_forecast_hi_95
      })) || [];

      setForecasts(timeGPTForecasts);
      setLastForecastTime(new Date());
      
      onStatusUpdate((prev: any) => ({
        ...prev,
        arbitrage_opportunities: timeGPTForecasts.length
      }));

    } catch (error) {
      console.error('Error generating TimeGPT forecast:', error);
    } finally {
      setIsForecasting(false);
    }
  };

  // Create comprehensive timeline: Historical (Past) + Forecast (Future)
  const timelineData = (() => {
    const now = new Date();
    
    // Get comprehensive historical data (last 72 hours for context)
    const historicalHours = 72;
    const historicalData = marketData.slice(0, historicalHours).map(data => {
      const dataTime = new Date(data.timestamp);
      return {
        time: dataTime.toLocaleString(undefined, { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit'
        }),
        fullTime: dataTime.toLocaleString(),
        actualTime: dataTime,
        Historical: data.energy_price,
        TimeGPT: null,
        'TimeGPT-lo-80': null,
        'TimeGPT-hi-80': null,
        'TimeGPT-lo-95': null,
        'TimeGPT-hi-95': null,
        isPast: dataTime < now,
        isFuture: false,
        isNow: Math.abs(dataTime.getTime() - now.getTime()) < 30 * 60 * 1000 // Within 30 minutes
      };
    }).reverse(); // Reverse to get chronological order

    // Add forecast data (future)
    const forecastData = forecasts.map(forecast => {
      const forecastTime = new Date(forecast.timestamp);
      return {
        time: forecastTime.toLocaleString(undefined, { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit'
        }),
        fullTime: forecastTime.toLocaleString(),
        actualTime: forecastTime,
        Historical: null,
        TimeGPT: forecast.TimeGPT,
        'TimeGPT-lo-80': forecast['TimeGPT-lo-80'],
        'TimeGPT-hi-80': forecast['TimeGPT-hi-80'],
        'TimeGPT-lo-95': forecast['TimeGPT-lo-95'],
        'TimeGPT-hi-95': forecast['TimeGPT-hi-95'],
        isPast: false,
        isFuture: forecastTime > now,
        isNow: false
      };
    });

    // Combine and sort by time
    const combined = [...historicalData, ...forecastData].sort((a, b) => 
      a.actualTime.getTime() - b.actualTime.getTime()
    );

    return combined;
  })();

  // Calculate statistics
  const stats = (() => {
    if (forecasts.length === 0) return null;

    const currentPrice = marketData[0]?.energy_price || 0;
    const forecastPrices = forecasts.map(f => f.TimeGPT);
    const meanForecast = forecastPrices.reduce((sum, p) => sum + p, 0) / forecastPrices.length;
    const minForecast = Math.min(...forecastPrices);
    const maxForecast = Math.max(...forecastPrices);
    
    // Calculate volatility
    const variance = forecastPrices.reduce((sum, p) => sum + Math.pow(p - meanForecast, 2), 0) / forecastPrices.length;
    const volatility = Math.sqrt(variance);

    return {
      current: currentPrice,
      mean: meanForecast,
      min: minForecast,
      max: maxForecast,
      volatility,
      change: meanForecast - currentPrice,
      changePercent: ((meanForecast - currentPrice) / currentPrice) * 100
    };
  })();

  return (
    <div className="space-y-4">
      {/* TimeGPT Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            TimeGPT Forecasting
          </CardTitle>
          <CardDescription>
            Generate AI-powered predictions with historical context
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Horizon:</label>
              <Select value={selectedHorizon} onValueChange={setSelectedHorizon}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12h</SelectItem>
                  <SelectItem value="24">24h</SelectItem>
                  <SelectItem value="48">48h</SelectItem>
                  <SelectItem value="72">72h</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={generateTimeGPTForecast}
              disabled={isForecasting || marketData.length === 0}
              size="sm"
            >
              {isForecasting ? 'Forecasting...' : 'Generate Forecast'}
            </Button>
          </div>
          
          {lastForecastTime && (
            <div className="flex items-center gap-2 text-xs text-green-600">
              <Activity className="h-3 w-3" />
              <span>Last: {lastForecastTime.toLocaleString()}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Timeline Chart: Past + Future */}
      {timelineData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Energy Price Timeline: Historical + Forecast
            </CardTitle>
            <CardDescription>
              {timelineData.filter(d => d.isPast).length} hours historical data + {forecasts.length}h forecast
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    fontSize={11}
                  />
                  <YAxis 
                    label={{ value: 'Price ($/kWh)', angle: -90, position: 'insideLeft' }}
                    fontSize={11}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      value ? `$${Number(value).toFixed(4)}` : 'N/A',
                      name
                    ]}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0] && payload[0].payload.fullTime) {
                        const point = payload[0].payload;
                        const timeType = point.isPast ? '📈 Historical' : point.isFuture ? '🔮 Forecast' : '⏰ Now';
                        return `${timeType}: ${payload[0].payload.fullTime}`;
                      }
                      return `Time: ${label}`;
                    }}
                  />
                  <Legend />
                  
                  {/* 95% Confidence Interval */}
                  <Area
                    type="monotone"
                    dataKey="TimeGPT-hi-95"
                    stroke="none"
                    fill="#ef4444"
                    fillOpacity={0.1}
                    connectNulls={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="TimeGPT-lo-95"
                    stroke="none"
                    fill="white"
                    fillOpacity={1}
                    connectNulls={false}
                  />
                  
                  {/* 80% Confidence Interval */}
                  <Area
                    type="monotone"
                    dataKey="TimeGPT-hi-80"
                    stroke="none"
                    fill="#ef4444"
                    fillOpacity={0.2}
                    connectNulls={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="TimeGPT-lo-80"
                    stroke="none"
                    fill="white"
                    fillOpacity={1}
                    connectNulls={false}
                  />

                  {/* Historical Data */}
                  <Line 
                    type="monotone" 
                    dataKey="Historical" 
                    stroke="#1f2937" 
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                    name="📈 Historical Data"
                  />

                  {/* TimeGPT Forecast */}
                  <Line 
                    type="monotone" 
                    dataKey="TimeGPT" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={false}
                    connectNulls={false}
                    name="🔮 TimeGPT Forecast"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Forecast Summary & Trading Insights */}
      {forecasts.length > 0 && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Price Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">📊 Price Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Current</p>
                  <p className="font-bold">${stats.current.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Avg Forecast</p>
                  <p className="font-bold">${stats.mean.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Min Expected</p>
                  <p className="font-bold text-green-600">${stats.min.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Max Expected</p>
                  <p className="font-bold text-red-600">${stats.max.toFixed(4)}</p>
                </div>
              </div>
              <div className="pt-2 border-t">
                <p className="text-gray-600 text-sm">Expected Change</p>
                <p className={`font-bold ${stats.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.change >= 0 ? '+' : ''}${stats.change.toFixed(4)} ({stats.changePercent >= 0 ? '+' : ''}{stats.changePercent.toFixed(1)}%)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Trading Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">⚡ Trading Windows</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* Best time to mine (cheapest) */}
                <div className="text-sm">
                  <p className="text-green-700 font-medium">🟢 Best Mining Time:</p>
                  {(() => {
                    const cheapest = forecasts.reduce((min, f) => f.TimeGPT < min.TimeGPT ? f : min);
                    return (
                      <p className="text-xs text-gray-600">
                        {new Date(cheapest.timestamp).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })} at ${cheapest.TimeGPT.toFixed(4)}/kWh
                      </p>
                    );
                  })()}
                </div>
                
                {/* Worst time to mine (most expensive) */}
                <div className="text-sm">
                  <p className="text-red-700 font-medium">🔴 Avoid Mining:</p>
                  {(() => {
                    const expensive = forecasts.reduce((max, f) => f.TimeGPT > max.TimeGPT ? f : max);
                    return (
                      <p className="text-xs text-gray-600">
                        {new Date(expensive.timestamp).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })} at ${expensive.TimeGPT.toFixed(4)}/kWh
                      </p>
                    );
                  })()}
                </div>

                <div className="pt-2 border-t text-sm">
                  <p className="text-gray-600">Volatility: ${stats.volatility.toFixed(4)}/kWh</p>
                  <p className="text-gray-600">{selectedHorizon}h Arbitrage Opportunities: {forecasts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No Forecast State */}
      {forecasts.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Sparkles className="h-8 w-8 mx-auto text-gray-400 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Generate TimeGPT Forecast</h3>
            <p className="text-sm text-gray-600 mb-3">
              See past trends and future predictions in one timeline
            </p>
            <p className="text-xs text-gray-500">
              Historical context + AI-powered forecasts with confidence intervals
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}