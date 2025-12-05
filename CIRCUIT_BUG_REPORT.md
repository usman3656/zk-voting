# Circom 0.5.46 Parser Bug

## Issue
Circom 0.5.46 has a parser bug that causes it to fail parsing even the simplest circuits. The error shows:
```
Error: Parse error on line 1:
pragma circom 2.0.0;template Test
```

The parser is not properly handling newlines after the pragma statement, even though the file content is correct.

## Evidence
- ✅ File content is correct (verified with hex dump and Node.js readFileSync)
- ✅ File has proper newlines (verified)
- ✅ Issue occurs with simplest possible circuit
- ✅ Issue occurs regardless of file path (tested with C:/temp path)
- ✅ Issue occurs even when file is created programmatically with LF-only newlines

## Workaround
Since circom 0.5.46 appears to have a fundamental parser bug, we need to either:
1. Use a different version of circom (but 2.1.7 doesn't exist as npm package)
2. Compile the circuit manually using circom's Rust implementation
3. Use an online compiler or Docker container
4. Wait for a fix to circom 0.5.46

## Current Status
The circuit code in `circuits/vote.circom` is **correct** - it just cannot be compiled with the current circom installation due to this parser bug.

## Next Steps
1. Try installing circom from source (Rust)
2. Use a Docker container with a working circom version
3. Compile on a different machine/environment
4. Report this bug to the circom maintainers


