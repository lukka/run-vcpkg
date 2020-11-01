// Copyright (c) 2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as path from 'path'
import * as fs from 'fs'
import * as core from '@actions/core'
import * as runVcpkgLib from '@lukka/run-vcpkg-lib'
import * as BaseUtilLib from '@lukka/base-util-lib'

export function ensureDirExists(path: string): void {
  try {
    fs.mkdirSync(path, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      core.warning(`Failed to create directory '${path}', error='${err}'.`);
    }
  }
}

/**
 * Compute an unique string given some text.
 * @param {string} text The text to computer an hash for.
 * @returns {string} The unique hash of 'text'.
 */
export function hashCode(text: string): string {
  let hash = 42;
  if (text.length != 0) {
    for (let i = 0; i < text.length; i++) {
      const char: number = text.charCodeAt(i);
      hash = ((hash << 5) + hash) ^ char;
    }
  }

  return hash.toString();
}

export function isExactKeyMatch(key: string, cacheKey?: string): boolean {
  if (cacheKey)
    return cacheKey.localeCompare(key, undefined, { sensitivity: "accent" }) === 0;
  else
    return false;
}

export async function getVcpkgCommitId(baseUtils: BaseUtilLib.BaseUtilLib, vcpkgDirectory: string): Promise<string | undefined> {
  let id = undefined;
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
    } else {
      id = await runVcpkgLib.VcpkgRunner.getCommitId(baseUtils, fullVcpkgPath);
    }
    id = id?.trim();
  }

  // Normalize any error to undefined.
  return id ?? undefined;
}

