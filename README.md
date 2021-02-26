[![Action Status](https://github.com/lukka/run-vcpkg/workflows/build-test/badge.svg)](https://github.com/lukka/run-vcpkg/actions)

[![Coverage Status](https://coveralls.io/repos/github/lukka/run-vcpkg/badge.svg?branch=main)](https://coveralls.io/github/lukka/run-vcpkg?branch=main)

# Before using this action, consider writing a _pure_ workflow!

Before using this action, please consider reading and learning how to write a workflow which is directly using the well known tools you can run on your own machine, without relying on GitHub actions that you cannot run on your development machine.
You can read more in this issue about it: https://github.com/lukka/run-vcpkg/issues/66

# [The **run-vcpkg** action for caching artifacts and using vcpkg on GitHub](https://github.com/marketplace/actions/run-vcpkg)

The **run-vcpkg** action restores from cache [vcpkg](https://github.com/microsoft/vcpkg) along with the previously installed ports. On the other hand when there is a "cache miss":
 - `vpckg` is fetched and installed; the cache's key is composed by hashing the hosting OS name, the command line arguments and the vcpkg's commit id.
    - Restoring from cache can be skipped with `doNotCache: true`.
 - Then `vcpkg` is run to install the desired ports.
    - This step can be skipped with `setupOnly: true`.
 - Artifacts and `vcpkg` are then saved in cache.
    - Saving to cache can be skipped with `doNotCache: true`.
    - Saving to cache happens at the end of the workflow in case `setupOnly: true`, otherwise it happens at the end of the action execution.

The provided [samples](#samples) use [GitHub hosted runners](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/virtual-environments-for-github-hosted-runners).

Good companions are the [run-cmake](https://github.com/marketplace/actions/run-cmake) action and the
[get-cmake](https://github.com/marketplace/actions/get-cmake) actions.

 ## User Manual
 * [Contributing](#contributing)
 * [Quickstart](#quickstart)
   * [Setup vcpkg and use CMake and a vcpkg.json to install and build](#manifest)
   * [Setup vcpkg and use your own scripts](#setuponly)
   * [Flowchart](#flowchart)
 * [Best practices](#best-practices)
    * [Use vcpkg as a submodule of your repository](#use-vcpkg-as-a-submodule-of-your-repository)
    * [Use vcpkg's vcpkg.json file to specify the dependencies](#vcpkgjson)
 * [Action reference: all input/output parameters](#reference)
 * [Samples](#samples)
 * [Projects](#projects)

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md)

## <a id='quickstart'>Quickstart</a>

### <a id='manifest'>Setup vcpkg and use CMake with a vcpkg.json manifest to install dependencies and build your project</a>

It is __highly recommended__ to use both [vcpkg as a submodule](#vcpkgsubmodule) and a [vcpkg.json](#vcpkgjson) manifest file to declaratively specify the dependencies.

Both suggestions are shown in the [hosted-advanced-setup-vcpkg-manifest.yml](https://github.com/lukka/CppBuildTasks-Validation/blob/master/.github/workflows/hosted-advanced-setup-vcpkg-manifest.yml) workflow, here below an excerpt:

```yaml
jobs: 
  build:
    env:
      buildDir: '${{ github.workspace }}/build/'
    steps:
      #-uses: actions/cache@v1   <===== YOU DO NOT NEED THIS!
      
      # Install latest CMake.
      - uses: lukka/get-cmake@latest

      # Restore from cache the previously built ports. If a "cache miss" occurs, then vcpkg is bootstrapped. Since a the vcpkg.json is being used later on to install the packages when run-cmake runs, no packages are installed at this time and the input 'setupOnly:true' is mandatory.
      - name: Restore artifacts, or setup vcpkg (do not install any package)
        uses: lukka/run-vcpkg@v6
        with:
          # Just install vcpkg for now, do not install any ports in this step yet.
          setupOnly: true
          # Location of the vcpkg submodule in the Git repository.
          vcpkgDirectory: '${{ github.workspace }}/vcpkg'
          # Since the cache must be invalidated when content of the vcpkg.json file changes, let's
          # compute its hash and append this to the computed cache's key.
          appendedCacheKey: ${{ hashFiles( '**/vcpkg_manifest/vcpkg.json' ) }}
          vcpkgTriplet: ${{ matrix.triplet }}
          # Ensure the vcpkg artifacts are cached, they are generated in the 'CMAKE_BINARY_DIR/vcpkg_installed' directory.
          additionalCachedPaths: ${{ env.buildDir }}/vcpkg_installed

      - name: Run CMake to install the dependencies specified in the vcpkg.json manifest, generate project file and build the project
        uses: lukka/run-cmake@v3
        with:
          cmakeListsOrSettingsJson: CMakeListsTxtAdvanced
          cmakeListsTxtPath: '${{ github.workspace }}/vcpkg_manifest/CMakeLists.txt'
          buildDirectory: ${{ env.buildDir }}
          # This input tells run-cmake to consume the vcpkg.cmake toolchain file set by run-vcpkg.
          useVcpkgToolchainFile: true
          buildWithCMake: true
```

### <a id='setuponly'>Setup vcpkg only and use your own scripts</a>

When `setupOnly: true`, it only setups `vcpkg` without installing any port. The provisioned `vcpkg` can then be used in a subsequent step as shown:

```yaml
    # Restore from cache the previously built ports. If cache-miss, download and build vcpkg (aka "bootstrap vcpkg").
    - name: Restore from cache and install vcpkg
      # Download and build vcpkg, without installing any port. If content is cached already, it is a no-op.
      uses: lukka/run-vcpkg@v6
      with:
        setupOnly: true
    # Now that vcpkg is installed, it is being used to run with the desired arguments.
    - run: |
        $VCPKG_ROOT/vcpkg install boost:linux-x64
      shell: bash
```

### <a id='flowchart'>Flowchart</a>

![run-vcpkg flowchart](https://raw.githubusercontent.com/lukka/run-cmake-vcpkg-action-libs/main/packages/run-vcpkg-lib/docs/task-vcpkg.png
)

### <a id='reference'>Action reference: all input/output parameters</a>

[action.yml](https://github.com/lukka/run-vcpkg/blob/main/action.yml)

## Best practices

### <a id='vcpkgsubmodule'>Use **vcpkg** as a submodule of your repository</a>

When using **vcpkg**, be aware of how it works, specifically:
 - a specific version of `vcpkg` must be used either locally and on build servers;
 - a specific version of `vcpkg` is identified by the commit id of the used vcpkg repository;
 - it not possible to choose which version of a port to install, instead it is the used version of `vcpkg` that establishes which version (just one) of a port is available;

 To sum up, **you need to pin the specific version of vcpkg you want to use to keep a consistent development experience between local and remote build environments.** This is accomplished by **using vcpkg as submodule of your Git repository**; this way the version of `vcpkg` used is implied by the commit id specified by the submodule for `vcpkg`.

### <a id='vcpkgjson'>Use vcpkg's vcpkg.json file to specify the dependencies</a>

The [vcpkg.json](https://github.com/microsoft/vcpkg/blob/master/docs/specifications/manifests.md) is a manifest file that declaratively specifies the dependencies to be installed.
The file is being used automatically by running CMake when:
 - starting CMake with the `vcpkg.cmake` toolchain file.
 - the root CMake source directory contains a [vcpkg.json](https://github.com/microsoft/vcpkg/blob/master/docs/specifications/manifests.md) file.

When conditions are satisfied, the toolchain execution starts [vcpkg](https://github.com/microsoft/vcpkg) to install the packages declared in the manifest file.

 *Putting this manifest-like file under source control is highly recommended as this helps to run vcpkg the same exact way locally and remotely on the build servers.**
The dependencies specified in the vcpkg.json file are installed when CMake runs (i.e. at run-cmake time), hence the 'run-vcpkg' step must have the input `setupOnly: true`.

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

|Project|Platform(s)| |
|----------|-------|-|
|[CppOpenGLWebAssemblyCMake](https://github.com/lukka/CppOpenGLWebAssemblyCMake) | [WASM/Linux/macOS](https://github.com/lukka/CppOpenGLWebAssemblyCMake/blob/master/.github/workflows/build.yml) | [![Actions Status](https://github.com/lukka/CppOpenGLWebAssemblyCMake/workflows/hosted-wasm-macos-linux/badge.svg)](https://github.com/lukka/CppOpenGLWebAssemblyCMake/actions)
|[codehz/wine-bdlauncher](https://github.com/codehz/wine-bdlauncher) | [Windows](https://github.com/codehz/wine-bdlauncher/blob/master/.github/workflows/ci.yml) | [![CI](https://github.com/codehz/wine-bdlauncher/workflows/CI/badge.svg)](https://github.com/codehz/wine-bdlauncher/actions)
|[OPM/ResInsight](https://github.com/OPM/ResInsight/) | [Windows/Linux](https://github.com/OPM/ResInsight/blob/dev/.github/workflows/main.yml) | [![CI](https://github.com/OPM/ResInsight/workflows/ResInsight%20Build/badge.svg)](https://github.com/OPM/ResInsight/actions)
[Mudlet/Mudlet](https://github.com/Mudlet/Mudlet) | [Linux/macOS/Windows](https://github.com/Mudlet/Mudlet/blob/development/.github/workflows/build-mudlet.yml) | [![Build Mudlet](https://github.com/Mudlet/Mudlet/workflows/Build%20Mudlet/badge.svg)](https://github.com/Mudlet/Mudlet/actions)
|[otland/forgottenserver](https://github.com/otland/forgottenserver) | [Linux/macOS/Windows](https://github.com/otland/forgottenserver/blob/master/.github/workflows/build-vcpkg.yml) | [![Build with vcpkg](https://github.com/otland/forgottenserver/workflows/Build%20with%20vcpkg/badge.svg)](https://github.com/otland/forgottenserver/actions)
|[Element-0/ElementZero](https://github.com/Element-0/ElementZero) | [Windows](https://github.com/Element-0/ElementZero/blob/master/.github/workflows/ci.yml) | [![CI](https://github.com/Element-0/ElementZero/workflows/CI/badge.svg)](https://github.com/Element-0/ElementZero/actions)
|[zealdocs/zeal](https://github.com/zealdocs/zeal) | [Linux/Windows](https://github.com/zealdocs/zeal/blob/master/.github/workflows/build-check.yml) | [![Build Check](https://github.com/zealdocs/zeal/workflows/Build%20Check/badge.svg)](https://github.com/zealdocs/zeal/actions)
|[libevent/libevent](https://github.com/libevent/libevent) | [Windows](https://github.com/libevent/libevent/blob/master/.github/workflows/windows.yml)/[macos](https://github.com/libevent/libevent/blob/master/.github/workflows/macos.yml)/[Linux](https://github.com/libevent/libevent/blob/master/.github/workflows/linux.yml) | [![Windows](https://github.com/libevent/libevent/workflows/windows/badge.svg)](https://github.com/libevent/libevent/actions)[![macOS](https://github.com/libevent/libevent/workflows/macos/badge.svg)](https://github.com/libevent/libevent/actions)[![Linux](https://github.com/libevent/libevent/workflows/linux/badge.svg)](https://github.com/libevent/libevent/actions)
|[marian-nmt/marian-dev](https://github.com/marian-nmt/marian-dev) | [Windows](https://github.com/marian-nmt/marian-dev/blob/master/.github/workflows/windows.yml)/[Linux](https://github.com/marian-nmt/marian-dev/blob/master/.github/workflows/ubuntu.yml)/[macOS](https://github.com/marian-nmt/marian-dev/blob/master/.github/workflows/macos.yml)|[![Windows](https://github.com/marian-nmt/marian-dev/workflows/Windows/badge.svg)](https://github.com/marian-nmt/marian-dev/actions/) [![Linux](https://github.com/marian-nmt/marian-dev/workflows/Ubuntu/badge.svg)](https://github.com/marian-nmt/marian-dev/actions/) [![macOS](https://github.com/marian-nmt/marian-dev/workflows/MacOS/badge.svg)](https://github.com/marian-nmt/marian-dev/actions/) 
|[GrinPlusPlus](https://github.com/GrinPlusPlus/GrinPlusPlus) | [Linux/Windows/macOS](https://github.com/GrinPlusPlus/GrinPlusPlus/blob/master/.github/workflows/ci.yml) | [![ci](https://github.com/GrinPlusPlus/GrinPlusPlus/workflows/ci/badge.svg)](https://github.com/GrinPlusPlus/GrinPlusPlus/actions/)
|[OpenTDD](https://github.com/OpenTTD/OpenTTD) | [Windows/macOS](https://github.com/OpenTTD/OpenTTD/blob/master/.github/workflows/ci-build.yml) | [![CI](https://github.com/OpenTTD/OpenTTD/workflows/CI/badge.svg)](https://github.com/OpenTTD/OpenTTD/actions/)
|[scummvm](https://github.com/scummvm/scummvm) | [Windows](https://github.com/scummvm/scummvm/blob/master/.github/workflows/ci.yml) | `n/a`

# License
 All the content in this repository is licensed under the [MIT License](LICENSE.txt).

Copyright (c) 2019-2020-2021 Luca Cappa

# Donating

Other than submitting a pull request, [donating](paypal.me/lucappa) is another way to contribute to this project.
