# AI-Driven Trading System

A comprehensive AI-powered trading system that arbitrages energy and inference marketplace prices to optimize compute allocation while utilizing Bitcoin miners and HPC servers.

## 🚀 Features

### Real-Time Market Analysis
- **Live Pricing Data**: Integrates with the Mara Hackathon API for real-time energy, hash, and token prices
- **Price Trend Visualization**: Interactive charts showing market movements and correlations
- **Market Sentiment Analysis**: Real-time assessment of market conditions

### AI-Powered Forecasting
- **TimeGPT Integration**: Advanced time series forecasting using the Vercel AI SDK
- **Multi-Asset Predictions**: Forecasts for energy prices, hash rates, and token values
- **Confidence Scoring**: Each forecast includes confidence intervals and reliability metrics
- **Anomaly Detection**: Automatically identifies unusual market patterns and price deviations

### Intelligent Arbitrage Engine
- **Opportunity Detection**: AI identifies profitable arbitrage opportunities across markets
- **Risk Assessment**: Comprehensive risk analysis with customizable tolerance levels
- **Resource Optimization**: Optimal allocation of mining rigs and GPU clusters
- **Automated Execution**: Real-time trade execution based on predefined criteria

### Resource Management
- **Multi-Resource Support**: Manages Bitcoin miners, GPU clusters, and CPU farms
- **Power Optimization**: Monitors and optimizes power consumption across all resources
- **Geographic Distribution**: Supports resources across multiple locations (Texas, California, Oregon)
- **Real-Time Monitoring**: Live tracking of resource utilization and profitability

### Risk Management & Monitoring
- **Real-Time Risk Assessment**: Continuous monitoring of system-wide risk metrics
- **Budget Controls**: Automated budget allocation and spending limits
- **Alert System**: Proactive alerts for risk thresholds and market anomalies
- **Performance Analytics**: Detailed profit/loss tracking and performance metrics

### Trading Interface
- **Manual Trading**: Execute manual trades across energy and inference markets
- **Order Management**: Support for market and limit orders
- **Portfolio Tracking**: Real-time tracking of active positions and trade history
- **Market Overview**: Comprehensive view of current market conditions

## 🏗️ Architecture

### Frontend Components
- **Dashboard**: Main control center with system overview
- **Pricing Dashboard**: Real-time market data visualization
- **Forecast Panel**: AI forecasting and anomaly detection interface
- **Arbitrage Engine**: Opportunity detection and execution controls
- **Resource Manager**: Infrastructure monitoring and control
- **Trading Interface**: Manual trading capabilities
- **Risk Monitor**: Risk assessment and alerting system

### Backend APIs
- **Market Data API** (`/api/market-data`): Fetches live pricing data
- **Forecast API** (`/api/forecast`): AI-powered price predictions
- **Arbitrage API** (`/api/arbitrage`): Opportunity detection and analysis
- **Anomaly Detection API** (`/api/anomaly-detection`): Pattern analysis
- **Trade Execution API** (`/api/execute-trade`): Automated trade execution

## 💡 Key Innovation Areas

### 1. Energy Market Arbitrage
- Real-time monitoring of ERCOT and other energy markets
- Optimal data center load management for maximum profit per watt
- Dynamic resource allocation based on energy price fluctuations

### 2. Bitcoin Mining Intelligence
- Network difficulty and hashrate predictions
- Mining pool performance analysis and optimization
- Profitability forecasting based on energy costs and token prices

### 3. AI Inference Marketplace
- Integration with cloud compute pricing APIs
- Dynamic GPU allocation for inference workloads
- Profit optimization between mining and AI inference

### 4. Derivatives and Futures
- Support for hashrate and compute futures contracts
- Risk hedging through derivative instruments
- Price discovery for underlying assets

## 🎯 Trading Strategies

### Mining Arbitrage
- **Strategy**: Activate mining rigs when hash prices exceed energy costs
- **Optimization**: Factor in network difficulty and token price forecasts
- **Risk Management**: Stop-loss mechanisms for prolonged unprofitable periods

### Inference Arbitrage
- **Strategy**: Deploy GPU clusters for AI inference when demand is high
- **Optimization**: Route workloads to lowest-cost energy regions
- **Scaling**: Dynamic scaling based on demand and profitability

### Hybrid Operations
- **Strategy**: Simultaneously run mining and inference workloads
- **Load Balancing**: Optimal distribution between mining and inference
- **Profit Maximization**: Real-time switching between workload types

## 📊 Risk Management

### Budget Controls
- Maximum allocation limits per strategy
- Real-time budget utilization tracking
- Automated stop-loss triggers

### Volatility Management
- Market volatility monitoring and alerts
- Position sizing based on volatility metrics
- Correlation analysis between energy and crypto markets

### Operational Risk
- Infrastructure failure monitoring
- Backup resource allocation
- Emergency shutdown capabilities

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-trading-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Configure AI SDK API keys
   - Set up market data API endpoints
   - Configure resource management credentials

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Access the dashboard**
   - Open [http://localhost:3000](http://localhost:3000) in your browser
   - Start monitoring markets and managing resources

## 🔧 Configuration

### Risk Settings
- Adjust risk tolerance levels (Conservative, Moderate, Aggressive)
- Set maximum budget allocations
- Configure stop-loss thresholds

### Resource Management
- Add mining rigs and GPU clusters
- Configure power limits and geographic locations
- Set up automated scaling rules

### Market Integration
- Configure API endpoints for market data
- Set up forecasting models and parameters
- Customize alert thresholds

## 📈 Performance Metrics

### Key Performance Indicators
- **Total Profit/Loss**: Real-time P&L tracking
- **ROI**: Return on investment across all strategies
- **Sharpe Ratio**: Risk-adjusted returns
- **Maximum Drawdown**: Worst-case loss scenarios

### Operational Metrics
- **Resource Utilization**: Percentage of active resources
- **Energy Efficiency**: Profit per kWh consumed
- **Trade Success Rate**: Percentage of profitable trades
- **System Uptime**: Infrastructure availability

## 🔮 Future Enhancements

### Advanced AI Features
- Deep learning models for market prediction
- Reinforcement learning for strategy optimization
- Natural language processing for news sentiment analysis

### Expanded Markets
- Integration with additional energy markets
- Support for renewable energy certificates
- Carbon credit trading capabilities

### Enhanced Risk Management
- Value at Risk (VaR) calculations
- Stress testing and scenario analysis
- Real-time margin requirements

## 🤝 Contributing

We welcome contributions to improve the AI trading system! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request with detailed description

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This system is for educational and demonstration purposes. Trading involves substantial risk of loss. Past performance does not guarantee future results. Please consult with qualified financial advisors before making investment decisions. 