'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PricingDashboard } from '@/components/pricing-dashboard';
import { ForecastPanel } from '@/components/forecast-panel';
import { ArbitrageEngine } from '@/components/arbitrage-engine';
import { ResourceManager } from '@/components/resource-manager';
import { TradingInterface } from '@/components/trading-interface';
import { RiskMonitor } from '@/components/risk-monitor';
import { Zap, TrendingUp, Server, Bitcoin, AlertTriangle, Activity } from 'lucide-react';

interface MarketData {
  timestamp: string;
  energy_price: number;
  hash_price: number;
  token_price: number;
}

interface SystemStatus {
  total_profit: number;
  active_miners: number;
  active_gpus: number;
  energy_cost: number;
  arbitrage_opportunities: number;
}

export default function TradingSystemDashboard() {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [currentPrices, setCurrentPrices] = useState<MarketData | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    total_profit: 0,
    active_miners: 0,
    active_gpus: 0,
    energy_cost: 0,
    arbitrage_opportunities: 0
  });
  const [isSystemActive, setIsSystemActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchMarketData = async () => {
    try {
      const response = await fetch('/api/market-data');
      const data = await response.json();
      setMarketData(data);
      setCurrentPrices(data[0]); // Most recent price
      setLoading(false);
    } catch (error) {
      console.error('Error fetching market data:', error);
    }
  };

  const toggleSystem = () => {
    setIsSystemActive(!isSystemActive);
  };

  const profitColor = systemStatus.total_profit >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Trading System</h1>
            <p className="text-gray-600">Energy & Inference Marketplace Arbitrage with TimeGPT Forecasting</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant={isSystemActive ? "default" : "secondary"}>
              {isSystemActive ? "Active" : "Inactive"}
            </Badge>
            <Button 
              onClick={toggleSystem}
              variant={isSystemActive ? "destructive" : "default"}
            >
              {isSystemActive ? "Stop System" : "Start System"}
            </Button>
          </div>
        </div>

        {/* System Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${profitColor}`}>
                ${systemStatus.total_profit.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Miners</CardTitle>
              <Bitcoin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStatus.active_miners}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active GPUs</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStatus.active_gpus}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Energy Cost</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${systemStatus.energy_cost.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStatus.arbitrage_opportunities}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Energy</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${currentPrices?.energy_price.toFixed(3) || '0.000'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Unified Dashboard with Integrated Forecasting */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Market Data & Forecasting */}
          <div className="space-y-6">
            <PricingDashboard 
              marketData={marketData} 
              currentPrices={currentPrices}
              loading={loading}
            />
            <ForecastPanel 
              marketData={marketData}
              onStatusUpdate={setSystemStatus}
            />
          </div>

          {/* Right Column: Trading Operations */}
          <div className="space-y-6">
            <ArbitrageEngine 
              marketData={marketData}
              systemActive={isSystemActive}
              onStatusUpdate={setSystemStatus}
            />
            <TradingInterface 
              currentPrices={currentPrices}
              systemActive={isSystemActive}
            />
          </div>
        </div>

        {/* Additional System Tabs */}
        <Tabs defaultValue="resources" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="risk">Risk Monitor</TabsTrigger>
          </TabsList>

          <TabsContent value="resources" className="space-y-4">
            <ResourceManager 
              systemStatus={systemStatus}
              onStatusUpdate={setSystemStatus}
            />
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            <RiskMonitor 
              systemStatus={systemStatus}
              marketData={marketData}
            />
          </TabsContent>
        </Tabs>

        {/* System Alerts */}
        {isSystemActive && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              AI Trading System is active. Monitoring markets with TimeGPT forecasting and executing trades automatically.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
} 