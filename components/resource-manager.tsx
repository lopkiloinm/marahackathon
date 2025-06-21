'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Server, Bitcoin, Zap, Activity, Settings } from 'lucide-react';

interface ResourceManagerProps {
  systemStatus: {
    active_miners: number;
    active_gpus: number;
    energy_cost: number;
  };
  onStatusUpdate: (status: any) => void;
}

interface Resource {
  id: string;
  type: 'miner' | 'gpu' | 'cpu';
  name: string;
  status: 'active' | 'idle' | 'maintenance';
  power_draw: number;
  utilization: number;
  profit_rate: number;
  location: string;
}

export function ResourceManager({ systemStatus, onStatusUpdate }: ResourceManagerProps) {
  const [resources] = useState<Resource[]>([
    {
      id: 'miner-001',
      type: 'miner',
      name: 'Antminer S19 Pro #1',
      status: 'active',
      power_draw: 3250,
      utilization: 98,
      profit_rate: 12.50,
      location: 'Texas'
    },
    {
      id: 'miner-002',
      type: 'miner',
      name: 'Antminer S19 Pro #2',
      status: 'idle',
      power_draw: 0,
      utilization: 0,
      profit_rate: 0,
      location: 'Texas'
    },
    {
      id: 'gpu-001',
      type: 'gpu',
      name: 'RTX 4090 Cluster A',
      status: 'active',
      power_draw: 1600,
      utilization: 85,
      profit_rate: 8.75,
      location: 'California'
    },
    {
      id: 'gpu-002',
      type: 'gpu',
      name: 'RTX 4090 Cluster B',
      status: 'active',
      power_draw: 1600,
      utilization: 92,
      profit_rate: 9.25,
      location: 'California'
    },
    {
      id: 'cpu-001',
      type: 'cpu',
      name: 'AMD EPYC Cluster',
      status: 'idle',
      power_draw: 0,
      utilization: 0,
      profit_rate: 0,
      location: 'Oregon'
    }
  ]);

  const toggleResource = (resourceId: string) => {
    // Implementation for toggling resource status
    console.log('Toggling resource:', resourceId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'idle': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'miner': return <Bitcoin className="h-4 w-4" />;
      case 'gpu': return <Server className="h-4 w-4" />;
      case 'cpu': return <Activity className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const activeResources = resources.filter(r => r.status === 'active');
  const totalPowerDraw = activeResources.reduce((sum, r) => sum + r.power_draw, 0);
  const avgUtilization = activeResources.length > 0 
    ? activeResources.reduce((sum, r) => sum + r.utilization, 0) / activeResources.length 
    : 0;
  const totalProfitRate = activeResources.reduce((sum, r) => sum + r.profit_rate, 0);

  return (
    <div className="space-y-6">
      {/* Resource Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Resources</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeResources.length}/{resources.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Power Draw</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totalPowerDraw / 1000).toFixed(1)}kW</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgUtilization.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit Rate</CardTitle>
            <Bitcoin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalProfitRate.toFixed(2)}/h</div>
          </CardContent>
        </Card>
      </div>

      {/* Resource List */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Management</CardTitle>
          <CardDescription>
            Monitor and control mining rigs, GPU clusters, and compute resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {resources.map((resource) => (
              <div key={resource.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(resource.type)}
                    <div>
                      <h4 className="font-medium">{resource.name}</h4>
                      <p className="text-sm text-gray-600">{resource.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(resource.status)}>
                      {resource.status}
                    </Badge>
                    <Switch
                      checked={resource.status === 'active'}
                      onCheckedChange={() => toggleResource(resource.id)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                  <div>
                    <p className="text-gray-600">Power Draw</p>
                    <p className="font-medium">{resource.power_draw}W</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Utilization</p>
                    <p className="font-medium">{resource.utilization}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Profit Rate</p>
                    <p className="font-medium text-green-600">${resource.profit_rate}/h</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Type</p>
                    <p className="font-medium capitalize">{resource.type}</p>
                  </div>
                </div>

                {resource.status === 'active' && (
                  <Progress value={resource.utilization} className="h-2" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resource Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Resource Controls</CardTitle>
          <CardDescription>
            Manage multiple resources at once
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="outline">
              Start All Miners
            </Button>
            <Button variant="outline">
              Start All GPUs
            </Button>
            <Button variant="outline">
              Stop All Resources
            </Button>
            <Button variant="destructive">
              Emergency Shutdown
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 