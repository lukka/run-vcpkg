
// Copyright (c) 2021 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as core from '@actions/core'
import * as baseutillib from '@lukka/base-util-lib'
import * as vcpkgutil from './vcpkg-utils'

export class VcpkgPostAction {
  constructor(
    private baseUtil: baseutillib.BaseUtilLib,
    private jobSucceeded: boolean,
    private doNotCacheOnWorkflowFailure: boolean,
    private doNotCache: boolean,
    private keys: baseutillib.KeySet,
    private cachedPaths: string[],
    private hitCacheKey: string | null
  ) {
    // Intentionally void.
  }

  public async run(): Promise<void> {
    try {
      await this.baseUtil.wrapOp('Save vcpkg and its artifacts into GitHub service cache',
        async () => {
          if (!this.jobSucceeded && this.doNotCacheOnWorkflowFailure) {
            this.baseUtil.baseLib.info("Skipping saving cache as job failed and input 'doNotCacheOnWorkflowFailure : true'.");
            return;
          } else {
            await vcpkgutil.Utils.saveCache(this.baseUtil.baseLib, this.doNotCache, this.keys, this.hitCacheKey, this.cachedPaths);
          }
        });
      this.baseUtil.baseLib.info('run-vcpkg post action execution succeeded');
      process.exitCode = 0;
    } catch (err) {
      const error: Error = err as Error;
      if (error?.stack) {
        this.baseUtil.baseLib.info(error.stack);
      }
      const errorAsString = (err as Error)?.message ?? "undefined error";
      process.exitCode = -1000;
    }
  }
}
