import random
import csv

def spin_roulette_wheel():
    # Simulate a roulette wheel spin
    number = random.randint(0, 36)
    if number == 0:
        return number, 'green'
    elif number in [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]:
        return number, 'red'
    else:
        return number, 'black'

def simulate_roulette(num_rounds, initial_bet):
    current_bet = initial_bet
    total_profit_loss = 0
    total_bets = 0
    results = []

    for round_num in range(1, num_rounds + 1):
        number, color = spin_roulette_wheel()
        if color == 'red':
            win_status = 'win'
            total_profit_loss += current_bet
            current_bet = initial_bet  # Reset to original bet after a win
        else:
            win_status = 'loss'
            total_profit_loss -= current_bet
            current_bet *= 2  # Double the bet after a loss
        
        total_bets += current_bet
        
        # Record the results
        results.append({
            'Round': round_num,
            'Current Bet': current_bet,
            'Total Bets': total_bets,
            'Total Profit/Loss': total_profit_loss,
            'Number': number,
            'Color': color,
            'Win Status': win_status
        })
    
    # Write results to CSV file
    with open('roulette_simulation_results.csv', mode='w', newline='') as file:
        fieldnames = ['Round', 'Current Bet', 'Total Bets', 'Total Profit/Loss', 'Number', 'Color', 'Win Status']
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        
        writer.writeheader()
        for result in results:
            writer.writerow(result)

    print(f"Simulation completed. Results written to 'roulette_simulation_results.csv'.")

if __name__ == "__main__":
    num_rounds = int(input("Enter the number of rounds to simulate: "))
    initial_bet = float(input("Enter the initial bet amount: "))

    simulate_roulette(num_rounds, initial_bet)
