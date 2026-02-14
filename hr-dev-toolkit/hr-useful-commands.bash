# Delete all untracked files and reset to the latest commit
git fetch origin # Fetches the latest changes from the remote repository
git reset --hard origin/main # Resets the current branch to match the remote main/master branch
git clean -fd # Deletes untracked files and directories

# Extract project files
cd D:\Github\<project-folder> # Change to your project directory <project-folder>
git ls-files > git-code-files.txt # List all tracked files and save to git-code-files.txt
git ls-files "*.py" # List all Python files
git ls-files "frontend/*" # List all files in the frontend directory
git ls-files "backend/*" # List all files in the backend directory
