# Auto Publish Flow

This repo now supports one-command publish to GitHub, with Vercel deploying automatically from Git pushes.

## Command

```bash
npm run push:auto -- "your commit message"
```

If you omit the message, a timestamped fallback message is used.

## What it does

1. `git add -A`
2. `git commit`
3. `git push origin main`

Because this project is connected to Vercel via Git integration, each push triggers Vercel deployment.

## Notes

- Use this only when you want to commit everything in the working tree.
- For selective commits, keep using standard git commands manually.
