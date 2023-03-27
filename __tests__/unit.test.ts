// Copyright (c) 2020-2021-2022-2023 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as process from 'process'
import * as fs from 'fs'
import * as os from 'os'
import * as vcpkgaction from '../src/vcpkg-action'
import * as actionlib from '@lukka/action-lib'
import * as cache from '@actions/cache'
import * as runvcpkglib from '@lukka/run-vcpkg-lib'
import * as path from 'path'
import * as baseutil from '@lukka/base-util-lib'
import * as vcpkgutils from '../src/vcpkg-utils'

jest.setTimeout(120 * 1000);
const baseUtil = new baseutil.BaseUtilLib(new actionlib.ActionLib());
let warningMock: jest.SpyInstance;
let errorMock: jest.SpyInstance;
let debugMock: jest.SpyInstance;
let infoMock: jest.SpyInstance;
let getFileHashMock: jest.SpyInstance;
let getStateMock: jest.SpyInstance;
let setStateMock: jest.SpyInstance;
let getBinDirMock: jest.SpyInstance;
let getVcpkgCacheDirMock: jest.SpyInstance;
let getVcpkgDirMock: jest.SpyInstance;

// Mocks entire run-vcpkg-lib module.
jest.mock("@lukka/run-vcpkg-lib");

function clearInputs(): void {
    Object.keys(process.env)
        .filter((key) => key.match(/^INPUT_/))
        .forEach((key) => {
            delete process.env[key];
        });
}

function printStackFrame(): void {
    if (process.env.DEBUG) console.trace();
}

beforeAll(async () => {
});

beforeEach(() => {
    process.env.GITHUB_WORKSPACE = os.tmpdir();
    jest.resetAllMocks();
    jest.spyOn(runvcpkglib, "getOrdinaryCachedPaths").mockImplementation(
        function (vcpkgRoot): string[] {
            return [vcpkgRoot];
        });
    warningMock = jest.spyOn(baseUtil.baseLib, 'warning').mockImplementation((msg: string) => {
        console.log(`baselib.warning(): ${msg}`);
        printStackFrame();
    });
    infoMock = jest.spyOn(baseUtil.baseLib, 'info').mockImplementation((msg: string) => {
        console.log(`baselib.info(): ${msg}`);
        printStackFrame();
    });
    debugMock = jest.spyOn(baseUtil.baseLib, 'debug').mockImplementation((msg: string) => {
        console.log(`baselib.debug(): ${msg}`);
        printStackFrame();
    });
    errorMock = jest.spyOn(baseUtil.baseLib, 'error').mockImplementation((msg: string) => {
        console.log(`baselib.error(): ${msg}`);
        printStackFrame();
    });
    setStateMock = jest.spyOn(baseUtil.baseLib, "setState").mockImplementation((name: string, value: string): void => {
        console.log(`setStateMock(): ${name}='${value}'`);
        process.env[name] = value;
    });
    getStateMock = jest.spyOn(baseUtil.baseLib, "getState").mockImplementation((name: string): string => {
        console.log(`getStateMock(): ${name}='${process.env[name]}'`);
        return process.env[name] ?? "";
    });
    getFileHashMock = jest.spyOn(baseUtil, 'getFileHash').mockImplementation((file: string) => {
        return Promise.resolve([file, `hash-of-${file}`]);
    });
    getBinDirMock = jest.spyOn(baseUtil.baseLib, 'getBinDir').mockImplementation(() => {
        return Promise.resolve(path.join(os.tmpdir(), "bin"));
    });
    getVcpkgCacheDirMock = jest.spyOn(runvcpkglib, 'getDefaultVcpkgCacheDirectory').mockImplementation((baselib) => {
        return Promise.resolve(path.join(os.tmpdir(), "vcpkg_cache"));
    });
    getVcpkgDirMock = jest.spyOn(runvcpkglib, 'getDefaultVcpkgDirectory').mockImplementation((baselib) => {
        return Promise.resolve(path.join(os.tmpdir(), "vcpkg"));
    });
});

afterEach(() => {
    clearInputs();
});

afterAll(async () => {
});

test('run-vcpkg: basic run no exception', async () => {
    // Arrange.
    process.env[`INPUT_${vcpkgaction.additionalCachedPathsInput.toUpperCase()}`] = "/a/path/";

    // Act.
    const vcpkg: vcpkgaction.VcpkgAction = new vcpkgaction.VcpkgAction(baseUtil);
    await vcpkg.run();

    // No assert.
});

test('run-vcpkg: basic run with exception', async () => {
    // Arrange.
    jest.spyOn(baseUtil, "wrapOp").mockImplementationOnce(() => { throw new Error(); });

    // Act and Assert.
    const vcpkg: vcpkgaction.VcpkgAction = new vcpkgaction.VcpkgAction(baseUtil);
    await expect(async () => await vcpkg.run()).rejects.toThrowError();
});

test('run-vcpkg: basic run with exception on saving the cache', async () => {
    // Arrange.
    jest.spyOn(cache, "saveCache").mockImplementationOnce(() => { throw new Error(); });

    // Act and Assert.
    const vcpkg: vcpkgaction.VcpkgAction = new vcpkgaction.VcpkgAction(baseUtil);
    await vcpkg.run();
});

test('run-vcpkg: cache hit', async () => {
    // Arrange.
    const primaryHitKey = "hit";
    const keys = baseutil.createKeySet([primaryHitKey]);
    const saveCacheSpy = jest.spyOn(cache, "saveCache").mockImplementation(
        function (a, b, c): Promise<number> {
            return Promise.resolve(17);
        });
    jest.spyOn(vcpkgutils.Utils,
        "computeCacheKeys").mockReturnValue(Promise.resolve(keys));
    const restoreCacheSpy = jest.spyOn(cache, "restoreCache").mockImplementation(
        function (a, b, c): Promise<string> { return Promise.resolve(primaryHitKey); });
    process.env.INPUT_VCPKGDIRECTORY = "/var/tmp/vcpkg";

    // Act.
    const vcpkg: vcpkgaction.VcpkgAction = new vcpkgaction.VcpkgAction(baseUtil);
    await vcpkg.run();

    // Asserts.
    expect(restoreCacheSpy).toBeCalledTimes(1);
    const key = restoreCacheSpy.mock.calls[0][1];

    // Cache was hit, and cache.save() must not be called.
    expect(saveCacheSpy).toBeCalledTimes(0);
});

test('run-vcpkg: cache miss', async () => {
    // Arrange.
    const saveCacheSpy = jest.spyOn(cache, "saveCache").mockImplementation(
        function (a, b, c): Promise<number> { return Promise.resolve(42); });
    // Mock returns an underfined key since it is a cache miss.
    const restoreCacheSpy = jest.spyOn(cache, "restoreCache").mockImplementation(
        function (a, b, c): Promise<string | undefined> { return Promise.resolve(undefined); });
    const vcpkgRunnerRunSpy = jest.spyOn(runvcpkglib.VcpkgRunner.prototype, "run");
    // Act.
    const vcpkg: vcpkgaction.VcpkgAction = new vcpkgaction.VcpkgAction(baseUtil);
    await vcpkg.run();

    // Asserts.
    expect(restoreCacheSpy).toBeCalledTimes(1);
    const key = restoreCacheSpy.mock.calls[0][1];
    // Cache was missed, and cache.save() is going to be called in the action.
    expect(saveCacheSpy).toBeCalledTimes(1);
    expect(saveCacheSpy.mock.calls[0][1]).toBe(key);
    // The "key cache hit" must be empty as there was no cache hit.
    expect(vcpkgRunnerRunSpy).toBeCalledTimes(0);
});

test('run-vcpkg: cache must not be restored/saved when "doNotCache" is true', async () => {
    // Arrange.
    const saveCacheSpy = jest.spyOn(cache, "saveCache");
    const restoreCacheSpy = jest.spyOn(cache, "restoreCache");
    const vcpkgRunnerRunSpy = jest.spyOn(runvcpkglib.VcpkgRunner.prototype, "run");
    process.env["INPUT_DONOTCACHE"] = "true";

    // Act.
    const vcpkg: vcpkgaction.VcpkgAction = new vcpkgaction.VcpkgAction(baseUtil);
    await vcpkg.run();

    // Asserts.

    // doNotCache is true, no cache operation must be carried.
    expect(restoreCacheSpy).toBeCalledTimes(0);
    expect(saveCacheSpy).toBeCalledTimes(0);
    expect(vcpkgRunnerRunSpy).toBeCalledTimes(0);
});

test('isExactKeyMatch() tests', () => {
    expect(vcpkgutils.Utils.isExactKeyMatch("hash1", "hash2")).toBeFalsy();
    expect(vcpkgutils.Utils.isExactKeyMatch("hash2", "hash")).toBeFalsy();
    expect(vcpkgutils.Utils.isExactKeyMatch("hash", "hash")).toBeTruthy();
});

test('getVcpkgCommitId() must return undefined when the path is not the root of a Git repository', async () => {
    // Arrange
    const vcpkgrunnerGetCommitIdMock = jest.spyOn(runvcpkglib.VcpkgRunner, 'getCommitId').
        mockImplementationOnce(function (baseUtilLib, path): Promise<string> {
            return Promise.resolve("1234");
        });

    // It must return undefined when the path is not the _root_ of a Git repository.
    const nonGitRootPath = path.resolve(__dirname);
    process.env.GITHUB_WORKSPACE = nonGitRootPath;

    // Act and Assert
    expect(await vcpkgutils.Utils.getVcpkgCommitId(baseUtil, nonGitRootPath)).toStrictEqual([undefined, undefined]);
    expect(vcpkgrunnerGetCommitIdMock).toBeCalledTimes(0);
});

test('getVcpkgCommitId() tests', async () => {
    const p = path.resolve(path.join(__dirname, ".."));
    // It must return undefined when GITHUB_WORKSPACE is not defined.
    delete process.env.GITHUB_WORKSPACE;
    expect(await vcpkgutils.Utils.getVcpkgCommitId(baseUtil, p)).toStrictEqual([undefined, undefined]);

    // It must return undefined when the path is not existent
    process.env.GITHUB_WORKSPACE = "/var/tmp/anything";
    process.env.INPUT_VCPKGDIRECTORY = "/vcpkg";
    expect(await vcpkgutils.Utils.getVcpkgCommitId(baseUtil, p)).toStrictEqual([undefined, false]);

    {
        // vcpkg submodule scenario.
        const expectedVcpkgSubmoduleCommitId = "commit_id_sha";
        jest.spyOn(fs, 'readFileSync').mockImplementationOnce(function (filePath) {
            return expectedVcpkgSubmoduleCommitId;
        });
        jest.spyOn(fs, 'existsSync').mockImplementationOnce(function (filePath) {
            return true;
        });
        const commitId = await vcpkgutils.Utils.getVcpkgCommitId(baseUtil, p);
        expect(commitId).toStrictEqual([expectedVcpkgSubmoduleCommitId, true]);
    }

    {
        // vcpkg non-submodule scenario.
        const expectedVcpkgSubmoduleCommitId = "commit_id_sha";
        jest.spyOn(fs, 'existsSync').mockImplementationOnce(function (filePath) {
            return false;
        });
        jest.spyOn(runvcpkglib.VcpkgRunner, "getCommitId").mockImplementation(
            function (baseUtil, fullVcpkgPath): Promise<string> {
                return Promise.resolve<string>(expectedVcpkgSubmoduleCommitId);
            });
        const commitId = await vcpkgutils.Utils.getVcpkgCommitId(baseUtil, p);
        expect(commitId).toStrictEqual([expectedVcpkgSubmoduleCommitId, false]);
    }
});


test('computeCacheKey(): vcpkg not as a submodule (no commit id user provided and no vcpkg.json found)', async () => {
    // Arrange.
    const expected: baseutil.KeySet = {
        "primary": "runnerOS=imageos42-vcpkgGitCommit=1234",
        "restore":
            [
            ]
    };
    process.env.ImageOS = "imageos";
    process.env.ImageVersion = "42";
    const getFileHashMock = jest.spyOn(baseUtil, 'getFileHash').mockImplementation((file: string) => {
        return Promise.resolve([null, null]);
    });
    const vcpkgCommitIdMock = jest.spyOn(vcpkgutils.Utils, 'getVcpkgCommitId').
        mockImplementationOnce(function (baseUtilLib, path): Promise<[string, boolean]> {
            return Promise.resolve(["1234", false]);
        });
    // Act and Assert.
    expect(await vcpkgutils.Utils.computeCacheKeys(
        baseUtil,
        ".",
        "")).toStrictEqual(expected);
    expect(warningMock).toBeCalledTimes(0);

    // Cleanup.
    vcpkgCommitIdMock.mockClear();
    getFileHashMock.mockClear();
});

test('computeCacheKey(): vcpkg not as a submodule (no commit id user provided)', async () => {
    // Arrange.
    const expected: baseutil.KeySet = {
        "primary": "runnerOS=imageos42-vcpkgGitCommit=1234",
        "restore":
            [
            ]
    };
    process.env.ImageOS = "imageos";
    process.env.ImageVersion = "42"
    const vcpkgCommitIdMock = jest.spyOn(vcpkgutils.Utils, 'getVcpkgCommitId').
        mockImplementationOnce(function (baseUtilLib, path): Promise<[string, boolean]> {
            return Promise.resolve(["1234", false]);
        });

    // Act and Assert.
    expect(await vcpkgutils.Utils.computeCacheKeys(
        baseUtil, "", null
    )).toStrictEqual(expected);
    expect(warningMock).toBeCalledTimes(0);

    // Cleanup.
    vcpkgCommitIdMock.mockClear();
});

test('computeCacheKey(): vcpkg as a submodule (no commit id user provided)', async () => {
    // Arrange.
    const expected: baseutil.KeySet = {
        "primary": "runnerOS=imageos42-vcpkgGitCommit=5678",
        "restore": []
    };
    process.env.ImageOS = "imageos";
    process.env.ImageVersion = "42";
    const vcpkgCommitIdMock = jest.spyOn(vcpkgutils.Utils, 'getVcpkgCommitId').
        mockImplementationOnce(function (baseUtilLib, path): Promise<[string, boolean]> {
            return Promise.resolve(["5678", true]);
        });

    // Act and Assert.
    expect(await vcpkgutils.Utils.computeCacheKeys(
        baseUtil, "", null)).toStrictEqual(expected);
    expect(warningMock).toBeCalledTimes(0);

    // Cleanup.
    vcpkgCommitIdMock.mockClear();
});

test('computeCacheKey(): vcpkg as a submodule, with user provided Git commit id, it must trigger a warning', async () => {
    // Arrange.
    const expected: baseutil.KeySet = {
        "primary": "runnerOS=imageos42-vcpkgGitCommit=0912",
        "restore": []
    };
    process.env.ImageOS = "imageos";
    process.env.ImageVersion = "42";
    const vcpkgCommitIdMock = jest.spyOn(vcpkgutils.Utils, 'getVcpkgCommitId').
        mockImplementationOnce(function (baseUtilLib, path): Promise<[string, boolean]> {
            return Promise.resolve(["0912", true /* is submodule must be true */]);
        });

    // Act and Assert.
    expect(await vcpkgutils.Utils.computeCacheKeys(
        baseUtil, "", "userProvidedGitCommitId")).toStrictEqual(expected);
    expect(warningMock).toBeCalledTimes(1);
    vcpkgCommitIdMock.mockClear();
});

test('computeCacheKey(): vcpkg with user provided commit it must not trigger a warning', async () => {
    // Arrange.
    const expected: baseutil.KeySet = {
        "primary": "runnerOS=imageos42-vcpkgGitCommit=userProvidedCommitId",
        "restore": []
    };
    process.env.ImageOS = "imageos";
    process.env.ImageVersion = "42";
    const vcpkgCommitIdMock = jest.spyOn(vcpkgutils.Utils, 'getVcpkgCommitId').
        mockImplementationOnce(function (baseUtilLib, path): Promise<[string | undefined, boolean]> {
            return Promise.resolve([undefined, false]);
        });

    // Act and assert.
    expect(await vcpkgutils.Utils.computeCacheKeys(
        baseUtil, "", "userProvidedCommitId")).toStrictEqual(expected);
    expect(warningMock).toBeCalledTimes(0);
});
