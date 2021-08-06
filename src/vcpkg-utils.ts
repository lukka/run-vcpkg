// Copyright (c) 2020-2021 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as path from 'path'
import * as fs from 'fs'
import * as core from '@actions/core'
import * as runvcpkglib from '@lukka/run-vcpkg-lib'
import * as baselib from '@lukka/base-lib'
import * as baseutillib from '@lukka/base-util-lib'
import * as actionlib from '@lukka/action-lib'
import * as cache from '@actions/cache'
import { additionalCachedPathsInput } from './vcpkg-action'

export class Utils {

  private static readonly VCPKG_ADDITIONAL_CACHED_PATHS_KEY = "VCPKG_ADDITIONAL_CACHED_PATHS_KEY";

  public static ensureDirExists(path: string): void {
    try {
      fs.mkdirSync(path, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') {
        core.warning(`Failed to create directory '${path}', error='${err}'.`);
      }
    }
  }

  public static isExactKeyMatch(key: string, cacheKey?: string): boolean {
    if (cacheKey)
      return cacheKey.localeCompare(key, undefined, { sensitivity: "accent" }) === 0;
    else
      return false;
  }

  /**
   * Retrieve the commit id of the Git repository at vcpkgDirectory.
   *
   * @static
   * @param {baseutillib.BaseUtilLib} baseUtils
   * @param {string} vcpkgDirectory
   * @returns {(Promise<[string | undefined, boolean | undefined]>)}
   * @memberof Utils
   */
  public static async getVcpkgCommitId(baseUtils: baseutillib.BaseUtilLib, vcpkgDirectory: string): Promise<[string | undefined, boolean | undefined]> {
    let id = undefined;
    let isSubmodule = undefined;
    const workspaceDir = process.env.GITHUB_WORKSPACE ?? "";
    if (workspaceDir) {
      let fullVcpkgPath = "";
      core.debug(`inputVcpkgPath=${vcpkgDirectory}`);
      if (path.isAbsolute(vcpkgDirectory))
        fullVcpkgPath = path.normalize(path.resolve(vcpkgDirectory));
      else
        fullVcpkgPath = path.normalize(path.resolve(path.join(workspaceDir, vcpkgDirectory)));
      core.debug(`fullVcpkgPath='${fullVcpkgPath}'`);
      const relPath = fullVcpkgPath.replace(workspaceDir, '');
      core.debug(`relPath='${relPath}'`);
      const submodulePath = path.join(workspaceDir, ".git/modules", relPath, "HEAD")
      core.debug(`submodulePath='${submodulePath}'`);
      // Check whether it is a submodule.
      if (fs.existsSync(submodulePath)) {
        id = fs.readFileSync(submodulePath).toString();
        core.debug(`commitId='${id}'`);
        isSubmodule = true;
      } else {
        id = await runvcpkglib.VcpkgRunner.getCommitId(baseUtils, fullVcpkgPath);
        isSubmodule = false;
      }
      id = id?.trim();
    }

    // Normalize any error to undefined.
    return [id, isSubmodule];
  }

  public static async computeCacheKey(appendedCacheKey: string): Promise<string[]> {
    let key = "";
    const restoreKeys = [] as string[];

    const actionLib = new actionlib.ActionLib();
    const baseUtil = new baseutillib.BaseUtilLib(actionLib);

    key += "runnerOS=" + process.env.ImageOS ? process.env.ImageOS : process.platform;
    // Add the triplet only if it is provided.
    const triplet = core.getInput(runvcpkglib.vcpkgTriplet)
    if (triplet) {
      key += "-triplet=" + triplet;
    }
    restoreKeys.push(key);

    const inputVcpkgPath = core.getInput(runvcpkglib.vcpkgDirectory);
    const [commitId, isSubmodule] = await Utils.getVcpkgCommitId(baseUtil, inputVcpkgPath);
    const userProvidedCommitId = core.getInput(runvcpkglib.vcpkgCommitId);
    if (commitId) {
      if (isSubmodule) {
        key += `_vcpkgGitCommit=${commitId}`;
        core.info(`Adding vcpkg submodule commit id '${commitId}' to cache key`);
      } else {
        key += `_vcpkgGitCommit=${userProvidedCommitId}`;
        core.info(`Adding user provided vcpkg commit id ${userProvidedCommitId} to cache key`);
      }
      restoreKeys.push(key);
    } else if (userProvidedCommitId) {
      key += `_vcpkgGitCommit=${userProvidedCommitId}`;
      core.info(`Adding user provided vcpkg commit id ${userProvidedCommitId} to cache key`);
      restoreKeys.push(key);
    } else {
      core.info(`No vcpkg commit id was provided, does not contribute to the cache's key.`);
    }

    if (appendedCacheKey) {
      key += `_appendedKey=${appendedCacheKey}`;
      restoreKeys.push(key);
    }

    restoreKeys.reverse();
    return restoreKeys;
  }

  public static async saveCache(doNotCache: boolean, vcpkgCacheComputedKey: string, hitCacheKey: string | undefined, cachedPaths: string[]): Promise<void> {
    try {
      if (doNotCache) {
        core.info(`Caching is disabled, saving cache is skipped.`);
      } else {
        if (!vcpkgCacheComputedKey) {
          core.warning(`Error retrieving cache's key.`);
          return;
        }

        if (Utils.isExactKeyMatch(vcpkgCacheComputedKey, hitCacheKey)) {
          core.info(`Cache hit occurred on the cache key '${vcpkgCacheComputedKey}', saving cache is skipped.`);
        } else {
          const pathsToCache: string[] = cachedPaths;
          core.info(`Caching paths: '${pathsToCache}'`);

          try {
            core.info(`Running save-cache with key '${vcpkgCacheComputedKey}' ...`);
            await cache.saveCache(pathsToCache, vcpkgCacheComputedKey);
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
    } catch (err) {
      core.info("vcpkg-utils.saveCache() failed!");
      const error: Error = err as Error;
      if (error?.stack) {
        core.info(error.stack);
      }
    }
  }

  public static addCachedPaths(paths: string): void {
    core.debug(`Set VCPKG_ADDITIONAL_CACHED_PATHS_KEY=${paths}`);
    core.saveState(Utils.VCPKG_ADDITIONAL_CACHED_PATHS_KEY, paths);
    core.exportVariable(Utils.VCPKG_ADDITIONAL_CACHED_PATHS_KEY, paths)
  }

  public static getAllCachedPaths(baselib: baselib.BaseLib, vcpkgRootDir: string): string[] {
    let paths = runvcpkglib.getOrdinaryCachedPaths(vcpkgRootDir);

    let additionalCachedPaths: string | undefined = core.getState(Utils.VCPKG_ADDITIONAL_CACHED_PATHS_KEY);
    if (!additionalCachedPaths) {
      additionalCachedPaths = process.env[Utils.VCPKG_ADDITIONAL_CACHED_PATHS_KEY];
    }
    core.debug(`Get VCPKG_ADDITIONAL_CACHED_PATHS_KEY=${additionalCachedPaths}`);
    if (additionalCachedPaths) {
      paths = paths.concat(additionalCachedPaths.split(';'));
    }

    // Remove empty entries.
    paths = paths.map(s => s.trim()).filter(Boolean);

    // Remove duplicates.
    return [...new Set(paths)];
  }
}
