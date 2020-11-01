import * as process from 'process'
import * as fs from 'fs'
import * as vcpkgAction from '../src/vcpkg-action'
import * as actionLib from '@lukka/action-lib'
import * as vcpkgUtils from '../src/vcpkg-utils'
import * as cache from '@actions/cache'
import * as core from '@actions/core'
import * as runVcpkgLib from '@lukka/run-vcpkg-lib'
import * as path from 'path'
import { BaseUtilLib } from '@lukka/base-util-lib'
import { ActionLib } from '@lukka/action-lib'

jest.setTimeout(15 * 1000)
// Mocks entire action-lib module.
jest.mock("@lukka/action-lib");
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
});

beforeEach(() => {
});

afterEach(() => {
    clearInputs();
});

afterAll(async () => {
});

test('run-vcpkg: basic run scenario test', async () => {
    const vcpkg: vcpkgAction.VcpkgAction = new vcpkgAction.VcpkgAction(
        new BaseUtilLib(new actionLib.ActionLib()));
    await vcpkg.run();
});

test('run-vcpkg: cache hit scenario test', async () => {
    // Arrange.
    const saveCacheSpy = jest.spyOn(cache, "saveCache").mockImplementation(
        function (a, b, c): Promise<number> { return Promise.resolve(17); });
    const restoreCacheSpy = jest.spyOn(cache, "restoreCache").mockImplementation(
        function (a, b, c): Promise<string> { return Promise.resolve("hit"); });
    const keyMatchMock = jest.spyOn(vcpkgUtils, "isExactKeyMatch").mockImplementation(
        function (key: string, cacheKey?: string): boolean {
            return true;
        });

    // Act.
    const vcpkg: vcpkgAction.VcpkgAction = new vcpkgAction.VcpkgAction(
        new BaseUtilLib(new actionLib.ActionLib()));
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
    const keyMatchMock = jest.spyOn(vcpkgUtils, "isExactKeyMatch").mockImplementation(
        function (key: string, cacheKey?: string): boolean {
            return false;
        });
    const vcpkgRunnerRunSpy = jest.spyOn(runVcpkgLib.VcpkgRunner.prototype, "run");
    // Act.
    const vcpkg: vcpkgAction.VcpkgAction = new vcpkgAction.VcpkgAction(
        new BaseUtilLib(new actionLib.ActionLib()));
    await vcpkg.run();

    // Asserts.
    expect(restoreCacheSpy).toBeCalledTimes(1);
    const key = restoreCacheSpy.mock.calls[0][1];
    // Cache was missed, it must be called once!
    expect(saveCacheSpy).toBeCalledTimes(1);
    expect(vcpkgRunnerRunSpy).toBeCalledTimes(1);
    expect(saveCacheSpy.mock.calls[0][1]).toBe(key);

    // Clear mocks.
    keyMatchMock.mockRestore();
});

test('run-vcpkg: cache must not be restored/saved when "doNotCache" is true scenario test', async () => {
    // Arrange.
    const saveCacheSpy = jest.spyOn(cache, "saveCache");
    const restoreCacheSpy = jest.spyOn(cache, "restoreCache");
    const keyMatchMock = jest.spyOn(vcpkgUtils, "isExactKeyMatch").mockImplementation(
        function (key: string, cacheKey?: string): boolean {
            return true;
        });
    const vcpkgRunnerRunSpy = jest.spyOn(runVcpkgLib.VcpkgRunner.prototype, "run");
    jest.mock("@actions/core");
    const inputMock = jest.spyOn(core, "getInput").mockImplementation(
        (name: string, options): string => {
            if (name === vcpkgAction.doNotCacheInput) {
                return "true";
            } else {
                return jest.requireActual("@actions/core").getInput(name, options);
            }
        })

    // Act.
    const vcpkg: vcpkgAction.VcpkgAction = new vcpkgAction.VcpkgAction(
        new BaseUtilLib(new actionLib.ActionLib()));
    await vcpkg.run();

    // Asserts.

    // doNotCache is true, no cache operation must be carried.
    expect(restoreCacheSpy).toBeCalledTimes(0);
    expect(saveCacheSpy).toBeCalledTimes(0);
    expect(vcpkgRunnerRunSpy).toBeCalledTimes(1);

    // Clear mocks.
    keyMatchMock.mockRestore();
});

test('isExactKeyMatch tests', () => {
    const hash = vcpkgUtils.hashCode("hashCode");
    const hash2 = vcpkgUtils.hashCode("hashCode2");
    expect(vcpkgUtils.isExactKeyMatch(hash, hash2)).toBeFalsy();
    expect(vcpkgUtils.isExactKeyMatch(hash2, hash)).toBeFalsy();
    expect(vcpkgUtils.isExactKeyMatch(hash, hash)).toBeTruthy();
});

test('getVcpkgCommitId tests', async () => {
    const p = path.resolve(path.join(__dirname, ".."));
    const baseUtils = new BaseUtilLib(new ActionLib());
    // It must return undefined when GITHUB_WORKSPACE is not defined.
    process.env.GITHUB_WORKSPACE = undefined;
    expect(await vcpkgUtils.getVcpkgCommitId(baseUtils, p)).toBe(undefined);

    // It must return undefined when there is no vcpkg repository.
    process.env.GITHUB_WORKSPACE = "/var/tmp/anything";
    process.env.INPUT_VCPKGDIRECTORY = "fafsadfdsds";
    expect(await vcpkgUtils.getVcpkgCommitId(baseUtils, p)).toBeFalsy();

    const expectedVcpkgSubmoduleCommitId = "commit_id_sha";
    // A commit SHA is 40 characters long.
    jest.spyOn(fs, 'readFileSync').mockImplementationOnce(function (filePath) {
        return expectedVcpkgSubmoduleCommitId;
    });
    jest.spyOn(fs, 'existsSync').mockImplementationOnce(function (filePath) {
        return true;
    });
    const commitId = await vcpkgUtils.getVcpkgCommitId(baseUtils, p);
    expect(commitId).toBe(expectedVcpkgSubmoduleCommitId);
});
