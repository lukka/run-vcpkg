// Copyright (c) 2020-2021-2022-2023 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as path from 'path'
import * as cache from '@actions/cache'
import * as baseutillib from '@lukka/base-util-lib'
import * as runvcpkglib from '@lukka/run-vcpkg-lib'
import * as vcpkgutil from './vcpkg-utils'

// Input names for run-vcpkg only.
export const doNotCacheInput = 'DONOTCACHE';
export const additionalCachedPathsInput = 'ADDITIONALCACHEDPATHS';
export const binaryCachePathInput = 'BINARYCACHEPATH';
export const vcpkgJsonGlobInput = 'VCPKGJSONGLOB';
export const vcpkgJsonIgnoresInput = "VCPKGJSONIGNORES";
export const runVcpkgInstallInput = 'RUNVCPKGINSTALL';
export const runVcpkgFormatStringInput = "RUNVCPKGFORMATSTRING";
export const vcpkgDirectoryInput = "VCPKGDIRECTORY";
export const vcpkgCommitIdInput = "VCPKGGITCOMMITID";
export const doNotUpdateVcpkgInput = "DONOTUPDATEVCPKG";
export const vcpkgUrlInput = "VCPKGGITURL";
export const logCollectionRegExpsInput = 'LOGCOLLECTIONREGEXPS';
export const vcpkgConfigurationJsonGlob = 'VCPKGCONFIGURATIONJSONGLOB';

export class VcpkgAction {
  public static readonly VCPKG_DEFAULT_BINARY_CACHE = "VCPKG_DEFAULT_BINARY_CACHE";
  private static readonly VCPKGJSON_GLOB = "**/vcpkg.json";
  private static readonly VCPKGJSON_IGNORES = "['**/vcpkg/**']";
  private static readonly DEFAULTVCPKGURL = 'https://github.com/microsoft/vcpkg.git';
  private readonly doNotCache: boolean = true;
  private readonly runVcpkgFormatString: string | null;
  private readonly vcpkgJsonGlob: string;
  private readonly vcpkgJsonIgnores: string[];
  private readonly runVcpkgInstall: boolean = false;
  private readonly userProvidedCommitId: string | null;
  private readonly doNotUpdateVcpkg: boolean = false;
  private readonly vcpkgUrl: string | null;
  private readonly vcpkgCommitId: string | null;
  private readonly logCollectionRegExps: string[];
  private readonly binaryCachePath: string | null;
  private readonly vcpkgConfigurationJsonGlob: string | null;
  private vcpkgRootDir: string | null;

  constructor(private readonly baseUtilLib: baseutillib.BaseUtilLib) {
    // Fetch inputs.
    const vcpkgRootDir = baseUtilLib.baseLib.getPathInput(vcpkgDirectoryInput, false, false);
    this.vcpkgRootDir = vcpkgRootDir ? path.normalize(path.resolve(vcpkgRootDir)) : null;
    this.userProvidedCommitId = baseUtilLib.baseLib.getInput(vcpkgCommitIdInput, false) ?? null;
    this.runVcpkgFormatString = baseUtilLib.baseLib.getInput(runVcpkgFormatStringInput, false) ?? null;
    this.vcpkgJsonGlob = baseUtilLib.baseLib.getInput(vcpkgJsonGlobInput, false) ?? VcpkgAction.VCPKGJSON_GLOB;
    this.vcpkgJsonIgnores = eval(baseUtilLib.baseLib.getInput(vcpkgJsonIgnoresInput, false) ?? VcpkgAction.VCPKGJSON_IGNORES) as string[];
    this.vcpkgConfigurationJsonGlob = baseUtilLib.baseLib.getInput(vcpkgConfigurationJsonGlob, false) ?? null;
    this.runVcpkgInstall = baseUtilLib.baseLib.getBoolInput(runVcpkgInstallInput, false) ?? this.runVcpkgInstall;
    this.doNotCache = baseUtilLib.baseLib.getBoolInput(doNotCacheInput, false) ?? this.doNotCache;
    this.doNotUpdateVcpkg = baseUtilLib.baseLib.getBoolInput(doNotUpdateVcpkgInput, false) ?? this.doNotUpdateVcpkg;
    this.vcpkgUrl = baseUtilLib.baseLib.getInput(vcpkgUrlInput, false) ?? VcpkgAction.DEFAULTVCPKGURL;
    this.vcpkgCommitId = baseUtilLib.baseLib.getInput(vcpkgCommitIdInput, false) ?? null;
    this.logCollectionRegExps = baseUtilLib.baseLib.getDelimitedInput(logCollectionRegExpsInput, ';', false) ?? [];
    this.binaryCachePath = baseUtilLib.baseLib.getPathInput(binaryCachePathInput, false, true) ?? null;
  }

  public async run(): Promise<void> {
    const baseLib = this.baseUtilLib.baseLib;
    baseLib.debug("run()<<");

    this.vcpkgRootDir = await this.baseUtilLib.wrapOp('Prepare output directories', async () => {
      let vcpkgRoot = this.vcpkgRootDir;
      // Ensure vcpkg root is set.
      if (!vcpkgRoot) {
        vcpkgRoot = await runvcpkglib.getDefaultVcpkgDirectory(this.baseUtilLib.baseLib);
        baseLib.info(`The vcpkg's root directory is not provided, using the default value: '${this.vcpkgRootDir}'`);
      }
      baseLib.info(`The vpckg root directory: '${vcpkgRoot}'`);

      // Create the vcpkg_root and cache directory if needed.
      const binCachePath: string = this.binaryCachePath ?? await runvcpkglib.getDefaultVcpkgCacheDirectory(this.baseUtilLib.baseLib);
      baseLib.debug(`vcpkgRootDir=${this.vcpkgRootDir}, binCachePath=${binCachePath}`);
      await baseLib.mkdirP(vcpkgRoot);
      await baseLib.mkdirP(binCachePath);

      // Set the place where vcpkg is putting the binary caching artifacts.
      this.baseUtilLib.baseLib.setVariable(VcpkgAction.VCPKG_DEFAULT_BINARY_CACHE, binCachePath);
      return vcpkgRoot;
    });

    if (!this.vcpkgRootDir) {
      throw new Error(`vcpkgRootDir is not defined!`);
    }

    let isCacheHit: boolean | null = null;
    let cacheKey: baseutillib.KeySet | null = null;
    if (this.doNotCache) {
      this.baseUtilLib.baseLib.debug(`Skipping restoring vcpkg as caching is disabled. Set input 'doNotCache:false' to enable caching.`);
    } else {
      cacheKey =
        await this.baseUtilLib.wrapOp('Computing vcpkg cache key', async () => {
          const keys = await vcpkgutil.Utils.computeCacheKeys(
            this.baseUtilLib,
            this.vcpkgRootDir as string, // HACK: if it were not set it would have thrown before.
            this.userProvidedCommitId);

          if (keys) {
            baseLib.info(`Computed key: ${JSON.stringify(keys)}`);
          } else {
            throw new Error("Computation for the cache key failed!");
          }
          return keys;
        });

      isCacheHit = await this.restoreCache(cacheKey);
    }

    await runvcpkglib.VcpkgRunner.run(
      this.baseUtilLib,
      this.vcpkgRootDir,
      this.vcpkgUrl,
      this.vcpkgCommitId,
      this.runVcpkgInstall,
      this.doNotUpdateVcpkg,
      this.logCollectionRegExps,
      this.vcpkgJsonGlob,
      this.vcpkgJsonIgnores,
      this.vcpkgConfigurationJsonGlob,
      this.runVcpkgFormatString
    );

    if (this.doNotCache) {
      this.baseUtilLib.baseLib.debug(`Skipping restoring vcpkg as caching is disabled. Set input 'doNotCache:false' to enable caching.`);
    } else {
      await this.saveCache(
        isCacheHit,
        cacheKey as baseutillib.KeySet, // Hack: if it were not set it would have thrown an exception before.
        vcpkgutil.Utils.getAllCachedPaths(this.baseUtilLib.baseLib,
          this.vcpkgRootDir as string // HACK: if it were not set it would have thrown an exception before.
        ),
        true);
    }

    this.baseUtilLib.baseLib.debug("run()>>");
  }

  private async restoreCache(keys: baseutillib.KeySet): Promise<boolean> {
    let isCacheHit = false;
    this.baseUtilLib.baseLib.debug("restoreCache()<<");
    await this.baseUtilLib.wrapOp('Restore vcpkg installation from cache (not the packages, that is done by vcpkg via Binary Caching stored onto the GitHub Action cache)',
      async () => {
        if (!this.vcpkgRootDir) throw new Error("VCPKG_ROOT must be defined");
        const pathsToCache: string[] = vcpkgutil.Utils.getAllCachedPaths(
          this.baseUtilLib.baseLib, this.vcpkgRootDir);
        this.baseUtilLib.baseLib.info(`Cache key: '${keys.primary}'`);
        this.baseUtilLib.baseLib.info(`Cache restore keys: '${keys.restore}'`);
        this.baseUtilLib.baseLib.info(`Cached paths: '${pathsToCache}'`);

        let keyCacheHit: string | undefined;
        try {
          keyCacheHit = await cache.restoreCache(pathsToCache, keys.primary, keys.restore);
        }
        catch (err) {
          this.baseUtilLib.baseLib.warning(`cache.restoreCache() failed: '${(err as Error)?.message ?? "<undefined error>"}', skipping restoring from cache.`);
        }

        if (keyCacheHit) {
          this.baseUtilLib.baseLib.info(`Cache hit, key = '${keyCacheHit}'.`);
          isCacheHit = true;
        } else {
          this.baseUtilLib.baseLib.info(`Cache miss.`);
          isCacheHit = false;
        }
      }
    );

    this.baseUtilLib.baseLib.debug("restoreCache()>>");
    return isCacheHit;
  }

  private async saveCache(isCacheHit: boolean | null, keys: baseutillib.KeySet, cachedPaths: string[],
    successStep: boolean): Promise<void> {
    this.baseUtilLib.baseLib.debug('saveCache()<<');
    await vcpkgutil.Utils.saveCache(this.baseUtilLib, keys,
      isCacheHit ? keys.primary : null, /* Only the primary cache could have hit, since there are no restore keys. */
      cachedPaths);
    this.baseUtilLib.baseLib.debug('saveCache()>>');
  }
}
