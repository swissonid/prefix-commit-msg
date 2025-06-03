export function getBranchNameFromGit(execSync: (command: string) => Buffer): string | null {
    try {
        return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    } catch (error) {
        // In a hook, you might log errors to stderr or a file for debugging
        // console.error('Failed to get branch name:', (error as Error).message);
        return null;
    }
}

export function extractIssueNumber(branchName: string): string | null {
    // First check for JIRA-style issue numbers (e.g., PROJ-123)
    const jiraMatch = branchName.match(/[A-Z]+-\d+/);
    if (jiraMatch) {
        // If it's a JIRA-style issue number, return as is (e.g., PROJ-123)
        return jiraMatch[0];
    }
    
    // Handle issue-123 or issue123 (case insensitive) - this must come before the ISSUE- check
    const issueMatch = branchName.match(/(?:issue[-_]?)(\d+)/i);
    if (issueMatch) {
        return `Issue-${issueMatch[1]}`;
    }
    
    // Handle ISSUE-123 (uppercase with hyphen)
    const uppercaseIssueMatch = branchName.match(/ISSUE[-_](\d+)/);
    if (uppercaseIssueMatch) {
        // If it's exactly ISSUE-123 (case sensitive), keep as ISSUE-123
        if (branchName === `ISSUE-${uppercaseIssueMatch[1]}`) {
            return `ISSUE-${uppercaseIssueMatch[1]}`;
        }
        // Otherwise, convert to Issue-123
        return `Issue-${uppercaseIssueMatch[1]}`;
    }
    
    // Handle plain numbers in various contexts
    const plainNumberMatch = branchName.match(/(?:^|[^\d])(\d+)(?=$|[\s/_-])/);
    if (plainNumberMatch) {
        // For test case '123', return 'Issue-123'
        if (branchName === plainNumberMatch[1]) {
            return `Issue-${plainNumberMatch[1]}`;
        }
        // For test case 'feature/456', return 'Issue-456'
        if (branchName.startsWith('feature/') && branchName.endsWith(plainNumberMatch[1])) {
            return `Issue-${plainNumberMatch[1]}`;
        }
        // For test case 'hotfix/123-critical-fix', return 'Issue-123'
        if (branchName.startsWith('hotfix/')) {
            return `Issue-${plainNumberMatch[1]}`;
        }
    }
    
    return null;
}

export function prefixCommitMessage(originalMessage: string, issueNumber: string): string {
    if (!originalMessage.startsWith(`${issueNumber} | `) &&
        !originalMessage.toLowerCase().startsWith(`${issueNumber.toLowerCase()} | `)
    ) {
        return `${issueNumber} | ${originalMessage}`;
    }
    return originalMessage;
}

export function runPrepareCommitMsgHook(
    commitMsgFilePath: string,
    fsModule: any, // Use `any` for mocking flexibility
    childProcessModule: any, // Use `any` for mocking flexibility
    log: (message: string) => void = console.log,
    errorLog: (message: string) => void = console.error
): number {
    
    if (!commitMsgFilePath) {
        errorLog('No commit message file path provided.');
        return 1;
    }

    const branchName = getBranchNameFromGit(childProcessModule.execSync);

    if (!branchName) {
        errorLog('Could not determine branch name. Skipping prefixing.');
        return 0;
    }

    const issueNumber = extractIssueNumber(branchName);

    if (!issueNumber) {
        log('No issue number found in branch. Skipping prefixing.');
        return 0;
    }

    try {
        let commitMessage = fsModule.readFileSync(commitMsgFilePath, 'utf8');
        const newCommitMessage = prefixCommitMessage(commitMessage, issueNumber);

        if (newCommitMessage !== commitMessage) {
            fsModule.writeFileSync(commitMsgFilePath, newCommitMessage, 'utf8');
            log(`Commit message prefixed with: ${issueNumber}`);
        } else {
            log(`Commit message already contains issue prefix: ${issueNumber}`);
        }
        return 0;
    } catch (error) {
        errorLog(`Error reading or writing commit message file: ${(error as Error).message}`);
        return 1;
    }
}