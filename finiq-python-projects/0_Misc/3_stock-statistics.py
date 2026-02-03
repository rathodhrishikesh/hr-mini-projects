import yfinance as yf
import matplotlib.pyplot as plt

def plot_stock_price_trend(ticker, stock_data):
    plt.figure(figsize=(10, 6))
    plt.plot(stock_data.index, stock_data['Adj Close'], label='Stock Price', color='blue')
    plt.xlabel('Date')
    plt.ylabel('Stock Price')
    plt.title(f'{ticker} Stock Price Trend')
    plt.legend()
    plt.grid(True)
    plt.show()

def plot_daily_returns_distribution(ticker, stock_data):
    daily_returns = stock_data['Adj Close'].pct_change().dropna()
    plt.figure(figsize=(10, 6))
    plt.hist(daily_returns, bins=50, color='green', alpha=0.7)
    plt.xlabel('Daily Returns')
    plt.ylabel('Frequency')
    plt.title(f'{ticker} Daily Returns Distribution')
    plt.grid(True)
    plt.show()

def plot_moving_averages(ticker, stock_data):
    plt.figure(figsize=(12, 8))
    plt.plot(stock_data.index, stock_data['Adj Close'], label='Stock Price', color='blue')
    stock_data['SMA_50'] = stock_data['Adj Close'].rolling(window=50).mean()
    plt.plot(stock_data.index, stock_data['SMA_50'], label='SMA 50-days', color='orange')
    stock_data['EMA_20'] = stock_data['Adj Close'].ewm(span=20, adjust=False).mean()
    plt.plot(stock_data.index, stock_data['EMA_20'], label='EMA 20-days', color='green')
    plt.xlabel('Date')
    plt.ylabel('Stock Price')
    plt.title(f'{ticker} Moving Averages')
    plt.legend()
    plt.grid(True)
    plt.show()

def plot_trading_volume(ticker, stock_data):
    plt.figure(figsize=(10, 6))
    plt.bar(stock_data.index, stock_data['Volume'], color='purple')
    plt.xlabel('Date')
    plt.ylabel('Trading Volume')
    plt.title(f'{ticker} Trading Volume')
    plt.grid(True)
    plt.show()

def main():
    ticker = input("Enter the ticker: ")

    # Fetch stock price data using yfinance
    stock_data = yf.download(ticker, start='2010-01-01', end='2023-01-01')

    # Plot basic statistics
    plot_stock_price_trend(ticker, stock_data)
    plot_daily_returns_distribution(ticker, stock_data)
    plot_moving_averages(ticker, stock_data)
    plot_trading_volume(ticker, stock_data)

if __name__ == "__main__":
    main()