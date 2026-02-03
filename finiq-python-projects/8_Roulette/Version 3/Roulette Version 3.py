import random

def martingale_simulator(initial_bet=10, max_rounds=50):
    # Initial variables
    current_bet = initial_bet
    total_bets = 0
    net_profit_loss = 0
    round_number = 1
    
    # Simulation loop
    while round_number <= max_rounds:
        # Place bet on Red
        total_bets += 1
        net_profit_loss -= current_bet
        
        # Simulate roulette spin (assuming there are 18 red numbers and 20 black/green numbers)
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
            current_bet = initial_bet  # Reset bet to initial amount after a win
        else:
            win_status = "Lost"
            current_bet *= 2  # Double the bet for the next round
        
        # Print round results
        print(f"Round {round_number}:")
        print(f"  Current Bet: ${current_bet}")
        print(f"  Total Bets: {total_bets}")
        print(f"  Net Profit/Loss: ${net_profit_loss}")
        print(f"  Roulette Result: {spin_result}")
        print(f"  Win Status: {win_status}")
        print()
        
        # Prepare for next round
        round_number += 1
    
    print("Simulation complete.")

# Run the simulator
martingale_simulator()
