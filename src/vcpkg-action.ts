// Copyright (c) 2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as core from '@actions/core'
import * as path from 'path'
import * as fs from 'fs'
import * as cache from '@actions/cache'
import { BaseLib } from '@lukka/base-lib'
import * as runvcpkglib from '@lukka/run-vcpkg-lib'

// State's keys.
export const VCPKGCACHEKEY = 'cacheKey';
export const VCPKGCACHEHIT = 'cacheHit';
// Input name for run-vcpkg only.
export const doNotCache = 'doNotCache';

function ensureDirExists(path: string): void {
  try {
    fs.mkdirSync(path, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      core.warning(`Failed to create directory '${path}', error='${err}'.`);
    }
  }
}

/**
 * The input's name for additional content for the cache key.
 */
export const appendedCacheKey = 'appendedCacheKey';

export function getCachedPaths(): string[] {
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

/**
 * Compute an unique number given some text.
 * @param {string} text
 * @returns {string}
 */
function hashCode(text: string): string {
  let hash = 42;
  if (text.length != 0) {
    for (let i = 0; i < text.length; i++) {
      const char: number = text.charCodeAt(i);
      hash = ((hash << 5) + hash) ^ char;
    }
  }

  return hash.toString();
}

export class VcpkgAction {
  constructor(private tl: BaseLib) {
  }

  public async run(): Promise<void> {
    core.startGroup('Restore vcpkg and its artifacts from cache');
    try {
      if (core.getInput(doNotCache).toLowerCase() === "true") {
        core.info(`Caching is disabled (${doNotCache}=true)`);
      } else {
        // Get an unique output directory name from the URL.
        const key: string = this.computeKey();
        const pathsToCache: string[] = getCachedPaths();

        core.info(`Cache's key = '${key}'.`);
        core.saveState(VCPKGCACHEKEY, key);
        core.info(`Running restore-cache`);

        let cacheHitId: string | undefined;
        try {
          cacheHitId = await cache.restoreCache(pathsToCache, key);
        }
        catch (err) {
          core.warning(`restoreCache() failed: '${err?.toString()}'.`)
        }

        if (cacheHitId) {
          core.info(`Cache hit, id=${cacheHitId}.`);
          core.saveState(VCPKGCACHEHIT, cacheHitId);
        } else {
          core.info(`Cache miss.`);
        }
      }
    } finally {
      core.endGroup()
    }

    const runner: runvcpkglib.VcpkgRunner = new runvcpkglib.VcpkgRunner(this.tl);
    await runner.run();
  }

  private getVcpkgCommitId(): string {
    let id = "";
    const workspaceDir = process.env.GITHUB_WORKSPACE ?? "";
    if (workspaceDir) {
      let fullVcpkgPath = "";
      const inputVcpkgPath = core.getInput(runvcpkglib.vcpkgDirectory);
      if (path.isAbsolute(inputVcpkgPath))
        fullVcpkgPath = path.normalize(path.resolve(inputVcpkgPath));
      else
        fullVcpkgPath = path.normalize(path.resolve(path.join(workspaceDir, inputVcpkgPath)));
      core.debug(`fullVcpkgPath='${fullVcpkgPath}'`);
      const relPath = fullVcpkgPath.replace(workspaceDir, '');
      core.debug(`relPath='${relPath}'`);
      const submodulePath = path.join(workspaceDir, ".git/modules", relPath, "HEAD")
      core.debug(`submodulePath='${submodulePath}'`);
      if (fs.existsSync(submodulePath)) {
        id = fs.readFileSync(submodulePath).toString();
        core.debug(`commitId='${id}'`);
      }
    }
    return id.trim();
  }

  private computeKey(): string {
    let key = "";
    const commitId: string = this.getVcpkgCommitId();
    if (commitId) {
      core.info(`vcpkg identified at commitId=${commitId}, adding it to the cache's key.`);
      key += `submodGitId=${commitId}`;
    } else if (core.getInput(runvcpkglib.vcpkgCommitId)) {
      key += "localGitId=" + hashCode(core.getInput(runvcpkglib.vcpkgCommitId));
    } else {
      core.info(`No vcpkg's commit id was provided, does not contribute to the cache's key.`);
    }

    key += "-args=" + hashCode(core.getInput(runvcpkglib.vcpkgArguments));
    key += "-os=" + hashCode(process.platform);
    key += "-appendedKey=" + hashCode(core.getInput(appendedCacheKey));

    // Add the triplet only if it is provided.
    const triplet = core.getInput(runvcpkglib.vcpkgTriplet)
    if (triplet)
      key += "-triplet=" + hashCode(triplet);
    return key;
  }
}
