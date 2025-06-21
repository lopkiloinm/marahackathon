'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MarketData {
  timestamp: string;
  energy_price: number;
  hash_price: number;
  token_price: number;
}

interface PricingDashboardProps {
  marketData: MarketData[];
  currentPrices: MarketData | null;
  loading: boolean;
}

type TimeWindow = '5min' | '1hour' | '1day' | '1week';

export function PricingDashboard({ marketData, currentPrices, loading }: PricingDashboardProps) {
  const [priceChanges, setPriceChanges] = useState({
    energy: 0,
    hash: 0,
    token: 0
  });
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('1hour');

  useEffect(() => {
    if (marketData.length >= 2) {
      const current = marketData[0];
      const previous = marketData[1];
      
      setPriceChanges({
        energy: ((current.energy_price - previous.energy_price) / previous.energy_price) * 100,
        hash: ((current.hash_price - previous.hash_price) / previous.hash_price) * 100,
        token: ((current.token_price - previous.token_price) / previous.token_price) * 100
      });
    }
  }, [marketData]);

  const getTrendIcon = (change: number) => {
    if (change > 0.1) return <TrendingUp className="h-4 w-4 text-emerald-400" />;
    if (change < -0.1) return <TrendingDown className="h-4 w-4 text-red-400" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0.1) return 'text-emerald-400';
    if (change < -0.1) return 'text-red-400';
    return 'text-muted-foreground';
  };

  // Get filtered data based on time window
  const getFilteredData = () => {
    const now = new Date();
    let cutoffTime: Date;
    let dataPoints: number;

    switch (timeWindow) {
      case '5min':
        // Show last 5 minutes (1 data point per 5 min interval)
        cutoffTime = new Date(now.getTime() - 5 * 60 * 1000);
        dataPoints = 1;
        break;
      case '1hour':
        // Show last hour (12 data points - 5 min intervals)
        cutoffTime = new Date(now.getTime() - 60 * 60 * 1000);
        dataPoints = 12;
        break;
      case '1day':
        // Show last 24 hours (288 data points - 5 min intervals)
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        dataPoints = 288;
        break;
      case '1week':
        // Show last 7 days (2016 data points - 5 min intervals)
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dataPoints = 2016;
        break;
      default:
        cutoffTime = new Date(now.getTime() - 60 * 60 * 1000);
        dataPoints = 100;
    }

    // Filter data by time and limit number of points
    return marketData
      .filter(data => new Date(data.timestamp) >= cutoffTime)
      .slice(0, Math.min(dataPoints, marketData.length));
  };

  // Format X-axis based on time window
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
          day: 'numeric'
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

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton for chart */}
        <Card className="animate-pulse glass h-[600px]">
          <CardHeader>
            <div className="h-6 bg-muted/30 rounded w-1/3"></div>
            <div className="h-4 bg-muted/30 rounded w-1/2 mt-2"></div>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] bg-muted/20 rounded"></div>
          </CardContent>
        </Card>
        
        {/* Loading skeleton for price cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse glass">
              <CardHeader>
                <div className="h-4 bg-muted/30 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted/30 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const filteredData = getFilteredData();
  const chartData = filteredData.reverse().map(data => ({
    time: formatXAxis(data.timestamp),
    timestamp: data.timestamp,
    energy: data.energy_price,
    hash: data.hash_price,
    token: data.token_price
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Find the original timestamp from the payload
      const timestamp = payload[0]?.payload?.timestamp;
      const date = timestamp ? new Date(timestamp) : new Date();
      
      // Convert to Pacific Time
      const pacificDateTime = date.toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      return (
        <div className="glass rounded-xl p-5 shadow-2xl border border-white/20 backdrop-blur-xl">
          <p className="text-sm text-muted-foreground mb-3 font-medium">{pacificDateTime} PST</p>
          {payload.map((pld: any) => (
            <div key={pld.dataKey} className="text-sm mb-1 flex justify-between gap-4">
              <span style={{ color: pld.color }} className="font-medium">{pld.name}:</span>
              <span className="font-bold text-foreground">${pld.value.toFixed(4)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Main Price Chart - Now Much Larger */}
      <Card className="overflow-hidden gradient-border backdrop-blur-xl bg-card/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Real-time Market Analytics</CardTitle>
              <CardDescription className="text-base mt-1">
                Live pricing data from energy and inference markets - {filteredData.length} data points
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
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 px-6 pb-6">
          <div className="h-[600px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="hashGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#374151" 
                  opacity={0.1} 
                  vertical={false}
                />
                <XAxis 
                  dataKey="time" 
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
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="energy"
                  stroke="#ef4444"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#energyGradient)"
                  name="Energy Price"
                />
                <Area
                  type="monotone"
                  dataKey="hash"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#hashGradient)"
                  name="Hash Price"
                />
                <Area
                  type="monotone"
                  dataKey="token"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#tokenGradient)"
                  name="Token Price"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Current Prices - Now Below the Chart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="group hover-card overflow-hidden gradient-border">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Energy Price</CardTitle>
            {getTrendIcon(priceChanges.energy)}
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums">
              ${currentPrices?.energy_price.toFixed(4) || '0.0000'}
            </div>
            <p className={`text-sm ${getTrendColor(priceChanges.energy)} mt-2`}>
              {priceChanges.energy > 0 ? '+' : ''}{priceChanges.energy.toFixed(2)}% from last update
            </p>
          </CardContent>
        </Card>

        <Card className="group hover-card overflow-hidden gradient-border">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hash Price</CardTitle>
            {getTrendIcon(priceChanges.hash)}
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums">
              ${currentPrices?.hash_price.toFixed(4) || '0.0000'}
            </div>
            <p className={`text-sm ${getTrendColor(priceChanges.hash)} mt-2`}>
              {priceChanges.hash > 0 ? '+' : ''}{priceChanges.hash.toFixed(2)}% from last update
            </p>
          </CardContent>
        </Card>

        <Card className="group hover-card overflow-hidden gradient-border">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Token Price</CardTitle>
            {getTrendIcon(priceChanges.token)}
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums">
              ${currentPrices?.token_price.toFixed(4) || '0.0000'}
            </div>
            <p className={`text-sm ${getTrendColor(priceChanges.token)} mt-2`}>
              {priceChanges.token > 0 ? '+' : ''}{priceChanges.token.toFixed(2)}% from last update
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 