import pandas as pd

def calculate_statistics(stock_data):
    # Calculate statistics
    statistics = {
        'Minimum Price': stock_data['Adj Close'].min(),
        'Maximum Price': stock_data['Adj Close'].max(),
        'Average Price': stock_data['Adj Close'].mean(),
        'Standard Deviation': stock_data['Adj Close'].std(),
        'Median Price': stock_data['Adj Close'].median(),
        'Total Volume': stock_data['Volume'].sum()
    }
    return statistics

def write_statistics_to_txt(ticker, statistics):
    filename = f"{ticker}_statistics.txt"
    with open(filename, 'w') as file:
        for key, value in statistics.items():
            file.write(f"{key}: {value}\n")
    print(f"Statistics for {ticker} saved to {filename}")

def main():
    ticker = input("Enter the ticker: ")

    # Read the data from the Excel file
    filename = f"{ticker}_historical_data.xlsx"
    stock_data = pd.read_excel(filename, index_col='Date')

    # Calculate statistics
    statistics = calculate_statistics(stock_data)

    # Write statistics to a .txt file
    write_statistics_to_txt(ticker, statistics)

if __name__ == "__main__":
    main()