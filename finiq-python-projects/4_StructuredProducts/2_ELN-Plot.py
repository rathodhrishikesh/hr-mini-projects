import yfinance as yf
import matplotlib.pyplot as plt

def calculate_payoff(share_price, strike, coupon):
    if share_price >= strike:
        return share_price * (1 + coupon)
    else:
        return 0

def main():
    ticker = input("Enter the ticker: ")
    notional = float(input("Enter the notional amount: "))
    currency = input("Enter the currency: ")
    tenor = float(input("Enter the tenor (in years): "))
    upfront = float(input("Enter the upfront payment: "))
    solvefor = input("Enter the 'solve for' parameter (strike or coupon): ")

    if solvefor == 'strike':
        coupon_percent = float(input("Enter the coupon percentage (in decimal): "))
        coupon = coupon_percent * notional
        strike = upfront / (notional * (1 + coupon_percent))
    elif solvefor == 'coupon':
        strike_percent = float(input("Enter the strike price percentage (in decimal): "))
        strike = upfront / notional
        coupon = (upfront / strike) - 1
    else:
        print("Invalid input for 'solve for' parameter.")
        return

    # Fetch share price data using yfinance
    stock_data = yf.download(ticker, start='2022-01-01', end='2023-01-01')
    share_prices = stock_data['Adj Close']

    # Create share price scenarios
    payoffs = [calculate_payoff(price, strike, coupon) for price in share_prices]

    # Plot Scenario 1: Share price at or above strike price (green color)
    plt.plot(share_prices, payoffs, label="Payoff")
    plt.axhline(y=strike, color='green', linestyle='--', label="Strike Price")
    plt.xlabel("Share Price")
    plt.ylabel("Payoff")
    plt.title(f"Scenario 1 - Structured Product ELN\nTicker: {ticker} ({currency}) - Tenor: {tenor} years")
    plt.legend()
    plt.grid(True)
    plt.fill_between(share_prices, payoffs, where=[p >= strike for p in payoffs], color='green', alpha=0.3)
    plt.show()

    # Plot Scenario 2: Share price below strike price (yellow color)
    plt.plot(share_prices, payoffs, label="Payoff")
    plt.axhline(y=strike, color='yellow', linestyle='--', label="Strike Price")
    plt.xlabel("Share Price")
    plt.ylabel("Payoff")
    plt.title(f"Scenario 2 - Structured Product ELN\nTicker: {ticker} ({currency}) - Tenor: {tenor} years")
    plt.legend()
    plt.grid(True)
    plt.fill_between(share_prices, payoffs, where=[p < strike for p in payoffs], color='yellow', alpha=0.3)
    plt.show()

    # Plot Scenario 3: Share price drops to zero (red color)
    plt.plot(share_prices, payoffs, label="Payoff")
    plt.axhline(y=strike, color='red', linestyle='--', label="Strike Price")
    plt.xlabel("Share Price")
    plt.ylabel("Payoff")
    plt.title(f"Scenario 3 - Structured Product ELN\nTicker: {ticker} ({currency}) - Tenor: {tenor} years")
    plt.legend()
    plt.grid(True)
    plt.fill_between(share_prices, payoffs, where=[p == 0 for p in payoffs], color='red', alpha=0.3)
    plt.show()

if __name__ == "__main__":
    main()
