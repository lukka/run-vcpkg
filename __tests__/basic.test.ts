import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import * as io from '@actions/io'

const tempDirectory = path.join(__dirname, "tempDirectory");
const vcpkgDirectory = path.join(__dirname, "vcpkgDirectory");
const testScript = path.join(__dirname, '..', 'dist', 'index.js');;

jest.setTimeout(15 * 1000)

describe('basic run-vcpkg tests', () => {
    beforeEach(async () => {
        await io.rmRF(tempDirectory);
        await io.rmRF(vcpkgDirectory);
        await io.mkdirP(tempDirectory);
        await io.mkdirP(vcpkgDirectory);
    });

    afterAll(async () => {
        try {
            //??await io.rmRF(tempDirectory);
            //??await io.rmRF(vcpkgDirectory);
        } catch {
            console.log('Failed to remove test directories');
        }
    });

    test('basic test for run-vcpkg', async () => {
        process.env['GITHUB_WORKSPACE'] = tempDirectory;
        process.env['INPUT_VCPKGDIRECTORY'] = vcpkgDirectory;
        process.env['INPUT_VCPKGARGUMENTS'] = 'sqlite3';
        process.env['INPUT_VCPKGGITURL'] = 'https://github.com/lukka/vcpkg.git'
        process.env['INPUT_VCPKGGITCOMMITID'] = 'run-vcpkg-action-test';
        process.env.INPUT_USESHELL = 'true';
        const options: cp.ExecSyncOptions = {
            env: process.env,
            stdio: "inherit"
        };
        console.log(cp.execSync(`node ${testScript}`, options)?.toString());
    });

    test('basic test for run-vcpkg with setupOnly', async () => {
        process.env['GITHUB_WORKSPACE'] = tempDirectory;
        process.env['INPUT_VCPKGGITURL'] = 'https://github.com/lukka/vcpkg.git'
        process.env['INPUT_VCPKGGITCOMMITID'] = 'run-vcpkg-action-test';
        process.env['INPUT_SETUPONLY'] = 'true';
        process.env.INPUT_USESHELL = 'true';
        const options: cp.ExecSyncOptions = {
            env: process.env,
            stdio: "inherit"
        };
        console.log(cp.execSync(`node ${testScript}`, options)?.toString());
    });
});