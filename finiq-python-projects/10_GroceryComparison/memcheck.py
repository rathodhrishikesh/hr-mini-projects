import os
import sys

site_packages = next(p for p in sys.path if "site-packages" in p)

package_sizes = []
for pkg in os.listdir(site_packages):
    pkg_path = os.path.join(site_packages, pkg)
    if os.path.isdir(pkg_path):
        size = sum(os.path.getsize(os.path.join(root, f)) for root, _, files in os.walk(pkg_path) for f in files)
        package_sizes.append((pkg, size / (1024 * 1024)))  # MB

# Sort biggest → smallest
package_sizes.sort(key=lambda x: x[1], reverse=True)

for pkg, size in package_sizes:
    print(f"{pkg:30} {size:,.2f} MB")
