[![Action Status](https://github.com/lukka/run-vcpkg/workflows/build-test/badge.svg)](https://github.com/lukka/run-vcpkg/actions)

[![Coverage Status](https://coveralls.io/repos/github/lukka/run-vcpkg/badge.svg?branch=main)](https://coveralls.io/github/lukka/run-vcpkg?branch=main)

- [Before using this action, consider writing a C++ CMake/vcpkg/Ninja based _pure_ workflow!](#before-using-this-action-consider-writing-a-c-cmakevcpkgninja-based-pure-workflow)
- [The **run-vcpkg@v10** action for caching artifacts and using vcpkg with manifest files on GitHub workflows](#the-run-vcpkgv10-action-for-caching-artifacts-and-using-vcpkg-with-manifest-files-on-github-workflows)
  - [Quickstart](#quickstart)
  - [Action reference: all input/output parameters](#action-reference-all-inputoutput-parameters)
  - [Flowchart](#flowchart)
  - [Best practices](#best-practices)
    - [Use **vcpkg** as a submodule of your repository](#use-vcpkg-as-a-submodule-of-your-repository)
    - [Use vcpkg's vcpkg.json file to specify the dependencies](#use-vcpkgs-vcpkgjson-file-to-specify-the-dependencies)
  - [Samples](#samples)
- [License](#license)
- [Disclaimer](#disclaimer)
- [Contributing](#contributing)

# Before using this action, consider writing a [C++ CMake/vcpkg/Ninja based _pure_ workflow](https://github.com/lukka/CppBuildTasks-Validation/blob/master/.github/workflows/hosted-pure-workflow.yml)!

A __pure__ workflow is one without using special GitHub action that you cannot run locally on your development machine, but directly using the tools (`CMake`, `Ninja`, `vcpkg`) you already use daily. 
You can read more in this issue about it: https://github.com/lukka/run-vcpkg/issues/66

# [The **run-vcpkg@v10** action for caching artifacts and using vcpkg with manifest files on GitHub workflows](https://github.com/marketplace/actions/run-vcpkg)

The **run-vcpkg** action restores from cache [vcpkg](https://github.com/microsoft/vcpkg) along with the previously installed packages, and then setup vcpkg to be run in a subsequent step. Or it runs it for you.

Special features which provide added value over a pure workflow are:
  - automatic cache management of vcpkg's artifacts by computing a cache key based (among others) on content of `vcpkg.json`.
  - automatic computation of the set of keys (primary key and secondary keys) used maximize the reuse of existing cached vcpkg's artifacts.
  - automatic dump of log files created by `CMake` (e.g., `CMakeOutput.log`) and `vcpkg`. The content of those files flow into the workflow output log. Customizable by the user.
  - automatic parsing of `CMake`, `vcpkg` and `gcc`, `clang`, `msvc` errors, reporting them contextually in the workflow summary by means of annotations.

The provided [samples](#samples) use [GitHub hosted runners](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/virtual-environments-for-github-hosted-runners).

Good companions are the [run-cmake](https://github.com/marketplace/actions/run-cmake) action and the
[get-cmake](https://github.com/marketplace/actions/get-cmake) actions.

## Quickstart

It is __highly recommended__ to use:
- [vcpkg as a submodule](#vcpkgsubmodule).
- a [vcpkg.json](#vcpkgjson) manifest file to declaratively specify the dependencies.
- a CMakePreset.json file.

```yaml
jobs:
  build:
    steps:
      #-uses: actions/cache@v1   <===== YOU DO NOT NEED THIS!

      # Install latest CMake.
      - uses: lukka/get-cmake@latest
      # Or pin to a specific CMake version:
      # lukka/get-cmake@v3.21.2

      # Restore from cache the previously built ports. If a "cache miss" occurs,
      # then vcpkg is bootstrapped. Since a the vcpkg.json is being used later on
      # to install the packages when `run-cmake` runs, no packages are installed at
      # this time.
      - name: Restore artifacts, or setup vcpkg (do not install any package)
        uses: lukka/run-vcpkg@v10 # Always specify the specific _version_ of the action you need, `v10` in this case.
        #with:
          # This is the default location of the directory containing vcpkg sources.
          # Change it to the right location if needed.
          # vcpkgDirectory: '${{ github.workspace }}/vcpkg'

          # If not using a submodule for vcpkg sources, this specifies which commit
          # id must be checkout from a Git repo. It must not set if using a submodule
          # for vcpkg.
          # vcpkgGitCommitId: '${{ matrix.vcpkgCommitId }}'

          # This is the glob expression used to locate the vpkg.json and add its
          # hash to the cache key. Change it to match a single manifest file you want
          # to use.
          # vcpkgJsonGlob: '**/vcpkg.json'

          # This is needed to run `vcpkg install` command (after vcpkg is built) in
          # the directory where vcpkg.json has been located. Default is false,
          # It is highly suggested to let `run-cmake` to run vcpkg (i.e. `false`)
          # (i.e. let CMake run `vcpkg install`) using the vcpkg.cmake toolchain.
          # runVcpkgInstall: true

      - name: Run CMake consuming CMakePreset.json and vcpkg.json by mean of vcpkg.
        uses: lukka/run-cmake@v10
        with:
          # This is the default path to the CMakeLists.txt along side the
          # CMakePresets.json. Change if you need have CMakeLists.txt and CMakePresets.json
          # located elsewhere.
          # cmakeListsTxtPath: '${{ github.workspace }}/CMakeLists.txt'

          # This is the name of the CMakePresets.json's configuration to use to generate
          # the project files. This configuration leverages the vcpkg.cmake toolchain file to
          # run vcpkg and install all dependencies specified in vcpkg.json.
          configurePreset: 'ninja-multi-vcpkg'

          # This is the name of the CMakePresets.json's configuration to build the project.
          buildPreset: 'ninja-multi-vcpkg'
```

## Action reference: all input/output parameters

Description of all input parameters: [action.yml](https://github.com/lukka/run-vcpkg/blob/main/action.yml)

## Flowchart

Flowchart with related input in [action.yml](https://github.com/lukka/run-vcpkg/blob/main/action.yml) which let customize the flow.

```
┌──────────────────────────┐
│  Compute cache key from: │   Inputs:
│  - vcpkg Git commit      │   - `appendedCacheKey`
│  - platform and OS       │   - `vcpkgGitCommitId`
│  - user provided key     │
└─────────────┬────────────┘
              │     
              ▼     
 ┌─────────────────────────┐
 │ Locate vcpkg.json.      │   Inputs:
 │ If found, add its hash  │   - `vcpkgJsonGlob`
 │ to cache key            │   _ `vcpkgJsonIgnores`
 └────────────┬────────────┘
              │     
              ▼     
 ┌─────────────────────────┐   Inputs:
 │ Restore vcpkg and       │   - `doNotCache`
 │ packages from cache     │   - `vcpkgDirectory`
 │ to cache key            │   - `binaryCachePath`
 └────────────┬────────────┘   Environment variable:
              │                - `VCPKG_DEFAULT_BINARY_CACHE`: where previous built packages 
              ▼                  are going to be restored
 ┌─────────────────────────┐
 │ If vcpkg is not a       │   Inputs:
 │ submodule, fetch it     │   - `vcpkgGitCommitId`
 │                         │   - `vcpkgGitURL`
 └────────────┬────────────┘   - `doNotUpdateVcpkg`
              │                - `vcpkgDirectory`
              ▼     
 ┌─────────────────────────┐
 │ Rebuild vcpkg executable│   Inputs:
 │ if not in sync with     │   - `vcpkgGitCommitId`
 │ sources                 │   - `vcpkgGitURL`
 └────────────┬────────────┘
              │     
              ▼     
  <Is `runVcpkgInstall:true`>┐    Inputs:
          ────┬────        No│   - `runVcpkgInstall`
              │ Yes          │
              ▼              │
 ┌─────────────────────────┐ │
 │ Launch `vcpkg install`  │ │   Inputs:
 │ where vcpkg.json has    │ │   - `runVcpkgFormatString`
 │ been located            │ │   Environment variables: 
 └────────────┬────────────┘ │   - `VCPKG_DEFAULT_TRIPLET` is used. If not yet
              │              │     set, it is set to the current platform.
              ▼              │
 ┌─────────────────────────┐ │
 │ Set `VCPKG_ROOT` and    │ │   
 │ `VCPKG_DEFAULT_TRIPLET` │ │   
 │ workflow-wide env vars  │ │   
 └────────────┬────────────┘ │
              ├───────────── ┘
              ▼     
 ┌───────────────────────────┐
 │ Schedule this step at     │
 │ end of the workflow:      │
 │┌─────────────────────────┐│
 │| If no cache-hit,        ││  Inputs:
 ││ store `VCPKG_ROOT` and  ││  - `binaryCachePath`
 ││ binary packages in cache││  - `doNotCache`
 │└────────────┬────────────┘│  - `doNotCacheOnWorkflowFailure`
 └────────────┬──────────────┘
              ▼     
              ⬬
```


## Best practices

### Use **vcpkg** as a submodule of your repository

 **It is highly suggested to pin the specific version of vcpkg you want to use to keep a consistent development experience between local and remote build environments.** This is accomplished by **using vcpkg as submodule of your Git repository**; this way the version of `vcpkg` used is implied by the commit id specified by the submodule for `vcpkg`.

### Use vcpkg's vcpkg.json file to specify the dependencies

The [vcpkg.json](https://github.com/microsoft/vcpkg/blob/master/docs/specifications/manifests.md) is a manifest file that declaratively specifies the dependencies to be installed.
The file is being used automatically by running CMake (e.g. by using [run-cmake](https://github.com/lukka/run-cmake)) when:
 - starting CMake with the `vcpkg.cmake` toolchain file.
 - the root CMake source directory contains a [vcpkg.json](https://github.com/microsoft/vcpkg/blob/master/docs/specifications/manifests.md) file.

Or it can also be used by invoking `vcpkg install` in a directory where `vcpkg.json` is located (e.g., input `runVcpkgInstall : true`).

When conditions are satisfied, the toolchain execution starts [vcpkg](https://github.com/microsoft/vcpkg) to install the packages declared in the manifest file.

 *Putting this manifest-like file under source control is highly recommended as this helps to run vcpkg the same exact way locally and remotely on the build servers.**
The dependencies specified in the vcpkg.json file are installed when CMake runs (i.e. at `run-cmake` execution time).

## Samples

|Sample scenario|Notes|
|:-:|:-:|
|[vcpkg as submodule, CMake with vcpkg toolchain in a CMakePreset.json configuration](https://github.com/lukka/CppBuildTasks-Validation/blob/v10/.github/workflows/hosted-ninja-vcpkg_submod.yml)| Uses `CMake`, `Ninja` and `vcpkg`|
|[vcpkg NOT as submodule, CMake with vcpkg toolchain in a CMakePreset.json configuration](https://github.com/lukka/CppBuildTasks-Validation/blob/v10/.github/workflows/hosted-ninja-vcpkg_submod.yml)|Uses `CMake`, `Ninja` and `vcpkg`|
|[`run-vcpkg` runs 'vcpkg install'](https://github.com/lukka/CppBuildTasks-Validation/blob/v10/.github/workflows/hosted-ninja-vcpkg-install.yml)|Uses `CMake`, `Ninja` and `vcpkg`|
<br>

# License

All the content in this repository is licensed under the [MIT License](LICENSE.txt).

Copyright © 2019-2020-2021 Luca Cappa

# Disclaimer

The software is provided as is, there is no warranty of any kind. All users are encouraged to improve the [source code](https://github.com/lukka/run-vcpkg) with fixes and new features.

# Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md)
