import yfinance as yf
import matplotlib.pyplot as plt

def main():
    ticker = input("Enter the ticker: ")

    # Fetch share price data using yfinance for each date range
    stock_data_green = yf.download(ticker, start='2022-01-01', end='2023-01-01')
    stock_data_yellow = yf.download(ticker, start='2021-01-01', end='2022-01-01')
    stock_data_red = yf.download(ticker, start='2020-01-01', end='2021-01-01')

    # Combine data for all three date ranges
    stock_data = stock_data_green._append(stock_data_yellow)._append(stock_data_red)

    # Plot the graph with different colors for each date range
    plt.figure(figsize=(10, 6))
    plt.plot(stock_data.index, stock_data['Adj Close'], color='skyblue', label='Share Price')
    plt.xlabel("Date")
    plt.ylabel("Share Price")
    plt.title(f"Share Price for {ticker} from 2020-01-01 to 2023-01-01")

    # Fill regions with different colors for each date range
    plt.fill_between(stock_data_green.index, stock_data_green['Adj Close'], color='green', alpha=0.3, label='2022-01-01 to 2023-01-01')
    plt.fill_between(stock_data_yellow.index, stock_data_yellow['Adj Close'], color='yellow', alpha=0.3, label='2021-01-01 to 2022-01-01')
    plt.fill_between(stock_data_red.index, stock_data_red['Adj Close'], color='red', alpha=0.3, label='2020-01-01 to 2021-01-01')

    plt.legend()
    plt.grid(True)
    plt.show()

if __name__ == "__main__":
    main()
