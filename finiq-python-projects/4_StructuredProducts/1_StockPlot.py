import yfinance as yf
import matplotlib.pyplot as plt

def plot_stock_price(symbol, color):
    stock = yf.Ticker(symbol)
    historical_data = stock.history(period='10y')
    company_name = stock.info['longName']
    plt.plot(historical_data['Close'], color=color, label=company_name)
    plt.xlabel('Date')
    plt.ylabel('Stock Price')
    plt.title(f'Stock Price for {company_name} ({symbol})')
    plt.legend()
    plt.grid(True)
    plt.tight_layout()

# Replace 'AAPL', 'SEB', 'AZO', 'BKNG', 'TPL', 'CABO', 'CMG', 'MKL', and 'MTD' 
# with the stock symbols of your choice
plot_stock_price('AAPL', 'yellow')
plot_stock_price('SEB', 'red')
plot_stock_price('AZO', 'green')
plot_stock_price('BKNG', 'blue')
plot_stock_price('TPL', 'purple')
plot_stock_price('CABO', 'orange')
plot_stock_price('CMG', 'cyan')
plot_stock_price('MKL', 'magenta')
plot_stock_price('MTD', 'brown')

plt.show()