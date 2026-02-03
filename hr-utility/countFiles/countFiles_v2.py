import os
import hashlib

folder_old = r'F:\Hrishikesh\OnePlus\02-02-2022\WhatsApp\WhatsApp Images'
folder_new = r'F:\Hrishikesh\Root\Phase 1\Moto G5+\WhatsApp\Media\WhatsApp Images'

def get_file_hash(path, block_size=65536):
    hasher = hashlib.md5()
    with open(path, 'rb') as f:
        for block in iter(lambda: f.read(block_size), b''):
            hasher.update(block)
    return hasher.hexdigest()

def scan_folder(folder):
    file_data = {}
    for root, dirs, files in os.walk(folder):
        for name in files:
            full_path = os.path.join(root, name)
            rel_path = os.path.relpath(full_path, folder)
            size = os.path.getsize(full_path)
            file_data[rel_path] = {
                "size": size,
                "hash": get_file_hash(full_path)
            }
    return file_data

print("Scanning folders...\n")

old_files = scan_folder(folder_old)
new_files = scan_folder(folder_new)

old_set = set(old_files.keys())
new_set = set(new_files.keys())

common = old_set & new_set
only_old = old_set - new_set
only_new = new_set - old_set

modified = []
same = []

for f in common:
    if old_files[f]["hash"] != new_files[f]["hash"]:
        modified.append(f)
    else:
        same.append(f)

print("===== FOLDER COMPARISON REPORT =====\n")

print(f"Total files in OLD folder: {len(old_files)}")
print(f"Total files in NEW folder: {len(new_files)}\n")

print(f"Same files: {len(same)}")
print(f"Modified files: {len(modified)}")
print(f"Only in OLD: {len(only_old)}")
print(f"Only in NEW: {len(only_new)}\n")

print("---- MODIFIED FILES ----")
for f in modified:
    print(f)

print("\n---- ONLY IN OLD ----")
for f in only_old:
    print(f)

print("\n---- ONLY IN NEW ----")
for f in only_new:
    print(f)

print("\nComparison complete.")
