import argparse
import yfinance as yf
import matplotlib.pyplot as plt
from dateutil.relativedelta import relativedelta
import pandas as pd
import sys

def calculate_strike_price(initial_share_price, strike_percent):
    return initial_share_price * strike_percent

def calculate_final_outcome(stock_data, initial_share_price, strike_price, notional, issuer_percent):
    valuation_date = stock_data.index[-1]
    spot_price_valuation_date = stock_data['Adj Close'][-1]

    if spot_price_valuation_date > strike_price:
        profit = notional - (notional * issuer_percent)
        num_shares = 0  # Profit Case
        outcome = f'Profit Case: Investor Receives Full Notional\nTotal Profit (Notional - Invested Amount): {profit:.2f}'
    else:
        # Calculate the number of shares received by the investor
        num_shares = notional / (strike_price)
        profit = 0  # Loss Case
        outcome = f'Loss Case:\nInvestor Receives Number of Shares: {num_shares:.2f}'

    return valuation_date, spot_price_valuation_date, num_shares, profit, outcome

def parse_arguments():
    parser = argparse.ArgumentParser(description='Calculate ELN (Equity-Linked Note) outcomes.')
    parser.add_argument('ticker', type=str, help='Stock ticker symbol')
    parser.add_argument('tenor', type=float, help='Tenor in years')
    parser.add_argument('notional', type=float, help='Notional amount')
    parser.add_argument('strike', type=float, help='Strike price as a percentage')
    parser.add_argument('issuer', type=float, help='Issuer price as a percentage')
    return parser.parse_args()

def main():
    args = parse_arguments()
    ticker = args.ticker
    tenor_years = args.tenor

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

    # Read notional, strike price, and issuer price from the user
    notional = args.notional
    strike_percent = args.strike/ 100
    issuer_percent = args.issuer/ 100

    # Calculate the strike price, knockout price, and knockin price
    initial_share_price = stock_data['Adj Close'][0]
    strike_price = calculate_strike_price(initial_share_price, strike_percent)

    # Calculate the final outcome based on the conditions
    valuation_date, spot_price_valuation_date, num_shares, profit, outcome = calculate_final_outcome(
        stock_data, initial_share_price, strike_price, notional, issuer_percent
    )

    # Save the details in a .txt file
    output_file = f'{ticker}_ELN_Output.txt'
    with open(output_file, 'w') as file:
        file.write(f'Ticker: {ticker}\n')
        file.write(f'Notional: {notional:.2f}\n')
        file.write(f'Spot Price on Initial Date ({stock_data.index[0].strftime("%d-%b-%Y")}): {initial_share_price:.2f}\n')
        file.write(f'Spot Price on Valuation Date ({valuation_date.strftime("%d-%b-%Y")}): {spot_price_valuation_date:.2f}\n')
        file.write(f'Number of Days between Valuation Date and Initial Date: {len(stock_data)} days\n')
        file.write(f'Strike %: {strike_percent*100:.2f}\n')
        file.write(f'Strike Price: {strike_price:.2f}\n')
        file.write(f'Issuer %: {issuer_percent*100:.2f}\n')
        file.write(f'Share Price {"ABOVE" if spot_price_valuation_date > strike_price else "BELOW"} Strike Price on Valuation Date\n')
        file.write(f'\n')
        file.write(f'Final Outcome:\n')
        file.write(f'{outcome}\n')

    print(f'Final outcome details saved to {output_file}')

    # Draw a line for strike price as a percentage of the initial share price
    plt.axhline(y=strike_price, color='red', linestyle='--', label=f"Strike Price @ {strike_percent*100:.2f}%")

    plt.xlabel('Date')
    plt.ylabel('Share Price')
    plt.title(f'{ticker} Stock Price for {int(tenor_years * 12)} months and Key Levels')
    plt.legend()
    plt.grid(True)
    plt.show()
    
    sys.exit()

if __name__ == "__main__":
    main()