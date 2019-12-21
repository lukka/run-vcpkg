// Copyright (c) 2019 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as libaction from './action-lib';
import * as core from '@actions/core'
import * as vcpkgrunner from './vcpkg-runner';
import * as vcpkgUtils from './vcpkg-utils';

async function main(): Promise<number> {
  try {
    const actionLib = new libaction.ActionLib();
    vcpkgUtils.setBaseLib(actionLib);
    const runner: vcpkgrunner.VcpkgRunner = new vcpkgrunner.VcpkgRunner(actionLib);
    await runner.run();
    core.info('run-vcpkg action execution succeeded');
    return 0;
  } catch (err) {
    core.debug('Error: ' + err);
    core.error(err);
    core.setFailed('run-vcpkg action execution failed');
    return -1000;
  }
}

// Main entry point of the task.
main().catch(error => console.error("main() failed!", error));