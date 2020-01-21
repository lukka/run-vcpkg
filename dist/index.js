module.exports =
/******/ (function(modules, runtime) { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	__webpack_require__.ab = __dirname + "/";
/******/
/******/ 	// the startup function
/******/ 	function startup() {
/******/ 		// Load entry module and return exports
/******/ 		return __webpack_require__(16);
/******/ 	};
/******/
/******/ 	// run startup
/******/ 	return startup();
/******/ })
/************************************************************************/
/******/ ({

/***/ 1:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const childProcess = __webpack_require__(129);
const path = __webpack_require__(622);
const util_1 = __webpack_require__(669);
const ioUtil = __webpack_require__(672);
const exec = util_1.promisify(childProcess.exec);
/**
 * Copies a file or folder.
 * Based off of shelljs - https://github.com/shelljs/shelljs/blob/9237f66c52e5daa40458f94f9565e18e8132f5a6/src/cp.js
 *
 * @param     source    source path
 * @param     dest      destination path
 * @param     options   optional. See CopyOptions.
 */
function cp(source, dest, options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const { force, recursive } = readCopyOptions(options);
        const destStat = (yield ioUtil.exists(dest)) ? yield ioUtil.stat(dest) : null;
        // Dest is an existing file, but not forcing
        if (destStat && destStat.isFile() && !force) {
            return;
        }
        // If dest is an existing directory, should copy inside.
        const newDest = destStat && destStat.isDirectory()
            ? path.join(dest, path.basename(source))
            : dest;
        if (!(yield ioUtil.exists(source))) {
            throw new Error(`no such file or directory: ${source}`);
        }
        const sourceStat = yield ioUtil.stat(source);
        if (sourceStat.isDirectory()) {
            if (!recursive) {
                throw new Error(`Failed to copy. ${source} is a directory, but tried to copy without recursive flag.`);
            }
            else {
                yield cpDirRecursive(source, newDest, 0, force);
            }
        }
        else {
            if (path.relative(source, newDest) === '') {
                // a file cannot be copied to itself
                throw new Error(`'${newDest}' and '${source}' are the same file`);
            }
            yield copyFile(source, newDest, force);
        }
    });
}
exports.cp = cp;
/**
 * Moves a path.
 *
 * @param     source    source path
 * @param     dest      destination path
 * @param     options   optional. See MoveOptions.
 */
function mv(source, dest, options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        if (yield ioUtil.exists(dest)) {
            let destExists = true;
            if (yield ioUtil.isDirectory(dest)) {
                // If dest is directory copy src into dest
                dest = path.join(dest, path.basename(source));
                destExists = yield ioUtil.exists(dest);
            }
            if (destExists) {
                if (options.force == null || options.force) {
                    yield rmRF(dest);
                }
                else {
                    throw new Error('Destination already exists');
                }
            }
        }
        yield mkdirP(path.dirname(dest));
        yield ioUtil.rename(source, dest);
    });
}
exports.mv = mv;
/**
 * Remove a path recursively with force
 *
 * @param inputPath path to remove
 */
function rmRF(inputPath) {
    return __awaiter(this, void 0, void 0, function* () {
        if (ioUtil.IS_WINDOWS) {
            // Node doesn't provide a delete operation, only an unlink function. This means that if the file is being used by another
            // program (e.g. antivirus), it won't be deleted. To address this, we shell out the work to rd/del.
            try {
                if (yield ioUtil.isDirectory(inputPath, true)) {
                    yield exec(`rd /s /q "${inputPath}"`);
                }
                else {
                    yield exec(`del /f /a "${inputPath}"`);
                }
            }
            catch (err) {
                // if you try to delete a file that doesn't exist, desired result is achieved
                // other errors are valid
                if (err.code !== 'ENOENT')
                    throw err;
            }
            // Shelling out fails to remove a symlink folder with missing source, this unlink catches that
            try {
                yield ioUtil.unlink(inputPath);
            }
            catch (err) {
                // if you try to delete a file that doesn't exist, desired result is achieved
                // other errors are valid
                if (err.code !== 'ENOENT')
                    throw err;
            }
        }
        else {
            let isDir = false;
            try {
                isDir = yield ioUtil.isDirectory(inputPath);
            }
            catch (err) {
                // if you try to delete a file that doesn't exist, desired result is achieved
                // other errors are valid
                if (err.code !== 'ENOENT')
                    throw err;
                return;
            }
            if (isDir) {
                yield exec(`rm -rf "${inputPath}"`);
            }
            else {
                yield ioUtil.unlink(inputPath);
            }
        }
    });
}
exports.rmRF = rmRF;
/**
 * Make a directory.  Creates the full path with folders in between
 * Will throw if it fails
 *
 * @param   fsPath        path to create
 * @returns Promise<void>
 */
function mkdirP(fsPath) {
    return __awaiter(this, void 0, void 0, function* () {
        yield ioUtil.mkdirP(fsPath);
    });
}
exports.mkdirP = mkdirP;
/**
 * Returns path of a tool had the tool actually been invoked.  Resolves via paths.
 * If you check and the tool does not exist, it will throw.
 *
 * @param     tool              name of the tool
 * @param     check             whether to check if tool exists
 * @returns   Promise<string>   path to tool
 */
function which(tool, check) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!tool) {
            throw new Error("parameter 'tool' is required");
        }
        // recursive when check=true
        if (check) {
            const result = yield which(tool, false);
            if (!result) {
                if (ioUtil.IS_WINDOWS) {
                    throw new Error(`Unable to locate executable file: ${tool}. Please verify either the file path exists or the file can be found within a directory specified by the PATH environment variable. Also verify the file has a valid extension for an executable file.`);
                }
                else {
                    throw new Error(`Unable to locate executable file: ${tool}. Please verify either the file path exists or the file can be found within a directory specified by the PATH environment variable. Also check the file mode to verify the file is executable.`);
                }
            }
        }
        try {
            // build the list of extensions to try
            const extensions = [];
            if (ioUtil.IS_WINDOWS && process.env.PATHEXT) {
                for (const extension of process.env.PATHEXT.split(path.delimiter)) {
                    if (extension) {
                        extensions.push(extension);
                    }
                }
            }
            // if it's rooted, return it if exists. otherwise return empty.
            if (ioUtil.isRooted(tool)) {
                const filePath = yield ioUtil.tryGetExecutablePath(tool, extensions);
                if (filePath) {
                    return filePath;
                }
                return '';
            }
            // if any path separators, return empty
            if (tool.includes('/') || (ioUtil.IS_WINDOWS && tool.includes('\\'))) {
                return '';
            }
            // build the list of directories
            //
            // Note, technically "where" checks the current directory on Windows. From a toolkit perspective,
            // it feels like we should not do this. Checking the current directory seems like more of a use
            // case of a shell, and the which() function exposed by the toolkit should strive for consistency
            // across platforms.
            const directories = [];
            if (process.env.PATH) {
                for (const p of process.env.PATH.split(path.delimiter)) {
                    if (p) {
                        directories.push(p);
                    }
                }
            }
            // return the first match
            for (const directory of directories) {
                const filePath = yield ioUtil.tryGetExecutablePath(directory + path.sep + tool, extensions);
                if (filePath) {
                    return filePath;
                }
            }
            return '';
        }
        catch (err) {
            throw new Error(`which failed with message ${err.message}`);
        }
    });
}
exports.which = which;
function readCopyOptions(options) {
    const force = options.force == null ? true : options.force;
    const recursive = Boolean(options.recursive);
    return { force, recursive };
}
function cpDirRecursive(sourceDir, destDir, currentDepth, force) {
    return __awaiter(this, void 0, void 0, function* () {
        // Ensure there is not a run away recursive copy
        if (currentDepth >= 255)
            return;
        currentDepth++;
        yield mkdirP(destDir);
        const files = yield ioUtil.readdir(sourceDir);
        for (const fileName of files) {
            const srcFile = `${sourceDir}/${fileName}`;
            const destFile = `${destDir}/${fileName}`;
            const srcFileStat = yield ioUtil.lstat(srcFile);
            if (srcFileStat.isDirectory()) {
                // Recurse
                yield cpDirRecursive(srcFile, destFile, currentDepth, force);
            }
            else {
                yield copyFile(srcFile, destFile, force);
            }
        }
        // Change the mode for the newly created directory
        yield ioUtil.chmod(destDir, (yield ioUtil.stat(sourceDir)).mode);
    });
}
// Buffered file copy
function copyFile(srcFile, destFile, force) {
    return __awaiter(this, void 0, void 0, function* () {
        if ((yield ioUtil.lstat(srcFile)).isSymbolicLink()) {
            // unlink/re-link it
            try {
                yield ioUtil.lstat(destFile);
                yield ioUtil.unlink(destFile);
            }
            catch (e) {
                // Try to override file permission
                if (e.code === 'EPERM') {
                    yield ioUtil.chmod(destFile, '0666');
                    yield ioUtil.unlink(destFile);
                }
                // other errors = it doesn't exist, no work to do
            }
            // Copy over symlink
            const symlinkFull = yield ioUtil.readlink(srcFile);
            yield ioUtil.symlink(symlinkFull, destFile, ioUtil.IS_WINDOWS ? 'junction' : null);
        }
        else if (!(yield ioUtil.exists(destFile)) || force) {
            yield ioUtil.copyFile(srcFile, destFile);
        }
    });
}
//# sourceMappingURL=io.js.map

/***/ }),

/***/ 9:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const os = __webpack_require__(87);
const events = __webpack_require__(614);
const child = __webpack_require__(129);
const path = __webpack_require__(622);
const io = __webpack_require__(1);
const ioUtil = __webpack_require__(672);
/* eslint-disable @typescript-eslint/unbound-method */
const IS_WINDOWS = process.platform === 'win32';
/*
 * Class for running command line tools. Handles quoting and arg parsing in a platform agnostic way.
 */
class ToolRunner extends events.EventEmitter {
    constructor(toolPath, args, options) {
        super();
        if (!toolPath) {
            throw new Error("Parameter 'toolPath' cannot be null or empty.");
        }
        this.toolPath = toolPath;
        this.args = args || [];
        this.options = options || {};
    }
    _debug(message) {
        if (this.options.listeners && this.options.listeners.debug) {
            this.options.listeners.debug(message);
        }
    }
    _getCommandString(options, noPrefix) {
        const toolPath = this._getSpawnFileName();
        const args = this._getSpawnArgs(options);
        let cmd = noPrefix ? '' : '[command]'; // omit prefix when piped to a second tool
        if (IS_WINDOWS) {
            // Windows + cmd file
            if (this._isCmdFile()) {
                cmd += toolPath;
                for (const a of args) {
                    cmd += ` ${a}`;
                }
            }
            // Windows + verbatim
            else if (options.windowsVerbatimArguments) {
                cmd += `"${toolPath}"`;
                for (const a of args) {
                    cmd += ` ${a}`;
                }
            }
            // Windows (regular)
            else {
                cmd += this._windowsQuoteCmdArg(toolPath);
                for (const a of args) {
                    cmd += ` ${this._windowsQuoteCmdArg(a)}`;
                }
            }
        }
        else {
            // OSX/Linux - this can likely be improved with some form of quoting.
            // creating processes on Unix is fundamentally different than Windows.
            // on Unix, execvp() takes an arg array.
            cmd += toolPath;
            for (const a of args) {
                cmd += ` ${a}`;
            }
        }
        return cmd;
    }
    _processLineBuffer(data, strBuffer, onLine) {
        try {
            let s = strBuffer + data.toString();
            let n = s.indexOf(os.EOL);
            while (n > -1) {
                const line = s.substring(0, n);
                onLine(line);
                // the rest of the string ...
                s = s.substring(n + os.EOL.length);
                n = s.indexOf(os.EOL);
            }
            strBuffer = s;
        }
        catch (err) {
            // streaming lines to console is best effort.  Don't fail a build.
            this._debug(`error processing line. Failed with error ${err}`);
        }
    }
    _getSpawnFileName() {
        if (IS_WINDOWS) {
            if (this._isCmdFile()) {
                return process.env['COMSPEC'] || 'cmd.exe';
            }
        }
        return this.toolPath;
    }
    _getSpawnArgs(options) {
        if (IS_WINDOWS) {
            if (this._isCmdFile()) {
                let argline = `/D /S /C "${this._windowsQuoteCmdArg(this.toolPath)}`;
                for (const a of this.args) {
                    argline += ' ';
                    argline += options.windowsVerbatimArguments
                        ? a
                        : this._windowsQuoteCmdArg(a);
                }
                argline += '"';
                return [argline];
            }
        }
        return this.args;
    }
    _endsWith(str, end) {
        return str.endsWith(end);
    }
    _isCmdFile() {
        const upperToolPath = this.toolPath.toUpperCase();
        return (this._endsWith(upperToolPath, '.CMD') ||
            this._endsWith(upperToolPath, '.BAT'));
    }
    _windowsQuoteCmdArg(arg) {
        // for .exe, apply the normal quoting rules that libuv applies
        if (!this._isCmdFile()) {
            return this._uvQuoteCmdArg(arg);
        }
        // otherwise apply quoting rules specific to the cmd.exe command line parser.
        // the libuv rules are generic and are not designed specifically for cmd.exe
        // command line parser.
        //
        // for a detailed description of the cmd.exe command line parser, refer to
        // http://stackoverflow.com/questions/4094699/how-does-the-windows-command-interpreter-cmd-exe-parse-scripts/7970912#7970912
        // need quotes for empty arg
        if (!arg) {
            return '""';
        }
        // determine whether the arg needs to be quoted
        const cmdSpecialChars = [
            ' ',
            '\t',
            '&',
            '(',
            ')',
            '[',
            ']',
            '{',
            '}',
            '^',
            '=',
            ';',
            '!',
            "'",
            '+',
            ',',
            '`',
            '~',
            '|',
            '<',
            '>',
            '"'
        ];
        let needsQuotes = false;
        for (const char of arg) {
            if (cmdSpecialChars.some(x => x === char)) {
                needsQuotes = true;
                break;
            }
        }
        // short-circuit if quotes not needed
        if (!needsQuotes) {
            return arg;
        }
        // the following quoting rules are very similar to the rules that by libuv applies.
        //
        // 1) wrap the string in quotes
        //
        // 2) double-up quotes - i.e. " => ""
        //
        //    this is different from the libuv quoting rules. libuv replaces " with \", which unfortunately
        //    doesn't work well with a cmd.exe command line.
        //
        //    note, replacing " with "" also works well if the arg is passed to a downstream .NET console app.
        //    for example, the command line:
        //          foo.exe "myarg:""my val"""
        //    is parsed by a .NET console app into an arg array:
        //          [ "myarg:\"my val\"" ]
        //    which is the same end result when applying libuv quoting rules. although the actual
        //    command line from libuv quoting rules would look like:
        //          foo.exe "myarg:\"my val\""
        //
        // 3) double-up slashes that precede a quote,
        //    e.g.  hello \world    => "hello \world"
        //          hello\"world    => "hello\\""world"
        //          hello\\"world   => "hello\\\\""world"
        //          hello world\    => "hello world\\"
        //
        //    technically this is not required for a cmd.exe command line, or the batch argument parser.
        //    the reasons for including this as a .cmd quoting rule are:
        //
        //    a) this is optimized for the scenario where the argument is passed from the .cmd file to an
        //       external program. many programs (e.g. .NET console apps) rely on the slash-doubling rule.
        //
        //    b) it's what we've been doing previously (by deferring to node default behavior) and we
        //       haven't heard any complaints about that aspect.
        //
        // note, a weakness of the quoting rules chosen here, is that % is not escaped. in fact, % cannot be
        // escaped when used on the command line directly - even though within a .cmd file % can be escaped
        // by using %%.
        //
        // the saving grace is, on the command line, %var% is left as-is if var is not defined. this contrasts
        // the line parsing rules within a .cmd file, where if var is not defined it is replaced with nothing.
        //
        // one option that was explored was replacing % with ^% - i.e. %var% => ^%var^%. this hack would
        // often work, since it is unlikely that var^ would exist, and the ^ character is removed when the
        // variable is used. the problem, however, is that ^ is not removed when %* is used to pass the args
        // to an external program.
        //
        // an unexplored potential solution for the % escaping problem, is to create a wrapper .cmd file.
        // % can be escaped within a .cmd file.
        let reverse = '"';
        let quoteHit = true;
        for (let i = arg.length; i > 0; i--) {
            // walk the string in reverse
            reverse += arg[i - 1];
            if (quoteHit && arg[i - 1] === '\\') {
                reverse += '\\'; // double the slash
            }
            else if (arg[i - 1] === '"') {
                quoteHit = true;
                reverse += '"'; // double the quote
            }
            else {
                quoteHit = false;
            }
        }
        reverse += '"';
        return reverse
            .split('')
            .reverse()
            .join('');
    }
    _uvQuoteCmdArg(arg) {
        // Tool runner wraps child_process.spawn() and needs to apply the same quoting as
        // Node in certain cases where the undocumented spawn option windowsVerbatimArguments
        // is used.
        //
        // Since this function is a port of quote_cmd_arg from Node 4.x (technically, lib UV,
        // see https://github.com/nodejs/node/blob/v4.x/deps/uv/src/win/process.c for details),
        // pasting copyright notice from Node within this function:
        //
        //      Copyright Joyent, Inc. and other Node contributors. All rights reserved.
        //
        //      Permission is hereby granted, free of charge, to any person obtaining a copy
        //      of this software and associated documentation files (the "Software"), to
        //      deal in the Software without restriction, including without limitation the
        //      rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
        //      sell copies of the Software, and to permit persons to whom the Software is
        //      furnished to do so, subject to the following conditions:
        //
        //      The above copyright notice and this permission notice shall be included in
        //      all copies or substantial portions of the Software.
        //
        //      THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
        //      IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
        //      FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
        //      AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
        //      LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
        //      FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
        //      IN THE SOFTWARE.
        if (!arg) {
            // Need double quotation for empty argument
            return '""';
        }
        if (!arg.includes(' ') && !arg.includes('\t') && !arg.includes('"')) {
            // No quotation needed
            return arg;
        }
        if (!arg.includes('"') && !arg.includes('\\')) {
            // No embedded double quotes or backslashes, so I can just wrap
            // quote marks around the whole thing.
            return `"${arg}"`;
        }
        // Expected input/output:
        //   input : hello"world
        //   output: "hello\"world"
        //   input : hello""world
        //   output: "hello\"\"world"
        //   input : hello\world
        //   output: hello\world
        //   input : hello\\world
        //   output: hello\\world
        //   input : hello\"world
        //   output: "hello\\\"world"
        //   input : hello\\"world
        //   output: "hello\\\\\"world"
        //   input : hello world\
        //   output: "hello world\\" - note the comment in libuv actually reads "hello world\"
        //                             but it appears the comment is wrong, it should be "hello world\\"
        let reverse = '"';
        let quoteHit = true;
        for (let i = arg.length; i > 0; i--) {
            // walk the string in reverse
            reverse += arg[i - 1];
            if (quoteHit && arg[i - 1] === '\\') {
                reverse += '\\';
            }
            else if (arg[i - 1] === '"') {
                quoteHit = true;
                reverse += '\\';
            }
            else {
                quoteHit = false;
            }
        }
        reverse += '"';
        return reverse
            .split('')
            .reverse()
            .join('');
    }
    _cloneExecOptions(options) {
        options = options || {};
        const result = {
            cwd: options.cwd || process.cwd(),
            env: options.env || process.env,
            silent: options.silent || false,
            windowsVerbatimArguments: options.windowsVerbatimArguments || false,
            failOnStdErr: options.failOnStdErr || false,
            ignoreReturnCode: options.ignoreReturnCode || false,
            delay: options.delay || 10000
        };
        result.outStream = options.outStream || process.stdout;
        result.errStream = options.errStream || process.stderr;
        return result;
    }
    _getSpawnOptions(options, toolPath) {
        options = options || {};
        const result = {};
        result.cwd = options.cwd;
        result.env = options.env;
        result['windowsVerbatimArguments'] =
            options.windowsVerbatimArguments || this._isCmdFile();
        if (options.windowsVerbatimArguments) {
            result.argv0 = `"${toolPath}"`;
        }
        return result;
    }
    /**
     * Exec a tool.
     * Output will be streamed to the live console.
     * Returns promise with return code
     *
     * @param     tool     path to tool to exec
     * @param     options  optional exec options.  See ExecOptions
     * @returns   number
     */
    exec() {
        return __awaiter(this, void 0, void 0, function* () {
            // root the tool path if it is unrooted and contains relative pathing
            if (!ioUtil.isRooted(this.toolPath) &&
                (this.toolPath.includes('/') ||
                    (IS_WINDOWS && this.toolPath.includes('\\')))) {
                // prefer options.cwd if it is specified, however options.cwd may also need to be rooted
                this.toolPath = path.resolve(process.cwd(), this.options.cwd || process.cwd(), this.toolPath);
            }
            // if the tool is only a file name, then resolve it from the PATH
            // otherwise verify it exists (add extension on Windows if necessary)
            this.toolPath = yield io.which(this.toolPath, true);
            return new Promise((resolve, reject) => {
                this._debug(`exec tool: ${this.toolPath}`);
                this._debug('arguments:');
                for (const arg of this.args) {
                    this._debug(`   ${arg}`);
                }
                const optionsNonNull = this._cloneExecOptions(this.options);
                if (!optionsNonNull.silent && optionsNonNull.outStream) {
                    optionsNonNull.outStream.write(this._getCommandString(optionsNonNull) + os.EOL);
                }
                const state = new ExecState(optionsNonNull, this.toolPath);
                state.on('debug', (message) => {
                    this._debug(message);
                });
                const fileName = this._getSpawnFileName();
                const cp = child.spawn(fileName, this._getSpawnArgs(optionsNonNull), this._getSpawnOptions(this.options, fileName));
                const stdbuffer = '';
                if (cp.stdout) {
                    cp.stdout.on('data', (data) => {
                        if (this.options.listeners && this.options.listeners.stdout) {
                            this.options.listeners.stdout(data);
                        }
                        if (!optionsNonNull.silent && optionsNonNull.outStream) {
                            optionsNonNull.outStream.write(data);
                        }
                        this._processLineBuffer(data, stdbuffer, (line) => {
                            if (this.options.listeners && this.options.listeners.stdline) {
                                this.options.listeners.stdline(line);
                            }
                        });
                    });
                }
                const errbuffer = '';
                if (cp.stderr) {
                    cp.stderr.on('data', (data) => {
                        state.processStderr = true;
                        if (this.options.listeners && this.options.listeners.stderr) {
                            this.options.listeners.stderr(data);
                        }
                        if (!optionsNonNull.silent &&
                            optionsNonNull.errStream &&
                            optionsNonNull.outStream) {
                            const s = optionsNonNull.failOnStdErr
                                ? optionsNonNull.errStream
                                : optionsNonNull.outStream;
                            s.write(data);
                        }
                        this._processLineBuffer(data, errbuffer, (line) => {
                            if (this.options.listeners && this.options.listeners.errline) {
                                this.options.listeners.errline(line);
                            }
                        });
                    });
                }
                cp.on('error', (err) => {
                    state.processError = err.message;
                    state.processExited = true;
                    state.processClosed = true;
                    state.CheckComplete();
                });
                cp.on('exit', (code) => {
                    state.processExitCode = code;
                    state.processExited = true;
                    this._debug(`Exit code ${code} received from tool '${this.toolPath}'`);
                    state.CheckComplete();
                });
                cp.on('close', (code) => {
                    state.processExitCode = code;
                    state.processExited = true;
                    state.processClosed = true;
                    this._debug(`STDIO streams have closed for tool '${this.toolPath}'`);
                    state.CheckComplete();
                });
                state.on('done', (error, exitCode) => {
                    if (stdbuffer.length > 0) {
                        this.emit('stdline', stdbuffer);
                    }
                    if (errbuffer.length > 0) {
                        this.emit('errline', errbuffer);
                    }
                    cp.removeAllListeners();
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(exitCode);
                    }
                });
            });
        });
    }
}
exports.ToolRunner = ToolRunner;
/**
 * Convert an arg string to an array of args. Handles escaping
 *
 * @param    argString   string of arguments
 * @returns  string[]    array of arguments
 */
function argStringToArray(argString) {
    const args = [];
    let inQuotes = false;
    let escaped = false;
    let arg = '';
    function append(c) {
        // we only escape double quotes.
        if (escaped && c !== '"') {
            arg += '\\';
        }
        arg += c;
        escaped = false;
    }
    for (let i = 0; i < argString.length; i++) {
        const c = argString.charAt(i);
        if (c === '"') {
            if (!escaped) {
                inQuotes = !inQuotes;
            }
            else {
                append(c);
            }
            continue;
        }
        if (c === '\\' && escaped) {
            append(c);
            continue;
        }
        if (c === '\\' && inQuotes) {
            escaped = true;
            continue;
        }
        if (c === ' ' && !inQuotes) {
            if (arg.length > 0) {
                args.push(arg);
                arg = '';
            }
            continue;
        }
        append(c);
    }
    if (arg.length > 0) {
        args.push(arg.trim());
    }
    return args;
}
exports.argStringToArray = argStringToArray;
class ExecState extends events.EventEmitter {
    constructor(options, toolPath) {
        super();
        this.processClosed = false; // tracks whether the process has exited and stdio is closed
        this.processError = '';
        this.processExitCode = 0;
        this.processExited = false; // tracks whether the process has exited
        this.processStderr = false; // tracks whether stderr was written to
        this.delay = 10000; // 10 seconds
        this.done = false;
        this.timeout = null;
        if (!toolPath) {
            throw new Error('toolPath must not be empty');
        }
        this.options = options;
        this.toolPath = toolPath;
        if (options.delay) {
            this.delay = options.delay;
        }
    }
    CheckComplete() {
        if (this.done) {
            return;
        }
        if (this.processClosed) {
            this._setResult();
        }
        else if (this.processExited) {
            this.timeout = setTimeout(ExecState.HandleTimeout, this.delay, this);
        }
    }
    _debug(message) {
        this.emit('debug', message);
    }
    _setResult() {
        // determine whether there is an error
        let error;
        if (this.processExited) {
            if (this.processError) {
                error = new Error(`There was an error when attempting to execute the process '${this.toolPath}'. This may indicate the process failed to start. Error: ${this.processError}`);
            }
            else if (this.processExitCode !== 0 && !this.options.ignoreReturnCode) {
                error = new Error(`The process '${this.toolPath}' failed with exit code ${this.processExitCode}`);
            }
            else if (this.processStderr && this.options.failOnStdErr) {
                error = new Error(`The process '${this.toolPath}' failed because one or more lines were written to the STDERR stream`);
            }
        }
        // clear the timeout
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        this.done = true;
        this.emit('done', error, this.processExitCode);
    }
    static HandleTimeout(state) {
        if (state.done) {
            return;
        }
        if (!state.processClosed && state.processExited) {
            const message = `The STDIO streams did not close within ${state.delay /
                1000} seconds of the exit event from process '${state.toolPath}'. This may indicate a child process inherited the STDIO streams and has not yet exited.`;
            state._debug(message);
        }
        state._setResult();
    }
}
//# sourceMappingURL=toolrunner.js.map

/***/ }),

/***/ 16:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";

// Copyright (c) 2019 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const libaction = __webpack_require__(35);
const core = __webpack_require__(470);
const vcpkgrunner = __webpack_require__(835);
const vcpkgUtils = __webpack_require__(693);
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const actionLib = new libaction.ActionLib();
            vcpkgUtils.setBaseLib(actionLib);
            const runner = new vcpkgrunner.VcpkgRunner(actionLib);
            yield runner.run();
            core.info('run-vcpkg action execution succeeded');
            return 0;
        }
        catch (err) {
            core.debug('Error: ' + err);
            core.error(err);
            core.setFailed('run-vcpkg action execution failed');
            return -1000;
        }
    });
}
// Main entry point of the task.
main().catch(error => console.error("main() failed!", error));

//# sourceMappingURL=vcpkg-action.js.map


/***/ }),

/***/ 35:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";

// Copyright (c) 2019-2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const baselib = __webpack_require__(42);
const core = __webpack_require__(470);
const exec = __webpack_require__(986);
const ioutil = __webpack_require__(672);
const io = __webpack_require__(1);
const fs = __webpack_require__(747);
const path = __webpack_require__(622);
class ToolRunner {
    constructor(path) {
        this.path = path;
        this.args = [];
    }
    exec(options) {
        const options2 = this.convertExecOptions(options);
        return exec.exec(`"${this.path}"`, this.args, options2);
    }
    line(val) {
        this.args = this.args.concat(this.argStringToArray(val));
    }
    arg(val) {
        if (val instanceof Array) {
            this.args = this.args.concat(val);
        }
        else if (typeof (val) === 'string') {
            this.args = this.args.concat(val.trim());
        }
    }
    execSync(options) {
        return __awaiter(this, void 0, void 0, function* () {
            let stdout = "";
            let stderr = "";
            let options2 = undefined;
            if (options) {
                options2 = this.convertExecOptions(options);
                options2.listeners = {
                    stdout: (data) => {
                        stdout += data.toString();
                    },
                    stderr: (data) => {
                        stderr += data.toString();
                    }
                };
            }
            const exitCode = yield exec.exec(`"${this.path}"`, this.args, options2);
            const res2 = {
                code: exitCode,
                stdout: stdout,
                stderr: stderr
            };
            return Promise.resolve(res2);
        });
    }
    convertExecOptions(options) {
        var _a, _b, _c, _d, _e, _f;
        const result = {
            cwd: (_a = options.cwd, (_a !== null && _a !== void 0 ? _a : process.cwd())),
            env: (_b = options.env, (_b !== null && _b !== void 0 ? _b : process.env)),
            silent: (_c = options.silent, (_c !== null && _c !== void 0 ? _c : false)),
            failOnStdErr: (_d = options.failOnStdErr, (_d !== null && _d !== void 0 ? _d : false)),
            ignoreReturnCode: (_e = options.ignoreReturnCode, (_e !== null && _e !== void 0 ? _e : false)),
            windowsVerbatimArguments: (_f = options.windowsVerbatimArguments, (_f !== null && _f !== void 0 ? _f : false)),
            listeners: {
                stdout: (data) => void {
                // Nothing to do.
                },
                stderr: (data) => void {
                // Nothing to do.
                },
                stdline: (data) => void {},
                errline: (data) => void {
                // Nothing to do.
                },
                debug: (data) => void {
                // Nothing to do.
                },
            }
        };
        result.outStream = options.outStream || process.stdout;
        result.errStream = options.errStream || process.stderr;
        return result;
    }
    argStringToArray(argString) {
        const args = [];
        let inQuotes = false;
        let escaped = false;
        let lastCharWasSpace = true;
        let arg = '';
        const append = function (c) {
            // we only escape double quotes.
            if (escaped && c !== '"') {
                arg += '\\';
            }
            arg += c;
            escaped = false;
        };
        for (let i = 0; i < argString.length; i++) {
            const c = argString.charAt(i);
            if (c === ' ' && !inQuotes) {
                if (!lastCharWasSpace) {
                    args.push(arg);
                    arg = '';
                }
                lastCharWasSpace = true;
                continue;
            }
            else {
                lastCharWasSpace = false;
            }
            if (c === '"') {
                if (!escaped) {
                    inQuotes = !inQuotes;
                }
                else {
                    append(c);
                }
                continue;
            }
            if (c === "\\" && escaped) {
                append(c);
                continue;
            }
            if (c === "\\" && inQuotes) {
                escaped = true;
                continue;
            }
            append(c);
            lastCharWasSpace = false;
        }
        if (!lastCharWasSpace) {
            args.push(arg.trim());
        }
        return args;
    }
}
exports.ToolRunner = ToolRunner;
class ActionLib {
    getInput(name, isRequired) {
        const value = core.getInput(name, { required: isRequired });
        this.debug(`getInput(${name}, ${isRequired}) -> '${value}'`);
        return value;
    }
    getBoolInput(name, isRequired) {
        var _a;
        const value = (_a = core.getInput(name, { required: isRequired }), (_a !== null && _a !== void 0 ? _a : "")).toUpperCase() === "TRUE";
        this.debug(`getBoolInput(${name}, ${isRequired}) -> '${value}'`);
        return value;
    }
    getPathInput(name) {
        const value = core.getInput(name);
        this.debug(`getPathInput(${name}) -> '${value}'`);
        return value;
    }
    isFilePathSupplied(name) {
        var _a, _b;
        // normalize paths
        const pathValue = this.resolve((_a = this.getPathInput(name), (_a !== null && _a !== void 0 ? _a : '')));
        const repoRoot = this.resolve((_b = process.env.GITHUB_WORKSPACE, (_b !== null && _b !== void 0 ? _b : '')));
        const isSupplied = pathValue !== repoRoot;
        this.debug(`isFilePathSupplied(s file path=('${name}') -> '${isSupplied}'`);
        return isSupplied;
    }
    getDelimitedInput(name, delim, required) {
        const input = core.getInput(name, { required: required });
        const inputs = input.split(delim);
        this.debug(`getDelimitedInput(${name}, ${delim}, ${required}) -> '${inputs}'`);
        return inputs;
    }
    // Set an environment variable, re-usable in subsequent actions.
    setVariable(name, value) {
        core.exportVariable(name, value);
    }
    // Set the output of the action.
    setOutput(name, value) {
        core.setOutput(name, value);
    }
    getVariable(name) {
        var _a;
        //?? Is it really fine to return an empty string in case of undefined variable?
        return _a = process.env[name], (_a !== null && _a !== void 0 ? _a : "");
    }
    debug(message) {
        core.debug(message);
    }
    error(message) {
        core.error(message);
    }
    warning(message) {
        core.warning(message);
    }
    tool(name) {
        return new ToolRunner(name);
    }
    exec(path, args, options) {
        return Promise.resolve(exec.exec(`"${path}"`, args, options));
    }
    execSync(path, args, options) {
        return __awaiter(this, void 0, void 0, function* () {
            // Note: the exec.exec() fails to launch an executable that contains blanks in its path/name. Sorrounding with double quotes is mandatory.
            const exitCode = yield exec.exec(`"${path}"`, args, options);
            const res2 = {
                code: exitCode,
                stdout: "",
                stderr: ""
            };
            return Promise.resolve(res2);
        });
    }
    which(name, required) {
        return __awaiter(this, void 0, void 0, function* () {
            return io.which(name, required);
        });
    }
    rmRF(path) {
        return __awaiter(this, void 0, void 0, function* () {
            yield io.rmRF(path);
        });
    }
    mkdirP(path) {
        return __awaiter(this, void 0, void 0, function* () {
            yield io.mkdirP(path);
        });
    }
    cd(path) {
        process.chdir(path);
    }
    writeFile(path, content) {
        fs.writeFileSync(path, content);
    }
    resolve(apath) {
        return path.resolve(apath);
    }
    stats(path) {
        return fs.statSync(path);
    }
    exist(path) {
        return ioutil.exists(path);
    }
    getBinDir() {
        if (!process.env.GITHUB_WORKSPACE) {
            throw new Error("GITHUB_WORKSPACE is not set.");
        }
        const binPath = baselib.normalizePath(path.resolve(path.join(process.env.GITHUB_WORKSPACE, "../b/")));
        if (!fs.existsSync(binPath)) {
            core.debug(`BinDir '${binPath}' does not exists, creating it...`);
            fs.mkdirSync(binPath);
        }
        return binPath;
    }
    getSrcDir() {
        if (!process.env.GITHUB_WORKSPACE) {
            throw new Error("GITHUB_WORKSPACE env var is not set.");
        }
        const srcPath = baselib.normalizePath(path.resolve(process.env.GITHUB_WORKSPACE));
        if (!fs.existsSync(srcPath)) {
            throw new Error(`SourceDir '${srcPath}' does not exists.`);
        }
        return srcPath;
    }
    getArtifactsDir() {
        if (!process.env.GITHUB_WORKSPACE) {
            throw new Error("GITHUB_WORKSPACE is not set.");
        }
        //?? HACK. How to get the {{ runner.temp }} path in JS's action?
        const artifactsPath = baselib.normalizePath(path.resolve(path.join(process.env.GITHUB_WORKSPACE, "../../_temp")));
        if (!fs.existsSync(artifactsPath)) {
            core.debug(`ArtifactsDir '${artifactsPath}' does not exists, creating it...`);
            fs.mkdirSync(artifactsPath);
        }
        return artifactsPath;
    }
}
exports.ActionLib = ActionLib;

//# sourceMappingURL=action-lib.js.map


/***/ }),

/***/ 42:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";

// Copyright (c) 2019-2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT
Object.defineProperty(exports, "__esModule", { value: true });
const path = __webpack_require__(622);
/**
 * Normalize a filesystem path with path.normalize(), then remove any trailing space.
 *
 * @export
 * @param {string} aPath The string representing a filesystem path.
 * @returns {string} The normalizeed path without trailing slash.
 */
function normalizePath(aPath) {
    aPath = path.normalize(aPath);
    if (/[\\\/]$/.test(aPath))
        aPath = aPath.slice(0, -1);
    return aPath;
}
exports.normalizePath = normalizePath;

//# sourceMappingURL=base-lib.js.map


/***/ }),

/***/ 87:
/***/ (function(module) {

module.exports = require("os");

/***/ }),

/***/ 129:
/***/ (function(module) {

module.exports = require("child_process");

/***/ }),

/***/ 357:
/***/ (function(module) {

module.exports = require("assert");

/***/ }),

/***/ 373:
/***/ (function(__unusedmodule, exports) {

"use strict";

// Copyright (c) 2019-2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT
Object.defineProperty(exports, "__esModule", { value: true });
exports.vcpkgArguments = 'vcpkgArguments';
exports.buildDirectory = 'buildDirectory';
exports.vcpkgGitURL = 'vcpkgGitURL';
exports.vcpkgCommitId = 'vcpkgGitCommitId';
exports.outVcpkgRootPath = "RUNVCPKG_VCPKG_ROOT";
exports.outVcpkgTriplet = "RUNVCPKG_VCPKG_TRIPLET";
exports.vcpkgTriplet = "vcpkgTriplet";
exports.vcpkgDirectory = "vcpkgDirectory";
exports.vcpkgArtifactIgnoreEntries = "vcpkgArtifactIgnoreEntries";
exports.vcpkgRemoteUrlLastFileName = 'vcpkg_remote_url.last';

//# sourceMappingURL=vcpkg-globals.js.map


/***/ }),

/***/ 431:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const os = __webpack_require__(87);
/**
 * Commands
 *
 * Command Format:
 *   ##[name key=value;key=value]message
 *
 * Examples:
 *   ##[warning]This is the user warning message
 *   ##[set-secret name=mypassword]definitelyNotAPassword!
 */
function issueCommand(command, properties, message) {
    const cmd = new Command(command, properties, message);
    process.stdout.write(cmd.toString() + os.EOL);
}
exports.issueCommand = issueCommand;
function issue(name, message = '') {
    issueCommand(name, {}, message);
}
exports.issue = issue;
const CMD_STRING = '::';
class Command {
    constructor(command, properties, message) {
        if (!command) {
            command = 'missing.command';
        }
        this.command = command;
        this.properties = properties;
        this.message = message;
    }
    toString() {
        let cmdStr = CMD_STRING + this.command;
        if (this.properties && Object.keys(this.properties).length > 0) {
            cmdStr += ' ';
            let first = true;
            for (const key in this.properties) {
                if (this.properties.hasOwnProperty(key)) {
                    const val = this.properties[key];
                    if (val) {
                        if (first) {
                            first = false;
                        }
                        else {
                            cmdStr += ',';
                        }
                        // safely append the val - avoid blowing up when attempting to
                        // call .replace() if message is not a string for some reason
                        cmdStr += `${key}=${escape(`${val || ''}`)}`;
                    }
                }
            }
        }
        cmdStr += CMD_STRING;
        // safely append the message - avoid blowing up when attempting to
        // call .replace() if message is not a string for some reason
        const message = `${this.message || ''}`;
        cmdStr += escapeData(message);
        return cmdStr;
    }
}
function escapeData(s) {
    return s.replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}
function escape(s) {
    return s
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A')
        .replace(/]/g, '%5D')
        .replace(/;/g, '%3B');
}
//# sourceMappingURL=command.js.map

/***/ }),

/***/ 470:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = __webpack_require__(431);
const os = __webpack_require__(87);
const path = __webpack_require__(622);
/**
 * The code to exit an action
 */
var ExitCode;
(function (ExitCode) {
    /**
     * A code indicating that the action was successful
     */
    ExitCode[ExitCode["Success"] = 0] = "Success";
    /**
     * A code indicating that the action was a failure
     */
    ExitCode[ExitCode["Failure"] = 1] = "Failure";
})(ExitCode = exports.ExitCode || (exports.ExitCode = {}));
//-----------------------------------------------------------------------
// Variables
//-----------------------------------------------------------------------
/**
 * Sets env variable for this action and future actions in the job
 * @param name the name of the variable to set
 * @param val the value of the variable
 */
function exportVariable(name, val) {
    process.env[name] = val;
    command_1.issueCommand('set-env', { name }, val);
}
exports.exportVariable = exportVariable;
/**
 * Registers a secret which will get masked from logs
 * @param secret value of the secret
 */
function setSecret(secret) {
    command_1.issueCommand('add-mask', {}, secret);
}
exports.setSecret = setSecret;
/**
 * Prepends inputPath to the PATH (for this action and future actions)
 * @param inputPath
 */
function addPath(inputPath) {
    command_1.issueCommand('add-path', {}, inputPath);
    process.env['PATH'] = `${inputPath}${path.delimiter}${process.env['PATH']}`;
}
exports.addPath = addPath;
/**
 * Gets the value of an input.  The value is also trimmed.
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   string
 */
function getInput(name, options) {
    const val = process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] || '';
    if (options && options.required && !val) {
        throw new Error(`Input required and not supplied: ${name}`);
    }
    return val.trim();
}
exports.getInput = getInput;
/**
 * Sets the value of an output.
 *
 * @param     name     name of the output to set
 * @param     value    value to store
 */
function setOutput(name, value) {
    command_1.issueCommand('set-output', { name }, value);
}
exports.setOutput = setOutput;
//-----------------------------------------------------------------------
// Results
//-----------------------------------------------------------------------
/**
 * Sets the action status to failed.
 * When the action exits it will be with an exit code of 1
 * @param message add error issue message
 */
function setFailed(message) {
    process.exitCode = ExitCode.Failure;
    error(message);
}
exports.setFailed = setFailed;
//-----------------------------------------------------------------------
// Logging Commands
//-----------------------------------------------------------------------
/**
 * Writes debug message to user log
 * @param message debug message
 */
function debug(message) {
    command_1.issueCommand('debug', {}, message);
}
exports.debug = debug;
/**
 * Adds an error issue
 * @param message error issue message
 */
function error(message) {
    command_1.issue('error', message);
}
exports.error = error;
/**
 * Adds an warning issue
 * @param message warning issue message
 */
function warning(message) {
    command_1.issue('warning', message);
}
exports.warning = warning;
/**
 * Writes info to log with console.log.
 * @param message info message
 */
function info(message) {
    process.stdout.write(message + os.EOL);
}
exports.info = info;
/**
 * Begin an output group.
 *
 * Output until the next `groupEnd` will be foldable in this group
 *
 * @param name The name of the output group
 */
function startGroup(name) {
    command_1.issue('group', name);
}
exports.startGroup = startGroup;
/**
 * End an output group.
 */
function endGroup() {
    command_1.issue('endgroup');
}
exports.endGroup = endGroup;
/**
 * Wrap an asynchronous function call in a group.
 *
 * Returns the same type as the function itself.
 *
 * @param name The name of the group
 * @param fn The function to wrap in the group
 */
function group(name, fn) {
    return __awaiter(this, void 0, void 0, function* () {
        startGroup(name);
        let result;
        try {
            result = yield fn();
        }
        finally {
            endGroup();
        }
        return result;
    });
}
exports.group = group;
//-----------------------------------------------------------------------
// Wrapper action state
//-----------------------------------------------------------------------
/**
 * Saves state for current action, the state can only be retrieved by this action's post job execution.
 *
 * @param     name     name of the state to store
 * @param     value    value to store
 */
function saveState(name, value) {
    command_1.issueCommand('save-state', { name }, value);
}
exports.saveState = saveState;
/**
 * Gets the value of an state set by this action's main execution.
 *
 * @param     name     name of the state to get
 * @returns   string
 */
function getState(name) {
    return process.env[`STATE_${name}`] || '';
}
exports.getState = getState;
//# sourceMappingURL=core.js.map

/***/ }),

/***/ 614:
/***/ (function(module) {

module.exports = require("events");

/***/ }),

/***/ 622:
/***/ (function(module) {

module.exports = require("path");

/***/ }),

/***/ 669:
/***/ (function(module) {

module.exports = require("util");

/***/ }),

/***/ 672:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __webpack_require__(357);
const fs = __webpack_require__(747);
const path = __webpack_require__(622);
_a = fs.promises, exports.chmod = _a.chmod, exports.copyFile = _a.copyFile, exports.lstat = _a.lstat, exports.mkdir = _a.mkdir, exports.readdir = _a.readdir, exports.readlink = _a.readlink, exports.rename = _a.rename, exports.rmdir = _a.rmdir, exports.stat = _a.stat, exports.symlink = _a.symlink, exports.unlink = _a.unlink;
exports.IS_WINDOWS = process.platform === 'win32';
function exists(fsPath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield exports.stat(fsPath);
        }
        catch (err) {
            if (err.code === 'ENOENT') {
                return false;
            }
            throw err;
        }
        return true;
    });
}
exports.exists = exists;
function isDirectory(fsPath, useStat = false) {
    return __awaiter(this, void 0, void 0, function* () {
        const stats = useStat ? yield exports.stat(fsPath) : yield exports.lstat(fsPath);
        return stats.isDirectory();
    });
}
exports.isDirectory = isDirectory;
/**
 * On OSX/Linux, true if path starts with '/'. On Windows, true for paths like:
 * \, \hello, \\hello\share, C:, and C:\hello (and corresponding alternate separator cases).
 */
function isRooted(p) {
    p = normalizeSeparators(p);
    if (!p) {
        throw new Error('isRooted() parameter "p" cannot be empty');
    }
    if (exports.IS_WINDOWS) {
        return (p.startsWith('\\') || /^[A-Z]:/i.test(p) // e.g. \ or \hello or \\hello
        ); // e.g. C: or C:\hello
    }
    return p.startsWith('/');
}
exports.isRooted = isRooted;
/**
 * Recursively create a directory at `fsPath`.
 *
 * This implementation is optimistic, meaning it attempts to create the full
 * path first, and backs up the path stack from there.
 *
 * @param fsPath The path to create
 * @param maxDepth The maximum recursion depth
 * @param depth The current recursion depth
 */
function mkdirP(fsPath, maxDepth = 1000, depth = 1) {
    return __awaiter(this, void 0, void 0, function* () {
        assert_1.ok(fsPath, 'a path argument must be provided');
        fsPath = path.resolve(fsPath);
        if (depth >= maxDepth)
            return exports.mkdir(fsPath);
        try {
            yield exports.mkdir(fsPath);
            return;
        }
        catch (err) {
            switch (err.code) {
                case 'ENOENT': {
                    yield mkdirP(path.dirname(fsPath), maxDepth, depth + 1);
                    yield exports.mkdir(fsPath);
                    return;
                }
                default: {
                    let stats;
                    try {
                        stats = yield exports.stat(fsPath);
                    }
                    catch (err2) {
                        throw err;
                    }
                    if (!stats.isDirectory())
                        throw err;
                }
            }
        }
    });
}
exports.mkdirP = mkdirP;
/**
 * Best effort attempt to determine whether a file exists and is executable.
 * @param filePath    file path to check
 * @param extensions  additional file extensions to try
 * @return if file exists and is executable, returns the file path. otherwise empty string.
 */
function tryGetExecutablePath(filePath, extensions) {
    return __awaiter(this, void 0, void 0, function* () {
        let stats = undefined;
        try {
            // test file exists
            stats = yield exports.stat(filePath);
        }
        catch (err) {
            if (err.code !== 'ENOENT') {
                // eslint-disable-next-line no-console
                console.log(`Unexpected error attempting to determine if executable file exists '${filePath}': ${err}`);
            }
        }
        if (stats && stats.isFile()) {
            if (exports.IS_WINDOWS) {
                // on Windows, test for valid extension
                const upperExt = path.extname(filePath).toUpperCase();
                if (extensions.some(validExt => validExt.toUpperCase() === upperExt)) {
                    return filePath;
                }
            }
            else {
                if (isUnixExecutable(stats)) {
                    return filePath;
                }
            }
        }
        // try each extension
        const originalFilePath = filePath;
        for (const extension of extensions) {
            filePath = originalFilePath + extension;
            stats = undefined;
            try {
                stats = yield exports.stat(filePath);
            }
            catch (err) {
                if (err.code !== 'ENOENT') {
                    // eslint-disable-next-line no-console
                    console.log(`Unexpected error attempting to determine if executable file exists '${filePath}': ${err}`);
                }
            }
            if (stats && stats.isFile()) {
                if (exports.IS_WINDOWS) {
                    // preserve the case of the actual file (since an extension was appended)
                    try {
                        const directory = path.dirname(filePath);
                        const upperName = path.basename(filePath).toUpperCase();
                        for (const actualName of yield exports.readdir(directory)) {
                            if (upperName === actualName.toUpperCase()) {
                                filePath = path.join(directory, actualName);
                                break;
                            }
                        }
                    }
                    catch (err) {
                        // eslint-disable-next-line no-console
                        console.log(`Unexpected error attempting to determine the actual case of the file '${filePath}': ${err}`);
                    }
                    return filePath;
                }
                else {
                    if (isUnixExecutable(stats)) {
                        return filePath;
                    }
                }
            }
        }
        return '';
    });
}
exports.tryGetExecutablePath = tryGetExecutablePath;
function normalizeSeparators(p) {
    p = p || '';
    if (exports.IS_WINDOWS) {
        // convert slashes on Windows
        p = p.replace(/\//g, '\\');
        // remove redundant slashes
        return p.replace(/\\\\+/g, '\\');
    }
    // remove redundant slashes
    return p.replace(/\/\/+/g, '/');
}
// on Mac/Linux, test the execute bit
//     R   W  X  R  W X R W X
//   256 128 64 32 16 8 4 2 1
function isUnixExecutable(stats) {
    return ((stats.mode & 1) > 0 ||
        ((stats.mode & 8) > 0 && stats.gid === process.getgid()) ||
        ((stats.mode & 64) > 0 && stats.uid === process.getuid()));
}
//# sourceMappingURL=io-util.js.map

/***/ }),

/***/ 693:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";

// Copyright (c) 2019-2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __webpack_require__(747);
const os = __webpack_require__(87);
let baseLib;
exports.cachingFormatEnvName = 'AZP_CACHING_CONTENT_FORMAT';
function setBaseLib(tl) {
    baseLib = tl;
}
exports.setBaseLib = setBaseLib;
function isVcpkgSubmodule(gitPath, fullVcpkgPath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const options = {
                cwd: process.env.BUILD_SOURCESDIRECTORY,
                failOnStdErr: false,
                errStream: process.stdout,
                outStream: process.stdout,
                ignoreReturnCode: true,
                silent: false,
                windowsVerbatimArguments: false,
                env: process.env
            };
            const res = yield baseLib.execSync(gitPath, ['submodule', 'status', fullVcpkgPath], options);
            let isSubmodule = false;
            if (res.error !== null) {
                isSubmodule = res.code == 0;
                let msg;
                msg = `'git submodule ${fullVcpkgPath}': exit code='${res.code}' `;
                if (res.stdout !== null) {
                    msg += `, stdout='${res.stdout.trim()}'`;
                }
                if (res.stderr !== null) {
                    msg += `, stderr='${res.stderr.trim()}'`;
                }
                msg += '.';
                baseLib.debug(msg);
            }
            return isSubmodule;
        }
        catch (error) {
            baseLib.warning(`ïsVcpkgSubmodule() failed: ${error}`);
            return false;
        }
    });
}
exports.isVcpkgSubmodule = isVcpkgSubmodule;
function throwIfErrorCode(errorCode) {
    if (errorCode != 0) {
        const errMsg = `Last command execution failed with error code '${errorCode}'.`;
        baseLib.error(errMsg);
        throw new Error(errMsg);
    }
}
exports.throwIfErrorCode = throwIfErrorCode;
function isWin32() {
    return os.platform().toLowerCase() === 'win32';
}
exports.isWin32 = isWin32;
function isMacos() {
    return os.platform().toLowerCase() === 'darwin';
}
exports.isMacos = isMacos;
// freeBSD or openBSD
function isBSD() {
    return os.platform().toLowerCase().indexOf("bsd") != -1;
}
exports.isBSD = isBSD;
function isLinux() {
    return os.platform().toLowerCase() === 'linux';
}
exports.isLinux = isLinux;
function isDarwin() {
    return os.platform().toLowerCase() === 'Darwin';
}
exports.isDarwin = isDarwin;
function directoryExists(path) {
    try {
        return baseLib.stats(path).isDirectory();
    }
    catch (error) {
        baseLib.debug(`directoryExists(${path}): ${"" + error}`);
        return false;
    }
}
exports.directoryExists = directoryExists;
function fileExists(path) {
    try {
        return baseLib.stats(path).isFile();
    }
    catch (error) {
        baseLib.debug(`fileExists(${path}): ${"" + error}`);
        return false;
    }
}
exports.fileExists = fileExists;
function readFile(path) {
    try {
        const readString = fs.readFileSync(path, { encoding: 'utf8', flag: 'r' });
        baseLib.debug(`readFile(${path})='${readString}'.`);
        return [true, readString];
    }
    catch (error) {
        baseLib.debug(`readFile(${path}): ${"" + error}`);
        return [false, error];
    }
}
exports.readFile = readFile;
function writeFile(file, content) {
    baseLib.debug(`Writing to file '${file}' content '${content}'.`);
    baseLib.writeFile(file, content);
}
exports.writeFile = writeFile;
function getDefaultTriplet() {
    const envVar = process.env["VCPKG_DEFAULT_TRIPLET"];
    if (envVar) {
        return envVar;
    }
    else {
        if (isWin32()) {
            return "x86-windows";
        }
        else if (isLinux()) {
            return "x64-linux";
        }
        else if (isMacos()) {
            return "x64-osx";
        }
        else if (isBSD()) {
            return "x64-freebsd";
        }
    }
    return "";
}
exports.getDefaultTriplet = getDefaultTriplet;
function extractTriplet(args, readFile) {
    let triplet = null;
    // Split string on any 'whitespace' character
    const argsSplitted = args.split(/\s/).filter((a) => a.length != 0);
    let index = 0;
    for (; index < argsSplitted.length; index++) {
        let arg = argsSplitted[index].trim();
        // remove all whitespace characters (e.g. newlines, tabs, blanks)
        arg = arg.replace(/\s/, '');
        if (arg === "--triplet") {
            index++;
            if (index < argsSplitted.length) {
                triplet = argsSplitted[index];
                return triplet.trim();
            }
        }
        if (arg.startsWith("@")) {
            const [ok, content] = readFile(arg.substring(1));
            if (ok) {
                const t = extractTriplet(content, readFile);
                if (t) {
                    return t.trim();
                }
            }
        }
    }
    return triplet;
}
exports.extractTriplet = extractTriplet;
function resolveArguments(args, readFile) {
    let resolvedArguments = "";
    // Split string on any 'whitespace' character
    const argsSplitted = args.split(/\s/).filter((a) => a.length != 0);
    let index = 0;
    for (; index < argsSplitted.length; index++) {
        let arg = argsSplitted[index].trim();
        // remove all whitespace characters (e.g. newlines, tabs, blanks)
        arg = arg.replace(/\s/, '');
        let isResponseFile = false;
        if (arg.startsWith("@")) {
            const resolvedFilePath = baseLib.resolve(arg);
            if (baseLib.exist(resolvedFilePath)) {
                const [ok, content] = readFile(resolvedFilePath);
                if (ok && content) {
                    isResponseFile = true;
                    resolvedArguments += content;
                }
            }
        }
        if (!isResponseFile) {
            resolvedArguments += arg;
        }
    }
    return resolvedArguments;
}
exports.resolveArguments = resolveArguments;
// Force 'name' env variable to have value of 'value'.
function setEnvVar(name, value) {
    // Set variable both as env var and as step variable, which might be re-used in subseqeunt steps.  
    process.env[name] = value;
    baseLib.setVariable(name, value);
    baseLib.debug(`Set variable and the env variable '${name}' to value '${value}'.`);
}
exports.setEnvVar = setEnvVar;

//# sourceMappingURL=vcpkg-utils.js.map


/***/ }),

/***/ 747:
/***/ (function(module) {

module.exports = require("fs");

/***/ }),

/***/ 835:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";

// Copyright (c) 2019-2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = __webpack_require__(622);
const vcpkgUtils = __webpack_require__(693);
const globals = __webpack_require__(373);
class VcpkgRunner {
    constructor(tl) {
        var _a, _b;
        this.tl = tl;
        this.options = {};
        this.vcpkgArtifactIgnoreEntries = [];
        this.vcpkgArgs = (_a = this.tl.getInput(globals.vcpkgArguments, true), (_a !== null && _a !== void 0 ? _a : ""));
        this.defaultVcpkgUrl = 'https://github.com/microsoft/vcpkg.git';
        this.vcpkgURL =
            this.tl.getInput(globals.vcpkgGitURL, false) || this.defaultVcpkgUrl;
        this.vcpkgCommitId =
            this.tl.getInput(globals.vcpkgCommitId, false) || 'master';
        this.vcpkgDestPath = (_b = this.tl.getPathInput(globals.vcpkgDirectory, false), (_b !== null && _b !== void 0 ? _b : ""));
        if (!this.vcpkgDestPath) {
            this.vcpkgDestPath = path.join(this.tl.getBinDir(), 'vcpkg');
        }
        this.vcpkgTriplet = this.tl.getInput(globals.vcpkgTriplet, false) || "";
        this.vcpkgArtifactIgnoreEntries = this.tl.getDelimitedInput(globals.vcpkgArtifactIgnoreEntries, '\n', false);
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            this.tl.debug("vcpkg runner starting...");
            // Override the RUNVCPKG_VCPKG_ROOT value, it must point to this vcpkg instance.
            vcpkgUtils.setEnvVar(globals.outVcpkgRootPath, this.vcpkgDestPath);
            // The output variable must have a different name than the
            // one set with setVariable(), as the former get a prefix added out of our control.
            const outVarName = `${globals.outVcpkgRootPath}_OUT`;
            console.log(`Set task output variable '${outVarName}' to value: ${this.vcpkgDestPath}`);
            this.tl.setOutput(`${outVarName}`, this.vcpkgDestPath);
            // Force AZP_CACHING_CONTENT_FORMAT to "Files"
            vcpkgUtils.setEnvVar(vcpkgUtils.cachingFormatEnvName, "Files");
            this.options = {
                cwd: this.vcpkgDestPath,
                failOnStdErr: false,
                errStream: process.stdout,
                outStream: process.stdout,
                ignoreReturnCode: true,
                silent: false,
                windowsVerbatimArguments: false,
                env: process.env
            };
            const needRebuild = yield this.updateRepo();
            if (needRebuild) {
                yield this.build();
            }
            yield this.updatePackages();
            yield this.prepareForCache();
        });
    }
    prepareForCache() {
        return __awaiter(this, void 0, void 0, function* () {
            const artifactignoreFile = '.artifactignore';
            const artifactFullPath = path.join(this.vcpkgDestPath, artifactignoreFile);
            const [ok, content] = vcpkgUtils.readFile(artifactFullPath);
            const contentWithNewLine = ok ? content + "\n" : "";
            vcpkgUtils.writeFile(artifactFullPath, contentWithNewLine + this.vcpkgArtifactIgnoreEntries.join('\n'));
        });
    }
    updatePackages() {
        return __awaiter(this, void 0, void 0, function* () {
            let vcpkgPath = path.join(this.vcpkgDestPath, 'vcpkg');
            if (vcpkgUtils.isWin32()) {
                vcpkgPath += '.exe';
            }
            // vcpkg remove --outdated --recurse
            const removeCmd = 'remove --outdated --recurse';
            let vcpkgTool = this.tl.tool(vcpkgPath);
            console.log(`Running 'vcpkg ${removeCmd}' in directory '${this.vcpkgDestPath}' ...`);
            vcpkgTool.line(removeCmd);
            vcpkgUtils.throwIfErrorCode(yield vcpkgTool.exec(this.options));
            // vcpkg install --recurse <list of packages>
            vcpkgTool = this.tl.tool(vcpkgPath);
            let installCmd = `install --recurse ${this.vcpkgArgs}`;
            // Extract triplet from arguments for vcpkg.
            const extractedTriplet = vcpkgUtils.extractTriplet(installCmd, vcpkgUtils.readFile);
            // Append triplet, only if provided by the user in the task arguments
            if (extractedTriplet !== null) {
                if (this.vcpkgTriplet) {
                    this.tl.warning(`Ignoring the task provided triplet: '${this.vcpkgTriplet}'.`);
                }
                this.vcpkgTriplet = extractedTriplet;
                console.log(`Extracted triplet from command line '${this.vcpkgTriplet}'.`);
            }
            else {
                // If triplet is nor specified in arguments, nor in task, let's deduce it from
                // agent context (i.e. its OS).
                if (!this.vcpkgTriplet) {
                    console.log("No '--triplet' argument is provided on the command line to vcpkg.");
                }
                else {
                    console.log(`Using triplet '${this.vcpkgTriplet}'.`);
                    // Add the triplet argument to the command line.
                    installCmd += ` --triplet ${this.vcpkgTriplet}`;
                }
            }
            const outVarName = `${globals.outVcpkgTriplet}_OUT`;
            if (this.vcpkgTriplet) {
                // Set the used triplet in RUNVCPKG_VCPKG_TRIPLET environment variable.
                vcpkgUtils.setEnvVar(globals.outVcpkgTriplet, this.vcpkgTriplet);
                // Set output variable containing the use triplet
                console.log(`Set task output variable '${outVarName}' to value: ${this.vcpkgTriplet}`);
                this.tl.setVariable(outVarName, this.vcpkgTriplet);
            }
            else {
                console.log(`${globals.outVcpkgTriplet}' nor '${outVarName}' have NOT been set by the step since there is no default triplet specified.`);
            }
            vcpkgTool.line(installCmd);
            console.log(`Running 'vcpkg ${installCmd}' in directory '${this.vcpkgDestPath}' ...`);
            vcpkgUtils.throwIfErrorCode(yield vcpkgTool.exec(this.options));
        });
    }
    updateRepo() {
        return __awaiter(this, void 0, void 0, function* () {
            const gitPath = yield this.tl.which('git', true);
            // Git update or clone depending on content of vcpkgDestPath.
            const cloneCompletedFilePath = path.join(this.vcpkgDestPath, globals.vcpkgRemoteUrlLastFileName);
            // Update the source of vcpkg if needed.
            let updated = false;
            let needRebuild = false;
            const remoteUrlAndCommitId = this.vcpkgURL + this.vcpkgCommitId;
            const isSubmodule = yield vcpkgUtils.isVcpkgSubmodule(gitPath, this.vcpkgDestPath);
            if (isSubmodule) {
                // In case vcpkg it is a Git submodule...
                console.log(`'vcpkg' is detected as a submodule, adding '.git' to the ignored entries in '.artifactignore' file (for excluding it from caching).`);
                // Remove any existing '!.git'.
                this.vcpkgArtifactIgnoreEntries =
                    this.vcpkgArtifactIgnoreEntries.filter(item => !item.trim().endsWith('!.git'));
                // Add '.git' to ignore that directory.
                this.vcpkgArtifactIgnoreEntries.push('.git');
                console.log(`.artifactsignore content: '${this.vcpkgArtifactIgnoreEntries.map(s => `"${s}"`).join(', ')}'`);
                updated = true;
            }
            const res = vcpkgUtils.directoryExists(this.vcpkgDestPath);
            this.tl.debug(`exist('${this.vcpkgDestPath}') == ${res}`);
            if (res && !isSubmodule) {
                const [ok, remoteUrlAndCommitIdLast] = vcpkgUtils.readFile(cloneCompletedFilePath);
                this.tl.debug(`cloned check: ${ok}, ${remoteUrlAndCommitIdLast}`);
                if (ok) {
                    this.tl.debug(`lastcommitid=${remoteUrlAndCommitIdLast}, actualcommitid=${remoteUrlAndCommitId}`);
                    if (remoteUrlAndCommitIdLast == remoteUrlAndCommitId) {
                        // Update from remote repository.
                        this.tl.debug(`options.cwd=${this.options.cwd}`);
                        vcpkgUtils.throwIfErrorCode(yield this.tl.exec(gitPath, ['remote', 'update'], this.options));
                        // Use git status to understand if we need to rebuild vcpkg since the last cloned 
                        // repository is not up to date.
                        const gitRunner = this.tl.tool(gitPath);
                        gitRunner.arg(['status', '-uno']);
                        const res = yield gitRunner.execSync(this.options);
                        const uptodate = res.stdout.match("up to date");
                        const detached = res.stdout.match("detached");
                        if (!uptodate && !detached) {
                            // Update sources and force a rebuild.
                            vcpkgUtils.throwIfErrorCode(yield this.tl.exec(gitPath, ['pull', 'origin', this.vcpkgCommitId], this.options));
                            needRebuild = true;
                            console.log("Building vcpkg as Git repo has been updated.");
                        }
                        updated = true;
                    }
                }
            }
            // Git clone.
            if (!updated) {
                needRebuild = true;
                yield this.tl.rmRF(this.vcpkgDestPath);
                yield this.tl.mkdirP(this.vcpkgDestPath);
                this.tl.cd(this.vcpkgDestPath);
                let gitTool = this.tl.tool(gitPath);
                gitTool.arg(['clone', this.vcpkgURL, '-n', '.']);
                vcpkgUtils.throwIfErrorCode(yield gitTool.exec(this.options));
                gitTool = this.tl.tool(gitPath);
                gitTool.arg(['checkout', '--force', this.vcpkgCommitId]);
                vcpkgUtils.throwIfErrorCode(yield gitTool.exec(this.options));
                this.tl.writeFile(cloneCompletedFilePath, remoteUrlAndCommitId);
            }
            // If the executable file ./vcpkg/vcpkg is not present, force build. The fact that the repository
            // is up to date is meaningless.
            const vcpkgExe = vcpkgUtils.isWin32() ? "vcpkg.exe" : "vcpkg";
            const vcpkgPath = path.join(this.vcpkgDestPath, vcpkgExe);
            if (!vcpkgUtils.fileExists(vcpkgPath)) {
                console.log("Building vcpkg as executable is missing.");
                needRebuild = true;
            }
            else {
                if (!vcpkgUtils.isWin32()) {
                    yield this.tl.execSync('chmod', ["+x", vcpkgPath]);
                }
            }
            return needRebuild;
        });
    }
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            // Build vcpkg.
            let bootstrapFileName = 'bootstrap-vcpkg';
            if (vcpkgUtils.isWin32()) {
                bootstrapFileName += '.bat';
            }
            else {
                bootstrapFileName += '.sh';
            }
            if (vcpkgUtils.isWin32()) {
                const cmdPath = yield this.tl.which('cmd.exe', true);
                const cmdTool = this.tl.tool(cmdPath);
                cmdTool.arg(['/c', path.join(this.vcpkgDestPath, bootstrapFileName)]);
                vcpkgUtils.throwIfErrorCode(yield cmdTool.exec(this.options));
            }
            else {
                const shPath = yield this.tl.which('sh', true);
                const shTool = this.tl.tool(shPath);
                const bootstrapFullPath = path.join(this.vcpkgDestPath, bootstrapFileName);
                if (!vcpkgUtils.isWin32()) {
                    yield this.tl.execSync('chmod', ["+x", bootstrapFullPath]);
                }
                shTool.arg(['-c', bootstrapFullPath]);
                vcpkgUtils.throwIfErrorCode(yield shTool.exec(this.options));
            }
        });
    }
}
exports.VcpkgRunner = VcpkgRunner;

//# sourceMappingURL=vcpkg-runner.js.map


/***/ }),

/***/ 986:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const tr = __webpack_require__(9);
/**
 * Exec a command.
 * Output will be streamed to the live console.
 * Returns promise with return code
 *
 * @param     commandLine        command to execute (can include additional args). Must be correctly escaped.
 * @param     args               optional arguments for tool. Escaping is handled by the lib.
 * @param     options            optional exec options.  See ExecOptions
 * @returns   Promise<number>    exit code
 */
function exec(commandLine, args, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const commandArgs = tr.argStringToArray(commandLine);
        if (commandArgs.length === 0) {
            throw new Error(`Parameter 'commandLine' cannot be null or empty.`);
        }
        // Path to tool to execute should be first arg
        const toolPath = commandArgs[0];
        args = commandArgs.slice(1).concat(args || []);
        const runner = new tr.ToolRunner(toolPath, args, options);
        return runner.exec();
    });
}
exports.exec = exec;
//# sourceMappingURL=exec.js.map

/***/ })

/******/ });