# CI/CD Setup & Maintenance Guide

This document explains the automated CI/CD pipeline for CareSync.

## Workflows Overview

| Workflow | File | Trigger |
|----------|------|---------|
| CI Pipeline (Lint + TypeScript + Tests) | `.github/workflows/ci.yml` | Every PR |
| SonarQube Analysis | `.github/workflows/sonarqube.yml` | Every PR |
| Dependency Review | `.github/workflows/dependency-review.yml` | Every PR |

## Required GitHub Secrets

Go to **Settings → Secrets and variables → Actions** and add:

| Secret | Description |
|--------|-------------|
| `SONAR_TOKEN` | Your SonarQube authentication token |
| `SONAR_HOST_URL` | Your SonarQube server URL (e.g. `https://sonarcloud.io`) |

### Getting SonarQube credentials (SonarCloud — free for open source)
1. Go to [sonarcloud.io](https://sonarcloud.io) and sign in with GitHub.
2. Click **+** → **Analyze new project** → select `vallabhatech/CareSync`.
3. Copy the **Project Key** into `sonar-project.properties`.
4. Generate a token under **My Account → Security** and add it as `SONAR_TOKEN`.
5. Set `SONAR_HOST_URL` to `https://sonarcloud.io`.

## CodeRabbit Setup

CodeRabbit is configured via `.github/coderabbit.yml`.

1. Go to [coderabbit.ai](https://coderabbit.ai) and sign in with GitHub.
2. Install the CodeRabbit GitHub App on the `vallabhatech/CareSync` repo.
3. CodeRabbit will automatically review every new PR using the config in `.github/coderabbit.yml`.

No secrets required — CodeRabbit uses its own GitHub App token.

## Local Development Checks

Run these before pushing to avoid CI failures:

```bash
# Lint
npm run lint

# Type check
npx tsc --noEmit

# Tests
npm test
```

## PR Checklist

Before marking a PR ready for review, ensure:
- [ ] ESLint passes with no errors
- [ ] TypeScript compiles with no errors
- [ ] All tests pass
- [ ] SonarQube shows no new critical/blocker issues
- [ ] CodeRabbit review comments are addressed