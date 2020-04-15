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
/******/ 		return __webpack_require__(762);
/******/ 	};
/******/
/******/ 	// run startup
/******/ 	return startup();
/******/ })
/************************************************************************/
/******/ ({

/***/ 16:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";

// Copyright (c) 2020 Luca Cappa
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
const core = __webpack_require__(470);
const vcpkgrunner = __webpack_require__(835);
const globals = __webpack_require__(471);
const cp = __webpack_require__(129);
const path = __webpack_require__(622);
const fs = __webpack_require__(747);
exports.VCPKGCACHEKEY = 'vcpkgDirectoryKey';
/**
 * The input's name for additional content for the cache key.
 */
exports.appendedCacheKey = 'appendedCacheKey';
/**
 * Compute an unique number given some text.
 * @param {string} text
 * @returns {string}
 */
function hashCode(text) {
    let hash = 42;
    if (text.length != 0) {
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) + hash) ^ char;
        }
    }
    return hash.toString();
}
class VcpkgAction {
    constructor(tl) {
        this.tl = tl;
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                core.startGroup('Restore vcpkg and its artifacts from cache');
                // Get an unique output directory name from the URL.
                const key = this.computeKey();
                const outPath = this.getOutputPath();
                // Use the embedded actions/cache to cache the downloaded CMake binaries.
                process.env.INPUT_KEY = key;
                console.log(`Cache's key = '${key}'.`);
                process.env.INPUT_PATH = outPath;
                core.saveState(exports.VCPKGCACHEKEY, outPath);
                const options = {
                    env: process.env,
                    stdio: "inherit",
                };
                const scriptPath = path.join(__dirname, '../actions/cache/dist/restore/index.js');
                console.log(`Running restore-cache`);
                cp.execSync(`node ${scriptPath}`, options);
            }
            finally {
                core.endGroup();
            }
            const runner = new vcpkgrunner.VcpkgRunner(this.tl);
            yield runner.run();
        });
    }
    getOutputPath() {
        return core.getInput(globals.vcpkgDirectory);
    }
    getVcpkgCommitId() {
        var _a;
        let id = "";
        const workspaceDir = (_a = process.env.GITHUB_WORKSPACE, (_a !== null && _a !== void 0 ? _a : ""));
        if (workspaceDir) {
            let fullVcpkgPath = "";
            const inputVcpkgPath = core.getInput(globals.vcpkgDirectory);
            if (path.isAbsolute(inputVcpkgPath))
                fullVcpkgPath = path.normalize(path.resolve(inputVcpkgPath));
            else
                fullVcpkgPath = path.normalize(path.resolve(path.join(workspaceDir, inputVcpkgPath)));
            core.debug(`fullVcpkgPath='${fullVcpkgPath}'`);
            const relPath = fullVcpkgPath.replace(workspaceDir, '');
            core.debug(`relPath='${relPath}'`);
            const submodulePath = path.join(workspaceDir, ".git/modules", relPath, "HEAD");
            core.debug(`submodulePath='${submodulePath}'`);
            if (fs.existsSync(submodulePath)) {
                id = fs.readFileSync(submodulePath).toString();
                core.debug(`commitId='${id}'`);
            }
        }
        return id.trim();
    }
    computeKey() {
        let key = "";
        const commitId = this.getVcpkgCommitId();
        if (commitId) {
            console.log(`vcpkg identified at commitId=${commitId}, adding it to the cache's key.`);
            key += `submodGitId=${commitId}`;
        }
        else if (core.getInput(globals.vcpkgCommitId)) {
            key += "localGitId=" + hashCode(core.getInput(globals.vcpkgCommitId));
        }
        else {
            console.log(`No vcpkg's commit id was provided, does not contribute to the cache's key.`);
        }
        key += "-args=" + hashCode(core.getInput(globals.vcpkgArguments));
        key += "-os=" + hashCode(process.platform);
        key += "-appendedKey=" + hashCode(core.getInput(exports.appendedCacheKey));
        return key;
    }
}
exports.VcpkgAction = VcpkgAction;

//# sourceMappingURL=vcpkg-action.js.map


/***/ }),

/***/ 87:
/***/ (function(module) {

module.exports = require("os");

/***/ }),

/***/ 129:
/***/ (function(module) {

module.exports = require("child_process");

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
exports.vcpkgLastBuiltCommitId = 'vcpkgLastBuiltCommitId';
exports.cleanAfterBuild = 'cleanAfterBuild';
exports.doNotUpdateVcpkg = 'doNotUpdateVcpkg';
exports.vcpkgRoot = 'VCPKG_ROOT';
exports.setupOnly = 'setupOnly';

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

/***/ 471:
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
exports.vcpkgLastBuiltCommitId = 'vcpkgLastBuiltCommitId';
exports.cleanAfterBuild = 'cleanAfterBuild';
exports.doNotUpdateVcpkg = 'doNotUpdateVcpkg';
exports.vcpkgRoot = 'VCPKG_ROOT';
exports.setupOnly = 'setupOnly';

//# sourceMappingURL=vcpkg-globals.js.map


/***/ }),

/***/ 622:
/***/ (function(module) {

module.exports = require("path");

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
const path = __webpack_require__(622);
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
    if (errorCode !== 0) {
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
function getVcpkgExePath(vcpkgRoot) {
    const vcpkgExe = isWin32() ? "vcpkg.exe" : "vcpkg";
    const vcpkgExePath = path.join(vcpkgRoot, vcpkgExe);
    return vcpkgExePath;
}
exports.getVcpkgExePath = getVcpkgExePath;
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
function trimString(value) {
    var _a, _b;
    return _b = (_a = value) === null || _a === void 0 ? void 0 : _a.trim(), (_b !== null && _b !== void 0 ? _b : "");
}
exports.trimString = trimString;
function wrapOp(name, fn) {
    return __awaiter(this, void 0, void 0, function* () {
        baseLib.beginOperation(name);
        let result;
        try {
            result = yield fn();
        }
        finally {
            baseLib.endOperation();
        }
        return result;
    });
}
exports.wrapOp = wrapOp;
function wrapOpSync(name, fn) {
    baseLib.beginOperation(name);
    let result;
    try {
        result = fn();
    }
    finally {
        baseLib.endOperation();
    }
    return result;
}
exports.wrapOpSync = wrapOpSync;

//# sourceMappingURL=vcpkg-utils.js.map


/***/ }),

/***/ 747:
/***/ (function(module) {

module.exports = require("fs");

/***/ }),

/***/ 762:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";

// Copyright (c) 2020 Luca Cappa
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
const core = __webpack_require__(470);
const action = __webpack_require__(16);
const cp = __webpack_require__(129);
const path = __webpack_require__(622);
const fs = __webpack_require__(747);
function moveAway(rootDir) {
    if (process.env.RUNNER_TEMP) {
        for (const dirName of ['buildtrees', 'downloads', 'packages'])
            try {
                const src = path.normalize(path.join(rootDir, dirName));
                const dst = path.join(process.env.RUNNER_TEMP, dirName);
                console.log(`${src} -> ${dst}`);
                fs.renameSync(src, dst);
                console.log(`Moved away '${dirName}' to avoid caching it.`);
            }
            catch (error) {
                // Keep going in any case.
                core.debug(`${error}`);
            }
    }
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            core.startGroup('Cache vcpkg and its artifacts');
            const pathsToCache = core.getState(action.VCPKGCACHEKEY);
            for (const dir of pathsToCache.split(';')) {
                core.info(`Caching path: '${dir}'`);
                moveAway(dir);
                process.env.INPUT_PATH = dir;
                const options = {
                    env: process.env,
                    stdio: "inherit",
                };
                const scriptPath = __webpack_require__.ab + "index1.js";
                console.log(`Running store-cache`);
                cp.execSync(`node ${scriptPath}`, options);
            }
            core.info('run-vcpkg post action execution succeeded');
            process.exitCode = 0;
        }
        catch (err) {
            const errorAsString = ((err !== null && err !== void 0 ? err : "undefined error")).toString();
            core.debug('Error: ' + errorAsString);
            core.error(errorAsString);
            core.setFailed('run-vcpkg post action execution failed');
            process.exitCode = -1000;
        }
    });
}
// Main entry point of the task.
main().catch(error => console.error("main() failed!", error));

//# sourceMappingURL=post-action.js.map


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
        var _a, _b, _c, _d, _e;
        this.tl = tl;
        this.options = {};
        this.vcpkgArtifactIgnoreEntries = [];
        this.cleanAfterBuild = false;
        this.doNotUpdateVcpkg = false;
        this.setupOnly = (_a = this.tl.getBoolInput(globals.setupOnly, false), (_a !== null && _a !== void 0 ? _a : false));
        this.vcpkgArgs = (_b = this.tl.getInput(globals.vcpkgArguments, this.setupOnly === false), (_b !== null && _b !== void 0 ? _b : ""));
        this.defaultVcpkgUrl = 'https://github.com/microsoft/vcpkg.git';
        this.vcpkgURL =
            this.tl.getInput(globals.vcpkgGitURL, false) || this.defaultVcpkgUrl;
        this.vcpkgCommitId =
            this.tl.getInput(globals.vcpkgCommitId, false);
        this.vcpkgDestPath = (_c = this.tl.getPathInput(globals.vcpkgDirectory, false, false), (_c !== null && _c !== void 0 ? _c : ""));
        if (!this.vcpkgDestPath) {
            this.vcpkgDestPath = path.join(this.tl.getBinDir(), 'vcpkg');
        }
        this.vcpkgTriplet = this.tl.getInput(globals.vcpkgTriplet, false) || "";
        this.vcpkgArtifactIgnoreEntries = this.tl.getDelimitedInput(globals.vcpkgArtifactIgnoreEntries, '\n', false);
        this.doNotUpdateVcpkg = (_d = this.tl.getBoolInput(globals.doNotUpdateVcpkg, false), (_d !== null && _d !== void 0 ? _d : false));
        this.cleanAfterBuild = (_e = this.tl.getBoolInput(globals.cleanAfterBuild, false), (_e !== null && _e !== void 0 ? _e : true));
        // Git update or clone depending on content of vcpkgDestPath input parameter.
        this.pathToLastBuiltCommitId = path.join(this.vcpkgDestPath, globals.vcpkgLastBuiltCommitId);
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
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            this.tl.debug("vcpkg runner starting...");
            vcpkgUtils.wrapOpSync("Set output env vars", () => this.setOutputs());
            // Ensuring `this.vcpkgDestPath` is existent, since is going to be used as current working directory.
            if (!(yield this.tl.exist(this.vcpkgDestPath))) {
                this.tl.debug(`Creating vcpkg root directory as it is not existing: ${this.vcpkgDestPath}`);
                yield this.tl.mkdirP(this.vcpkgDestPath);
            }
            let needRebuild = false;
            const currentCommitId = yield this.getCommitId();
            if (this.doNotUpdateVcpkg) {
                console.log(`Skipping any check to update vcpkg directory (${this.vcpkgDestPath}).`);
            }
            else {
                const updated = yield vcpkgUtils.wrapOp("Check whether vcpkg repository is up to date", () => this.checkRepoUpdated(currentCommitId));
                if (!updated) {
                    yield vcpkgUtils.wrapOp("Download vcpkg source code repository", () => this.cloneRepo());
                    needRebuild = true;
                }
            }
            // Build is needed at the first check which is saying so.
            if (!needRebuild) {
                needRebuild = vcpkgUtils.wrapOpSync("Check whether last vcpkg's build is up to date with sources", () => this.checkLastBuildCommitId(currentCommitId));
                if (!needRebuild) {
                    needRebuild = yield vcpkgUtils.wrapOp("Check vcpkg executable exists", () => this.checkExecutable());
                }
            }
            if (needRebuild) {
                yield vcpkgUtils.wrapOp("Build vcpkg", () => this.build());
            }
            if (!this.setupOnly) {
                yield vcpkgUtils.wrapOp("Install/Update ports", () => this.updatePackages());
            }
            yield vcpkgUtils.wrapOp("Prepare vcpkg generated file for caching", () => this.prepareForCache());
        });
    }
    setOutputs() {
        // Set the RUNVCPKG_VCPKG_ROOT value, it could be re-used later by run-cmake task.
        vcpkgUtils.setEnvVar(globals.outVcpkgRootPath, this.vcpkgDestPath);
        // Override the VCPKG_ROOT value, it must point to this vcpkg instance, it is used by 
        // any invocation of the vcpkg executable in this task.
        vcpkgUtils.setEnvVar(globals.vcpkgRoot, this.vcpkgDestPath);
        // The output variable must have a different name than the
        // one set with setVariable(), as the former get a prefix added out of our control.
        const outVarName = `${globals.outVcpkgRootPath}_OUT`;
        console.log(`Set task output variable '${outVarName}' to value: ${this.vcpkgDestPath}`);
        this.tl.setOutput(`${outVarName}`, this.vcpkgDestPath);
        // Force AZP_CACHING_CONTENT_FORMAT to "Files"
        vcpkgUtils.setEnvVar(vcpkgUtils.cachingFormatEnvName, "Files");
    }
    prepareForCache() {
        return __awaiter(this, void 0, void 0, function* () {
            const artifactignoreFile = '.artifactignore';
            const artifactFullPath = path.join(this.vcpkgDestPath, artifactignoreFile);
            vcpkgUtils.writeFile(artifactFullPath, this.vcpkgArtifactIgnoreEntries.join('\n'));
        });
    }
    static extractOverlays(args, currentDir) {
        const overlays = args.split(' ').
            filter((item) => item.startsWith(VcpkgRunner.overlayArgName) || item.startsWith('@'));
        let result = [];
        for (const item of overlays) {
            if (item.startsWith('@')) {
                let responseFilePath = item.slice(1);
                if (!path.isAbsolute(responseFilePath)) {
                    responseFilePath = path.join(currentDir, responseFilePath);
                }
                const [ok, content] = vcpkgUtils.readFile(responseFilePath);
                if (ok) {
                    const overlays2 = content.split('\n').
                        filter((item) => item.trim().startsWith(VcpkgRunner.overlayArgName)).map((item) => item.trim());
                    result = result.concat(overlays2);
                }
            }
            else {
                result = result.concat(item);
            }
        }
        return result;
    }
    updatePackages() {
        return __awaiter(this, void 0, void 0, function* () {
            let vcpkgPath = path.join(this.vcpkgDestPath, 'vcpkg');
            if (vcpkgUtils.isWin32()) {
                vcpkgPath += '.exe';
            }
            const appendedOverlaysArgs = VcpkgRunner.extractOverlays(this.vcpkgArgs, this.options.cwd);
            const appendedString = appendedOverlaysArgs ? " " + appendedOverlaysArgs.join(' ') : "";
            // vcpkg remove --outdated --recurse
            const removeCmd = `remove --outdated --recurse${appendedString}`;
            let vcpkgTool = this.tl.tool(vcpkgPath);
            console.log(`Running 'vcpkg ${removeCmd}' in directory '${this.vcpkgDestPath}' ...`);
            vcpkgTool.line(removeCmd);
            vcpkgUtils.throwIfErrorCode(yield vcpkgTool.exec(this.options));
            // vcpkg install --recurse <list of packages>
            vcpkgTool = this.tl.tool(vcpkgPath);
            let installCmd = `install --recurse ${this.vcpkgArgs}`;
            // Get the triplet specified in the task.
            let vcpkgTripletUsed = this.vcpkgTriplet;
            // Extract triplet from arguments for vcpkg.
            const extractedTriplet = vcpkgUtils.extractTriplet(installCmd, vcpkgUtils.readFile);
            // Append triplet, only if provided by the user in the task arguments
            if (extractedTriplet !== null) {
                if (vcpkgTripletUsed) {
                    this.tl.warning(`Ignoring the task provided triplet: '${vcpkgTripletUsed}'.`);
                }
                vcpkgTripletUsed = extractedTriplet;
                console.log(`Extracted triplet from command line '${vcpkgTripletUsed}'.`);
            }
            else {
                // If triplet is nor specified in arguments, nor in task, let's deduce it from
                // agent context (i.e. its OS).
                if (!vcpkgTripletUsed) {
                    console.log("No '--triplet' argument is provided on the command line to vcpkg.");
                }
                else {
                    console.log(`Using triplet '${vcpkgTripletUsed}'.`);
                    // Add the triplet argument to the command line.
                    installCmd += ` --triplet ${vcpkgTripletUsed}`;
                }
            }
            // If required, add '--clean-after-build'
            if (this.cleanAfterBuild) {
                installCmd += ' --clean-after-build';
            }
            const outVarName = `${globals.outVcpkgTriplet}_OUT`;
            if (vcpkgTripletUsed) {
                // Set the used triplet in RUNVCPKG_VCPKG_TRIPLET environment variable.
                vcpkgUtils.setEnvVar(globals.outVcpkgTriplet, vcpkgTripletUsed);
                // Set output variable containing the use triplet
                console.log(`Set task output variable '${outVarName}' to value: ${vcpkgTripletUsed}`);
                this.tl.setVariable(outVarName, vcpkgTripletUsed);
            }
            else {
                console.log(`${globals.outVcpkgTriplet}' nor '${outVarName}' have NOT been set by the step since there is no default triplet specified.`);
            }
            vcpkgTool.line(installCmd);
            console.log(`Running 'vcpkg ${installCmd}' in directory '${this.vcpkgDestPath}' ...`);
            vcpkgUtils.throwIfErrorCode(yield vcpkgTool.exec(this.options));
        });
    }
    /**
     * Get the commit id of the vcpkg directory specified in 'vcpkgDirectory' input.
     * @private
     * @returns {Promise<string>} the commit id
     * @memberof VcpkgRunner
     */
    getCommitId() {
        return __awaiter(this, void 0, void 0, function* () {
            this.tl.debug("getCommitId()<<");
            let currentCommitId = "";
            const gitPath = yield this.tl.which('git', true);
            // Use git to verify whether the repo is up to date.
            const gitRunner = this.tl.tool(gitPath);
            gitRunner.arg(['rev-parse', 'HEAD']);
            console.log(`Fetching the commit id at ${this.options.cwd}`);
            const res = yield gitRunner.execSync(this.options);
            if (res.code === 0) {
                currentCommitId = vcpkgUtils.trimString(res.stdout);
                this.tl.debug(`git rev-parse: code=${res.code}, stdout=${vcpkgUtils.trimString(res.stdout)}, stderr=${vcpkgUtils.trimString(res.stderr)}`);
            }
            else /* if (res.code !== 0) */ {
                this.tl.debug(`error executing git: code=${res.code}, stdout=${vcpkgUtils.trimString(res.stdout)}, stderr=${vcpkgUtils.trimString(res.stderr)}`);
            }
            this.tl.debug(`getCommitId()>> -> ${currentCommitId}`);
            return currentCommitId;
        });
    }
    checkRepoUpdated(currentCommitId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Checking whether vcpkg's repository is updated to commit id '${currentCommitId}' ...`);
            let updated = false;
            const gitPath = yield this.tl.which('git', true);
            const isSubmodule = yield vcpkgUtils.isVcpkgSubmodule(gitPath, this.vcpkgDestPath);
            if (isSubmodule) {
                // In case vcpkg it is a Git submodule...
                console.log(`'vcpkg' is detected as a submodule, adding '.git' to the ignored entries in '.artifactignore' file (for excluding it from caching).`);
                // Remove any existing '!.git'.
                this.vcpkgArtifactIgnoreEntries =
                    this.vcpkgArtifactIgnoreEntries.filter(item => !item.trim().endsWith('!.git'));
                // Add '.git' to ignore that directory.
                this.vcpkgArtifactIgnoreEntries.push('.git');
                console.log(`File '.artifactsignore' content: '${this.vcpkgArtifactIgnoreEntries.map(s => `'${s}'`).join(', ')}'`);
                updated = true;
                // Issue a warning if the vcpkgCommitId is specified.
                if (this.vcpkgCommitId) {
                    this.tl.warning(`Since the vcpkg directory '${this.vcpkgDestPath}' is a submodule, the input '${globals.vcpkgCommitId}' should not be provided (${this.vcpkgCommitId})`);
                }
            }
            else {
                const res = vcpkgUtils.directoryExists(this.vcpkgDestPath);
                this.tl.debug(`exist('${this.vcpkgDestPath}') === ${res}`);
                if (res && !isSubmodule) {
                    // Use git to verify whether the repo is up to date.
                    console.log(`Current commit id of vcpkg: '${currentCommitId}'.`);
                    if (!this.vcpkgCommitId) {
                        throw new Error(`'${globals.vcpkgCommitId}' input parameter must be provided when the specified vcpkg directory (${this.vcpkgDestPath}) is not a submodule.`);
                    }
                    if (this.vcpkgCommitId === currentCommitId) {
                        console.log(`Repository is up to date to requested commit id '${this.vcpkgCommitId}'`);
                        updated = true;
                    }
                }
            }
            console.log(`Is vcpkg repository updated? ${updated ? "Yes" : "No"}`);
            return updated;
        });
    }
    checkLastBuildCommitId(vcpkgCommitId) {
        console.log(`Checking last vcpkg build commit id in file '${this.pathToLastBuiltCommitId}' ...`);
        let rebuild = true; // Default is true.
        const [ok, lastCommitIdLast] = vcpkgUtils.readFile(this.pathToLastBuiltCommitId);
        this.tl.debug(`last build check: ${ok}, ${lastCommitIdLast}`);
        if (ok) {
            this.tl.debug(`lastcommitid = ${lastCommitIdLast}, currentcommitid = ${vcpkgCommitId}`);
            if (lastCommitIdLast === vcpkgCommitId) {
                rebuild = false;
                console.log(`vcpkg executable is up to date with sources.`);
            }
            else {
                console.log(`vcpkg executable is out of date with sources.`);
            }
        }
        else {
            rebuild = true; // Force a rebuild.
            console.log(`There is no file containing last built commit id of vcpkg, forcing a rebuild.`);
        }
        return rebuild;
    }
    cloneRepo() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Cloning vcpkg in '${this.vcpkgDestPath}'...`);
            if (!this.vcpkgCommitId) {
                throw new Error(`When the vcpkg directory is empty, the input parameter '${globals.vcpkgCommitId}' must be provided to git clone the repository.`);
            }
            const gitPath = yield this.tl.which('git', true);
            yield this.tl.rmRF(this.vcpkgDestPath);
            yield this.tl.mkdirP(this.vcpkgDestPath);
            this.tl.cd(this.vcpkgDestPath);
            let gitTool = this.tl.tool(gitPath);
            gitTool.arg(['clone', this.vcpkgURL, '-n', '.']);
            vcpkgUtils.throwIfErrorCode(yield gitTool.exec(this.options));
            gitTool = this.tl.tool(gitPath);
            gitTool.arg(['checkout', '--force', this.vcpkgCommitId]);
            vcpkgUtils.throwIfErrorCode(yield gitTool.exec(this.options));
            console.log(`Clone vcpkg in '${this.vcpkgDestPath}'.`);
        });
    }
    checkExecutable() {
        return __awaiter(this, void 0, void 0, function* () {
            let needRebuild = false;
            // If the executable file ./vcpkg/vcpkg is not present, force build. The fact that 'the repository is up to date' is meaningless.
            const vcpkgExePath = vcpkgUtils.getVcpkgExePath(this.vcpkgDestPath);
            if (!vcpkgUtils.fileExists(vcpkgExePath)) {
                console.log("Building vcpkg is necessary as executable is missing.");
                needRebuild = true;
            }
            else {
                if (!vcpkgUtils.isWin32()) {
                    yield this.tl.execSync('chmod', ["+x", vcpkgExePath]);
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
            // After a build, refetch the commit id of the vcpkg's repo, and store it into the file.
            const builtCommitId = yield this.getCommitId();
            vcpkgUtils.writeFile(this.pathToLastBuiltCommitId, builtCommitId);
            // Keep track of last successful build commit id.
            console.log(`Stored last built vcpkg commit id '${builtCommitId}' in file '${this.pathToLastBuiltCommitId}`);
        });
    }
}
exports.VcpkgRunner = VcpkgRunner;
VcpkgRunner.overlayArgName = "--overlay-ports=";

//# sourceMappingURL=vcpkg-runner.js.map


/***/ })

/******/ });