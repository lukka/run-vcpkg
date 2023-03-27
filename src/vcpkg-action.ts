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

export class VcpkgAction {
  public static readonly VCPKG_DEFAULT_BINARY_CACHE = "VCPKG_DEFAULT_BINARY_CACHE";
  private static readonly VCPKGJSON_GLOB = "**/vcpkg.json";
  private static readonly VCPKGJSON_IGNORES = "['**/vcpkg/**']";
  private static readonly DEFAULTVCPKGURL = 'https://github.com/microsoft/vcpkg.git';
  private readonly doNotCache: boolean = false;
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

  constructor(private readonly baseUtilLib: baseutillib.BaseUtilLib) {
    // Fetch inputs.
    const vcpkgRootDir = baseUtilLib.baseLib.getPathInput(vcpkgDirectoryInput, false, false);
    this.vcpkgRootDir = vcpkgRootDir ? path.normalize(path.resolve(vcpkgRootDir)) : null;
    this.userProvidedCommitId = baseUtilLib.baseLib.getInput(vcpkgCommitIdInput, false) ?? null;
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

    const [keys, vcpkgJsonFilePath] =
      await this.baseUtilLib.wrapOp('Compute vcpkg cache key', async () => {
        const vcpkgJsonPath = await vcpkgutil.Utils.getVcpkgJsonPath(
          this.baseUtilLib, this.vcpkgJsonGlob, this.vcpkgJsonIgnores);
        const keys = await vcpkgutil.Utils.computeCacheKeys(
          this.baseUtilLib,
          this.vcpkgRootDir as string, // HACK: if it were not set it would have thrown before.
          this.userProvidedCommitId);

        if (keys && vcpkgJsonPath) {
          baseLib.info(`Computed key: ${JSON.stringify(keys)}`);
        } else {
          throw new Error("Computation for the cache key or the vcpkg.json location failed!");
        }
        return [keys, vcpkgJsonPath];
      });

    const isCacheHit =
      await this.baseUtilLib.wrapOp<boolean>('Restore vcpkg installation from cache (not the packages, that is done by vcpkg via binary caching using GitHub Action cache)',
        async () => await this.restoreCache(keys as baseutillib.KeySet));

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

    await this.saveCache(
      isCacheHit,
      keys,
      vcpkgutil.Utils.getAllCachedPaths(this.baseUtilLib.baseLib,
        this.vcpkgRootDir as string // HACK: if it were not set it would have thrown before.
      ),
      this.doNotCache, true);

    this.baseUtilLib.baseLib.debug("run()>>");
  }

  private async restoreCache(keys: baseutillib.KeySet): Promise<boolean> {
    let isCacheHit = false;
    this.baseUtilLib.baseLib.debug("restoreCache()<<");
    if (this.doNotCache) {
      this.baseUtilLib.baseLib.info(`Skipping restoring cache as caching is disabled (${doNotCacheInput}: ${this.doNotCache}).`);
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
        isCacheHit = true;
      } else {
        this.baseUtilLib.baseLib.info(`Cache miss.`);
        isCacheHit = false;
      }
    }

    this.baseUtilLib.baseLib.debug("restoreCache()>>");
    return isCacheHit;
  }

  private async saveCache(isCacheHit: boolean, keys: baseutillib.KeySet, cachedPaths: string[], doNotCache: boolean,
    successStep: boolean): Promise<void> {
    this.baseUtilLib.baseLib.info('saveCache()<<');
    await this.baseUtilLib.wrapOp('Save vcpkg into the GitHub Action cache (only the tool, not the built packages which are saved by vcpkg`s Binary Caching on GitHub Action`s cache).',
      async () =>
        await vcpkgutil.Utils.saveCache(this.baseUtilLib.baseLib, this.doNotCache, keys,
          isCacheHit ? keys.primary : null, /* Only the primary cache could have hit, since there are no restore keys. */
          cachedPaths)
    );
    this.baseUtilLib.baseLib.info('saveCache()>>');
  }

  private async getCurrentDirectoryForRunningVcpkg(vcpkgJsonFile: string | null): Promise<string | null> {
    this.baseUtilLib.baseLib.debug(`getCurrentDirectoryForRunningVcpkg() << `);
    // When running 'vcpkg install' is requested, ensure the target directory is well known, fail otherwise.
    let vcpkgJsonPath: string | null = null;
    if (this.runVcpkgInstall) {
      vcpkgJsonPath = vcpkgJsonFile === null ? null : path.dirname(path.resolve(vcpkgJsonFile));
      this.baseUtilLib.baseLib.debug(`vcpkgJsonFile='${vcpkgJsonFile}', vcpkgJsonPath='${vcpkgJsonPath}'.`);
      if (vcpkgJsonPath === null) {
        this.baseUtilLib.baseLib.error(`Failing the workflow since the 'vcpkg.json' file has not been found, and its containing directory 
 is required and used as the 'working directory' when launching vcpkg with arguments:
 '${this.runVcpkgFormatString}'. `);
      }
    }

    this.baseUtilLib.baseLib.debug(`getCurrentDirectoryForRunningVcpkg()>> -> ${vcpkgJsonPath}`);
    return vcpkgJsonPath;
  }
}
