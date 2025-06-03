import * as fs from 'fs';
import * as child_process from 'child_process';
import { runPrepareCommitMsgHook } from './commit-msg-utils'; // Import the main hook function

// Git hooks pass arguments to the script. For prepare-commit-msg,
// the first argument is the path to the commit message file.
const commitMsgFilePath = process.argv[2];

// Call your main hook logic
const exitCode = runPrepareCommitMsgHook(
    commitMsgFilePath,
    fs, // Pass actual fs module
    child_process, // Pass actual child_process module
    console.log,
    console.error
);

// Ensure the hook exits with the correct status code
process.exit(exitCode);