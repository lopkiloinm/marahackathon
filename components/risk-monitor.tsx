'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Shield, TrendingDown, Zap, DollarSign } from 'lucide-react';

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

interface RiskMetric {
  name: string;
  value: number;
  threshold: number;
  status: 'safe' | 'warning' | 'critical';
  description: string;
}

interface RiskAlert {
  id: string;
  type: 'budget' | 'volatility' | 'exposure' | 'performance';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface RiskMonitorProps {
  systemStatus: SystemStatus;
  marketData: MarketData[];
}

export function RiskMonitor({ systemStatus, marketData }: RiskMonitorProps) {
  const [riskMetrics, setRiskMetrics] = useState<RiskMetric[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [overallRiskScore, setOverallRiskScore] = useState(0);

  useEffect(() => {
    calculateRiskMetrics();
    generateRiskAlerts();
  }, [systemStatus, marketData]);

  const calculateRiskMetrics = () => {
    const metrics: RiskMetric[] = [
      {
        name: 'Budget Utilization',
        value: Math.abs(systemStatus.energy_cost) / 10000 * 100, // Assuming 10k budget
        threshold: 80,
        status: Math.abs(systemStatus.energy_cost) / 10000 * 100 > 80 ? 'critical' : 
                Math.abs(systemStatus.energy_cost) / 10000 * 100 > 60 ? 'warning' : 'safe',
        description: 'Percentage of budget allocated to energy costs'
      },
      {
        name: 'Price Volatility',
        value: calculateVolatility(),
        threshold: 15,
        status: calculateVolatility() > 15 ? 'critical' : 
                calculateVolatility() > 10 ? 'warning' : 'safe',
        description: 'Market price volatility over the last 24 hours'
      },
      {
        name: 'Resource Exposure',
        value: (systemStatus.active_miners + systemStatus.active_gpus) / 20 * 100, // Assuming 20 max resources
        threshold: 85,
        status: (systemStatus.active_miners + systemStatus.active_gpus) / 20 * 100 > 85 ? 'critical' : 
                (systemStatus.active_miners + systemStatus.active_gpus) / 20 * 100 > 70 ? 'warning' : 'safe',
        description: 'Percentage of available resources currently deployed'
      },
      {
        name: 'Profit Margin',
        value: systemStatus.total_profit > 0 ? 
               (systemStatus.total_profit / Math.abs(systemStatus.energy_cost)) * 100 : 0,
        threshold: 10,
        status: systemStatus.total_profit < 0 ? 'critical' : 
                (systemStatus.total_profit / Math.abs(systemStatus.energy_cost)) * 100 < 10 ? 'warning' : 'safe',
        description: 'Current profit margin relative to energy costs'
      }
    ];

    setRiskMetrics(metrics);
    
    // Calculate overall risk score
    const riskScore = metrics.reduce((acc, metric) => {
      if (metric.status === 'critical') return acc + 30;
      if (metric.status === 'warning') return acc + 15;
      return acc + 5;
    }, 0);
    
    setOverallRiskScore(Math.min(riskScore, 100));
  };

  const calculateVolatility = () => {
    if (marketData.length < 2) return 0;
    
    const prices = marketData.slice(0, 24).map(d => d.energy_price);
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((acc, price) => acc + Math.pow(price - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    
    return (stdDev / mean) * 100;
  };

  const generateRiskAlerts = () => {
    const alerts: RiskAlert[] = [];

    // Budget alert
    if (Math.abs(systemStatus.energy_cost) > 8000) {
      alerts.push({
        id: 'budget-001',
        type: 'budget',
        severity: 'high',
        message: 'Energy costs approaching budget limit',
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }

    // Volatility alert
    if (calculateVolatility() > 15) {
      alerts.push({
        id: 'volatility-001',
        type: 'volatility',
        severity: 'medium',
        message: 'High market volatility detected',
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }

    // Negative profit alert
    if (systemStatus.total_profit < -100) {
      alerts.push({
        id: 'performance-001',
        type: 'performance',
        severity: 'high',
        message: 'System running at significant loss',
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }

    setRiskAlerts(alerts);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'border-blue-500 bg-blue-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'high': return 'border-red-500 bg-red-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const riskChartData = marketData.slice(0, 24).reverse().map((data, index) => ({
    time: new Date(data.timestamp).toLocaleTimeString(),
    risk: overallRiskScore + (Math.random() - 0.5) * 20, // Simulated risk fluctuation
    volatility: calculateVolatility() + (Math.random() - 0.5) * 5
  }));

  return (
    <div className="space-y-6">
      {/* Overall Risk Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Risk Assessment Dashboard
          </CardTitle>
          <CardDescription>
            Monitor system risk metrics and receive alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Overall Risk Score</h3>
                  <Badge className={
                    overallRiskScore > 70 ? 'bg-red-100 text-red-800' :
                    overallRiskScore > 40 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }>
                    {overallRiskScore > 70 ? 'High Risk' :
                     overallRiskScore > 40 ? 'Medium Risk' :
                     'Low Risk'}
                  </Badge>
                </div>
                <Progress value={overallRiskScore} className="h-3" />
                <p className="text-sm text-gray-600">
                  Current risk level: {overallRiskScore.toFixed(1)}/100
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${
                overallRiskScore > 70 ? 'bg-red-100' :
                overallRiskScore > 40 ? 'bg-yellow-100' :
                'bg-green-100'
              }`}>
                <Shield className={`h-8 w-8 ${
                  overallRiskScore > 70 ? 'text-red-600' :
                  overallRiskScore > 40 ? 'text-yellow-600' :
                  'text-green-600'
                }`} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Metrics</CardTitle>
          <CardDescription>
            Detailed breakdown of system risk factors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {riskMetrics.map((metric, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{metric.name}</h4>
                  <Badge className={getStatusColor(metric.status)}>
                    {metric.status}
                  </Badge>
                </div>
                <Progress value={metric.value} className="h-2 mb-2" />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{metric.value.toFixed(1)}%</span>
                  <span>Threshold: {metric.threshold}%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Trends</CardTitle>
          <CardDescription>
            Historical risk levels and volatility
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={riskChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="risk" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Risk Score"
                />
                <Line 
                  type="monotone" 
                  dataKey="volatility" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="Volatility %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Risk Alerts */}
      {riskAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Active Risk Alerts
            </CardTitle>
            <CardDescription>
              Immediate attention required for these risk factors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {riskAlerts.map((alert) => (
                <Alert key={alert.id} className={getSeverityColor(alert.severity)}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex justify-between items-start">
                      <div>
                        <strong>{alert.type.toUpperCase()} Alert</strong> - {alert.message}
                        <br />
                        <span className="text-sm text-gray-600">
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                        alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 