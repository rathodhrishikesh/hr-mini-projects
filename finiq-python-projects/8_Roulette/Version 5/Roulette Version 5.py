import random
import csv

def martingale_simulator(max_rounds=10, csv_filename="martingale_results.csv"):
    current_bet = 10  # Initial bet amount
    total_bets = 0
    net_profit_loss = 0
    round_number = 1
    cumulative_total_bets = 0
    
    # Open CSV file for writing
    with open(csv_filename, mode='w', newline='') as file:
        writer = csv.writer(file)
        
        # Write headers to CSV
        writer.writerow(['Round', 'Current Bet', 'Total Bets', 'Cumulative Total Bets', 'Net Profit/Loss', 'Roulette Result', 'Win Status'])
        
        while round_number <= max_rounds:
            # Place bet on Red
            total_bets += 1
            cumulative_total_bets += current_bet
            net_profit_loss -= current_bet
            
            # Simulate roulette spin
            roulette_spin = random.randint(0, 37)  # 0 represents green, 1-18 red, 19-36 black
            
            if roulette_spin == 0:
                spin_result = "Green 0"
                color_result = "Green"
            elif roulette_spin <= 18:
                spin_result = f"Red {roulette_spin}"
                color_result = "Red"
            else:
                spin_result = f"Black {roulette_spin}"
                color_result = "Black"
            
            # Determine win or loss
            if color_result == "Red":
                net_profit_loss += current_bet * 2  # Won the bet
                win_status = "Won"
                current_bet = 10  # Reset bet to $10 after a win
            else:
                win_status = "Lost"
                current_bet *= 2  # Double the bet for the next round
            
            # Write round results to CSV
            writer.writerow([round_number, current_bet, total_bets, cumulative_total_bets, net_profit_loss, spin_result, win_status])
            
            # Prepare for next round
            round_number += 1
    
    print(f"\nSimulation results have been saved to '{csv_filename}'.")

# Run the simulator
martingale_simulator(max_rounds=10, csv_filename="martingale_results.csv")
