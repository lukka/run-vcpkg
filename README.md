[![Action Status](https://github.com/lukka/run-vcpkg/workflows/build-test/badge.svg)](https://github.com/lukka/run-vcpkg/actions)

[![Coverage Status](https://coveralls.io/repos/github/lukka/run-vcpkg/badge.svg?branch=main)](https://coveralls.io/github/lukka/run-vcpkg?branch=main)

# [The **run-vcpkg** action for caching artifacts and using vcpkg on GitHub](https://github.com/marketplace/actions/run-vcpkg)

The **run-vcpkg** action restores from cache [vcpkg](https://github.com/microsoft/vcpkg) along with the previously installed ports. Briefly:
 - If there is a cache miss, vpckg is fetched and installed; the cache's key is composed by hashing the hosting OS name, the command line arguments and the vcpkg's commit id.
    - Restoring from cache can be skipped with `doNotCache:true`.
 - Then `vcpkg` is run to install the desired ports. This is a no-op if artifacts are already restored. 
    - This step can be skipped with `setupOnly:true`.
 - Artifacts and vcpkg are then saved in cache (if it was a 'cache miss').
    - Saving to cache can be skipped with `doNotCache:true`.

The provided [samples](#samples) use [GitHub hosted runners](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/virtual-environments-for-github-hosted-runners).

Good companions are the [run-cmake](https://github.com/marketplace/actions/run-cmake) action and the
[get-cmake](https://github.com/marketplace/actions/get-cmake) actions.

 ## User Manual
 * [Contributing](#contributing)
 * [Quickstart](#quickstart)
   * [Restore cache/install/create cache](#install)
   * [Restore cache/do not install/create cache](#setuponly)
   * [Flowchart](#flowchart)
 * [Best practices](#best-practices)
    * [Use vcpkg as a submodule of your repository](#use-vcpkg-as-a-submodule-of-your-repository)
    * [Use vcpkg's response file as an argument](#use-vcpkgs-response-file-as-an-argument)
 * [Action reference: all input/output parameters](#reference)
 * [Samples](#samples)
 * [Projects](#projects)

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md)

## <a id='quickstart'>Quickstart</a>

### <a id='install'>Setup vcpkg and install ports</a>

It is __highly recommended__ to [use vcpkg as a submodule](#best-practices). Here below the sample where vcpkg is a Git submodule:

```yaml
  # Sample when vcpkg is a submodule of your repository (highly recommended!)

    #-uses: actions/cache@v1   <===== YOU DO NOT NEED THIS!

    # Install latest CMake.
    - uses: lukka/get-cmake@latest

    # Restore from cache the previously built ports. If "cache miss", then provision vcpkg, install desired ports, finally cache everything for the next run.
    - name: Restore from cache and run vcpkg
      uses: lukka/run-vcpkg@v5
      with:
        # Response file stored in source control, it provides the list of ports and triplet(s).
        vcpkgArguments: '@${{ env.vcpkgResponseFile }}'
        # Location of the vcpkg as submodule of the repository.
        vcpkgDirectory: '${{ github.workspace }}/vcpkg'
        # Since the cache must be invalidated when content of the response file changes, let's
        # compute its hash and append this to the computed cache's key.
        appendedCacheKey: ${{ hashFiles(env.vcpkgResponseFile) }}

    - name: 'Build with CMake and Ninja'
      uses: lukka/run-cmake@v3
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
      uses: lukka/run-vcpkg@v5
      with:
        setupOnly: true
    # Now that vcpkg is installed, it is being used to run desired arguments.
    - run: |
        $VCPKG_ROOT/vcpkg @$vcpkgResponseFile
        $VCPKG_ROOT/vcpkg install boost:linux-x64
      shell: bash
```

### <a id='flowchart'>Flowchart</a>

![run-vcpkg flowchart](https://raw.githubusercontent.com/lukka/run-cmake-vcpkg-action-libs/main/packages/run-vcpkg-lib/docs/task-vcpkg.png
)

### <a id='reference'>Action reference: all input/output parameters</a>

[action.yml](https://github.com/lukka/run-vcpkg/blob/main/action.yml)

## Best practices

### Use **vcpkg** as a submodule of your repository ###

When using **vcpkg**, be aware of how it works, specifically:
 - a specific version of vcpkg must be used either locally and on build servers;
 - a specific version of vcpkg is identified by the commit id of the used vcpkg repository;
 - it not possible to choose which version of a port to install, instead it is the used version of vcpkg that establishes which version (just one) of a port is available;

 To sum up, **you need to pin the specific version of vcpkg you want to use to keep a consistent development experience between local and remote build environments.** This is accomplished by **using vcpkg as submodule of your Git repository**; this way the version of vcpkg used is implied by the commit id specified by the submodule for vcpkg.

### Use vcpkg's response file as an argument

vcpkg accepts a response file that contains the arguments, suitable to store the list of ports to be installed. **It is useful to store the response file under source control, this helps to run vcpkg the same exact way locally and remotely on the build servers.** For example if you want to run:

 > vcpkg install boost zlib:x64 libmodbus --triplet x64

it is instead possible to run

 > vcpkg install @response_file.txt

 where `response_file.txt` contains (with no trailing whitespaces allowed):

```yaml
   boost
   zlib:x64
   libmodbus
   --triplet
   x64
```

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
[Mudlet/Mudlet](https://github.com/Mudlet/Mudlet) | [Linux/macOS](https://github.com/Mudlet/Mudlet/blob/development/.github/workflows/build-mudlet.yml) | [![Build Mudlet](https://github.com/Mudlet/Mudlet/workflows/Build%20Mudlet/badge.svg)](https://github.com/Mudlet/Mudlet/actions)
|[otland/forgottenserver](https://github.com/otland/forgottenserver) | [Linux/macOS/Windows](https://github.com/otland/forgottenserver/blob/master/.github/workflows/build-vcpkg.yml) | [![Build with vcpkg](https://github.com/otland/forgottenserver/workflows/Build%20with%20vcpkg/badge.svg)](https://github.com/otland/forgottenserver/actions)
|[Element-0/ElementZero](https://github.com/Element-0/ElementZero) | [Windows](https://github.com/Element-0/ElementZero/blob/master/.github/workflows/ci.yml) | [![CI](https://github.com/Element-0/ElementZero/workflows/CI/badge.svg)](https://github.com/Element-0/ElementZero/actions)
|[zealdocs/zeal](https://github.com/zealdocs/zeal) | [Linux/Windows](https://github.com/zealdocs/zeal/blob/master/.github/workflows/build-check.yml) | [![Build Check](https://github.com/zealdocs/zeal/workflows/Build%20Check/badge.svg)](https://github.com/zealdocs/zeal/actions)
|[libevent/libevent](https://github.com/libevent/libevent) | [Windows](https://github.com/libevent/libevent/blob/master/.github/workflows/windows.yml)/[macos](https://github.com/libevent/libevent/blob/master/.github/workflows/macos.yml)/[Linux](https://github.com/libevent/libevent/blob/master/.github/workflows/linux.yml) | [![Windows](https://github.com/libevent/libevent/workflows/windows/badge.svg)](https://github.com/libevent/libevent/actions)[![macOS](https://github.com/libevent/libevent/workflows/macos/badge.svg)](https://github.com/libevent/libevent/actions)[![Linux](https://github.com/libevent/libevent/workflows/linux/badge.svg)](https://github.com/libevent/libevent/actions)
|[marian-nmt/marian-dev](https://github.com/marian-nmt/marian-dev) | [Windows](https://github.com/marian-nmt/marian-dev/blob/master/.github/workflows/windows.yml)/[Linux](https://github.com/marian-nmt/marian-dev/blob/master/.github/workflows/ubuntu.yml)/[macOS](https://github.com/marian-nmt/marian-dev/blob/master/.github/workflows/macos.yml)|[![Windows](https://github.com/marian-nmt/marian-dev/workflows/Windows/badge.svg)](https://github.com/marian-nmt/marian-dev/actions/) [![Linux](https://github.com/marian-nmt/marian-dev/workflows/Ubuntu/badge.svg)](https://github.com/marian-nmt/marian-dev/actions/) [![macOS](https://github.com/marian-nmt/marian-dev/workflows/MacOS/badge.svg)](https://github.com/marian-nmt/marian-dev/actions/) 
|[GrinPlusPlus](https://github.com/GrinPlusPlus/GrinPlusPlus) | [Linux/Windows/macOS](https://github.com/GrinPlusPlus/GrinPlusPlus/blob/master/.github/workflows/ci.yml) | [![ci](https://github.com/GrinPlusPlus/GrinPlusPlus/workflows/ci/badge.svg)](https://github.com/GrinPlusPlus/GrinPlusPlus/actions/)

# License
 All the content in this repository is licensed under the [MIT License](LICENSE.txt).

Copyright (c) 2019-2020 Luca Cappa

# Donating

Other than submitting a pull request, [donating](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=EGNDRPRXM62G2&source=url) is another way to contribute to this project.
