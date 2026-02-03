import random
import pandas as pd

def spin_roulette():
    # Simulate a spin of the roulette wheel
    # Returns the result number and whether red wins
    result = random.randint(0, 37)
    if result == 0:
        return 0, "Green", False
    elif result == 37:
        return 37, "Green (00)", False
    elif result % 2 == 1:  # Odd numbers are red in roulette
        return result, "Red", True
    else:
        return result, "Black", False

def martingale_simulation(rounds):
    initial_bet = 10
    bet = initial_bet
    total_bets = 0
    total_profit_loss = 0

    data = []

    for _ in range(rounds):
        number, color, won = spin_roulette()
        total_bets += bet
        if won:
            total_profit_loss += bet
            bet = initial_bet  # Reset bet after a win
        else:
            total_profit_loss -= bet
            bet *= 2  # Double the bet after a loss

        data.append({
            "Round": _ + 1,
            "Bet": bet,
            "Total Bets": total_bets,
            "Profit/Loss": total_profit_loss,
            "Win Status": "Won" if won else "Lost",
            "Roulette Result": f"{number} ({color})"
        })

    return pd.DataFrame(data)

# Simulate 100 rounds of the Martingale Betting System
rounds = 200
results = martingale_simulation(rounds)
print(results)

# Save the results to a CSV file
results.to_csv("martingale_simulation_results.csv", index=False)

# Print the total number of rounds
print(f"Total number of betting rounds: {rounds}")
