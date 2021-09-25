// Copyright (c) 2020-2021 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as path from 'path'
import * as fs from 'fs'
import * as runvcpkglib from '@lukka/run-vcpkg-lib'
import * as baselib from '@lukka/base-lib'
import * as baseutillib from '@lukka/base-util-lib'
import * as cache from '@actions/cache'
import * as vcpkgaction from './vcpkg-action'

export class Utils {

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
    baseUtils.baseLib.debug(`getVcpkgCommitId()<<`);
    let id = undefined;
    let isSubmodule = undefined;
    const workspaceDir = process.env.GITHUB_WORKSPACE ?? "";
    if (workspaceDir) {
      let fullVcpkgPath = "";
      baseUtils.baseLib.debug(`inputVcpkgPath=${vcpkgDirectory}`);
      if (path.isAbsolute(vcpkgDirectory))
        fullVcpkgPath = path.normalize(path.resolve(vcpkgDirectory));
      else
        fullVcpkgPath = path.normalize(path.resolve(path.join(workspaceDir, vcpkgDirectory)));
      baseUtils.baseLib.debug(`fullVcpkgPath='${fullVcpkgPath}'`);
      const relPath = fullVcpkgPath.replace(workspaceDir, '');
      baseUtils.baseLib.debug(`relPath='${relPath}'`);
      const submodulePath = path.join(workspaceDir, ".git/modules", relPath, "HEAD")
      baseUtils.baseLib.debug(`submodulePath='${submodulePath}'`);
      // Check whether it is a submodule.
      if (fs.existsSync(submodulePath)) {
        id = fs.readFileSync(submodulePath).toString();
        baseUtils.baseLib.debug(`commitId='${id}'`);
        isSubmodule = true;
      } else {
        id = await runvcpkglib.VcpkgRunner.getCommitId(baseUtils, fullVcpkgPath);
        isSubmodule = false;
      }
      id = id?.trim();
    }
    baseUtils.baseLib.debug(`getVcpkgCommitId()>> -> [id=${id}, isSubmodule=${isSubmodule}]`);
    return [id, isSubmodule];
  }

  public static async getVcpkgJsonHash(baseUtil: baseutillib.BaseUtilLib, vcpkgJsonGlob: string, vcpkgJsonIgnores: string[]): Promise<[string | null, string | null]> {
    try {
      const [vcpkgJsonPath, vcpkgJsonHash] = await baseUtil.getFileHash(vcpkgJsonGlob, vcpkgJsonIgnores);
      if (vcpkgJsonPath) {
        baseUtil.baseLib.info(`Found vcpkg.json at '${vcpkgJsonPath}', its hash is '${vcpkgJsonHash}''.`);
        return [vcpkgJsonPath, vcpkgJsonHash];
      }
    }
    catch (err) {
      if (err instanceof Error) {
        baseUtil.baseLib.warning(err.message);
      }
    }

    baseUtil.baseLib.warning(`Cannot compute hash of vcpkg.json as it was not found (or multiple hits) with glob expression '${vcpkgJsonGlob}'.`);
    return [null, null];
  }

  public static async computeCacheKeys(
    baseUtilLib: baseutillib.BaseUtilLib,
    vcpkgJsonHash: string | null,
    vcpkgDirectory: string,
    userProvidedCommitId: string | null,
    appendedCacheKey: string | null): Promise<baseutillib.KeySet> {
    baseUtilLib.baseLib.debug(`computeCacheKeys()<<`);
    const cacheKeySegments: string[] = [];

    cacheKeySegments.push(`runnerOS=${process.env.ImageOS ? process.env.ImageOS : process.platform}`);

    const [commitId, isSubmodule] = await Utils.getVcpkgCommitId(baseUtilLib, vcpkgDirectory);
    if (commitId) {
      cacheKeySegments.push(`vcpkgGitCommit=${commitId}`);
      if (isSubmodule) {
        baseUtilLib.baseLib.info(`Adding vcpkg submodule Git commit id '${commitId}' to cache key`);
        if (userProvidedCommitId) {
          baseUtilLib.baseLib.warning(`Provided Git commit id is disregarded: '${userProvidedCommitId}'. Please remove it from the inputs.`);
        }
      } else {
        baseUtilLib.baseLib.info(`vcpkg identified at Git commit id '${commitId}', adding it to the cache's key.`);
      }
    } else if (userProvidedCommitId) {
      cacheKeySegments.push(`vcpkgGitCommit=${userProvidedCommitId}`);
      baseUtilLib.baseLib.info(`Adding user provided vcpkg's Git commit id '${userProvidedCommitId}' to cache key.`);
    } else {
      baseUtilLib.baseLib.info(`No vcpkg's commit id was provided, does not contribute to the cache's key.`);
    }

    if (vcpkgJsonHash) {
      cacheKeySegments.push(`vcpkgJson=${vcpkgJsonHash}`);
      baseUtilLib.baseLib.info(`Adding hash of vcpkg.json: '${vcpkgJsonHash}'.`);
    }

    if (appendedCacheKey) {
      cacheKeySegments.push(`appendedKey=${appendedCacheKey}`);
    }

    const keyset: baseutillib.KeySet = baseutillib.createKeySet(cacheKeySegments);
    baseUtilLib.baseLib.debug(`computeCacheKeys()>>`);
    return keyset;
  }

  public static async saveCache(baseLib: baselib.BaseLib, doNotCache: boolean, keys: baseutillib.KeySet,
    hitCacheKey: string | null, cachedPaths: string[]): Promise<void> {
    baseLib.debug(`saveCache(doNotCache:${doNotCache},keys:${JSON.stringify(keys)},hitCacheKey:${hitCacheKey},cachedPaths:${cachedPaths})<<`)
    try {
      if (doNotCache) {
        baseLib.info(`Caching is disabled, saving cache is skipped.`);
      } else {
        if (hitCacheKey && Utils.isExactKeyMatch(keys.primary, hitCacheKey)) {
          baseLib.info(`Saving cache is skipped, because cache hit occurred on the cache key '${keys.primary}'.`);
        } else {
          baseLib.info(`Saving a new cache entry, because primary key was missed or a fallback restore key was hit.`);
          const pathsToCache: string[] = cachedPaths;
          baseLib.info(`Caching paths: '${pathsToCache}'`);

          try {
            baseLib.info(`Saving cache with primary key '${keys.primary}' ...`);
            await cache.saveCache(pathsToCache, keys.primary);
          }
          catch (error) {
            if (error instanceof Error) {
              if (error.name === cache.ValidationError.name) {
                throw error;
              } else if (error.name === cache.ReserveCacheError.name) {
                baseLib.info(error.message);
              } else {
                baseLib.warning(error.message);
              }
            }
          }
        }
      }
    } catch (err) {
      baseLib.warning("vcpkg-utils.saveCache() failed!");
      if (err instanceof Error) {
        baseLib.warning(err.name);
        baseLib.warning(err.message);
        if (err?.stack) {
          baseLib.warning(err.stack);
        }
      }
    }
    
    baseLib.debug(`saveCache()>>`)
  }

  public static addCachedPaths(baseLib: baselib.BaseLib, paths: string | null): void {
    if (paths) {
      baseLib.debug(`Set ${vcpkgaction.VCPKG_ADDITIONAL_CACHED_PATHS_STATE}=${paths}`);
      baseLib.setState(vcpkgaction.VCPKG_ADDITIONAL_CACHED_PATHS_STATE, paths);
    }
  }

  public static getAllCachedPaths(baseLib: baselib.BaseLib, vcpkgRootDir: string): string[] {
    let paths = runvcpkglib.getOrdinaryCachedPaths(vcpkgRootDir);

    const additionalCachedPaths: string | undefined = baseLib.getState(vcpkgaction.VCPKG_ADDITIONAL_CACHED_PATHS_STATE);
    baseLib.debug(`Get ${vcpkgaction.VCPKG_ADDITIONAL_CACHED_PATHS_STATE}=${additionalCachedPaths}`);
    if (additionalCachedPaths) {
      paths = paths.concat(additionalCachedPaths.split(';'));
    }

    // Remove empty entries.
    paths = paths.map(s => s.trim()).filter(Boolean);

    // Remove duplicates.
    return [...new Set(paths)];
  }
}
