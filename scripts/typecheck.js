const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const tsconfig = require('../tsconfig');

const parseConfigHost = {
  fileExists: fs.existsSync,
  readDirectory: ts.sys.readDirectory,
  readFile(file) {
    return fs.readFileSync(file, 'utf8');
  },
  useCaseSensitiveFileNames: true,
};

const cwd = process.cwd();

const parsed = ts.parseJsonConfigFileContent(
  tsconfig,
  parseConfigHost,
  cwd
);

const argv = process.argv.slice(2);
const typingsPath = path.resolve(cwd, './src/typings.d.ts');

if (!argv.includes(typingsPath)) {
  argv.push(typingsPath);
}

const program = ts.createProgram(argv, {
  ...parsed.options,
  noEmit: true,
});

const emitResult = program.emit();

const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

for (const diagnostic of allDiagnostics) {
  if (diagnostic.file) {
    const {line, character} = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
  } else {
    console.log(`${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`);
  }
}

const exitCode = allDiagnostics.length > 0 ? 1 : 0;
process.exit(exitCode);
