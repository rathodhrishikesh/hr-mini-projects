# ================================
# PROJECT FILE EXTRACTION
# ================================

cd D:\Github\<project-folder>

git ls-files
git ls-files > git-code-files.txt
git ls-files "*.py"
git ls-files "frontend/*"
git ls-files "backend/*"

git ls-files | findstr /v test
git ls-files | findstr /v ".md"

# Export all code into one file (Git Bash)
git ls-files | xargs cat > full-project-code.txt

# Export all code into one file (Windows CMD)
for /f "delims=" %i in ('git ls-files') do type "%i" >> full-project-code.txt


# ================================
# REPOSITORY INFO
# ================================

git status
git remote -v
git branch
git branch -a


# ================================
# COMMIT HISTORY
# ================================

git log
git log --oneline
git log --oneline --graph --all


# ================================
# SEE CHANGES
# ================================

git diff
git diff --cached
git diff backend/main.py


# ================================
# PROJECT STATS
# ================================

git ls-files | wc -l
git ls-files | xargs wc -l


# ================================
# ARCHIVE / EXPORT
# ================================

git archive -o project.zip HEAD
git archive --format=zip --output=project.zip main
git archive -o backend.zip HEAD backend/
git archive -o frontend.zip HEAD frontend/


# ================================
# IGNORED FILES
# ================================

git status --ignored
git check-ignore -v *


# ================================
# CLEAN PROJECT
# ================================

git clean -fdn
git clean -fd


# ================================
# BASIC WORKFLOW
# ================================

git init
git clone <repo-url>

git add .
git commit -m "your message"
git push
git pull


# ================================
# EXPORT ONLY CODE EXTENSIONS
# ================================

git ls-files | findstr ".py .ts .tsx .js .jsx .json" > code-only.txt