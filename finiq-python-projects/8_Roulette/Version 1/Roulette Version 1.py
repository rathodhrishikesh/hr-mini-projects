import random
import pandas as pd

def spin_roulette():
    # Simulate a spin of the roulette wheel
    # Returns True if red wins, False otherwise
    # In American roulette, there are 18 reds, 18 blacks, and 2 greens (0 and 00)
    result = random.randint(0, 37)
    if result == 0 or result == 37:  # 0 and 00
        return False
    elif result % 2 == 1:  # Odd numbers are red in roulette
        return True
    else:
        return False

def martingale_simulation(rounds):
    initial_bet = 10
    bet = initial_bet
    total_bets = 0
    total_profit_loss = 0

    data = []

    for _ in range(rounds):
        won = spin_roulette()
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
            "Profit/Loss": total_profit_loss
        })

    return pd.DataFrame(data)

# Simulate 100 rounds of the Martingale Betting System
results = martingale_simulation(20)
print(results)

# Save the results to a CSV file
results.to_csv("martingale_simulation_results.csv", index=False)
