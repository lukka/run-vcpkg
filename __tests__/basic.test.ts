import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import * as io from '@actions/io'
import * as fs from 'fs'

const tempDirectory = path.join(__dirname, "tempDirectory");
const vcpkgDirectory = path.join(__dirname, "vcpkgDirectory");
const responseFile1 = path.join(tempDirectory, 'response_file1');
const responseFile2 = path.join(vcpkgDirectory, '..', 'response_file2');
const overlayPath = path.join(tempDirectory, 'another');
const testScript = path.join(__dirname, '..', 'dist', 'index.js');;

jest.setTimeout(15 * 1000)

function createDir(path: string) {
    try {
        fs.mkdirSync(path, { recursive: true });
    } catch (err) {
        if (err.code !== 'EEXIST') {
            throw err
        }
    }
}

describe('basic run-vcpkg tests', () => {
    beforeEach(async () => {
        await io.rmRF(tempDirectory);
        await io.rmRF(vcpkgDirectory);
        createDir(tempDirectory);
        createDir(vcpkgDirectory);

        try {
            fs.writeFileSync(responseFile1, `sqlite3\nfltk\n--overlay-ports=${overlayPath}`);
            fs.writeFileSync(responseFile2, `--overlay-ports=../any_dir\nfltk`);

            createDir(path.join(vcpkgDirectory, '..', '1'));
            createDir(path.join(vcpkgDirectory, '..', 'subdir', '2'));
            // These are outside of VCPKG_ROOT dir.
            createDir(path.join(vcpkgDirectory, '..', 'any_dir'));
            createDir(overlayPath);
        } catch (error) {
            console.error('cannot create response_file');
            throw new Error(error);
        }

        Object.keys(process.env)
            .filter((key) => key.match(/^INPUT_/))
            .forEach((key) => {
                delete process.env[key];
            });
        process.env.GITHUB_WORKSPACE = tempDirectory;
    });

    afterAll(async () => {
        try {
            await io.rmRF(tempDirectory);
            await io.rmRF(vcpkgDirectory);
        } catch {
            console.log('Failed to remove test directories');
        }
    });

    test('basic test for run-vcpkg', async () => {
        process.env['INPUT_VCPKGDIRECTORY'] = vcpkgDirectory;
        process.env['INPUT_VCPKGARGUMENTS'] = 'sqlite3';
        process.env['INPUT_VCPKGGITURL'] = 'https://github.com/lukka/vcpkg.git'
        process.env['INPUT_VCPKGGITCOMMITID'] = 'c5f01e1dee0d41b8014ac6f1eeafda974917ba17';
        process.env.INPUT_USESHELL = 'true';
        const options: cp.ExecSyncOptions = {
            env: process.env,
            stdio: "inherit",
            cwd: vcpkgDirectory
        };
        cp.execSync(`node ${testScript}`, options);
    });

    test('basic test for run-vcpkg with setupOnly', async () => {
        process.env['INPUT_VCPKGDIRECTORY'] = vcpkgDirectory;
        process.env['INPUT_VCPKGGITURL'] = 'https://github.com/lukka/vcpkg.git'
        process.env['INPUT_VCPKGGITCOMMITID'] = 'c5f01e1dee0d41b8014ac6f1eeafda974917ba17';
        process.env['INPUT_SETUPONLY'] = 'true';
        process.env.INPUT_USESHELL = 'true';
        const options: cp.ExecSyncOptions = {
            env: process.env,
            stdio: "inherit"
        };
        cp.execSync(`node ${testScript}`, options);
    });

    test('overlay extraction test for run-vcpkg', async () => {
        process.env['INPUT_VCPKGDIRECTORY'] = vcpkgDirectory;
        process.env['INPUT_VCPKGARGUMENTS'] = `--overlay-ports=../1 sqlite3 @${responseFile1} --overlay-ports=../subdir/2 @${responseFile2}`;
        process.env['INPUT_VCPKGGITURL'] = 'https://github.com/lukka/vcpkg.git'
        process.env['INPUT_VCPKGGITCOMMITID'] = 'c5f01e1dee0d41b8014ac6f1eeafda974917ba17';
        process.env.INPUT_USESHELL = 'true';
        const options: cp.ExecSyncOptions = {
            env: process.env,
            stdio: "inherit",
            cwd: vcpkgDirectory
        };
        cp.execSync(`node ${testScript}`, options);
    });
});