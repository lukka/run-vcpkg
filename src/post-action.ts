// Copyright (c) 2020-2021-2022 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as core from '@actions/core'
import * as vcpkgaction from './vcpkg-action'
import * as actionlib from '@lukka/action-lib'
import * as baseutillib from '@lukka/base-util-lib'
import * as vcpkgutil from './vcpkg-utils'
import * as vcpkgpostaction from './vcpkg-post-action'

export async function main(): Promise<void> {
  try {
    const doNotCache = (core.getState(vcpkgaction.VCPKG_DO_NOT_CACHE_STATE) ?? false).toLowerCase() === "true";
    const actionLib = new actionlib.ActionLib();
    const baseUtil = new baseutillib.BaseUtilLib(actionLib);

    const cacheHitKey: string = core.getState(vcpkgaction.VCPKG_KEY_CACHE_HIT_STATE);
    const computedCacheKey: baseutillib.KeySet = JSON.parse(core.getState(vcpkgaction.VCPKG_CACHE_COMPUTEDKEY_STATE)) as baseutillib.KeySet;
    const vcpkgRoot = core.getState(vcpkgaction.VCPKG_ROOT_STATE);
    const cachedPaths: string[] = vcpkgutil.Utils.getAllCachedPaths(actionLib, vcpkgRoot);

    const post = new vcpkgpostaction.VcpkgPostAction(baseUtil,
      doNotCache, computedCacheKey, cachedPaths, cacheHitKey);
    await post.run();
  } catch (err) {
    const error: Error = err as Error;
    if (error?.stack) {
      core.info(error.stack);
    }
    const errorAsString = (err as Error)?.message ?? "undefined error";
    core.setFailed(`run-vcpkg post-action execution failed: ${errorAsString}`);
    process.exitCode = -1000;
  }
}

// Main entry point of the task.
main().catch(error => console.error("main() failed!", error));
