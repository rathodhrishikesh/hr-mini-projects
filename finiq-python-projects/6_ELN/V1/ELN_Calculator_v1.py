"""
read ticker from User
read tenor from User could 1.5 should read as 18 months
fetch data from an online source, and plot a graph x axis has date, y axis has share price, for the specified tenor
highlight the share price at the start of every month with a tiny purple start
read strike price and notional from user
draw a line for strike price as a percentage of the initial share price
lets call the final date of the tenor as valuation date
Issuer Price is 99.04% of notional
Determine if Share Price is above or below Strike Price on Valuation Date
Calculation the Final Outcome based on the following conditions:
1. if above strike: investor receives 100% notional. Calculate Profit as Notional minus Issuer Price
2. if above strike: investor receives shares at worth (notional/(strike price) . Calculate Loss as Notional-(Shares value)

create a final output file in a .txt format with the following details:
1. Strike Price
2. Notional
3. Spot Price on Initial Date
4. Spot Price on Valuation Date
5. Number of Days between Valuation Date and Initial Date
6. Share Price ABOVE or BELOW Strike Price on Valuation Date
7. Final Outcome
"""

import yfinance as yf
import matplotlib.pyplot as plt
from dateutil.relativedelta import relativedelta
import pandas as pd

def calculate_strike_price(initial_share_price, strike_percent):
    return initial_share_price * strike_percent

def calculate_final_outcome(stock_data, initial_share_price, strike_price, notional, issuer_price):
    valuation_date = stock_data.index[-1]
    spot_price_valuation_date = stock_data['Adj Close'][-1]

    if spot_price_valuation_date >= strike_price:
        investor_receive = notional
        profit = notional - (notional * issuer_price)
        loss = 0
    else:
        investor_receive = notional / strike_price
        profit = 0
        loss = notional - (notional * strike_price)

    return valuation_date, spot_price_valuation_date, investor_receive, profit, loss

def main():
    ticker = input("Enter the ticker: ")
    tenor_years = float(input("Enter the tenor (in years): "))

    # Fetch historical stock data using yfinance
    end_date = pd.Timestamp.now()
    start_date = end_date - relativedelta(months=int(tenor_years * 12))
    stock_data = yf.download(ticker, start=start_date, end=end_date)

    # Calculate the share price at the start of every month
    monthly_data = stock_data['Adj Close'].resample('MS').first()

    # Plot the graph
    plt.figure(figsize=(12, 6))
    plt.plot(stock_data.index, stock_data['Adj Close'], label='Share Price', color='blue')

    # Highlight the share price at the start of every month with a star marker
    plt.scatter(monthly_data.index, monthly_data, marker='*', color='purple', s=50, label='Month Start')

    plt.xlabel('Date')
    plt.ylabel('Share Price')
    plt.title(f'{ticker} Stock Price for {int(tenor_years * 12)} months and Key Levels')
    plt.legend()
    plt.grid(True)
    plt.show()

    # Read strike price and notional from the user
    strike_percent = float(input("Enter the strike price as a percentage of the initial share price: ")) / 100
    notional = float(input("Enter the notional amount: "))
    # issuer_price = 0.9904  # Issuer Price is 99.04% of notional
    issuer_price = float(input("Enter the issuer price as a percentage of the initial share price: ")) / 100

    # Calculate the strike price, knockout price, and knockin price
    initial_share_price = stock_data['Adj Close'][0]
    strike_price = calculate_strike_price(initial_share_price, strike_percent)

    # Calculate the final outcome based on the conditions
    valuation_date, spot_price_valuation_date, investor_receive, profit, loss = calculate_final_outcome(
        stock_data, initial_share_price, strike_price, notional, issuer_price
    )

    # Save the details in a .txt file
    output_file = f'{ticker}_ELN_Output.txt'
    with open(output_file, 'w') as file:
        file.write(f'Strike Price: {strike_price:.2f}\n')
        file.write(f'Notional: {notional:.2f}\n')
        file.write(f'Spot Price on Initial Date: {initial_share_price:.2f}\n')
        file.write(f'Spot Price on Valuation Date: {spot_price_valuation_date:.2f}\n')
        file.write(f'Number of Days between Valuation Date and Initial Date: {len(stock_data)} days\n')
        file.write(f'Share Price {"ABOVE" if spot_price_valuation_date >= strike_price else "BELOW"} Strike Price on Valuation Date\n')
        file.write(f'Final Outcome:\n')
        file.write(f'Investor Receives: {investor_receive:.2f}\n')
        file.write(f'Profit: {profit:.2f}\n')
        file.write(f'Loss: {loss:.2f}\n')

    print(f'Final outcome details saved to {output_file}')

if __name__ == "__main__":
    main()
