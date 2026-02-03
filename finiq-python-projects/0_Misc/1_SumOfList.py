numbers = []

n=int(input("Enter count of numbers to be added : "))

i=0
for i in range(n):
    temp = int(input("Enter new element : "))
    numbers.append(temp)
        

# variable to store the sum
sum = 0

# iterate over the list
for val in numbers:
    sum = sum+val

print("The sum of",numbers, "is : ", sum)