// Copyright (c) 2020-2021-2022 Luca Cappa
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
/**
 * The input's name for additional content for the cache key.
 */
export const appendedCacheKeyInput = 'APPENDEDCACHEKEY';
export const prependedCacheKeyInput = 'PREPENDEDCACHEKEY';
export const logCollectionRegExpsInput = 'LOGCOLLECTIONREGEXPS';

// Saved data in the action, and consumed by post-action.
export const VCPKG_CACHE_COMPUTEDKEY_STATE = "VCPKG_CACHE_COMPUTEDKEY_STATE";
export const VCPKG_KEY_CACHE_HIT_STATE = "VCPKG_KEY_CACHE_HIT_STATE";
export const VCPKG_DO_NOT_CACHE_STATE = "VCPKG_DO_NOT_CACHE_STATE";
export const VCPKG_ADDED_CACHEKEY_STATE = "VCPKG_ADDED_CACHEKEY_STATE";
export const VCPKG_ROOT_STATE = "VCPKG_ROOT_STATE";
export const VCPKG_ADDITIONAL_CACHED_PATHS_STATE = "VCPKG_ADDITIONAL_CACHED_PATHS_STATE";
export const VCPKG_SUCCESS_STATE = "VCPKG_SUCCESS_STATE";

export class VcpkgAction {
  public static readonly VCPKG_DEFAULT_BINARY_CACHE = "VCPKG_DEFAULT_BINARY_CACHE";
  private static readonly VCPKGJSON_GLOB = "**/vcpkg.json";
  private static readonly VCPKGJSON_IGNORES = "['**/vcpkg/**']";
  private static readonly DEFAULTVCPKGURL = 'https://github.com/microsoft/vcpkg.git';
  private readonly doNotCache: boolean = false;
  private readonly appendedCacheKey: string | null;
  private readonly prependedCacheKey: string | null;
  private readonly runVcpkgFormatString: string | null;
  private readonly vcpkgJsonGlob: string;
  private readonly vcpkgJsonIgnores: string[];
  private readonly runVcpkgInstall: boolean;
  private readonly userProvidedCommitId: string | null;
  private readonly doNotUpdateVcpkg: boolean;
  private readonly vcpkgUrl: string | null;
  private readonly vcpkgCommitId: string | null;
  private readonly logCollectionRegExps: string[];
  private readonly binaryCachePath: string | null;
  private vcpkgRootDir: string | null;
  private hitCacheKey: string | undefined;

  constructor(private readonly baseUtilLib: baseutillib.BaseUtilLib) {
    // Fetch inputs.
    this.appendedCacheKey = baseUtilLib.baseLib.getInput(appendedCacheKeyInput, false) ?? null;
    this.prependedCacheKey = baseUtilLib.baseLib.getInput(prependedCacheKeyInput, false) ?? null;
    const vcpkgRootDir = baseUtilLib.baseLib.getPathInput(vcpkgDirectoryInput, false, false);
    this.vcpkgRootDir = vcpkgRootDir ? path.normalize(path.resolve(vcpkgRootDir)) : null;
    this.userProvidedCommitId = baseUtilLib.baseLib.getInput(vcpkgCommitIdInput, false) ?? null;
    vcpkgutil.Utils.addCachedPaths(baseUtilLib.baseLib, baseUtilLib.baseLib.getInput(additionalCachedPathsInput, false) ?? null);
    this.runVcpkgFormatString = baseUtilLib.baseLib.getInput(runVcpkgFormatStringInput, false) ?? null;
    this.vcpkgJsonGlob = baseUtilLib.baseLib.getInput(vcpkgJsonGlobInput, false) ?? VcpkgAction.VCPKGJSON_GLOB;
    this.vcpkgJsonIgnores = eval(baseUtilLib.baseLib.getInput(vcpkgJsonIgnoresInput, false) ?? VcpkgAction.VCPKGJSON_IGNORES) as string[];
    this.runVcpkgInstall = baseUtilLib.baseLib.getBoolInput(runVcpkgInstallInput, false) ?? false;
    this.doNotCache = baseUtilLib.baseLib.getBoolInput(doNotCacheInput, false) ?? false;
    this.doNotUpdateVcpkg = baseUtilLib.baseLib.getBoolInput(doNotUpdateVcpkgInput, false) ?? false;
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
        baseLib.info(`The vcpkg's root directory is not provided, using the predefined: '${this.vcpkgRootDir}'`);
      }

      // Create the vcpkg_root and cache directory if needed.
      const binCachePath: string = this.binaryCachePath ?? await runvcpkglib.getDefaultVcpkgCacheDirectory(this.baseUtilLib.baseLib);
      // Save the binary cache path for the post action.
      vcpkgutil.Utils.addCachedPaths(baseLib, binCachePath);
      baseLib.debug(`vcpkgRootDir=${this.vcpkgRootDir}, binCachePath=${binCachePath}`);
      await baseLib.mkdirP(vcpkgRoot);
      await baseLib.mkdirP(binCachePath);

      // Save state for post action.
      this.baseUtilLib.baseLib.setVariable(VcpkgAction.VCPKG_DEFAULT_BINARY_CACHE, binCachePath);
      this.baseUtilLib.baseLib.setState(VCPKG_DO_NOT_CACHE_STATE, this.doNotCache ? "true" : "false");
      this.baseUtilLib.baseLib.setState(VCPKG_ROOT_STATE, vcpkgRoot);

      return vcpkgRoot;
    });

    if (!this.vcpkgRootDir) {
      throw new Error(`vcpkgRootDir is not defined!`);
    }

    let keys: baseutillib.KeySet | null = null;
    let vcpkgJsonFilePath: string | null = null;
    await this.baseUtilLib.wrapOp('Compute vcpkg cache key', async () => {
      const [vcpkgJsonFile, vcpkgJsonHash, vcpkgConfigurationJsonHash] = await vcpkgutil.Utils.getVcpkgJsonHash(this.baseUtilLib, this.vcpkgJsonGlob, this.vcpkgJsonIgnores);
      keys = await vcpkgutil.Utils.computeCacheKeys(
        this.baseUtilLib, 
        vcpkgJsonHash, 
        vcpkgConfigurationJsonHash, 
        this.vcpkgRootDir as string, 
        this.userProvidedCommitId, 
        this.appendedCacheKey,
        this.prependedCacheKey);

      if (keys) {
        baseLib.info(`Computed key: ${JSON.stringify(keys)}`);
        vcpkgJsonFilePath = vcpkgJsonFile;
      } else {
        this.baseUtilLib.baseLib.warning("Computation for the cache key failed!");
      }
    });

    if (keys) {
      this.baseUtilLib.baseLib.setState(VCPKG_CACHE_COMPUTEDKEY_STATE, JSON.stringify(keys));
      await this.baseUtilLib.wrapOp('Restore vcpkg and its artifacts from cache',
        () => this.restoreCache(keys as baseutillib.KeySet));
    }

    const vcpkgJsonPath: string | null = await this.getCurrentDirectoryForRunningVcpkg(vcpkgJsonFilePath);
    await runvcpkglib.VcpkgRunner.run(
      this.baseUtilLib,
      this.vcpkgRootDir,
      this.vcpkgUrl,
      this.vcpkgCommitId,
      this.runVcpkgInstall,
      this.doNotUpdateVcpkg,
      this.logCollectionRegExps,
      vcpkgJsonPath,
      this.runVcpkgFormatString
    );

    baseLib.setState(VCPKG_SUCCESS_STATE, "success");
    this.baseUtilLib.baseLib.debug("run()>>");
  }

  private async restoreCache(keys: baseutillib.KeySet): Promise<void> {
    this.baseUtilLib.baseLib.debug("restoreCache()<<");
    if (this.doNotCache) {
      this.baseUtilLib.baseLib.info(`Skipping saving cache as caching is disabled (${doNotCacheInput}: ${this.doNotCache}).`);
    } else {
      if (!this.vcpkgRootDir) throw new Error("vcpkg_ROOT must be defined");
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
        this.hitCacheKey = keyCacheHit;
        this.baseUtilLib.baseLib.setState(VCPKG_KEY_CACHE_HIT_STATE, keyCacheHit);
      } else {
        this.baseUtilLib.baseLib.info(`Cache miss.`);
      }
    }
    this.baseUtilLib.baseLib.debug("restoreCache()>>");
  }

  private async getCurrentDirectoryForRunningVcpkg(vcpkgJsonFile: string | null): Promise<string | null> {
    this.baseUtilLib.baseLib.debug(`getCurrentDirectoryForRunningVcpkg() << `);
    // When running 'vcpkg install' is requested, ensure the target directory is well known, trigger a warning otherwise.
    let vcpkgJsonPath: string | null = null;
    if (this.runVcpkgInstall) {
      vcpkgJsonPath = vcpkgJsonFile === null ? null : path.dirname(path.resolve(vcpkgJsonFile));
      this.baseUtilLib.baseLib.debug(`vcpkgJsonFile = '${vcpkgJsonFile}', vcpkgJsonPath = '${vcpkgJsonPath}'.`);
      if (vcpkgJsonPath === null) {
        this.baseUtilLib.baseLib.warning(`The current directory for running the command '${this.runVcpkgFormatString}' is unknown.'`);
      }
    }

    this.baseUtilLib.baseLib.debug(`getCurrentDirectoryForRunningVcpkg()>> -> ${vcpkgJsonPath}`);
    return vcpkgJsonPath;
  }
}
