// Copyright (c) 2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as path from 'path'
import * as core from '@actions/core'
import * as cache from '@actions/cache'
import { BaseUtilLib } from '@lukka/base-util-lib'
import * as runvcpkglib from '@lukka/run-vcpkg-lib'
import { ensureDirExists, getVcpkgCommitId, hashCode, isExactKeyMatch } from './vcpkg-utils'

// Input name for run-vcpkg only.
export const doNotCacheInput = 'doNotCache';

export class VcpkgAction {
  /**
   * The input's name for additional content for the cache key.
   */
  private readonly appendedCacheKey = 'appendedCacheKey';
  private vcpkgCacheComputedKey: string | undefined;
  private VCPKGCACHEHIT: string | undefined;

  constructor(private baseUtilLib: BaseUtilLib) {
  }

  public async run(): Promise<void> {
    await this.baseUtilLib.wrapOp('Restore vcpkg and its artifacts from cache',
      () => this.restoreCache());
    const runner: runvcpkglib.VcpkgRunner = new runvcpkglib.VcpkgRunner(this.baseUtilLib.baseLib);
    await runner.run();
    await this.baseUtilLib.wrapOp('Cache vcpkg and its artifacts', () => this.saveCache());
  }

  private async computeCacheKey(): Promise<string> {
    let key = "";
    const inputVcpkgPath = core.getInput(runvcpkglib.vcpkgDirectory);
    const commitId: string | undefined = await getVcpkgCommitId(this.baseUtilLib, inputVcpkgPath);
    const userProvidedCommitId = core.getInput(runvcpkglib.vcpkgCommitId);
    if (commitId) {
      core.info(`vcpkg identified at commitId='${commitId}', adding it to the cache's key.`);
      key += `submodGitId=${commitId}`;
    } else if (userProvidedCommitId) {
      key += "localGitId=" + hashCode(userProvidedCommitId);
    } else {
      core.info(`No vcpkg's commit id was provided, does not contribute to the cache's key.`);
    }

    key += "-args=" + hashCode(core.getInput(runvcpkglib.vcpkgArguments));
    key += "-os=" + hashCode(process.platform);
    key += "-appendedKey=" + hashCode(core.getInput(this.appendedCacheKey));

    // Add the triplet only if it is provided.
    const triplet = core.getInput(runvcpkglib.vcpkgTriplet)
    if (triplet)
      key += "-triplet=" + hashCode(triplet);
    return key;
  }

  private async saveCache(): Promise<void> {
    try {
      if (core.getInput(doNotCacheInput).toLowerCase() === "true") {
        core.info(`Caching is disabled (${doNotCacheInput}=true)`);
      } else {
        if (!this.vcpkgCacheComputedKey) {
          core.warning(`Error retrieving cache's key.`);
          return;
        }

        if (isExactKeyMatch(this.vcpkgCacheComputedKey, this.VCPKGCACHEHIT)) {
          core.info(`Cache hit occurred on the cache key '${this.vcpkgCacheComputedKey}', saving cache is skipped.`);
          return;
        } else {
          const pathsToCache: string[] = this.getCachedPaths();
          core.info(`Caching paths: '${pathsToCache}'`);
          console.log(`Running save-cache`);

          try {
            await cache.saveCache(this.getCachedPaths(), this.vcpkgCacheComputedKey);
          }
          catch (error) {
            if (error.name === cache.ValidationError.name) {
              throw error;
            } else if (error.name === cache.ReserveCacheError.name) {
              core.info(error.message);
            } else {
              core.warning(error.message);
            }
          }
        }
      }
      core.info('run-vcpkg post action execution succeeded');
      process.exitCode = 0;
    } catch (err) {
      const errorAsString = (err ?? "undefined error").toString();
      core.error(errorAsString);
      core.setFailed('run-vcpkg post action execution failed');
      process.exitCode = -1000;
    }
  }

  private getCachedPaths(): string[] {
    const vcpkgDir = path.normalize(core.getInput(runvcpkglib.vcpkgDirectory));

    ensureDirExists(vcpkgDir);
    const pathsToCache: string[] = [
      vcpkgDir,
      path.normalize(`!${path.join(vcpkgDir, 'packages')}`),
      path.normalize(`!${path.join(vcpkgDir, 'buildtrees')}`),
      path.normalize(`!${path.join(vcpkgDir, 'downloads')}`)
    ];
    return pathsToCache;
  }

  private async restoreCache(): Promise<void> {
    if (core.getInput(doNotCacheInput).toLowerCase() === "true") {
      core.info(`Caching is disabled (${doNotCacheInput}=true)`);
    } else {
      const key: string = await this.computeCacheKey();
      const pathsToCache: string[] = this.getCachedPaths();

      core.info(`Cache's key = '${key}'.`);
      this.vcpkgCacheComputedKey = key;
      core.info(`Running restore-cache`);

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
        this.VCPKGCACHEHIT = cacheHitId;
      } else {
        core.info(`Cache miss.`);
      }
    }
  }
}


