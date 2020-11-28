// Copyright (c) 2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as path from 'path'
import * as core from '@actions/core'
import * as cache from '@actions/cache'
import { BaseUtilLib } from '@lukka/base-util-lib'
import * as runvcpkglib from '@lukka/run-vcpkg-lib'
import * as vcpkgutil from './vcpkg-utils'

// Input names for run-vcpkg only.
export const doNotCacheInput = 'doNotCache';
export const additionalCachedPathsInput = 'additionalCachedPaths';
/**
 * The input's name for additional content for the cache key.
 */
export const appendedCacheKeyInput = 'appendedCacheKey';

// Saved data in the action, and consumed by post-action.
export const VCPKG_CACHE_COMPUTED_KEY = "VCPKG_CACHE_COMPUTED_KEY";
export const VCPKG_CACHE_HIT_KEY = "VCPKG_CACHE_HIT_KEY";
export const VCPKG_DO_NOT_CACHE_KEY = "VCPKG_DO_NOT_CACHE_KEY";
export const VCPKG_ADDED_CACHEKEY_KEY = "VCPKG_ADDED_CACHEKEY_KEY";
export const VCPKG_ROOT_KEY = "VCPKG_ROOT_KEY";
export const VCPKG_DO_CACHE_ON_POST_ACTION_KEY = "VCPKG_DO_CACHE_ON_POST_ACTION_KEY";

export class VcpkgAction {

  private readonly doNotCache: boolean = false;
  private vcpkgCacheComputedKey: string | undefined;
  private hitCacheKey: string | undefined;
  private readonly appendedCacheKey: string;
  private readonly vcpkgRootDir: string;

  constructor(private baseUtilLib: BaseUtilLib) {
    this.doNotCache = core.getInput(doNotCacheInput).toLowerCase() === "true";
    core.saveState(VCPKG_DO_NOT_CACHE_KEY, this.doNotCache ? "true" : "false");
    this.appendedCacheKey = core.getInput(appendedCacheKeyInput);
    this.vcpkgRootDir = path.normalize(core.getInput(runvcpkglib.vcpkgDirectory));
    core.saveState(VCPKG_ROOT_KEY, this.vcpkgRootDir);
  }

  public async run(): Promise<void> {
    try {
      const computedCacheKey = await vcpkgutil.Utils.computeCacheKey(this.appendedCacheKey);
      core.saveState(VCPKG_CACHE_COMPUTED_KEY, computedCacheKey);

      await this.baseUtilLib.wrapOp('Restore vcpkg and its artifacts from cache',
        () => this.restoreCache());
      const runner: runvcpkglib.VcpkgRunner = new runvcpkglib.VcpkgRunner(this.baseUtilLib.baseLib);
      await runner.run();

      if (core.getInput(runvcpkglib.setupOnly).toLowerCase() !== "true") {
        await this.baseUtilLib.wrapOp('Cache vcpkg and its artifacts', () => this.saveCache());
      } else {
        // If 'setupOnly' is true, trigger the saving of the cache during the post-action execution.
        core.saveState(VCPKG_DO_CACHE_ON_POST_ACTION_KEY, "true");
      }

      core.info('run-vcpkg  action execution succeeded');
      process.exitCode = 0;
    }
    catch (err) {
      const error: Error = err as Error;
      if (error?.stack) {
        core.info(error.stack);
      }
      const errorAsString = (err ?? "undefined error").toString();
      core.setFailed(`run-vcpkg action execution failed: '${errorAsString}`);
      process.exitCode = -1000;
    }
  }

  private async saveCache(): Promise<void> {
    const computedCacheKey = await vcpkgutil.Utils.computeCacheKey(this.appendedCacheKey);
    await vcpkgutil.Utils.saveCache(this.doNotCache, computedCacheKey, this.hitCacheKey,
      vcpkgutil.Utils.getCachedPaths(this.vcpkgRootDir));
  }

  private async restoreCache(): Promise<void> {
    try {
      if (this.doNotCache) {
        core.info(`Caching is disabled (${doNotCacheInput}=true)`);
      } else {
        const key: string = await vcpkgutil.Utils.computeCacheKey(this.appendedCacheKey);
        const pathsToCache: string[] = vcpkgutil.Utils.getCachedPaths(this.vcpkgRootDir);

        core.info(`Cache's key = '${key}'.`);
        this.vcpkgCacheComputedKey = key;
        core.saveState(VCPKG_CACHE_COMPUTED_KEY, this.vcpkgCacheComputedKey);
        core.info(`Running restore-cache...`);

        let cacheHitId: string | undefined;
        try {
          cacheHitId = await cache.restoreCache(pathsToCache, key);
        }
        catch (err) {
          try {
            core.warning(`restoreCache() failed once: '${err?.toString()}' , retrying...`);
            cacheHitId = await cache.restoreCache(pathsToCache, key);
          }
          catch (err) {
            core.warning(`restoreCache() failed again: '${err?.toString()}'.`);
          }
        }

        if (cacheHitId) {
          core.info(`Cache hit, id=${cacheHitId}.`);
          this.hitCacheKey = cacheHitId;
          core.saveState(VCPKG_CACHE_HIT_KEY, cacheHitId);
        } else {
          core.info(`Cache miss.`);
        }
      }
    } catch (err) {
      const error: Error = err as Error;
      if (error?.stack) {
        core.info(error.stack);
      }
    }
  }
}
