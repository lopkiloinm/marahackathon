'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Zap, Server, Bitcoin, TrendingUp } from 'lucide-react';

interface MarketData {
  timestamp: string;
  energy_price: number;
  hash_price: number;
  token_price: number;
}

interface ArbitrageOpportunity {
  id: string;
  type: 'mining' | 'inference' | 'hybrid';
  profit_potential: number;
  confidence: number;
  duration: number;
  resource_requirements: {
    miners: number;
    gpus: number;
    power_draw: number;
  };
  expected_return: number;
  risk_level: 'low' | 'medium' | 'high';
}

interface ArbitrageEngineProps {
  marketData: MarketData[];
  systemActive: boolean;
  onStatusUpdate: (status: any) => void;
}

export function ArbitrageEngine({ marketData, systemActive, onStatusUpdate }: ArbitrageEngineProps) {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [autoExecute, setAutoExecute] = useState(false);
  const [maxBudget, setMaxBudget] = useState(10000);
  const [riskTolerance, setRiskTolerance] = useState('medium');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [totalAllocated, setTotalAllocated] = useState(0);

  useEffect(() => {
    if (marketData.length > 0 && systemActive) {
      findArbitrageOpportunities();
      const interval = setInterval(findArbitrageOpportunities, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [marketData, systemActive]);

  const findArbitrageOpportunities = async () => {
    setIsOptimizing(true);
    try {
      const response = await fetch('/api/arbitrage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marketData: marketData.slice(0, 10),
          maxBudget,
          riskTolerance
        }),
      });

      const result = await response.json();
      setOpportunities(result.opportunities);
      setTotalAllocated(result.totalAllocated);
      
      onStatusUpdate((prev: any) => ({
        ...prev,
        arbitrage_opportunities: result.opportunities.length
      }));
    } catch (error) {
      console.error('Error finding arbitrage opportunities:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const executeOpportunity = async (opportunity: ArbitrageOpportunity) => {
    try {
      const response = await fetch('/api/execute-trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ opportunity }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Update system status
        onStatusUpdate((prev: any) => ({
          ...prev,
          active_miners: prev.active_miners + opportunity.resource_requirements.miners,
          active_gpus: prev.active_gpus + opportunity.resource_requirements.gpus,
          energy_cost: prev.energy_cost + (opportunity.resource_requirements.power_draw * marketData[0]?.energy_price || 0)
        }));
        
        // Remove executed opportunity
        setOpportunities(prev => prev.filter(op => op.id !== opportunity.id));
      }
    } catch (error) {
      console.error('Error executing opportunity:', error);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mining': return <Bitcoin className="h-4 w-4" />;
      case 'inference': return <Server className="h-4 w-4" />;
      case 'hybrid': return <Zap className="h-4 w-4" />;
      default: return <Calculator className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Arbitrage Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Arbitrage Optimization Engine
          </CardTitle>
          <CardDescription>
            AI-powered arbitrage opportunity detection and execution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Max Budget ($)</Label>
              <Input
                id="budget"
                type="number"
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="risk">Risk Tolerance</Label>
              <select 
                id="risk"
                className="w-full p-2 border rounded-md"
                value={riskTolerance}
                onChange={(e) => setRiskTolerance(e.target.value)}
              >
                <option value="low">Conservative</option>
                <option value="medium">Moderate</option>
                <option value="high">Aggressive</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Auto Execute</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={autoExecute}
                  onCheckedChange={setAutoExecute}
                />
                <span className="text-sm text-gray-600">
                  {autoExecute ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Budget Allocation</p>
              <Progress value={(totalAllocated / maxBudget) * 100} className="w-64" />
              <p className="text-xs text-gray-600">
                ${totalAllocated.toFixed(2)} / ${maxBudget.toFixed(2)} allocated
              </p>
            </div>
            
            <Button 
              onClick={findArbitrageOpportunities}
              disabled={isOptimizing || !systemActive}
            >
              {isOptimizing ? 'Optimizing...' : 'Find Opportunities'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Arbitrage Opportunities */}
      {opportunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Arbitrage Opportunities</CardTitle>
            <CardDescription>
              {opportunities.length} opportunities detected with total potential profit of $
              {opportunities.reduce((sum, op) => sum + op.profit_potential, 0).toFixed(2)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {opportunities.map((opportunity) => (
                <div key={opportunity.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(opportunity.type)}
                      <span className="font-medium capitalize">{opportunity.type} Arbitrage</span>
                      <Badge className={getRiskColor(opportunity.risk_level)}>
                        {opportunity.risk_level} risk
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {opportunity.confidence}% confidence
                      </span>
                      <Button
                        size="sm"
                        onClick={() => executeOpportunity(opportunity)}
                        disabled={!systemActive}
                      >
                        Execute
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Profit Potential</p>
                      <p className="font-medium text-green-600">
                        ${opportunity.profit_potential.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Expected Return</p>
                      <p className="font-medium">
                        {opportunity.expected_return.toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Duration</p>
                      <p className="font-medium">{opportunity.duration}h</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Resources</p>
                      <p className="font-medium">
                        {opportunity.resource_requirements.miners}M / {opportunity.resource_requirements.gpus}G
                      </p>
                    </div>
                  </div>

                  <Progress value={opportunity.confidence} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Opportunities Message */}
      {opportunities.length === 0 && !isOptimizing && systemActive && (
        <Card>
          <CardContent className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Opportunities Found</h3>
            <p className="text-gray-600">
              The system is monitoring markets for profitable arbitrage opportunities.
              {marketData.length === 0 && " Waiting for market data..."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 