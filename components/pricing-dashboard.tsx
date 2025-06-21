'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

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

export function PricingDashboard({ marketData, currentPrices, loading }: PricingDashboardProps) {
  const [priceChanges, setPriceChanges] = useState({
    energy: 0,
    hash: 0,
    token: 0
  });

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
    if (change > 0.1) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < -0.1) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0.1) return 'text-green-600';
    if (change < -0.1) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </CardContent>
        </Card>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </CardContent>
        </Card>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const chartData = marketData.slice(0, 50).reverse().map(data => ({
    time: new Date(data.timestamp).toLocaleTimeString(),
    energy: data.energy_price,
    hash: data.hash_price,
    token: data.token_price
  }));

  return (
    <div className="space-y-6">
      {/* Current Prices */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Energy Price</CardTitle>
            {getTrendIcon(priceChanges.energy)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${currentPrices?.energy_price.toFixed(4) || '0.0000'}
            </div>
            <p className={`text-xs ${getTrendColor(priceChanges.energy)}`}>
              {priceChanges.energy > 0 ? '+' : ''}{priceChanges.energy.toFixed(2)}% from last update
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hash Price</CardTitle>
            {getTrendIcon(priceChanges.hash)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${currentPrices?.hash_price.toFixed(4) || '0.0000'}
            </div>
            <p className={`text-xs ${getTrendColor(priceChanges.hash)}`}>
              {priceChanges.hash > 0 ? '+' : ''}{priceChanges.hash.toFixed(2)}% from last update
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Token Price</CardTitle>
            {getTrendIcon(priceChanges.token)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${currentPrices?.token_price.toFixed(4) || '0.0000'}
            </div>
            <p className={`text-xs ${getTrendColor(priceChanges.token)}`}>
              {priceChanges.token > 0 ? '+' : ''}{priceChanges.token.toFixed(2)}% from last update
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Price Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time Market Prices</CardTitle>
          <CardDescription>
            Live pricing data from energy and inference markets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="energy" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Energy Price ($)"
                />
                <Line 
                  type="monotone" 
                  dataKey="hash" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Hash Price ($)"
                />
                <Line 
                  type="monotone" 
                  dataKey="token" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Token Price ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 