import os

# Define the paths to the folders
folder_old = r'C:\Users\ratho\OneDrive\HR-IMPORTANT TBO\Google Drive\Travel'
folder_new = r'C:\Users\ratho\OneDrive\HR-IMPORTANT TBO\Travel'

# Initialize lists to store the file names in each folder
files_old = []
files_new = []

# Traverse the old folder and store file names
for root, dirs, files in os.walk(folder_old):
    for file in files:
        files_old.append(file)

# Traverse the new folder and store file names
for root, dirs, files in os.walk(folder_new):
    for file in files:
        files_new.append(file)

# Find the common files
common_files = set(files_old).intersection(files_new)

# Count the number of files in each folder
count_old = len(files_old)
count_new = len(files_new)

# Print the results
print("Common files in both folders:")
for file in common_files:
    print(file)

print(f"Number of files in {folder_old}: {count_old}")
print(f"Number of files in {folder_new}: {count_new}")
