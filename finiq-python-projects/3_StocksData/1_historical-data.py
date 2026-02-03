import yfinance as yf
import pandas as pd

def fetch_historical_stock_data(ticker, years=10):
    end_date = pd.Timestamp.now()
    start_date = end_date - pd.DateOffset(years=years)

    stock_data = yf.download(ticker, start=start_date, end=end_date)
    return stock_data

def save_to_excel(ticker, stock_data):
    filename = f"{ticker}_historical_data.xlsx"
    stock_data.to_excel(filename)
    print(f"Historical data for {ticker} saved to {filename}")

def main():
    ticker = input("Enter the ticker: ")
    years = int(input("Enter the number of years of historical data to fetch (default: 10): ") or 10)

    stock_data = fetch_historical_stock_data(ticker, years)
    save_to_excel(ticker, stock_data)

if __name__ == "__main__":
    main()