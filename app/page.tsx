'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PricingDashboard } from '@/components/pricing-dashboard';
import { ForecastPanel } from '@/components/forecast-panel';
import { ArbitrageEngine } from '@/components/arbitrage-engine';
import { TradingInterface } from '@/components/trading-interface';
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



  const profitColor = systemStatus.total_profit >= 0 ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className="min-h-screen relative">
      <div className="max-w-[1920px] mx-auto px-6 py-8 space-y-8">
        {/* Header Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 blur-3xl" />
          <div className="relative space-y-6 text-center py-8">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold">
                <span className="gradient-text">AI Trading System</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Advanced energy & inference marketplace arbitrage powered by TimeGPT forecasting
              </p>
            </div>
            

          </div>
        </div>

        {/* Main Chart Section - Real-time Market Analytics */}
        <div className="w-full">
          <PricingDashboard 
            marketData={marketData} 
            currentPrices={currentPrices}
            loading={loading}
          />
        </div>

        {/* AI Predictions Section - Now Full Width */}
        <div className="w-full">
          <ForecastPanel 
            marketData={marketData}
          />
        </div>

        {/* Metrics Grid - More Compact */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { title: "Total Profit", value: systemStatus.total_profit, icon: TrendingUp, prefix: "$", suffix: "", color: profitColor },
            { title: "Active Miners", value: systemStatus.active_miners, icon: Bitcoin, prefix: "", suffix: "" },
            { title: "Active GPUs", value: systemStatus.active_gpus, icon: Server, prefix: "", suffix: "" },
            { title: "Energy Cost", value: systemStatus.energy_cost, icon: Zap, prefix: "$", suffix: "/hr" },
            { title: "Opportunities", value: systemStatus.arbitrage_opportunities, icon: AlertTriangle, prefix: "", suffix: "" },
            { title: "System Load", value: 87, icon: Activity, prefix: "", suffix: "%" }
          ].map((metric, index) => (
            <Card key={index} className="group hover-card gradient-border overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <metric.icon className="h-3 w-3 text-muted-foreground/60" />
              </CardHeader>
              <CardContent className="pb-3">
                <div className={`text-xl font-bold tabular-nums ${metric.color || ''}`}>
                  {metric.prefix}{typeof metric.value === 'number' ? metric.value.toFixed(metric.prefix === '$' ? 2 : 0) : metric.value}{metric.suffix}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trading Operations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Arbitrage Engine */}
          <Card className="gradient-border backdrop-blur-xl bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Arbitrage Engine
              </CardTitle>
              <CardDescription>Automated opportunity detection</CardDescription>
            </CardHeader>
            <CardContent>
              <ArbitrageEngine 
                marketData={marketData}
                systemActive={true}
                onStatusUpdate={setSystemStatus}
              />
            </CardContent>
          </Card>
          
          {/* Trading Terminal */}
          <Card className="gradient-border backdrop-blur-xl bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Trading Terminal
              </CardTitle>
              <CardDescription>Execute trades and manage positions</CardDescription>
            </CardHeader>
            <CardContent>
              <TradingInterface 
                currentPrices={currentPrices}
                systemActive={true}
              />
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
} 