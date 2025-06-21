'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, TrendingUp, TrendingDown, Clock, Settings } from 'lucide-react';

interface MarketData {
  timestamp: string;
  energy_price: number;
  hash_price: number;
  token_price: number;
}

interface Trade {
  id: string;
  type: 'buy' | 'sell';
  asset: 'energy' | 'hash' | 'token';
  amount: number;
  price: number;
  status: 'pending' | 'filled' | 'cancelled';
  timestamp: string;
}

interface TradingInterfaceProps {
  currentPrices: MarketData | null;
  systemActive: boolean;
}

export function TradingInterface({ currentPrices, systemActive }: TradingInterfaceProps) {
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [selectedAsset, setSelectedAsset] = useState<'energy' | 'hash' | 'token'>('energy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [trades] = useState<Trade[]>([
    {
      id: 'trade-001',
      type: 'buy',
      asset: 'energy',
      amount: 1000,
      price: 0.65,
      status: 'filled',
      timestamp: '2025-01-07T14:30:00'
    },
    {
      id: 'trade-002',
      type: 'sell',
      asset: 'hash',
      amount: 500,
      price: 8.45,
      status: 'filled',
      timestamp: '2025-01-07T14:25:00'
    },
    {
      id: 'trade-003',
      type: 'buy',
      asset: 'token',
      amount: 200,
      price: 2.90,
      status: 'pending',
      timestamp: '2025-01-07T14:35:00'
    }
  ]);

  const getCurrentPrice = () => {
    if (!currentPrices) return 0;
    switch (selectedAsset) {
      case 'energy': return currentPrices.energy_price;
      case 'hash': return currentPrices.hash_price;
      case 'token': return currentPrices.token_price;
      default: return 0;
    }
  };

  const calculateTotal = () => {
    const currentPrice = getCurrentPrice();
    const tradeAmount = parseFloat(amount) || 0;
    const tradePrice = orderType === 'market' ? currentPrice : parseFloat(price) || 0;
    return tradeAmount * tradePrice;
  };

  const placeTrade = () => {
    if (!systemActive) return;
    
    console.log('Placing trade:', {
      type: tradeType,
      asset: selectedAsset,
      amount: parseFloat(amount),
      price: orderType === 'market' ? getCurrentPrice() : parseFloat(price),
      orderType
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filled': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTradeTypeColor = (type: string) => {
    return type === 'buy' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Trading Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Place Order
            </CardTitle>
            <CardDescription>
              Execute manual trades in energy and inference markets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Order Type</Label>
                <Select value={orderType} onValueChange={(value: 'market' | 'limit') => setOrderType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="market">Market Order</SelectItem>
                    <SelectItem value="limit">Limit Order</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Trade Type</Label>
                <Select value={tradeType} onValueChange={(value: 'buy' | 'sell') => setTradeType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Asset</Label>
              <Select value={selectedAsset} onValueChange={(value: 'energy' | 'hash' | 'token') => setSelectedAsset(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="energy">Energy</SelectItem>
                  <SelectItem value="hash">Hash Power</SelectItem>
                  <SelectItem value="token">Token</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              
              {orderType === 'limit' && (
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Current Price:</span>
                <span className="font-medium">${getCurrentPrice().toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Est. Total:</span>
                <span className="font-medium">${calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            <Button 
              onClick={placeTrade}
              disabled={!systemActive || !amount}
              className="w-full"
              variant={tradeType === 'buy' ? 'default' : 'destructive'}
            >
              {tradeType === 'buy' ? 'Place Buy Order' : 'Place Sell Order'}
            </Button>
          </CardContent>
        </Card>

        {/* Market Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Market Overview
            </CardTitle>
            <CardDescription>
              Current market prices and trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentPrices ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Energy</p>
                    <p className="text-sm text-gray-600">$/kWh</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">${currentPrices.energy_price.toFixed(4)}</p>
                    <p className="text-sm text-green-600">+2.1%</p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Hash Power</p>
                    <p className="text-sm text-gray-600">$/TH/s/day</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">${currentPrices.hash_price.toFixed(4)}</p>
                    <p className="text-sm text-red-600">-1.5%</p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Token</p>
                    <p className="text-sm text-gray-600">$/token</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">${currentPrices.token_price.toFixed(4)}</p>
                    <p className="text-sm text-green-600">+0.8%</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No market data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Trades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Trades
          </CardTitle>
          <CardDescription>
            Your recent trading activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trades.map((trade) => (
              <div key={trade.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${trade.type === 'buy' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {trade.type === 'buy' ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      <span className={getTradeTypeColor(trade.type)}>
                        {trade.type.toUpperCase()}
                      </span>{' '}
                      {trade.amount} {trade.asset.toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-600">
                      at ${trade.price.toFixed(4)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(trade.status)}>
                    {trade.status}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(trade.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 