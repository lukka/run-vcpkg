// Copyright (c) 2020-2021 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as core from '@actions/core'
import * as vcpkgaction from './vcpkg-action'
import * as actionlib from '@lukka/action-lib'
import * as baseUtilLib from '@lukka/base-util-lib'
import * as vcpkgutil from './vcpkg-utils'

async function main(): Promise<void> {
  const doNotCache = (core.getState(vcpkgaction.VCPKG_DO_NOT_CACHE_KEY) ?? false) === "true";

  const actionLib = new actionlib.ActionLib();
  const baseUtil = new baseUtilLib.BaseUtilLib(actionLib);

  try {
    await baseUtil.wrapOp('Save vcpkg and its artifacts to cache',
      async () => {
        // Caching in the post action happens only when in 'setupOnly:true' mode.
        if (core.getState(vcpkgaction.VCPKG_DO_CACHE_ON_POST_ACTION_KEY) !== "true") {
          core.info("Skipping saving cache since the input 'setupOnly' is not set to true.");
          return;
        } else {
          // Inputs are re-evaluted before the post action, so we want the original key used for restore
          const cacheHit = core.getState(vcpkgaction.VCPKG_CACHE_HIT_KEY);
          const computedCacheKey = core.getState(vcpkgaction.VCPKG_CACHE_COMPUTED_KEY);
          const vcpkgRoot = core.getState(vcpkgaction.VCPKG_ROOT_KEY);
          const cachedPaths: string[] = vcpkgutil.Utils.getAllCachedPaths(actionLib, vcpkgRoot);

          await vcpkgutil.Utils.saveCache(doNotCache, computedCacheKey, cacheHit, cachedPaths);
        }
      });
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