# Prefix Commit Message Git Hook

`prefix-commit-msg` is a Git hook helper designed to automatically prefix your commit messages with issue numbers extracted from your current Git branch name (e.g., `feat/TICKET-123-add-feature` becomes `TICKET-123 | Your commit message`).

## ⚠️ Active Development

This tool is currently under active development. Features and usage may change.

## Purpose

This script is intended to be used as a `prepare-commit-msg` Git hook. It helps ensure that commit messages are consistently associated with a ticket or issue number, improving traceability in project management systems.

## Basic Setup (for local development/testing)

1.  **Build the project:**
    ```bash
    npm run build
    ```
2.  **Link for local use:**
    To test the CLI locally as if it were installed globally:
    ```bash
    npm link
    ```
    You can then run `prefix-commit-msg` in your terminal (ensure you are in a Git repository for it to function as intended with commit messages).

3.  **Git Hook Integration (Manual Example):**
    To use it as a `prepare-commit-msg` hook in a repository, you would typically create a script in `.git/hooks/prepare-commit-msg` that calls this CLI tool:
    ```sh
    #!/bin/sh
    # .git/hooks/prepare-commit-msg

    # Example: if you linked prefix-commit-msg globally
    prefix-commit-msg "$1"

    # Or, if installed as a project dependency (once published):
    # npx prefix-commit-msg "$1"
    ```
    Make sure the hook script is executable (`chmod +x .git/hooks/prepare-commit-msg`).

Further instructions on packaging and distribution will be added as development progresses.
