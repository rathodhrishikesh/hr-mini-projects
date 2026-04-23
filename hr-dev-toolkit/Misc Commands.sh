FOLDER_PATH="D:\MSBA\Foster School of Business"

# Command to print all file names in their name in folder E:\Backup & Sync\
Get-ChildItem $FOLDER_PATH -Recurse -File -ErrorAction SilentlyContinue

# Command to print all folder paths in folder E:\Backup & Sync\
Get-ChildItem $FOLDER_PATH -Recurse -Directory -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName

# Command to print all file names with "IMG-2021" in their name in folder E:\Backup & Sync\
Get-ChildItem $FOLDER_PATH -Recurse -File -Filter "*IMG-2021*" -ErrorAction SilentlyContinue

# Command to print folder paths containing files with "IMG-2021" in their name in folder E:\Backup & Sync\
Get-ChildItem $FOLDER_PATH -Recurse -File -Filter "*IMG-2021*" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty DirectoryName | Sort-Object -Unique

# Command to print the top 20 largest folders in folder
Get-ChildItem $FOLDER_PATH -Recurse -Directory -ErrorAction SilentlyContinue |
ForEach-Object {
    $size = (Get-ChildItem $_.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
    [PSCustomObject]@{
        Folder = $_.FullName
        SizeGB = [math]::Round($size / 1GB, 2)
    }
} | Sort-Object SizeGB -Descending | Select-Object -First 20
