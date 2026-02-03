"""
read ticker from User
read tenor from User could 1.5 should read as 18 months
fetch data from an online source, and plot a graph x axis has date, y axis has share price, for the specified tenor
draw a strike price line @ 97% of initial share price
highlight the share price at the start of every month with a tiny purple start
draw a knockout line @ 103% of initial share price
draw a knockin line @ 90% of inital share price
"""

import yfinance as yf
import matplotlib.pyplot as plt
import pandas as pd
from dateutil.relativedelta import relativedelta

def calculate_strike_price(initial_share_price, strike_percent):
    return initial_share_price * strike_percent

def main():
    ticker = input("Enter the ticker: ")
    tenor_years = float(input("Enter the tenor (in years): "))

    # Fetch historical stock data using yfinance
    end_date = pd.Timestamp.now()
    start_date = end_date - relativedelta(months=int(tenor_years * 12))
    stock_data = yf.download(ticker, start=start_date, end=end_date)

    # Calculate the strike price, knockout price, and knockin price
    initial_share_price = stock_data['Adj Close'][0]
    strike_percent = 0.97
    knockout_percent = 1.03
    knockin_percent = 0.90
    strike_price = calculate_strike_price(initial_share_price, strike_percent)
    knockout_price = calculate_strike_price(initial_share_price, knockout_percent)
    knockin_price = calculate_strike_price(initial_share_price, knockin_percent)

    # Plot the graph
    plt.figure(figsize=(12, 6))
    plt.plot(stock_data.index, stock_data['Adj Close'], label='Share Price', color='blue')
    plt.axhline(y=strike_price, color='red', linestyle='--', label="Strike Price @ 97.00%")
    plt.axhline(y=knockout_price, color='orange', linestyle='--', label="Knockout @ 103.00%")
    plt.axhline(y=knockin_price, color='green', linestyle='--', label="Knockin @ 90.00%")

    # Resample data to monthly frequency and highlight the start of each month with a star marker
    monthly_data = stock_data['Adj Close'].resample('MS').first()
    plt.scatter(monthly_data.index, monthly_data, marker='*', color='magenta', s=50, label='Month Start')

    plt.xlabel('Date')
    plt.ylabel('Share Price')
    plt.title(f'{ticker} Stock Price for {int(tenor_years * 12)} months and Key Levels')
    plt.legend()
    plt.grid(True)
    plt.show()

if __name__ == "__main__":
    main()
