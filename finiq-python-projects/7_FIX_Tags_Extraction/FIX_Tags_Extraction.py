import re
import pandas as pd

# Define the file path
file_path = "FIX_Messages.log"

# Define the tags you want to extract
#tags_to_extract = [35, 49, 56, 52, 1, 131, 55, 117, 132]

# Ask the user to enter comma-separated tag numbers
user_input = input("Enter comma-separated FIX tag numbers: ")

# Remove any extra spaces and split the input into a list of tag numbers
tags_to_extract = [int(tag.strip()) for tag in user_input.split(',')]
# Initialize empty lists to store extracted data
data = {tag: [] for tag in tags_to_extract}

# Open and read the file
with open(file_path, "r") as file:
    lines = file.readlines()

# Extract tag values from each line and store in the data dictionary
for line in lines:
    for tag in tags_to_extract:
        #pattern = rf"{tag}=(\w+)"
        pattern = rf"{tag}=(.*?)(?=|$)"
        match = re.search(pattern, line)
 
        if match:
            data[tag].append(match.group(1))
        else:
            data[tag].append(None)

# Create a DataFrame from the data dictionary
df = pd.DataFrame(data)

# Specify the Excel file name
excel_file_name = "extracted_data.xlsx"

# Write the DataFrame to an Excel file
df.to_excel(excel_file_name, index=False)

print("Data extracted and written to Excel file:", excel_file_name)
