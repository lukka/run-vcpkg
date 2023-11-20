// Copyright (c) 2021-2022-2023 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import { ActionLib } from '@lukka/action-lib';
import { BaseUtilLib } from '@lukka/base-util-lib';
import * as runvcpkglib from "@lukka/run-vcpkg-lib"

jest.setTimeout(800 * 1000);

const tempDirectory = path.join(__dirname, "temp Directory");
// Note: 'theAssets' must match the directory __tests__/theAssets/
const assetDirectory = path.join(__dirname, 'theAssets');
const vcpkgDirectory = path.join(assetDirectory, "vcpkg");
const testScript = path.join(__dirname, '..', 'dist', 'index.js');
const vcpkgProject = path.join(assetDirectory, "vcpkg_project");

const actionLib = new ActionLib();
const baseLibUtils = new BaseUtilLib(actionLib);

describe('run-vcpkg functional tests', () => {
    beforeEach(async () => {
        process.env.GITHUB_WORKSPACE = assetDirectory;
        // The GH Action cache is not enabled when running tests because these env vars are not defined:
        // ACTIONS_RUNTIME_TOKEN and ACTIONS_CACHE_URL. Set a default that uses the filesystem and won't fail.
        process.env.VCPKG_BINARY_SOURCES = 'clear;default,readwrite';

        await actionLib.rmRF(vcpkgDirectory);
        await actionLib.rmRF(tempDirectory);
        await actionLib.mkdirP(vcpkgDirectory);
        await actionLib.mkdirP(tempDirectory);
        Object.keys(process.env)
            .filter((key) => key.match(/^INPUT_/))
            .forEach((key) => {
                delete process.env[key];
            });
    }, 300000);

    afterAll(async () => {
        try {
            await actionLib.rmRF(vcpkgDirectory);
            await actionLib.rmRF(tempDirectory);
        } catch (error) {
            console.log(`Failed to remove test directories: '${error as Error}'`);
        }
    }, 100000);

    test('vcpkg setup and install must succeed', () => {
        process.env.INPUT_VCPKGGITURL = "https://github.com/microsoft/vcpkg.git";
        process.env.INPUT_VCPKGDIRECTORY = vcpkgDirectory;
        process.env.INPUT_VCPKGJSONGLOB = "**/vcpkg.json";
        process.env.INPUT_VCPKGGITCOMMITID = "8eb57355a4ffb410a2e94c07b4dca2dffbee8e50";
        process.env.INPUT_RUNVCPKGINSTALL = "true";
        process.env.INPUT_RUNVCPKGFORMATSTRING = runvcpkglib.VcpkgRunner.VCPKGINSTALLCMDDEFAULT;

        // Ensure child is running in the GH workspace, needed to find vcpkg.json.
        process.chdir(assetDirectory);

        const options: cp.ExecSyncOptions = {
            env: process.env,
            stdio: "inherit"
        };
        console.log(cp.execSync(`node ${testScript}`, options)?.toString());
    });

    test('vcpkg setup and no install must succeed', () => {
        process.env.INPUT_VCPKGGITURL = "https://github.com/microsoft/vcpkg.git";
        process.env.INPUT_VCPKGDIRECTORY = vcpkgDirectory;
        process.env.INPUT_VCPKGJSONGLOB = "**/vcpkg.json";
        process.env.INPUT_VCPKGGITCOMMITID = "8eb57355a4ffb410a2e94c07b4dca2dffbee8e50";
        process.env.INPUT_RUNVCPKGINSTALL = "false";
        process.env.INPUT_RUNVCPKGFORMATSTRING = "['invalid command']";

        const options: cp.ExecSyncOptions = {
            env: process.env,
            stdio: "inherit"
        };
        console.log(cp.execSync(`node ${testScript}`, options)?.toString());
    });

    test('vcpkg setup must succeed when without VCPKG_ROOT and vcpkg.json glob expression', async () => {
        delete process.env.INPUT_VCPKGDIRECTORY;
        console.log(process.env.INPUT_VCPKGDIRECTORY);
        delete process.env.INPUT_VCPKGJSONGLOB;
        process.env.INPUT_VCPKGGITURL = "https://github.com/microsoft/vcpkg.git";
        process.env.INPUT_VCPKGGITCOMMITID = "8eb57355a4ffb410a2e94c07b4dca2dffbee8e50";
        process.env.INPUT_RUNVCPKGINSTALL = "false";
        process.env.INPUT_RUNVCPKGFORMATSTRING = runvcpkglib.VcpkgRunner.VCPKGINSTALLCMDDEFAULT;

        const options: cp.ExecSyncOptions = {
            env: process.env,
            stdio: "inherit"
        };
        console.log(cp.execSync(`node ${testScript}`, options)?.toString());
    });

    test('vcpkg setup and install must pull packages stored in the cache and succeed', async () => {
        // Use the default vcpkg directory
        delete process.env.INPUT_VCPKGDIRECTORY;
        console.log(`INPUT_VCPKGDIRECTORY=${process.env.INPUT_VCPKGDIRECTORY}`);

        // Use the default glob.
        delete process.env.INPUT_VCPKGJSONGLOB;

        // Delete the vcpkg install default directory and its default cache directory.
        await actionLib.rmRF(await runvcpkglib.getDefaultVcpkgDirectory(baseLibUtils.baseLib));
        await actionLib.rmRF(await runvcpkglib.getDefaultVcpkgInstallDirectory(baseLibUtils.baseLib));
        await actionLib.rmRF(await runvcpkglib.getDefaultVcpkgCacheDirectory(baseLibUtils.baseLib));

        process.env.INPUT_VCPKGGITURL = "https://github.com/microsoft/vcpkg.git";
        process.env.INPUT_VCPKGGITCOMMITID = "8eb57355a4ffb410a2e94c07b4dca2dffbee8e50";
        process.env.INPUT_RUNVCPKGINSTALL = "true";
        process.env.INPUT_RUNVCPKGFORMATSTRING = runvcpkglib.VcpkgRunner.VCPKGINSTALLCMDDEFAULT;

        // Populate the cache in the default location (i.e. /b/vcpkg_cache).
        // Populate the vcpkg_installed in the default location (i.e. /b/vcpkg_installed).
        let startTime = new Date();
        const options: cp.ExecSyncOptions = {
            env: process.env,
            stdio: "inherit"
        };
        console.log(cp.execSync(`node ${testScript}`, options)?.toString());
        const elapsed = new Date().getTime() - startTime.getTime();
        console.log(`********* Without cache it took: ${elapsed}ms`)

        // Consume the vcpkg_installed content, and it should take less than without cache.
        startTime = new Date()
        console.log(cp.execSync(`node ${testScript}`, options)?.toString());
        const elapsedWithInstalled = new Date().getTime() - startTime.getTime();
        console.log(`********* With vcpkg_installed it took: ${elapsedWithInstalled}ms`)
        expect(elapsedWithInstalled).toBeLessThan((elapsed / 3) + 5000);// Allow 5 seconds of abs err.

        // Consume the generated cache, and it should take considerably less than without cache.
        await actionLib.rmRF(await runvcpkglib.getDefaultVcpkgInstallDirectory(baseLibUtils.baseLib));
        startTime = new Date()
        console.log(cp.execSync(`node ${testScript}`, options)?.toString());
        const elapsedWithCache = new Date().getTime() - startTime.getTime();
        console.log(`********* With cached built packages (binary cache) it took: ${elapsedWithCache}ms`)
        expect(elapsedWithCache).toBeLessThan(elapsed / 2);
    });

    test('vcpkg setup and no install must succeed when the commit id is not provided as input but it is read from vcpkg-configurationn.json', () => {
        process.env.INPUT_VCPKGGITURL = "https://github.com/microsoft/vcpkg.git";
        process.env.INPUT_VCPKGDIRECTORY = vcpkgDirectory;
        process.env.INPUT_VCPKGJSONGLOB = "**/vcpkg.json";
        delete process.env.INPUT_VCPKGGITCOMMITID;
        process.env.INPUT_RUNVCPKGINSTALL = "false";

        function fwSlash(p: string): string {
            return p.replace(/\\/g, '/');
        }
        process.env.INPUT_VCPKGCONFIGURATIONJSONGLOB = fwSlash(path.join("**", path.basename(vcpkgProject), runvcpkglib.VCPKG_CONFIGURATION_JSON));

        const options: cp.ExecSyncOptions = {
            env: process.env,
            stdio: "inherit"
        };
        console.log(cp.execSync(`node ${testScript}`, options)?.toString());
    });

});
