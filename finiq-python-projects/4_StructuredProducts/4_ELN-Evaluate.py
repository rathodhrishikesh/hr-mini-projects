import yfinance as yf
import matplotlib.pyplot as plt

def calculate_payoff(share_price, strike):
    if share_price >= strike:
        return share_price
    else:
        return 0

def main():
    ticker = input("Enter the ticker: ")
    strike_percent = float(input("Enter the strike price percentage (in decimal): "))

    # Fetch share price data using yfinance
    stock_data = yf.download(ticker, start='2021-01-01', end='2023-01-01')

    # Calculate the strike price based on user input
    initial_share_price = stock_data['Adj Close'][0]
    strike = initial_share_price * (1 + strike_percent)

    # Create share price scenarios
    payoffs = [calculate_payoff(price, strike) for price in stock_data['Adj Close']]

    # Plot the graph with green color
    plt.plot(stock_data.index, stock_data['Adj Close'], color='green', label='Share Price')
    plt.axhline(y=strike, color='red', linestyle='--', label="Strike Price")
    plt.xlabel("Date")
    plt.ylabel("Share Price")
    plt.title(f"ELN Payoff for {ticker} from 2021-01-01 to 2023-01-01")
    plt.legend()
    plt.grid(True)

    # Determine the final evaluation outcome
    final_price = stock_data['Adj Close'][-1]
    if final_price >= strike:
        outcome = f"Final evaluation: Share price at or above strike price (${strike:.2f})"
    elif final_price == 0:
        outcome = "Final evaluation: Share price drops to zero"
    else:
        outcome = f"Final evaluation: Share price below strike price (${strike:.2f})"

    # Display the outcome on the graph
    plt.text(stock_data.index[-1], final_price, outcome, ha='right', va='bottom', fontsize=10,
             bbox=dict(facecolor='white', alpha=0.7, edgecolor='gray'))

    plt.show()

if __name__ == "__main__":
    main()