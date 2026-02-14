# Branch Cleanup Instructions

## Current Branch Status

Based on the repository analysis, the following branches exist:

### Branch to Keep
- ✅ **main** - Primary branch (will be preserved)

### Branches to Delete
- ❌ **master** - Duplicate of main branch
- ❌ **copilot/delete-other-branches** - Current PR branch (can be deleted after merge)
- ❌ **copilot/fix-receita-categorization** - Old copilot branch
- ❌ **copilot/improve-feature** - Old copilot branch
- ❌ **copilot/improve-what-is-needed** - Old copilot branch
- ❌ **gh-pages** - GitHub pages branch

## How to Delete Branches

### Option 1: Using GitHub Web Interface (Recommended)
1. Go to https://github.com/JeffersonTeles/Gestor-de-Gastos
2. Click on "branches" (shows the count of branches)
3. For each branch you want to delete:
   - Find the branch in the list
   - Click the trash/delete icon next to it
   - Confirm the deletion

### Option 2: Using Git Command Line
If you prefer to use the command line, run these commands from your local machine:

```bash
# Delete remote branches
git push origin --delete master
git push origin --delete copilot/fix-receita-categorization
git push origin --delete copilot/improve-feature
git push origin --delete copilot/improve-what-is-needed
git push origin --delete gh-pages

# After this PR is merged, also delete:
git push origin --delete copilot/delete-other-branches
```

### Option 3: Using GitHub CLI
If you have GitHub CLI installed:

```bash
gh api repos/JeffersonTeles/Gestor-de-Gastos/git/refs/heads/master -X DELETE
gh api repos/JeffersonTeles/Gestor-de-Gastos/git/refs/heads/copilot/fix-receita-categorization -X DELETE
gh api repos/JeffersonTeles/Gestor-de-Gastos/git/refs/heads/copilot/improve-feature -X DELETE
gh api repos/JeffersonTeles/Gestor-de-Gastos/git/refs/heads/copilot/improve-what-is-needed -X DELETE
gh api repos/JeffersonTeles/Gestor-de-Gastos/git/refs/heads/gh-pages -X DELETE
```

## After Cleanup

After deleting all branches except `main`, you will have:
- Only the `main` branch remaining
- A cleaner repository structure
- Easier branch management going forward

## Notes

- The `copilot/delete-other-branches` branch (current PR branch) should be deleted after this PR is merged
- Make sure you have any important code from other branches before deleting them
- The `main` branch contains the latest stable version of your project
