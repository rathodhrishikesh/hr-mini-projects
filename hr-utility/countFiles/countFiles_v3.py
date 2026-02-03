import os

folder_old = r'C:\Users\ratho\OneDrive\HR-IMPORTANT TBO\Google Drive\Travel'
folder_new = r'C:\Users\ratho\OneDrive\HR-IMPORTANT TBO\Travel'

def get_all_filenames(folder):
    names = set()
    for root, dirs, files in os.walk(folder):
        for f in files:
            names.add(f.lower())   # lowercase for case-insensitive match
    return names

print("Scanning folders...\n")

old_names = get_all_filenames(folder_old)
new_names = get_all_filenames(folder_new)

common = old_names & new_names
only_old = old_names - new_names
only_new = new_names - old_names

print("===== PRESENCE-ONLY FILE REPORT =====\n")

print(f"Files in OLD folder: {len(old_names)}")
print(f"Files in NEW folder: {len(new_names)}\n")

print(f"Present in BOTH: {len(common)}")
print(f"Only in OLD: {len(only_old)}")
print(f"Only in NEW: {len(only_new)}\n")

print("---- ONLY IN OLD ----")
for f in sorted(only_old):
    print(f)

print("\n---- ONLY IN NEW ----")
for f in sorted(only_new):
    print(f)

print("\n---- PRESENT IN BOTH ----")
for f in sorted(common):
    print(f)

print("\nComparison complete.")
