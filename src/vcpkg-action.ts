// Copyright (c) 2019 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as libaction from './action-lib';
import * as core from '@actions/core'
import * as vcpkgrunner from './vcpkg-runner';
import * as vcpkgUtils from './vcpkg-utils';

async function main(): Promise<void> {
  try {
    const actionLib = new libaction.ActionLib();
    vcpkgUtils.setBaseLib(actionLib);
    const runner: vcpkgrunner.VcpkgRunner = new vcpkgrunner.VcpkgRunner(actionLib);
    await runner.run();
    core.info('run-vcpkg action execution succeeded');
    process.exitCode = 0;
  } catch (err) {
    const errorAsString = (err ?? "undefined error").toString();
    core.debug('Error: ' + errorAsString);
    core.error(errorAsString);
    core.setFailed('run-vcpkg action execution failed');
    process.exitCode = -1000;
  }
}

// Main entry point of the task.
main().catch(error => console.error("main() failed!", error));