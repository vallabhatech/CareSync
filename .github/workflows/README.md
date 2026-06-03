# GitHub Actions Workflows Documentation

This directory contains automated workflows for the CareSync repository to streamline issue and pull request management.

## Overview

The following workflows automate common repository tasks:
- Welcome comments for new issues and pull requests
- Automatic assignment to the maintainer
- Automatic review requests for pull requests
- Automatic label application

## Workflow Files

### 1. issue-welcome.yml

**Purpose**: Automatically posts a friendly welcome comment when a new issue is opened.

**Triggers**: 
- `issues: opened`

**What it does**:
- Posts a welcome message thanking the contributor
- Encourages providing screenshots, logs, reproduction steps, and environment details
- Links to the contributing guidelines
- Checks for existing welcome comments to avoid duplicates

**Permissions required**:
- `issues: write`

**Key features**:
- Uses `actions/github-script@v7` for GitHub API interactions
- Duplicate detection to prevent multiple welcome comments
- Dynamic repository links in the comment

---

### 2. pr-welcome.yml

**Purpose**: Automatically posts a welcome comment when a new pull request is opened.

**Triggers**: 
- `pull_request: opened`

**What it does**:
- Posts a welcome message thanking the contributor for their code
- Mentions that automated checks are running
- Informs that maintainers will review the changes
- Encourages responding to review comments
- Links to the contributing guidelines
- Checks for existing welcome comments to avoid duplicates

**Permissions required**:
- `pull-requests: write`

**Key features**:
- Uses `actions/github-script@v7` for GitHub API interactions
- Duplicate detection to prevent multiple welcome comments
- Dynamic repository links in the comment

---

### 3. auto-assign.yml

**Purpose**: Automatically assigns the maintainer (vallabhatech) to new issues and pull requests.

**Triggers**: 
- `issues: opened`
- `pull_request: opened`

**What it does**:
- Assigns `vallabhatech` to newly opened issues
- Assigns `vallabhatech` to newly opened pull requests
- Logs the assignment action for tracking

**Permissions required**:
- `issues: write`
- `pull-requests: write`

**Key features**:
- Uses `actions/github-script@v7` for GitHub API interactions
- Handles both issues and pull requests in a single workflow
- Console logging for debugging

---

### 4. auto-review-request.yml

**Purpose**: Automatically requests a review from vallabhatech for new pull requests.

**Triggers**: 
- `pull_request: opened`

**What it does**:
- Requests a formal review from `vallabhatech` using GitHub's review request system
- Logs the review request action for tracking

**Permissions required**:
- `pull-requests: write`

**Key features**:
- Uses `actions/github-script@v7` for GitHub API interactions
- Uses GitHub's native review request system (not just comments)
- Console logging for debugging

---

### 5. label-management.yml

**Purpose**: Automatically applies the "elusoc" label to new issues and pull requests.

**Triggers**: 
- `issues: opened`
- `pull_request: opened`

**What it does**:
- Checks if the "elusoc" label exists in the repository
- Creates the label if it doesn't exist (with color: #0066cc)
- Applies the "elusoc" label to newly opened issues
- Applies the "elusoc" label to newly opened pull requests
- Logs all actions for tracking

**Permissions required**:
- `issues: write`
- `pull-requests: write`
- `contents: read` (required to check repository labels)

**Key features**:
- Uses `actions/github-script@v7` for GitHub API interactions
- Automatic label creation if it doesn't exist
- Handles both issues and pull requests in a single workflow
- Console logging for debugging

---

## Required Repository Permissions

All workflows use least-privilege permissions. The repository must have the following permissions enabled in GitHub Actions settings:

- **Read and write permissions** for:
  - Issues
  - Pull requests
  - Contents (read-only for label checking)

### How to Enable Permissions

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Actions** → **General**
3. Under **Workflow permissions**, select:
   - ✅ **Read and write permissions**
4. Click **Save**

## Required GitHub Marketplace Actions

All workflows use official GitHub Actions:

- **actions/github-script@v7** - Used for all GitHub API interactions
  - This is an official GitHub action maintained by GitHub
  - No additional setup required
  - Automatically authenticated with the repository's GITHUB_TOKEN

## Setup Instructions

### Step 1: Verify Workflow Files

Ensure all workflow files are present in `.github/workflows/`:
- ✅ issue-welcome.yml
- ✅ pr-welcome.yml
- ✅ auto-assign.yml
- ✅ auto-review-request.yml
- ✅ label-management.yml

### Step 2: Enable Workflow Permissions

1. Go to your repository on GitHub
2. Click **Settings** → **Actions** → **General**
3. Under **Workflow permissions**, select **Read and write permissions**
4. Click **Save**

### Step 3: Verify Maintainer Username

Ensure the maintainer username `vallabhatech` exists on GitHub and has:
- Collaborator access to the repository (if it's a private repo)
- Or is a member of the organization (if it's an organization repo)

### Step 4: Test the Workflows

To test the workflows:

1. **Test issue automation**:
   - Create a new issue in the repository
   - Verify that:
     - A welcome comment is posted
     - The issue is assigned to vallabhatech
     - The "elusoc" label is applied

2. **Test pull request automation**:
   - Create a new pull request
   - Verify that:
     - A welcome comment is posted
     - The PR is assigned to vallabhatech
     - A review is requested from vallabhatech
     - The "elusoc" label is applied

### Step 5: Monitor Workflow Runs

1. Go to the **Actions** tab in your repository
2. Click on each workflow to see its run history
3. Check for any errors or warnings in the workflow logs

## Workflow Coordination

All workflows are designed to work together without conflicts:

- **No race conditions**: Each workflow operates independently on different aspects
- **Duplicate prevention**: Welcome workflows check for existing comments before posting
- **Idempotent operations**: Assignment, review requests, and labels can be safely applied multiple times
- **Parallel execution**: All workflows run in parallel when triggered, improving response time

## Troubleshooting

### Workflows not running

- Check that workflow permissions are enabled (see Step 2 above)
- Verify the workflow files are in the correct directory: `.github/workflows/`
- Check the Actions tab for error messages

### Welcome comments not appearing

- Check if a welcome comment already exists (workflows avoid duplicates)
- Verify the `issues: write` or `pull-requests: write` permissions are enabled
- Check the Actions tab for workflow errors

### Assignment or review requests failing

- Verify that `vallabhatech` has access to the repository
- Check that the user exists on GitHub
- Review the workflow logs in the Actions tab

### Label not being applied

- The workflow will automatically create the label if it doesn't exist
- Check the Actions tab for any errors during label creation
- Verify the `issues: write` and `pull-requests: write` permissions are enabled

## Customization

### Changing the Maintainer

To change the assigned maintainer and reviewer, update the username in:
- `auto-assign.yml`: Change `vallabhatech` to the desired username
- `auto-review-request.yml`: Change `vallabhatech` to the desired username

### Changing the Label

To change the label name, color, or description, update in `label-management.yml`:
- `labelName`: Change 'elusoc' to your desired label name
- `labelColor`: Change '0066cc' to your desired hex color
- `labelDescription`: Update the description text

### Modifying Welcome Messages

To customize the welcome messages, edit the `body` parameter in:
- `issue-welcome.yml`: Modify the issue welcome message
- `pr-welcome.yml`: Modify the pull request welcome message

## Best Practices Followed

- ✅ **Least-privilege permissions**: Each workflow only requests the permissions it needs
- ✅ **Official GitHub Actions**: Uses `actions/github-script@v7` maintained by GitHub
- ✅ **Duplicate prevention**: Welcome workflows check for existing comments
- ✅ **Error handling**: Workflows include try-catch blocks for label creation
- ✅ **Logging**: Console logging for debugging and monitoring
- ✅ **Comments**: Each workflow includes inline comments explaining functionality
- ✅ **Idempotent operations**: Safe to run multiple times without side effects

## Support

For issues or questions about these workflows:
1. Check the Actions tab for workflow run logs
2. Review this documentation for troubleshooting steps
3. Open an issue in the repository with details about the problem
