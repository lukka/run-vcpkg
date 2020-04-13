[![Action Status](https://github.com/lukka/run-vcpkg/workflows/build-test/badge.svg)](https://github.com/lukka/run-vcpkg/actions)

# [The **run-vcpkg** action for caching artifacts and using vcpkg on GitHub](https://github.com/marketplace/actions/run-vcpkg)

The **run-vcpkg** action restores from cache [vcpkg](https://github.com/microsoft/vcpkg) along with the previously installed ports. Briefly:
 - If there is a cache miss, vpckg is fetched and installed; the cache's key is composed by hashing the hosting OS, the command line arguments and the vcpkg's commit id.
 - Then vcpkg is run to install the desired ports. This is a no-op if artifacts are already installed; This step can be skipped with `setupOnly:true`;
 - Artifacts are finally cached (if needed) as a post action at the end of the `job`.

The provided [samples](#samples) use [GitHub hosted runners](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/virtual-environments-for-github-hosted-runners).

Good companions are the [run-cmake](https://github.com/marketplace/actions/run-cmake) action and the 
[get-cmake](https://github.com/marketplace/actions/get-cmake) action.

 ## User Manual
 * [Quickstart](#quickstart)
   * [Restore cache/install/create cache](#install)
   * [Restore cache/do not install/create cache](#setuponly)
   * [Flowchart](#flowchart)
 * [The <strong>run-vcpkg</strong> action](#run-vcpkg)
 * [Action reference: all input/output parameters](#reference)
 * [Samples](#samples)
 * [Projects](#projects)

 ## Developer Manual
 * [Developers information](#developers-information)
   * [Prerequisites](#prerequisites)
   * [Packaging](#packaging)
   * [Testing](#testing)
  * [Contributing](#contributing)
  * [License](#license)

## <a id='quickstart'>Quickstart</a>

### <a id='install'>Setup vcpkg and install ports</a>

It is __highly recommended__ to [use vcpkg as a submodule](https://github.com/lukka/CppBuildTasks/blob/master/README.md#use-vcpkg-as-a-submodule-of-your-git-repository). Here below the sample where vcpkg is a Git submodule:

```yaml
  # Sample when vcpkg is a submodule of your repository (highly recommended!)

    #-uses: actions/cache@v1   <===== YOU DO NOT NEED THIS!

    # Install latest CMake.
    - uses: lukka/get-cmake@v2

    # Restore from cache the previously built ports. If "cache miss", then provision vcpkg, install desired ports, finally cache everything for the next run.
    - name: Restore from cache and run vcpkg
      uses: lukka/run-vcpkg@v2
      with:
        # Response file stored in source control, it provides the list of ports and triplet(s).
        vcpkgArguments: '@${{ env.vcpkgResponseFile }}'
        # Location of the vcpkg as submodule of the repository.
        vcpkgDirectory: '${{ github.workspace }}/vcpkg'
        # Since the cache must be invalidated when content of the response file changes, let's
        # compute its hash and append this to the computed cache's key.
        appendedCacheKey: ${{ hashFiles(env.vcpkgResponseFile) }}

    - name: 'Build with CMake and Ninja'
      uses: lukka/run-cmake@v2
      with:
        cmakeListsOrSettingsJson: CMakeListsTxtAdvanced
        cmakeListsTxtPath: '${{ github.workspace }}/cmakesettings.json/CMakeLists.txt'
        useVcpkgToolchainFile: true
        buildDirectory: '${{ runner.workspace }}/b/ninja'
        cmakeAppendedArgs: '-GNinja Multi-Config'
        # Or build multiple configurations out of a CMakeSettings.json file created with Visual Studio.
        # cmakeListsOrSettingsJson: CMakeSettingsJson
        # cmakeSettingsJsonPath: '${{ github.workspace }}/cmakesettings.json/CMakeSettings.json'
        # configurationRegexFilter: '${{ matrix.configuration }}'
```

### <a id='setuponly'>Setup vcpkg only</a>

When `setupOnly: true`, it only setups vcpkg and set VCPKG_ROOT environment variable without installing any port. The provisioned vcpkg can then be used as follows in a subsequent step:

```yaml
    # Restore from cache the previously built ports. If cache-miss, download, build vcpkg.
    - name: Restore from cache and install vcpkg
      # Download and build vcpkg, without installing any port. If content is cached already, it is a no-op.
      uses: lukka/run-vcpkg@v2
      with:
        setupOnly: true
    # Now that vcpkg is installed, it is being used to run desired arguments.
    - run: |
        $VCPKG_ROOT/vcpkg @$vcpkgResponseFile
        $VCPKG_ROOT/vcpkg install boost:linux-x64
```

### <a id='flowchart'>Flowchart</a>

![run-vcpkg flowchart](https://raw.githubusercontent.com/lukka/run-cmake-vcpkg-action-libs/master/run-vcpkg-lib/docs/task-vcpkg.png
)

### <a id='reference'>Action reference: all input/output parameters</a>

[action.yml](https://github.com/lukka/run-vcpkg/blob/master/action.yml)

## <a id="samples">Samples</a>

[View the workflows based on the run-cmake and run-vcpkg actions](https://github.com/lukka/CppBuildTasks-Validation/actions).

|CMakeLists.txt samples | |
|----------|-------|
[Linux/macOS/Windows, hosted runner, basic](https://github.com/lukka/CppBuildTasks-Validation/blob/master/.github/workflows/hosted-basic.yml)| [![Actions Status](https://github.com/lukka/CppBuildTasks-Validation/workflows/hosted-basic/badge.svg)](https://github.com/lukka/CppBuildTasks-Validation/actions)
[Linux/macOS/Windows, hosted runner, advanced](https://github.com/lukka/CppBuildTasks-Validation/blob/master/.github/workflows/hosted-advanced.yml)| [![Actions Status](https://github.com/lukka/CppBuildTasks-Validation/workflows/hosted-advanced/badge.svg)](https://github.com/lukka/CppBuildTasks-Validation/actions)
[Linux/macOS/Windows, hosted runner, vcpkg as submodule](https://github.com/lukka/CppBuildTasks-Validation/blob/master/.github/workflows/hosted-basic-cache-submod_vcpkg.yml)| [![Actions Status](https://github.com/lukka/CppBuildTasks-Validation/workflows/hosted-basic-cache-submod_vcpkg/badge.svg)](https://github.com/lukka/CppBuildTasks-Validation/actions)
[Linux/macOS/Windows, hosted runner, setup only and vcpkg as submodule](https://github.com/lukka/CppBuildTasks-Validation/blob/master/.github/workflows/hosted-advanced-setup-vcpkg.yml)| [![Actions Status](https://github.com/lukka/CppBuildTasks-Validation/workflows/hosted-advanced-setup-vcpkg/badge.svg)](https://github.com/lukka/CppBuildTasks-Validation/actions)

|CMakeSettings.json samples | |
|----------|-------|
[Linux/macOS/Windows, hosted runner, with vcpkg as submodule](https://github.com/lukka/CppBuildTasks-Validation/blob/master/.github/workflows/hosted-cmakesettingsjson-cache-submod_vcpkg.yml)| [![Actions Status](https://github.com/lukka/CppBuildTasks-Validation/workflows/hosted-cmakesettingsjson-cache-submod_vcpkg/badge.svg)](https://github.com/lukka/CppBuildTasks-Validation/actions)

## <a id='projects'>Real world project samples</a>

project: [CppOpenGLWebAssemblyCMake](https://github.com/lukka/CppOpenGLWebAssemblyCMake) | |
|----------|-------|
[WASM, Linux, macOS](https://github.com/lukka/CppOpenGLWebAssemblyCMake/blob/master/.github/workflows/build.yml) | [![Actions Status](https://github.com/lukka/CppOpenGLWebAssemblyCMake/workflows/hosted-wasm-macos-linux/badge.svg)](https://github.com/lukka/CppOpenGLWebAssemblyCMake/actions)

project: [codehz/wine-bdlauncher](https://github.com/codehz/wine-bdlauncher) | |
|----------|-------|
[Windows](https://github.com/codehz/wine-bdlauncher/blob/master/.github/workflows/ci.yml) | [![CI](https://github.com/codehz/wine-bdlauncher/workflows/CI/badge.svg)](https://github.com/codehz/wine-bdlauncher/actions)

project: [OPM/ResInsight](https://github.com/OPM/ResInsight/) | | 
|----------|-------|
[Windows, Linux](https://github.com/OPM/ResInsight/blob/dev/.github/workflows/main.yml) | [![CI](https://github.com/OPM/ResInsight/workflows/ResInsight%20Build/badge.svg)](https://github.com/OPM/ResInsight/actions)

# Developers information

## Prerequisites
[gulp 4](https://www.npmjs.com/package/gulp4) globally installed.

## Build and lint
Build with `tsc` running:

 > npm run build

Launch `lint` by:

 > npm run lint

## Packaging
To build, lint validate and package the extension for release purpose, run:

  > npm run pack

## Testing

To build, pack and test:
 
 > npm run test

 To run test directly:
 
 > jest

[Smoke tests](https://en.wikipedia.org/wiki/Smoke_testing_(software)) are implemented in this repository, which run the action on all platforms.

Rigorous tests are executed in the builds of [CppBuildTasks](https://github.com/lukka/CppBuildTasks/) repository that shares the same engine in the [run-cmake-vcpkg-action-libs](https://github.com/lukka/run-cmake-vcpkg-action-libs) submodule.

It would be desirable to have extensive tests implemented in this repository as well.

Validation tests on various scenarios are run using the workflows of the [Samples](#samples).

## <a id='contributing'>Contributing</a>

The software is provided as is, there is no warranty of any kind. All users are encouraged to improve the [source code](https://github.com/lukka/run-vcpkg) with fixes and new features.

# License
 Except for the `actions/cache directory and its content`, all the content in this repository is licensed under the [MIT License](LICENSE.txt).

Copyright (c) 2019-2020 Luca Cappa

<hr>

All content under [actions/cache](./actions/cache) directory is subject to this [LICENSE](./actions/cache/LICENSE)

Copyright (c) 2018 GitHub, Inc. and contributors
