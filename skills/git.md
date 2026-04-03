---
name: git
description: Git best practices, commit conventions, and branch strategies
tags: [git, version-control, workflow]
---

## Git Best Practices

### Commit Messages (Conventional Commits)
Format: `type(scope): description`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting (no logic change)
- `refactor`: Code restructure (no feature/fix)
- `test`: Adding/fixing tests
- `chore`: Build, deps, configs

Examples:
```
feat(auth): add JWT refresh token support
fix(api): handle null response from user endpoint
docs(readme): update installation instructions
refactor(db): extract query builder into separate module
```

### Branch Strategy (GitHub Flow)
- `main` — always deployable
- `feature/description` — new features
- `fix/description` — bug fixes
- `hotfix/description` — urgent production fixes

### Common Workflows
```bash
# Start new feature
git checkout -b feature/my-feature

# Stage and commit
git add -p  # interactive staging (preferred)
git commit -m "feat(scope): description"

# Update with latest main
git fetch origin
git rebase origin/main

# Push and create PR
git push origin feature/my-feature

# Clean up after merge
git checkout main && git pull
git branch -d feature/my-feature
```

### Recovery
```bash
git log --oneline -10       # recent commits
git diff HEAD~1             # changes from last commit
git revert HEAD             # undo last commit (safe)
git reset --soft HEAD~1     # undo last commit (keep changes)
git stash / git stash pop   # temporarily save changes
```
