'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, AlertTriangle, Activity, Zap, BarChart3 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useEffect, useState } from 'react';

interface ForecastData {
  timestamp: string;
  energy_forecast: number;
  energy_price?: number;
  is_historical?: boolean;
  energy_forecast_lo_80?: number;
  energy_forecast_hi_80?: number;
  energy_forecast_lo_95?: number;
  energy_forecast_hi_95?: number;
  energy_price_lo_80?: number;
  energy_price_hi_80?: number;
  energy_price_lo_95?: number;
  energy_price_hi_95?: number;
  hash_price?: number;
  token_price?: number;
  hash_price_lo_80?: number;
  hash_price_hi_80?: number;
  hash_price_lo_95?: number;
  hash_price_hi_95?: number;
  hash_forecast_lo_80?: number;
  hash_forecast_hi_80?: number;
  hash_forecast_lo_95?: number;
  hash_forecast_hi_95?: number;
  token_price_lo_80?: number;
  token_price_hi_80?: number;
  token_price_lo_95?: number;
  token_price_hi_95?: number;
  token_forecast_lo_80?: number;
  token_forecast_hi_80?: number;
  token_forecast_lo_95?: number;
  token_forecast_hi_95?: number;
}

interface MarketData {
  timestamp: string;
  energy_price: number;
  [key: string]: any;
}

interface ForecastPanelProps {
  marketData: MarketData[];
  onForecastUpdate?: (forecast: any) => void;
}

type TimeWindow = '5min' | '1hour' | '1day' | '1week';

export function ForecastPanel({ marketData, onForecastUpdate }: ForecastPanelProps) {
  const [forecasts, setForecasts] = useState<ForecastData[]>([]);
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [arbitrageCount, setArbitrageCount] = useState(0);
  const [model, setModel] = useState<string>('TimeGPT');
  const [statistics, setStatistics] = useState<any>(null);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('1day');

  useEffect(() => {
    const generateForecast = async () => {
      if (marketData.length === 0) return;
      
      setIsLoading(true);
      try {
        const response = await fetch('/api/forecast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            marketData, 
            horizon: 288, // 24 hours in 5-minute intervals
            intervalMinutes: 5 
          }),
        });

        const data = await response.json();
        setForecasts(data.forecasts || []);
        setAnalysis(data.analysis || '');
        setArbitrageCount(data.arbitrage_opportunities || 0);
        setModel(data.model || 'TimeGPT');
        setStatistics(data.statistics || null);
        
        if (onForecastUpdate) {
          onForecastUpdate(data);
        }
      } catch (error) {
        console.error('Failed to generate forecast:', error);
      } finally {
        setIsLoading(false);
      }
    };

    generateForecast();
  }, [marketData, onForecastUpdate]);

  // Get filtered data based on time window
  const getFilteredData = () => {
    const now = new Date();
    let cutoffTime: Date;
    let historicalPoints: number;
    let forecastPoints: number;

    switch (timeWindow) {
      case '5min':
        // Show last 5 minutes of history + 5 minutes of forecast
        cutoffTime = new Date(now.getTime() - 5 * 60 * 1000);
        historicalPoints = 1;
        forecastPoints = 1;
        break;
      case '1hour':
        // Show last hour of history + 1 hour of forecast
        cutoffTime = new Date(now.getTime() - 60 * 60 * 1000);
        historicalPoints = 12;
        forecastPoints = 12;
        break;
      case '1day':
        // Show last 6 hours of history + 24 hours of forecast
        cutoffTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        historicalPoints = 72;
        forecastPoints = 288;
        break;
      case '1week':
        // Show last day of history + forecast
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        historicalPoints = 288;
        forecastPoints = 288;
        break;
      default:
        cutoffTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        historicalPoints = 72;
        forecastPoints = 288;
    }

    // Filter forecast data
    const filteredForecasts = forecasts.filter(data => {
      const date = new Date(data.timestamp);
      if (data.is_historical) {
        return date >= cutoffTime;
      } else {
        // For forecast data, limit by number of points
        const forecastStartIndex = forecasts.findIndex(f => !f.is_historical);
        const currentIndex = forecasts.indexOf(data);
        return currentIndex < forecastStartIndex + forecastPoints;
      }
    });

    return filteredForecasts;
  };

  // Combine historical data with forecasts for visualization
  const chartData = () => {
    // Debug: Check what data we have
    console.log('Raw forecast data:', forecasts);
    
    if (forecasts.length === 0) {
      return [];
    }
    
    const filteredData = getFilteredData();
    
    // Transform the forecast data to chart format
    return filteredData.map(item => {
      const isHistorical = item.is_historical || false;
      
      return {
        timestamp: item.timestamp,
        // Main data lines
        energy_historical: isHistorical ? item.energy_price : null,
        hash_historical: isHistorical ? item.hash_price : null,
        token_historical: isHistorical ? item.token_price : null,
        energy_forecast: !isHistorical ? item.energy_price : null,
        hash_forecast: !isHistorical ? item.hash_price : null,
        token_forecast: !isHistorical ? item.token_price : null,
        
        // Forecast confidence intervals as absolute values
        energy_forecast_lo_80: !isHistorical ? item.energy_price_lo_80 : null,
        energy_forecast_hi_80: !isHistorical ? item.energy_price_hi_80 : null,
        energy_forecast_lo_95: !isHistorical ? item.energy_price_lo_95 : null,
        energy_forecast_hi_95: !isHistorical ? item.energy_price_hi_95 : null,
        
        hash_forecast_lo_80: !isHistorical ? item.hash_price_lo_80 : null,
        hash_forecast_hi_80: !isHistorical ? item.hash_price_hi_80 : null,
        hash_forecast_lo_95: !isHistorical ? item.hash_price_lo_95 : null,
        hash_forecast_hi_95: !isHistorical ? item.hash_price_hi_95 : null,
        
        token_forecast_lo_80: !isHistorical ? item.token_price_lo_80 : null,
        token_forecast_hi_80: !isHistorical ? item.token_price_hi_80 : null,
        token_forecast_lo_95: !isHistorical ? item.token_price_lo_95 : null,
        token_forecast_hi_95: !isHistorical ? item.token_price_hi_95 : null,
        
        // Band widths for proper rendering
        energy_band_95: !isHistorical && item.energy_price_lo_95 && item.energy_price_hi_95 
          ? item.energy_price_hi_95 - item.energy_price_lo_95 : null,
        energy_band_80: !isHistorical && item.energy_price_lo_80 && item.energy_price_hi_80
          ? item.energy_price_hi_80 - item.energy_price_lo_80 : null,
          
        hash_band_95: !isHistorical && item.hash_price_lo_95 && item.hash_price_hi_95
          ? item.hash_price_hi_95 - item.hash_price_lo_95 : null,
        hash_band_80: !isHistorical && item.hash_price_lo_80 && item.hash_price_hi_80
          ? item.hash_price_hi_80 - item.hash_price_lo_80 : null,
          
        token_band_95: !isHistorical && item.token_price_lo_95 && item.token_price_hi_95
          ? item.token_price_hi_95 - item.token_price_lo_95 : null,
        token_band_80: !isHistorical && item.token_price_lo_80 && item.token_price_hi_80
          ? item.token_price_hi_80 - item.token_price_lo_80 : null,
      };
    });
  };

  const formatXAxis = (timestamp: string) => {
    const date = new Date(timestamp);
    
    switch (timeWindow) {
      case '5min':
        return date.toLocaleString('en-US', {
          timeZone: 'America/Los_Angeles',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
      case '1hour':
        return date.toLocaleString('en-US', {
          timeZone: 'America/Los_Angeles',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      case '1day':
        return date.toLocaleString('en-US', {
          timeZone: 'America/Los_Angeles',
          hour: '2-digit',
          hour12: false
        });
      case '1week':
        return date.toLocaleString('en-US', {
          timeZone: 'America/Los_Angeles',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          hour12: false
        });
      default:
        return date.toLocaleString('en-US', {
          timeZone: 'America/Los_Angeles',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      
      // Convert to Pacific Time for tooltip
      const pacificDateTime = date.toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      // Check if we have historical or forecast data
      const hasHistorical = payload.some((p: any) => 
        p.dataKey.includes('historical') && p.value !== null
      );
      const hasForecast = payload.some((p: any) => 
        p.dataKey.includes('forecast') && !p.dataKey.includes('lo') && !p.dataKey.includes('hi') && p.value !== null
      );
      
      return (
        <div className="glass rounded-xl p-5 shadow-2xl border border-white/20 backdrop-blur-xl">
          <p className="text-sm text-muted-foreground mb-3 font-medium">
            {pacificDateTime} PST
          </p>
          
          {/* Show historical prices */}
          {hasHistorical && (
            <div className="mb-3">
              <p className="text-xs text-gray-400 uppercase mb-1">Historical</p>
              {payload.filter((p: any) => p.dataKey.includes('historical') && p.value !== null).map((pld: any) => (
                <div key={pld.dataKey} className="text-sm mb-1 flex justify-between gap-4">
                  <span style={{ color: pld.color }} className="font-medium">
                    {pld.dataKey.includes('energy') ? 'Energy' : 
                     pld.dataKey.includes('hash') ? 'Hash' : 'Token'}:
                  </span>
                  <span className="font-bold text-foreground">${pld.value?.toFixed(4)}/kWh</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Show forecast data */}
          {hasForecast && (
            <div>
              <p className="text-xs text-gray-400 uppercase mb-1">Forecast</p>
              {/* Energy Forecast */}
              {payload.filter((p: any) => 
                p.dataKey === 'energy_forecast' && p.value !== null
              ).map((pld: any) => (
                <div key={pld.dataKey} className="mb-3">
                  <div className="text-sm mb-1 flex justify-between gap-4">
                    <span className="font-medium text-red-400">Energy:</span>
                    <span className="font-bold text-foreground">${pld.value?.toFixed(4)}/kWh</span>
                  </div>
                  {pld.payload.energy_forecast_lo_80 && (
                    <>
                      <div className="text-xs text-gray-400">
                        80% CI: ${pld.payload.energy_forecast_lo_80?.toFixed(4)} - ${pld.payload.energy_forecast_hi_80?.toFixed(4)}
                      </div>
                      <div className="text-xs text-gray-400">
                        95% CI: ${pld.payload.energy_forecast_lo_95?.toFixed(4)} - ${pld.payload.energy_forecast_hi_95?.toFixed(4)}
                      </div>
                    </>
                  )}
                </div>
              ))}
              {/* Hash Forecast */}
              {payload.filter((p: any) => 
                p.dataKey === 'hash_forecast' && p.value !== null
              ).map((pld: any) => (
                <div key={pld.dataKey} className="mb-3">
                  <div className="text-sm mb-1 flex justify-between gap-4">
                    <span className="font-medium text-blue-400">Hash:</span>
                    <span className="font-bold text-foreground">${pld.value?.toFixed(4)}/kWh</span>
                  </div>
                  {pld.payload.hash_forecast_lo_80 && (
                    <>
                      <div className="text-xs text-gray-400">
                        80% CI: ${pld.payload.hash_forecast_lo_80?.toFixed(4)} - ${pld.payload.hash_forecast_hi_80?.toFixed(4)}
                      </div>
                      <div className="text-xs text-gray-400">
                        95% CI: ${pld.payload.hash_forecast_lo_95?.toFixed(4)} - ${pld.payload.hash_forecast_hi_95?.toFixed(4)}
                      </div>
                    </>
                  )}
                </div>
              ))}
              {/* Token Forecast */}
              {payload.filter((p: any) => 
                p.dataKey === 'token_forecast' && p.value !== null
              ).map((pld: any) => (
                <div key={pld.dataKey}>
                  <div className="text-sm mb-1 flex justify-between gap-4">
                    <span className="font-medium text-emerald-400">Token:</span>
                    <span className="font-bold text-foreground">${pld.value?.toFixed(4)}/kWh</span>
                  </div>
                  {pld.payload.token_forecast_lo_80 && (
                    <>
                      <div className="text-xs text-gray-400">
                        80% CI: ${pld.payload.token_forecast_lo_80?.toFixed(4)} - ${pld.payload.token_forecast_hi_80?.toFixed(4)}
                      </div>
                      <div className="text-xs text-gray-400">
                        95% CI: ${pld.payload.token_forecast_lo_95?.toFixed(4)} - ${pld.payload.token_forecast_hi_95?.toFixed(4)}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const currentPrice = marketData[0]?.energy_price || 0;
  
  // Fix avgForecast calculation to only include forecast data
  const avgForecast = forecasts.length > 0 
    ? forecasts
        .filter(f => !f.is_historical)
        .reduce((sum, f) => sum + (f.energy_price || f.energy_forecast || 0), 0) / 
        forecasts.filter(f => !f.is_historical).length || 0
    : 0;
    
  const priceChange = avgForecast - currentPrice;
  const priceChangePercent = currentPrice > 0 ? (priceChange / currentPrice) * 100 : 0;

  // Add debug logging
  console.log('Forecast data sample:', forecasts.slice(0, 5));
  console.log('Chart data sample:', chartData().slice(0, 5));

  return (
    <div className="w-full space-y-6">
      {/* Main Forecast Chart - Matching Real-time Market Analytics Style */}
      <Card className="overflow-hidden gradient-border backdrop-blur-xl bg-card/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">AI Predictions - TimeGPT</CardTitle>
              <CardDescription className="text-base mt-1">
                {analysis || "Generating TimeGPT forecast with confidence intervals..."}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              {/* Time Window Controls */}
              <div className="flex items-center gap-2 bg-muted/20 p-1 rounded-lg">
                <Button
                  variant={timeWindow === '5min' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimeWindow('5min')}
                  className="h-8 px-3"
                >
                  5m
                </Button>
                <Button
                  variant={timeWindow === '1hour' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimeWindow('1hour')}
                  className="h-8 px-3"
                >
                  1h
                </Button>
                <Button
                  variant={timeWindow === '1day' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimeWindow('1day')}
                  className="h-8 px-3"
                >
                  1d
                </Button>
                <Button
                  variant={timeWindow === '1week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimeWindow('1week')}
                  className="h-8 px-3"
                >
                  1w
                </Button>
              </div>
              
              {/* Legend */}
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm text-muted-foreground">Energy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-muted-foreground">Hash</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-sm text-muted-foreground">Token</span>
                </div>
              </div>
              
              {arbitrageCount > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {arbitrageCount} Opportunities
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 px-6 pb-6">
          <div className="h-[600px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData()} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <defs>
                  {/* Gradients for historical data */}
                  <linearGradient id="energyHistoricalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="hashHistoricalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="tokenHistoricalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  
                  {/* Gradient for energy forecast */}
                  <linearGradient id="energyForecastGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                  </linearGradient>
                  
                  {/* Gradient for confidence intervals - Energy */}
                  <linearGradient id="energyCi95Gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15}/>
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05}/>
                  </linearGradient>
                  
                  <linearGradient id="energyCi80Gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.25}/>
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.1}/>
                  </linearGradient>
                  
                  {/* Gradient for confidence intervals - Hash */}
                  <linearGradient id="hashCi95Gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15}/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05}/>
                  </linearGradient>
                  
                  <linearGradient id="hashCi80Gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25}/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                  
                  {/* Gradient for confidence intervals - Token */}
                  <linearGradient id="tokenCi95Gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.05}/>
                  </linearGradient>
                  
                  <linearGradient id="tokenCi80Gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#374151" 
                  opacity={0.1} 
                  vertical={false}
                />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatXAxis}
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#374151' }}
                  interval={timeWindow === '1week' ? 'preserveStartEnd' : 'preserveEnd'}
                  angle={timeWindow === '1week' || timeWindow === '1day' ? -45 : 0}
                  textAnchor={timeWindow === '1week' || timeWindow === '1day' ? "end" : "middle"}
                  height={timeWindow === '1week' || timeWindow === '1day' ? 60 : 40}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#374151' }}
                  tickFormatter={(value) => `$${value.toFixed(2)}`}
                  domain={['dataMin * 0.9', 'dataMax * 1.1']}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Forecast Confidence Intervals as bands (rendered first so they appear behind) */}
                {/* Energy Confidence Bands */}
                <Area
                  type="monotone"
                  dataKey="energy_forecast_lo_95"
                  stackId="energy"
                  stroke="none"
                  fill="none"
                  connectNulls={false}
                />
                <Area
                  type="monotone"
                  dataKey="energy_band_95"
                  stackId="energy"
                  stroke="none"
                  fill="url(#energyCi95Gradient)"
                  connectNulls={false}
                />
                
                {/* Re-render lower bound for 80% CI */}
                <Area
                  type="monotone"
                  dataKey="energy_forecast_lo_80"
                  stackId="energy2"
                  stroke="none"
                  fill="none"
                  connectNulls={false}
                />
                <Area
                  type="monotone"
                  dataKey="energy_band_80"
                  stackId="energy2"
                  stroke="none"
                  fill="url(#energyCi80Gradient)"
                  connectNulls={false}
                />
                
                {/* Hash Confidence Bands */}
                <Area
                  type="monotone"
                  dataKey="hash_forecast_lo_95"
                  stackId="hash"
                  stroke="none"
                  fill="none"
                  connectNulls={false}
                />
                <Area
                  type="monotone"
                  dataKey="hash_band_95"
                  stackId="hash"
                  stroke="none"
                  fill="url(#hashCi95Gradient)"
                  connectNulls={false}
                />
                
                <Area
                  type="monotone"
                  dataKey="hash_forecast_lo_80"
                  stackId="hash2"
                  stroke="none"
                  fill="none"
                  connectNulls={false}
                />
                <Area
                  type="monotone"
                  dataKey="hash_band_80"
                  stackId="hash2"
                  stroke="none"
                  fill="url(#hashCi80Gradient)"
                  connectNulls={false}
                />
                
                {/* Token Confidence Bands */}
                <Area
                  type="monotone"
                  dataKey="token_forecast_lo_95"
                  stackId="token"
                  stroke="none"
                  fill="none"
                  connectNulls={false}
                />
                <Area
                  type="monotone"
                  dataKey="token_band_95"
                  stackId="token"
                  stroke="none"
                  fill="url(#tokenCi95Gradient)"
                  connectNulls={false}
                />
                
                <Area
                  type="monotone"
                  dataKey="token_forecast_lo_80"
                  stackId="token2"
                  stroke="none"
                  fill="none"
                  connectNulls={false}
                />
                <Area
                  type="monotone"
                  dataKey="token_band_80"
                  stackId="token2"
                  stroke="none"
                  fill="url(#tokenCi80Gradient)"
                  connectNulls={false}
                />
                
                {/* Historical Data - All three lines (without confidence intervals) */}
                <Area
                  type="monotone"
                  dataKey="energy_historical"
                  stroke="#ef4444"
                  strokeWidth={3}
                  fill="url(#energyHistoricalGradient)"
                  fillOpacity={1}
                  connectNulls={false}
                  name="Energy Historical"
                />
                
                <Area
                  type="monotone"
                  dataKey="hash_historical"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#hashHistoricalGradient)"
                  fillOpacity={1}
                  connectNulls={false}
                  name="Hash Historical"
                />
                
                <Area
                  type="monotone"
                  dataKey="token_historical"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#tokenHistoricalGradient)"
                  fillOpacity={1}
                  connectNulls={false}
                  name="Token Historical"
                />
                
                {/* Energy Forecast Line */}
                <Area
                  type="monotone"
                  dataKey="energy_forecast"
                  stroke="#ef4444"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  fill="none"
                  connectNulls={false}
                  name="Energy Forecast"
                />
                
                {/* Hash Forecast Line */}
                <Area
                  type="monotone"
                  dataKey="hash_forecast"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  fill="none"
                  connectNulls={false}
                  name="Hash Forecast"
                />
                
                {/* Token Forecast Line */}
                <Area
                  type="monotone"
                  dataKey="token_forecast"
                  stroke="#10b981"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  fill="none"
                  connectNulls={false}
                  name="Token Forecast"
                />
                
                {/* Vertical line at forecast start */}
                {marketData.length > 0 && (
                  <ReferenceLine 
                    x={marketData[0].timestamp} 
                    stroke="#10B981" 
                    strokeDasharray="3 3"
                    label={{ value: "Now", position: "top", fill: "#10B981", fontSize: 12 }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards - Matching style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="group hover-card overflow-hidden gradient-border">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Forecast</CardTitle>
            <Activity className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums">
              ${avgForecast.toFixed(4)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Next 24 hours
            </p>
          </CardContent>
        </Card>

        <Card className="group hover-card overflow-hidden gradient-border">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Price Change</CardTitle>
            {priceChange >= 0 ? (
              <TrendingUp className="w-4 h-4 text-red-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-green-400" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold tabular-nums ${priceChange >= 0 ? 'text-red-400' : 'text-green-400'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              From current
            </p>
          </CardContent>
        </Card>

        <Card className="group hover-card overflow-hidden gradient-border">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Volatility</CardTitle>
            <BarChart3 className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums">
              {statistics?.std ? `±${(statistics.std * 100).toFixed(1)}%` : '±0.0%'}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Standard deviation
            </p>
          </CardContent>
        </Card>

        <Card className="group hover-card overflow-hidden gradient-border">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Opportunities</CardTitle>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums text-amber-400">
              {arbitrageCount}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Arbitrage detected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Summary - Matching style */}
      {statistics && (
        <Card className="overflow-hidden gradient-border backdrop-blur-xl bg-card/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">📊 Forecast Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Mean Price:</span>
                <span className="text-foreground ml-2 font-medium">${statistics.mean?.toFixed(4)}/kWh</span>
              </div>
              <div>
                <span className="text-muted-foreground">Min Price:</span>
                <span className="text-green-400 ml-2 font-medium">${statistics.min?.toFixed(4)}/kWh</span>
              </div>
              <div>
                <span className="text-muted-foreground">Max Price:</span>
                <span className="text-red-400 ml-2 font-medium">${statistics.max?.toFixed(4)}/kWh</span>
              </div>
              <div>
                <span className="text-muted-foreground">Std Dev:</span>
                <span className="text-blue-400 ml-2 font-medium">${statistics.std?.toFixed(4)}/kWh</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 