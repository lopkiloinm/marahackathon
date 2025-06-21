import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(req: NextRequest) {
  try {
    const { marketData, maxBudget, riskTolerance } = await req.json();
    
    if (!marketData || marketData.length === 0) {
      return NextResponse.json({ error: 'No market data provided' }, { status: 400 });
    }

    const opportunities = findArbitrageOpportunities(marketData, maxBudget, riskTolerance);
    const totalAllocated = opportunities.reduce((sum, opp) => sum + opp.profit_potential, 0);

    return NextResponse.json({
      opportunities,
      totalAllocated,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error finding arbitrage opportunities:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function findArbitrageOpportunities(
  marketData: any[], 
  maxBudget: number, 
  riskTolerance: string
): ArbitrageOpportunity[] {
  const opportunities: ArbitrageOpportunity[] = [];
  const currentPrices = marketData[0];
  
  if (!currentPrices) return opportunities;

  const { energy_price, hash_price, token_price } = currentPrices;

  // Mining arbitrage opportunity
  const miningProfitability = calculateMiningProfitability(energy_price, hash_price, token_price);
  if (miningProfitability.profitable) {
    opportunities.push({
      id: `mining-${Date.now()}`,
      type: 'mining',
      profit_potential: miningProfitability.profit,
      confidence: miningProfitability.confidence,
      duration: 4,
      resource_requirements: {
        miners: Math.ceil(maxBudget / 5000), // Assume $5k per miner
        gpus: 0,
        power_draw: Math.ceil(maxBudget / 5000) * 3250 // 3.25kW per miner
      },
      expected_return: miningProfitability.return_rate,
      risk_level: determineRiskLevel(miningProfitability.volatility, riskTolerance)
    });
  }

  // Inference arbitrage opportunity
  const inferenceProfitability = calculateInferenceProfitability(energy_price, hash_price);
  if (inferenceProfitability.profitable) {
    opportunities.push({
      id: `inference-${Date.now()}`,
      type: 'inference',
      profit_potential: inferenceProfitability.profit,
      confidence: inferenceProfitability.confidence,
      duration: 2,
      resource_requirements: {
        miners: 0,
        gpus: Math.ceil(maxBudget / 2000), // Assume $2k per GPU setup
        power_draw: Math.ceil(maxBudget / 2000) * 400 // 400W per GPU
      },
      expected_return: inferenceProfitability.return_rate,
      risk_level: determineRiskLevel(inferenceProfitability.volatility, riskTolerance)
    });
  }

  // Hybrid arbitrage opportunity
  if (opportunities.length >= 2) {
    const hybridProfit = (miningProfitability.profit + inferenceProfitability.profit) * 0.8;
    opportunities.push({
      id: `hybrid-${Date.now()}`,
      type: 'hybrid',
      profit_potential: hybridProfit,
      confidence: Math.min(miningProfitability.confidence, inferenceProfitability.confidence),
      duration: 6,
      resource_requirements: {
        miners: Math.ceil(maxBudget / 10000),
        gpus: Math.ceil(maxBudget / 4000),
        power_draw: (Math.ceil(maxBudget / 10000) * 3250) + (Math.ceil(maxBudget / 4000) * 400)
      },
      expected_return: (miningProfitability.return_rate + inferenceProfitability.return_rate) / 2,
      risk_level: 'medium'
    });
  }

  // Filter opportunities based on budget and risk tolerance
  return opportunities
    .filter(opp => opp.profit_potential <= maxBudget)
    .filter(opp => filterByRiskTolerance(opp.risk_level, riskTolerance))
    .sort((a, b) => b.profit_potential - a.profit_potential)
    .slice(0, 5); // Return top 5 opportunities
}

function calculateMiningProfitability(energyPrice: number, hashPrice: number, tokenPrice: number) {
  // Simple mining profitability calculation
  const hashRate = 100; // TH/s
  const powerConsumption = 3.25; // kW
  
  const dailyRevenue = hashRate * hashPrice;
  const dailyEnergyCost = powerConsumption * 24 * energyPrice;
  const dailyProfit = dailyRevenue - dailyEnergyCost;
  
  const profitable = dailyProfit > 0;
  const returnRate = profitable ? (dailyProfit / dailyEnergyCost) * 100 : 0;
  
  return {
    profitable,
    profit: Math.max(dailyProfit * 30, 0), // 30-day projection
    confidence: profitable ? 80 + Math.random() * 15 : 30,
    return_rate: returnRate,
    volatility: Math.random() * 20 + 10 // 10-30% volatility
  };
}

function calculateInferenceProfitability(energyPrice: number, hashPrice: number) {
  // AI inference profitability calculation
  const computeUnits = 10; // GPU compute units
  const powerPerUnit = 0.4; // kW per unit
  const revenuePerUnit = hashPrice * 0.3; // Assume inference pays 30% of hash rate
  
  const hourlyRevenue = computeUnits * revenuePerUnit;
  const hourlyEnergyCost = computeUnits * powerPerUnit * energyPrice;
  const hourlyProfit = hourlyRevenue - hourlyEnergyCost;
  
  const profitable = hourlyProfit > 0;
  const returnRate = profitable ? (hourlyProfit / hourlyEnergyCost) * 100 : 0;
  
  return {
    profitable,
    profit: Math.max(hourlyProfit * 24 * 7, 0), // 7-day projection
    confidence: profitable ? 75 + Math.random() * 20 : 25,
    return_rate: returnRate,
    volatility: Math.random() * 25 + 15 // 15-40% volatility
  };
}

function determineRiskLevel(volatility: number, riskTolerance: string): 'low' | 'medium' | 'high' {
  if (riskTolerance === 'high') {
    return volatility > 30 ? 'high' : volatility > 20 ? 'medium' : 'low';
  } else if (riskTolerance === 'medium') {
    return volatility > 25 ? 'high' : volatility > 15 ? 'medium' : 'low';
  } else {
    return volatility > 20 ? 'high' : volatility > 10 ? 'medium' : 'low';
  }
}

function filterByRiskTolerance(riskLevel: string, riskTolerance: string): boolean {
  if (riskTolerance === 'high') return true;
  if (riskTolerance === 'medium') return riskLevel !== 'high';
  return riskLevel === 'low';
} 