
// Copyright (c) 2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as core from '@actions/core'
import * as action from './vcpkg-action'
import * as cache from '@actions/cache'

function isExactKeyMatch(key: string, cacheKey?: string): boolean {
  return !!(
    cacheKey &&
    cacheKey.localeCompare(key, undefined, {
      sensitivity: "accent"
    }) === 0
  );
}

async function main(): Promise<void> {
  try {
    core.startGroup('Cache vcpkg and its artifacts');
    try {
      if (core.getInput(action.doNotCache).toLowerCase() === "true") {
        core.info(`Caching is disabled (${action.doNotCache}=true)`);
      } else {
        const cacheHit = core.getState(action.VCPKGCACHEHIT);

        // Inputs are re-evaluted before the post action, so we want the original key used for restore
        const cacheKey = core.getState(action.VCPKGCACHEKEY);
        if (!cacheKey) {
          core.warning(`Error retrieving cache's key.`);
          return;
        }

        if (isExactKeyMatch(cacheKey, cacheHit)) {
          core.info(`Cache hit occurred on the cache key '${cacheKey}', saving cache is skipped.`);
          return;
        }

        else {
          const pathsToCache: string[] = action.getCachedPaths();
          core.info(`Caching path: '${pathsToCache}'`);
          console.log(`Running store-cache`);

          try {
            await cache.saveCache(action.getCachedPaths(), cacheKey);
          }
          catch (err) {
            core.warning(`saveCache() failed: '${err?.toString()}'.`)
          }
        }
      }
    }
    finally {
      core.endGroup();
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