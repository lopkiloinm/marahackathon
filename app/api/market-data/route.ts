import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Read data from CSV file
    const csvPath = path.join(process.cwd(), 'app', 'data', 'multi_market_data.csv');
    const fileContent = await fs.readFile(csvPath, 'utf8');
    
    // Parse CSV
    const lines = fileContent.trim().split('\n');
    const headers = lines[0].split(',');
    
    const data = lines.slice(1).map(line => {
      const values = line.split(',');
      return {
        energy_price: parseFloat(values[0]),
        hash_price: parseFloat(values[1]),
        token_price: parseFloat(values[2]),
        timestamp: values[3]
      };
    });
    
    // Sort by timestamp (ascending - oldest first)
    data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Get last 7 days of data
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    const filteredData = data.filter(item => {
      const itemDate = new Date(item.timestamp);
      return itemDate >= sevenDaysAgo && itemDate <= now;
    });
    
    return NextResponse.json(filteredData);
  } catch (error) {
    console.error('Error reading CSV file:', error);
    // Fallback to generated data if CSV is not available
    const mockData = generateMockData();
    return NextResponse.json(mockData);
  }
}

function generateMockData() {
  const mockData: any[] = [];
  const now = new Date();
  
  // Generate 7 days of historical data with 5-minute intervals
  const intervalsPerDay = (24 * 60) / 5;
  const dataPoints = 7 * intervalsPerDay; // 7 days * 288 intervals per day
  
  // Use consistent seed for reproducible data
  let seed = 42;
  function seededRandom() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }
  
  // Generate highly volatile prices with dramatic patterns
  const energyPrices: number[] = [];
  const hashPrices: number[] = [];
  const tokenPrices: number[] = [];
  
  for (let i = dataPoints - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - (i * 5 * 60 * 1000));
    const hourOfDay = timestamp.getHours() + timestamp.getMinutes() / 60;
    const t = dataPoints - 1 - i;
    const daysElapsed = t / intervalsPerDay;
    
    // Base price much higher with variation
    const basePrice = 2.5 + 0.5 * Math.sin(2 * Math.PI * daysElapsed / 3);
    
    // Energy price: highly volatile with multiple frequencies
    const energyDaily = 0.8 * Math.sin(2 * Math.PI * (hourOfDay - 6) / 24);
    const energyHourly = 0.3 * Math.sin(2 * Math.PI * hourOfDay / 6);
    const energyRapid = 0.2 * Math.sin(2 * Math.PI * t / (intervalsPerDay * 0.25));
    const energyTrend = 0.1 * daysElapsed;
    const energyVolatility = (seededRandom() - 0.5) * 0.3;
    
    // Add occasional spikes
    const spikeChance = seededRandom() < 0.02;
    const energySpike = spikeChance ? (seededRandom() * 1.5 + 0.5) : 0;
    
    let energyPrice = basePrice + energyDaily + energyHourly + energyRapid + energyTrend + energyVolatility + energySpike;
    
    // Hash price: counter-oscillating with different patterns
    const hashBase = 3.0 + 0.7 * Math.sin(2 * Math.PI * daysElapsed / 2.5 + Math.PI/3);
    const hashOscillation = 1.0 * Math.sin(2 * Math.PI * t / (intervalsPerDay * 0.4));
    const hashDaily = 0.6 * Math.sin(2 * Math.PI * (hourOfDay - 10) / 24);
    const hashRapid = 0.4 * Math.sin(2 * Math.PI * t / (intervalsPerDay * 0.15) + Math.PI/4);
    const hashVolatility = (seededRandom() - 0.5) * 0.4;
    const hashSpike = spikeChance ? (seededRandom() - 0.5) * 3.0 : 0;
    
    let hashPrice = hashBase + hashOscillation + hashDaily + hashRapid + hashVolatility + hashSpike;
    
    // Token price: chaotic pattern with extreme volatility
    const tokenBase = 2.0 + 1.2 * Math.sin(2 * Math.PI * daysElapsed / 1.5 + Math.PI/2);
    const tokenChaos = 0.5 * Math.sin(2 * Math.PI * t / (intervalsPerDay * 0.3)) * 
                       Math.sin(2 * Math.PI * t / (intervalsPerDay * 0.7));
    const tokenDaily = -0.7 * Math.sin(2 * Math.PI * (hourOfDay - 6) / 24);
    const tokenTrend = -0.05 * daysElapsed + 0.3 * Math.sin(2 * Math.PI * daysElapsed);
    const tokenVolatility = (seededRandom() - 0.5) * 0.5;
    const tokenJump = (seededRandom() < 0.03) ? (seededRandom() - 0.5) * 4.0 : 0;
    
    let tokenPrice = tokenBase + tokenChaos + tokenDaily + tokenTrend + tokenVolatility + tokenJump;
    
    // Store prices temporarily
    energyPrices.push(energyPrice);
    hashPrices.push(hashPrice);
    tokenPrices.push(tokenPrice);
  }
  
  // Add market shock events
  const eventTimes = [0.15, 0.35, 0.55, 0.75, 0.9];
  
  for (const et of eventTimes) {
    const eventIdx = Math.floor(et * dataPoints);
    if (eventIdx < dataPoints - 20) {
      const shockMagnitude = (seededRandom() - 0.5) * 3.0;
      
      for (let i = 0; i < 20; i++) {
        const idx = eventIdx + i;
        if (idx < dataPoints) {
          const decay = Math.exp(-i / 5);
          energyPrices[idx] += shockMagnitude * decay * (1 + (seededRandom() - 0.5) * 0.6);
          hashPrices[idx] += shockMagnitude * decay * 1.5 * (1 + (seededRandom() - 0.5) * 0.6);
          tokenPrices[idx] += -shockMagnitude * decay * 0.8 * (1 + (seededRandom() - 0.5) * 0.6);
        }
      }
    }
  }
  
  // Create final data points
  for (let i = dataPoints - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - (i * 5 * 60 * 1000));
    const idx = dataPoints - 1 - i;
    
    // Ensure prices don't go negative but can go very high
    const energyPrice = Math.max(0.1, energyPrices[idx]);
    const hashPrice = Math.max(0.1, hashPrices[idx]);
    const tokenPrice = Math.max(0.1, tokenPrices[idx]);
    
    mockData.push({
      timestamp: timestamp.toISOString(),
      energy_price: parseFloat(energyPrice.toFixed(6)),
      hash_price: parseFloat(hashPrice.toFixed(6)),
      token_price: parseFloat(tokenPrice.toFixed(6))
    });
  }
  
  return mockData;
} 