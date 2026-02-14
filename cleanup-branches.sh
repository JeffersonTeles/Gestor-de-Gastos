#!/bin/bash

# Branch Cleanup Script
# This script deletes all branches except 'main' from the remote repository

echo "================================================"
echo "Branch Cleanup Script"
echo "================================================"
echo ""
echo "This script will delete the following remote branches:"
echo "  - master"
echo "  - copilot/fix-receita-categorization"
echo "  - copilot/improve-feature"
echo "  - copilot/improve-what-is-needed"
echo "  - gh-pages"
echo ""
echo "The 'main' branch will be preserved."
echo "The 'copilot/delete-other-branches' branch will need to be deleted manually after PR merge."
echo ""
read -p "Do you want to continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Deleting branches..."
echo ""

# Delete each branch
branches=(
    "master"
    "copilot/fix-receita-categorization"
    "copilot/improve-feature"
    "copilot/improve-what-is-needed"
    "gh-pages"
)

for branch in "${branches[@]}"
do
    echo "Deleting branch: $branch"
    if git push origin --delete "$branch" 2>/dev/null; then
        echo "  ✓ Successfully deleted $branch"
    else
        echo "  ✗ Failed to delete $branch (may not exist or permission denied)"
    fi
    echo ""
done

echo "================================================"
echo "Cleanup complete!"
echo "================================================"
echo ""
echo "Remember to delete 'copilot/delete-other-branches' after this PR is merged."
echo ""
