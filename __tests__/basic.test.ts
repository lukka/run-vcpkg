import * as process from 'process'
import * as fs from 'fs'
import * as vcpkgaction from '../src/vcpkg-action'
import * as actionlib from '@lukka/action-lib'
import * as cache from '@actions/cache'
import * as core from '@actions/core'
import * as runvcpkglib from '@lukka/run-vcpkg-lib'
import * as path from 'path'
import * as baseutil from '@lukka/base-util-lib'
import * as vcpkgutils from '../src/vcpkg-utils'

jest.setTimeout(15 * 1000);
// Mocks entire action-lib module.
jest.mock("@lukka/action-lib");
// Mocks entire run-vcpkg-lib module.
jest.mock("@lukka/run-vcpkg-lib");

function createDir(path: string) {
    try {
        fs.mkdirSync(path, { recursive: true });
    } catch (err) {
        if (err.code !== 'EEXIST') {
            throw err
        }
    }
}

function clearInputs(): void {
    Object.keys(process.env)
        .filter((key) => key.match(/^INPUT_/))
        .forEach((key) => {
            delete process.env[key];
        });
}

beforeAll(async () => {
    process.env.GITHUB_WORKSPACE = "/var/tmp/";
    jest.resetAllMocks();
    jest.spyOn(runvcpkglib, "getOrdinaryCachedPaths").mockImplementation(
        function (vcpkgRoot): string[] {
            return [vcpkgRoot];
        });    
});

beforeEach(() => {
});

afterEach(() => {
    clearInputs();
});

afterAll(async () => {
});

test('run-vcpkg: basic run scenario test', async () => {
    const vcpkg: vcpkgaction.VcpkgAction = new vcpkgaction.VcpkgAction(
        new baseutil.BaseUtilLib(new actionlib.ActionLib()));
    await vcpkg.run();
});

test('run-vcpkg: cache hit scenario test', async () => {
    // Arrange.
    const saveCacheSpy = jest.spyOn(cache, "saveCache").mockImplementation(
        function (a, b, c): Promise<number> {
            return Promise.resolve(17);
        });
    const restoreCacheSpy = jest.spyOn(cache, "restoreCache").mockImplementation(
        function (a, b, c): Promise<string> { return Promise.resolve("hit"); });
    const keyMatchMock = jest.spyOn(vcpkgutils.Utils, "isExactKeyMatch").mockReturnValue(true);
    process.env.INPUT_VCPKGDIRECTORY = "/var/tmp/vcpkg";

    // Act.
    const vcpkg: vcpkgaction.VcpkgAction = new vcpkgaction.VcpkgAction(
        new baseutil.BaseUtilLib(new actionlib.ActionLib()));
    await vcpkg.run();

    // Asserts.
    expect(restoreCacheSpy).toBeCalledTimes(1);
    const key = restoreCacheSpy.mock.calls[0][1];
    // Cache was hit, it must not be called!
    expect(saveCacheSpy).toBeCalledTimes(0);

    // Clear mocks.
    keyMatchMock.mockRestore();
});

test('run-vcpkg: cache miss scenario test', async () => {
    // Arrange.
    const saveCacheSpy = jest.spyOn(cache, "saveCache").mockImplementation(
        function (a, b, c): Promise<number> { return Promise.resolve(42); });
    // Mock returns an underfined key since it is a cache miss.
    const restoreCacheSpy = jest.spyOn(cache, "restoreCache").mockImplementation(
        function (a, b, c): Promise<string | undefined> { return Promise.resolve(undefined); });
    const vcpkgRunnerRunSpy = jest.spyOn(runvcpkglib.VcpkgRunner.prototype, "run");
    // Act.
    const vcpkg: vcpkgaction.VcpkgAction = new vcpkgaction.VcpkgAction(
        new baseutil.BaseUtilLib(new actionlib.ActionLib()));
    await vcpkg.run();

    // Asserts.
    expect(restoreCacheSpy).toBeCalledTimes(1);
    const key = restoreCacheSpy.mock.calls[0][1];
    // Cache was missed, it must be called once!
    expect(saveCacheSpy).toBeCalledTimes(1);
    expect(vcpkgRunnerRunSpy).toBeCalledTimes(1);
    expect(saveCacheSpy.mock.calls[0][1]).toBe(key);
});

test('run-vcpkg: cache must not be restored/saved when "doNotCache" is true scenario test', async () => {
    // Arrange.
    const saveCacheSpy = jest.spyOn(cache, "saveCache");
    const restoreCacheSpy = jest.spyOn(cache, "restoreCache");
    const vcpkgRunnerRunSpy = jest.spyOn(runvcpkglib.VcpkgRunner.prototype, "run");
    process.env["INPUT_DONOTCACHE"] = "true";
    jest.mock("@actions/core");

    // Act.
    const vcpkg: vcpkgaction.VcpkgAction = new vcpkgaction.VcpkgAction(
        new baseutil.BaseUtilLib(new actionlib.ActionLib()));
    await vcpkg.run();

    // Asserts.

    // doNotCache is true, no cache operation must be carried.
    expect(restoreCacheSpy).toBeCalledTimes(0);
    expect(saveCacheSpy).toBeCalledTimes(0);
    expect(vcpkgRunnerRunSpy).toBeCalledTimes(1);
});

test('isExactKeyMatch tests', () => {
    const hash = vcpkgutils.Utils.hashCode("hashCode");
    const hash2 = vcpkgutils.Utils.hashCode("hashCode2");
    expect(vcpkgutils.Utils.isExactKeyMatch(hash, hash2)).toBeFalsy();
    expect(vcpkgutils.Utils.isExactKeyMatch(hash2, hash)).toBeFalsy();
    expect(vcpkgutils.Utils.isExactKeyMatch(hash, hash)).toBeTruthy();
});

test('getVcpkgCommitId tests', async () => {
    const p = path.resolve(path.join(__dirname, ".."));
    const baseUtils = new baseutil.BaseUtilLib(new actionlib.ActionLib());
    // It must return undefined when GITHUB_WORKSPACE is not defined.
    delete process.env.GITHUB_WORKSPACE;
    expect(await vcpkgutils.Utils.getVcpkgCommitId(baseUtils, p)).toStrictEqual([undefined, undefined]);

    // It must return undefined when there is no vcpkg repository.
    process.env.GITHUB_WORKSPACE = "/var/tmp/anything";
    process.env.INPUT_VCPKGDIRECTORY = "fafsadfdsds";
    expect(await vcpkgutils.Utils.getVcpkgCommitId(baseUtils, p)).toStrictEqual([undefined, false]);

    {
        // vcpkg submodule scenario.
        const expectedVcpkgSubmoduleCommitId = "commit_id_sha";
        jest.spyOn(fs, 'readFileSync').mockImplementationOnce(function (filePath) {
            return expectedVcpkgSubmoduleCommitId;
        });
        jest.spyOn(fs, 'existsSync').mockImplementationOnce(function (filePath) {
            return true;
        });
        const commitId = await vcpkgutils.Utils.getVcpkgCommitId(baseUtils, p);
        expect(commitId).toStrictEqual([expectedVcpkgSubmoduleCommitId, true]);
    }

    {
        // vcpkg non-submodule scenario.
        const expectedVcpkgSubmoduleCommitId = "commit_id_sha";
        jest.spyOn(fs, 'existsSync').mockImplementationOnce(function (filePath) {
            return false;
        });
        jest.spyOn(runvcpkglib.VcpkgRunner, "getCommitId").mockImplementation(
            function (baseUtils, fullVcpkgPath): Promise<string> {
                return Promise.resolve<string>(expectedVcpkgSubmoduleCommitId);
            });
        const commitId = await vcpkgutils.Utils.getVcpkgCommitId(baseUtils, p);
        expect(commitId).toStrictEqual([expectedVcpkgSubmoduleCommitId, false]);
    }
});
