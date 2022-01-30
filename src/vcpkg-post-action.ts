
// Copyright (c) 2021-2022 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as baseutillib from '@lukka/base-util-lib'
import * as vcpkgutil from './vcpkg-utils'
import * as vcpkgaction from './vcpkg-action'

export class VcpkgPostAction {
  constructor(
    private baseUtil: baseutillib.BaseUtilLib,
    private doNotCache: boolean,
    private keys: baseutillib.KeySet,
    private cachedPaths: string[],
    private hitCacheKey: string | null
  ) {
    // Intentionally void.
  }

  public async run(): Promise<void> {
    const RUNVCPKG_NO_CACHE = "RUNVCPKG_NO_CACHE";
    await this.baseUtil.wrapOp('Save vcpkg and its artifacts into GitHub service cache',
      async () => {
        const runvcpkgState = this.baseUtil.baseLib.getState(vcpkgaction.VCPKG_SUCCESS_STATE);
        if (process.env[RUNVCPKG_NO_CACHE]) {
          this.baseUtil.baseLib.info(`Skipping cache as '${RUNVCPKG_NO_CACHE}' is defined!`);
        } else if (!runvcpkgState) {
          this.baseUtil.baseLib.warning('Skipping cache as run-vcpkg step failed!');
        } else
          await vcpkgutil.Utils.saveCache(this.baseUtil.baseLib, this.doNotCache, this.keys, this.hitCacheKey, this.cachedPaths);
      });
    this.baseUtil.baseLib.info('run-vcpkg post action execution succeeded');
    process.exitCode = 0;
  }
}
