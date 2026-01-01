# Git History Cleanup Guide

This document provides instructions for cleaning up the Git repository history to remove sensitive files and improve commit messages.

## ⚠️ Important Notes

- **Backup your repository first!** These operations rewrite Git history.
- If you've already pushed to a remote repository, you'll need to force push, which can affect collaborators.
- Consider creating a fresh repository if the history cleanup is too complex.

## 1. Remove `venv/` from Git History

The `venv/` folder was accidentally committed. Even though it's now in `.gitignore`, it still exists in the Git history. Here's how to remove it:

### Option A: Using git filter-repo (Recommended)

```bash
# Install git-filter-repo if not already installed
# macOS: brew install git-filter-repo
# Or: pip install git-filter-repo

# Remove venv/ from entire history
git filter-repo --path venv --invert-paths

# Force push to remote (WARNING: This rewrites history)
git push origin --force --all
```

### Option B: Using git filter-branch (Built-in, but slower)

```bash
git filter-branch --force --index-filter \
  "git rm -rf --cached --ignore-unmatch venv" \
  --prune-empty --tag-name-filter cat -- --all

# Force push to remote
git push origin --force --all
```

### Option C: Fresh Start (Easiest, but loses history)

If the repository history isn't critical:

```bash
# Remove venv from current working directory
rm -rf venv

# Create a new orphan branch (no history)
git checkout --orphan clean-main
git add .
git commit -m "Initial commit: SpeechScore - AI-powered speech coach"

# Delete old main branch and rename
git branch -D main
git branch -m main

# Force push
git push origin --force --all
```

## 2. Improve Commit Messages

If you want to rewrite recent commit messages to be more professional:

```bash
# Interactive rebase of last N commits (replace N with number)
git rebase -i HEAD~N

# In the editor, change 'pick' to 'reword' for commits you want to edit
# Save and close, then Git will prompt you to edit each commit message

# Example of good commit messages:
# - "feat: add environment variable support for Firebase config"
# - "fix: remove hardcoded API keys from frontend"
# - "docs: add setup instructions and contributing guidelines"
# - "refactor: improve error handling in Firebase authentication"
```

## 3. Remove Sensitive Files from History

If any Firebase credential files were ever committed:

```bash
# Remove specific file patterns from history
git filter-repo --path-glob '*-firebase-adminsdk-*.json' --invert-paths

# Or using filter-branch
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch *-firebase-adminsdk-*.json" \
  --prune-empty --tag-name-filter cat -- --all
```

## 4. Verify Changes

After cleanup, verify the repository:

```bash
# Check repository size
du -sh .git

# Verify venv is not in history
git log --all --full-history -- venv/

# Check for any remaining sensitive files
git log --all --full-history -- "*-firebase-adminsdk-*.json"
```

## 5. Update Remote Repository

After cleaning up history:

```bash
# Force push all branches
git push origin --force --all

# Force push all tags
git push origin --force --tags
```

## ⚠️ Warnings

1. **Force pushing rewrites remote history** - Anyone who has cloned the repo will need to re-clone or reset their local copy.
2. **Backup first** - Always create a backup branch before major history rewrites:
   ```bash
   git branch backup-before-cleanup
   git push origin backup-before-cleanup
   ```
3. **Coordinate with collaborators** - If others are working on this repo, coordinate the cleanup.

## Alternative: Start Fresh

If the Git history is too messy or you don't need to preserve it:

1. Create a new repository
2. Copy all current files (excluding `venv/` and `.env` files)
3. Make an initial commit with a clean message
4. Update the remote URL to point to the new repository

This is often the cleanest approach for personal projects.

