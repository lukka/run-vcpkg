
// Copyright (c) 2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as core from '@actions/core'
import * as action from './vcpkg-action'
import * as cp from 'child_process'
import * as path from 'path'
import * as fs from 'fs'

function moveAway(rootDir: string): void {
  if (process.env.RUNNER_TEMP) {
    for (const dirName of ['buildtrees', 'downloads', 'packages'])
      try {
        const src: string = path.normalize(path.join(rootDir, dirName));
        const dst: string = path.join(process.env.RUNNER_TEMP, dirName);
        console.log(`${src} -> ${dst}`);
        fs.renameSync(src, dst);
        console.log(`Moved away '${dirName}' to avoid caching it.`);
      } catch (error) {
        // Keep going in any case.
        core.debug(`${error}`);
      }
  }
}

async function main(): Promise<void> {
  try {
    core.startGroup('Cache vcpkg artifacts');
    const pathsToCache = core.getState(action.VCPKGCACHEKEY);
    for (const dir of pathsToCache.split(';')) {
      core.info(`Caching path: '${dir}'`);
      moveAway(dir);
      process.env.INPUT_PATH = dir;
      const options: cp.ExecSyncOptions = {
        env: process.env,
        stdio: "inherit",
      };
      const scriptPath = path.join(path.dirname(path.dirname(__dirname)), 'actions/cache/dist/save/index.js');
      console.log(cp.execSync(`node ${scriptPath}`, options)?.toString());
    }

    core.info('run-vcpkg post action execution succeeded');
    process.exitCode = 0;
  } catch (err) {
    const errorAsString = (err ?? "undefined error").toString();
    core.debug('Error: ' + errorAsString);
    core.error(errorAsString);
    core.setFailed('run-vcpkg post action execution failed');
    process.exitCode = -1000;
  }
}

// Main entry point of the task.
main().catch(error => console.error("main() failed!", error));