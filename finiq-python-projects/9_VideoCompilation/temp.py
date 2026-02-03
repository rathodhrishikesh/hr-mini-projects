import pkg_resources
import os

def get_package_size(package):
    try:
        location = pkg_resources.get_distribution(package).location
        package_path = os.path.join(location, package)
        total_size = 0
        for dirpath, dirnames, filenames in os.walk(package_path):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                total_size += os.path.getsize(fp)
        return total_size
    except:
        return 0

def bytes_to_readable(size_in_bytes):
    # Convert bytes to a more human-readable format
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_in_bytes < 1024:
            return f"{size_in_bytes:.2f} {unit}"
        size_in_bytes /= 1024

installed_packages = {pkg.key: get_package_size(pkg.key) for pkg in pkg_resources.working_set}
total_size = sum(installed_packages.values())

print(f"{'Package':<30} {'Size'}")
print("-" * 50)

for package, size in installed_packages.items():
    readable_size = bytes_to_readable(size)
    print(f"{package:<30} {readable_size}")

print("\nTotal size of all packages:", bytes_to_readable(total_size))
