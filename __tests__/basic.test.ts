import * as process from 'process'
import * as path from 'path'
import * as io from '@actions/io'
import * as fs from 'fs'
import * as action from '../src/vcpkg-action'
import * as postAction from '../src/post-action'

jest.setTimeout(15 * 1000)
//jest.mock('./action-lib');

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

describe('basic run-vcpkg tests', () => {
    beforeAll(async () => {
        //jest.spyOn();
        /*jest.spyOn(actionUtils, "isExactKeyMatch").mockImplementation(
            (key, cacheResult) => {
                const actualUtils = jest.requireActual("../src/utils/actionUtils");
                return actualUtils.isExactKeyMatch(key, cacheResult);
            }
        );*/

        process.env.GITHUB_WORKSPACE = "";
    });

    beforeEach(() => {
        /*process.env[Events.Key] = Events.Push;
        process.env[RefKey] = "refs/heads/feature-branch";*/
    });

    afterEach(() => {
        clearInputs();
        /*delete process.env[Events.Key];
        delete process.env[RefKey];*/
    });

    afterAll(async () => {
        try {
        } catch {
            console.log('Failed to remove test directories');
        }
    });

    test('basic cache hit scenario test', async () => {
        //?? const vcpkg : action.VcpkgAction = new action.VcpkgAction(new actionLib.ActionLib());
    });

    test('basic cache miss scenario test', async () => {

    });
});