import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch data from the Mara Hackathon API
    const response = await fetch('https://mara-hackathon-api.onrender.com/prices', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch market data');
    }

    const data = await response.json();
    
    // Transform and clean the data
    const transformedData = data.map((item: any) => ({
      timestamp: item.timestamp,
      energy_price: parseFloat(item.energy_price.toFixed(6)),
      hash_price: parseFloat(item.hash_price.toFixed(6)),
      token_price: parseFloat(item.token_price.toFixed(6))
    }));

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error fetching market data:', error);
    
    // Return mock data if the API is unavailable
    const mockData = generateMockData();
    return NextResponse.json(mockData);
  }
}

function generateMockData() {
  const mockData: any[] = [];
  const now = new Date();
  
  for (let i = 0; i < 50; i++) {
    const timestamp = new Date(now.getTime() - (i * 5 * 60 * 1000)); // 5-minute intervals
    mockData.push({
      timestamp: timestamp.toISOString(),
      energy_price: 0.65 + (Math.random() - 0.5) * 0.2,
      hash_price: 8.5 + (Math.random() - 0.5) * 2,
      token_price: 3.0 + (Math.random() - 0.5) * 1
    });
  }
  
  return mockData;
} 