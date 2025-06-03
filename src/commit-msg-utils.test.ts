import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractIssueNumber, prefixCommitMessage, runPrepareCommitMsgHook } from './commit-msg-utils';

describe('commit-msg-utils', () => {
  // Mock dependencies
  const mockFs = {
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
  };
  
  const mockChildProcess = {
    execSync: vi.fn(),
  };

  const mockLog = vi.fn();
  const mockErrorLog = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractIssueNumber', () => {
    it('should extract issue number from branch name with issue- prefix', () => {
      expect(extractIssueNumber('issue-123')).toBe('Issue-123');
      expect(extractIssueNumber('ISSUE-456')).toBe('ISSUE-456'); // Keep as is since it's a valid JIRA-style issue
      expect(extractIssueNumber('feature/issue-789')).toBe('Issue-789');
    });

    it('should extract JIRA-style issue numbers', () => {
      expect(extractIssueNumber('PROJ-123')).toBe('PROJ-123');
      expect(extractIssueNumber('feature/PROJ-456')).toBe('PROJ-456');
      expect(extractIssueNumber('bugfix/ABC-789')).toBe('ABC-789');
    });

    it('should extract plain numbers as Issue-{number}', () => {
      expect(extractIssueNumber('123')).toBe('Issue-123');
      expect(extractIssueNumber('feature/456')).toBe('Issue-456');
    });

    it('should handle various branch name formats', () => {
      expect(extractIssueNumber('feature/issue-123-add-feature')).toBe('Issue-123');
      expect(extractIssueNumber('bugfix/PROJ-456-fix-bug')).toBe('PROJ-456');
      expect(extractIssueNumber('hotfix/123-critical-fix')).toBe('Issue-123');
    });

    it('should return null when no issue number is found', () => {
      expect(extractIssueNumber('main')).toBeNull();
      expect(extractIssueNumber('develop')).toBeNull();
      expect(extractIssueNumber('feature/update-readme')).toBeNull();
    });
  });

  describe('prefixCommitMessage', () => {
    it('should prefix message with issue number', () => {
      expect(prefixCommitMessage('Update code', 'ABC-123')).toBe('ABC-123 | Update code');
      expect(prefixCommitMessage('Fix bug', 'Issue-456')).toBe('Issue-456 | Fix bug');
    });

    it('should not add duplicate prefix', () => {
      expect(prefixCommitMessage('ABC-123 | Update code', 'ABC-123')).toBe('ABC-123 | Update code');
      expect(prefixCommitMessage('abc-123 | Update code', 'ABC-123')).toBe('abc-123 | Update code');
      expect(prefixCommitMessage('Issue-456 | Fix bug', 'ISSUE-456')).toBe('Issue-456 | Fix bug');
    });
  });

  describe('runPrepareCommitMsgHook', () => {
    it('should prefix commit message with issue number from branch', () => {
      const commitMsgFile = '/tmp/commit-msg';
      const originalMessage = 'Update implementation';
      const branchName = 'feature/ABC-123-update-feature';
      
      mockChildProcess.execSync.mockReturnValue(Buffer.from(branchName));
      mockFs.readFileSync.mockReturnValue(originalMessage);

      const result = runPrepareCommitMsgHook(
        commitMsgFile,
        mockFs,
        mockChildProcess,
        mockLog,
        mockErrorLog
      );

      expect(result).toBe(0);
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        commitMsgFile,
        'ABC-123 | Update implementation',
        'utf8'
      );
      expect(mockLog).toHaveBeenCalledWith('Commit message prefixed with: ABC-123');
    });

    it('should not modify commit message if already prefixed', () => {
      const commitMsgFile = '/tmp/commit-msg';
      const prefixedMessage = 'ABC-123 | Already prefixed';
      const branchName = 'feature/ABC-123-update-feature';
      
      mockChildProcess.execSync.mockReturnValue(Buffer.from(branchName));
      mockFs.readFileSync.mockReturnValue(prefixedMessage);

      const result = runPrepareCommitMsgHook(
        commitMsgFile,
        mockFs,
        mockChildProcess,
        mockLog,
        mockErrorLog
      );

      expect(result).toBe(0);
      expect(mockFs.writeFileSync).not.toHaveBeenCalled();
      expect(mockLog).toHaveBeenCalledWith('Commit message already contains issue prefix: ABC-123');
    });

    it('should handle case when no issue number is found in branch', () => {
      const commitMsgFile = '/tmp/commit-msg';
      const originalMessage = 'Update implementation';
      const branchName = 'feature/update-feature';
      
      mockChildProcess.execSync.mockReturnValue(Buffer.from(branchName));
      mockFs.readFileSync.mockReturnValue(originalMessage);

      const result = runPrepareCommitMsgHook(
        commitMsgFile,
        mockFs,
        mockChildProcess,
        mockLog,
        mockErrorLog
      );

      expect(result).toBe(0);
      expect(mockFs.writeFileSync).not.toHaveBeenCalled();
      expect(mockLog).toHaveBeenCalledWith('No issue number found in branch. Skipping prefixing.');
    });

    it('should handle errors when reading git branch', () => {
      const commitMsgFile = '/tmp/commit-msg';
      
      mockChildProcess.execSync.mockImplementation(() => {
        throw new Error('Git error');
      });

      const result = runPrepareCommitMsgHook(
        commitMsgFile,
        mockFs,
        mockChildProcess,
        mockLog,
        mockErrorLog
      );

      expect(result).toBe(0);
      expect(mockErrorLog).toHaveBeenCalledWith('Could not determine branch name. Skipping prefixing.');
    });

    it('should handle errors when reading/writing commit message file', () => {
      const commitMsgFile = '/tmp/commit-msg';
      const branchName = 'feature/ABC-123-update-feature';
      const error = new Error('File system error');
      
      mockChildProcess.execSync.mockReturnValue(Buffer.from(branchName));
      mockFs.readFileSync.mockImplementation(() => {
        throw error;
      });

      const result = runPrepareCommitMsgHook(
        commitMsgFile,
        mockFs,
        mockChildProcess,
        mockLog,
        mockErrorLog
      );

      expect(result).toBe(1);
      expect(mockErrorLog).toHaveBeenCalledWith(
        `Error reading or writing commit message file: ${error.message}`
      );
    });

    it('should return error code when no commit message file path is provided', () => {
      const result = runPrepareCommitMsgHook(
        '',
        mockFs,
        mockChildProcess,
        mockLog,
        mockErrorLog
      );

      expect(result).toBe(1);
      expect(mockErrorLog).toHaveBeenCalledWith('No commit message file path provided.');
    });
  });
});
