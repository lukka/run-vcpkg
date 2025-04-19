[![Action Status](https://github.com/lukka/run-vcpkg/workflows/build-test/badge.svg)](https://github.com/lukka/run-vcpkg/actions)

[![Coverage Status](https://coveralls.io/repos/github/lukka/run-vcpkg/badge.svg?branch=main)](https://coveralls.io/github/lukka/run-vcpkg?branch=main)

- [Important: **run-vcpkg@v11 requirements**](#important-run-vcpkgv11-requirements)
- [Quickstart with a C++ project template](#quickstart-with-a-c-project-template)
- [The **run-vcpkg@v11** action](#the-run-vcpkgv11-action)
  - [Quickstart with instructions](#quickstart-with-instructions)
  - [Action reference: all input/output parameters](#action-reference-all-inputoutput-parameters)
  - [Flowchart](#flowchart)
  - [Best practices](#best-practices)
    - [Use **vcpkg** as a submodule of your repository](#use-vcpkg-as-a-submodule-of-your-repository)
    - [Use vcpkg's vcpkg.json file to specify the dependencies](#use-vcpkgs-vcpkgjson-file-to-specify-the-dependencies)
    - [Usage of github.workspace in multi platform workflows](#usage-of-githubworkspace-in-multi-platform-workflows)
  - [Samples](#samples)
  - [Who is using `run-vcpkg`](#who-is-using-run-vcpkg)
- [License](#license)
- [Disclaimer](#disclaimer)
- [Contributing](#contributing)

# Important: **run-vcpkg@v11 requirements**

`run-vcpkg@v11` requires vcpkg more recent than 2023-03-29 (e.g. commit id `5b1214315250939257ef5d62ecdcbca18cf4fb1c`).

# Quickstart with a C++ project template

Take a look at this [C++ project template](https://github.com/lukka/CppCMakeVcpkgTemplate/tree/v11) that applies all the following instructions, but also shows how to create a __pure__ workflow without using special GitHub action that you cannot run locally on your development machine, but directly using the tools (`CMake`, `Ninja`, `vcpkg`, `C++` compilers) you already use daily.

# [The **run-vcpkg@v11** action](https://github.com/marketplace/actions/run-vcpkg)

The **run-vcpkg@v11** action setups (and optionally runs) [vcpkg](https://github.com/microsoft/vcpkg) to install the packages specified in the `vcpkg.json` manifest file.
It leverages the vcpkg's [Binary Caching](https://learn.microsoft.com/en-us/vcpkg/users/binarycaching) backed to [GitHub Action cache](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows), delegating cache and key management to vpckg.

Special features which provide added value over a __pure__ workflow are:
  - automatic caching leveraging `vcpkg`'s ability to store its [Binary Caching](https://learn.microsoft.com/en-us/vcpkg/users/binarycaching) artifacts onto the [GitHub Action cache](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows) so that packages are built only once and reused in subsequent workflow runs. The user can customize the behavior by setting the environment variable `VCPKG_BINARY_SOURCES` *before* vcpkg runs.
  - automatic dump of log files created by `CMake` (e.g., `CMakeOutput.log`) and `vcpkg`. The content of those files flow into the workflow output log. Customizable by the user by setting the input `logCollectionRegExps`.
  - automatic parsing of `CMake`, `vcpkg` and `gcc`, `clang`, `msvc` errors, reporting them contextually in the workflow summary by means of annotations.
  - although disabled by default (see input `doNotCache`), `run-vcpkg` can cache vcpkg's executable and data files to speed up subsequent workflow runs. Since bootstrapping `vcpkg` already downloads a prebuilt binary saving the time to build `vcpkg`,
  this form of caching is useful only when the prebuilt executable is not served as it happens for the ARM platform.
  Note this cache does not contain the libraries built by vcpkg, which is instead managed by vcpkg itself.

The provided [samples](#samples) use [GitHub hosted runners](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/virtual-environments-for-github-hosted-runners).

Good companions are the [run-cmake](https://github.com/marketplace/actions/run-cmake) and the
[get-cmake](https://github.com/marketplace/actions/get-cmake) actions.

<br>

## Quickstart with instructions

It is __highly recommended__ to use:
- [vcpkg as a submodule](#use-vcpkg-as-a-submodule-of-your-repository).
- a [vcpkg.json](#use-vcpkgs-vcpkgjson-file-to-specify-the-dependencies) manifest file to declaratively specify the dependencies.
- a `CMakePresets.json` file.

```yaml
jobs:
  build:
    steps:
      #-uses: actions/cache@v3   <===== YOU DO NOT NEED THIS!

      # Install latest CMake and Ninja.
      - uses: lukka/get-cmake@latest
      # Or pin to a specific CMake version:
      # lukka/get-cmake@v3.27

      # Setup vcpkg: ensures vcpkg is downloaded and built.
      # Since vcpkg.json is being used later on to install the packages
      # when `run-cmake` runs, no packages are installed at this time
      # (and vcpkg does not run).
      - name: Setup anew (or from cache) vcpkg (and does not build any package)
        uses: lukka/run-vcpkg@v11 # Always specify the specific _version_ of the
                                  # action you need, `v11` in this case to stay up
                                  # to date with fixes on the v11 branch.
        #with:
          # This is the default location of the directory containing vcpkg sources.
          # Change it to the right location if needed.
          # vcpkgDirectory: '${{ github.workspace }}/vcpkg'

          # If not using a Git submodule for vcpkg sources, this input
          # specifies which commit id to checkout from a Git repo.
          # Notes: 
          # - it must _not_ be set if using a Git submodule for vcpkg.
          # - if not provided, the `vcpkgConfigurationJsonGlob` or `vcpkgJsonGlob`
          #   are being used to locate either a vcpkg-configuration.json or vcpkg.json
          #   in order to use the builtin-baseline or the default-registry's
          #   builtin baseline.
          # vcpkgGitCommitId: '${{ matrix.vcpkgCommitId }}'

          # This is only needed if the command `vcpkg install` must run at this step.
          # Instead it is highly suggested to let `run-cmake` to run vcpkg later on
          # using the vcpkg.cmake toolchain. The default is `false`.
          # runVcpkgInstall: true

          # This is only needed if `runVpkgInstall` is `true`.
          # This glob expression used to locate the vcpkg.json and  use
          # its directory location as `working directory` when running `vcpkg install`.
          # Change it to match a single manifest file you want to use.
          # Note: do not use `${{ github.context }}` to compose the value as it
          # contains backslashes that would be misinterpreted. Instead
          # compose a value relative to the root of the repository using
          # `**/path/from/root/of/repo/to/vcpkg.json` to match the desired `vcpkg.json`.
          # vcpkgJsonGlob: '**/vcpkg.json'

      - name: Run CMake consuming CMakePreset.json and run vcpkg to build packages
        uses: lukka/run-cmake@v10
        with:
          # This is the default path to the CMakeLists.txt along side the
          # CMakePresets.json. Change if you need have CMakeLists.txt and CMakePresets.json
          # located elsewhere.
          # cmakeListsTxtPath: '${{ github.workspace }}/CMakeLists.txt'

          # You could use CMake workflow presets defined in the CMakePresets.json
          # with just this line below. Note this one cannot be used with any other
          # preset input, it is mutually exclusive.
          # workflowPreset: 'workflow-name'

          # This is the name of the CMakePresets.json's configuration to use to generate
          # the project files. This configuration leverages the vcpkg.cmake toolchain file to
          # run vcpkg and install all dependencies specified in vcpkg.json.
          configurePreset: 'ninja-multi-vcpkg'
          # Additional arguments can be appended to the cmake command.
          # This is useful to reduce the number of CMake's Presets since you can reuse
          # an existing preset with different variables.
          configurePresetAdditionalArgs: "['-DENABLE_YOUR_FEATURE=1']"

          # This is the name of the CMakePresets.json's configuration to build the project.
          buildPreset: 'ninja-multi-vcpkg'
          # Additional arguments can be appended when building, for example to specify the
          # configuration to build.
          # This is useful to reduce the number of CMake's Presets you need in CMakePresets.json.
          buildPresetAdditionalArgs: "['--config Release']"

          # This is the name of the CMakePresets.json's configuration to test the project with.
          testPreset: 'ninja-multi-vcpkg'
          # Additional arguments can be appended when testing, for example to specify the config
          # to test.
          # This is useful to reduce the number of CMake's Presets you need in CMakePresets.json.
          testPresetAdditionalArgs: "['--config Release']"

    #env:
    #  [OPTIONAL] Define the vcpkg's triplet you want to enforce, otherwise the default one
    #  for the hosting system will be automatically choosen (x64 is the default on all
    #  platforms, e.g. `x64-osx`).
    #  VCPKG_DEFAULT_TRIPLET: ${{ matrix.triplet }}
    #
    #  [OPTIONAL] If VCPKG_DEFAULT_TRIPLET is defined then it may also be desirable to set the host
    #  triplet to avoid unintended cross compiling behavior.
    #  VCPKG_DEFAULT_HOST_TRIPLET: ${{ matrix.triplet }}
    #
    #  [OPTIONAL] By default the action disables vcpkg's telemetry by defining VCPKG_DISABLE_METRICS.
    #  This behavior can be disabled by defining `VCPKG_ENABLE_METRICS` as follows.
    #  VCPKG_ENABLE_METRICS: 1
    #
```

<br>

## Action reference: all input/output parameters

Description of all input parameters: [action.yml](https://github.com/lukka/run-vcpkg/blob/main/action.yml)

<br>

## Flowchart

Flowchart with related input in [action.yml](https://github.com/lukka/run-vcpkg/blob/main/action.yml) which let customize the flow.

```
┌──────────────────────────┐
|  If running in GH Runner,|   Environment variables:
|  set the env vars:       |   - If any env var is already defined
|  - VCPKG_BINARY_SOURCES  |     it won't be overidden. 
└─────────────┬────────────┘
              ▼
┌──────────────────────────┐
|  Skipped by default.     |
│  Compute cache key from: │   Inputs:
│  - vcpkg Git commit      │   - `vcpkgGitCommitId`
│  - platform and OS       │   - `doNotCache`: set to false
└─────────────┬────────────┘     to run this block.
              ▼
 ┌─────────────────────────┐   Inputs:
 | Skipped by default.     |   - `vcpkgDirectory`
 │ Restore vcpkg           │   - `doNotCache`: set to false
 │ from the GH cache.      │     to run this block.
 └────────────┬────────────┘
              ▼
 ┌────────────────────────────┐   Inputs:
 │ If vcpkg is not a          │   - `vcpkgDirectory`
 │ submodule, fetch it.       │   - `vcpkgGitCommitId` 
 │ Use either the provided    │   - `vcpkgGitURL`
 │ commit id or the default   │   - `doNotUpdateVcpkg`
 │ registry baseline in       │   - `vcpkgConfigurationJsonGlob`
 │ vcpkg-configuration.json   │   - `vcpkgJsonGlob`
 │ or vcpkg.json.             │   Environment variables:
 └────────────┬───────────────┘   - VCPKG_CONFIGURATION_JSON_IGNORE_PATTERNS:
              ▼                     semicolon separated ignore patterns.
 ┌─────────────────────────┐
 │ Rebuild vcpkg executable│   Inputs:
 │ if not in sync with     │   - `vcpkgGitCommitId`
 │ sources.                │   - `vcpkgGitURL`
 └────────────┬────────────┘
              ▼
  <Is `runVcpkgInstall:true`>┐    Inputs:
          ────┬────        No│   - `runVcpkgInstall`
              │ Yes          │
              ▼              │
 ┌─────────────────────────┐ │  Inputs:
 │ Locate vcpkg.json.      │ │  - `vcpkgJsonGlob`
 └────────────┬────────────┘ │  - `vcpkgJsonIgnores`
              ▼              │
 ┌─────────────────────────┐ │
 │ Launch `vcpkg install`  │ │   Inputs:
 │ where vcpkg.json has    │ │   - `runVcpkgFormatString`
 │ been located.           │ │   Environment variables:
 └────────────┬────────────┘ │   - `VCPKG_DEFAULT_TRIPLET` is used. If not yet
              │              │     set, it is set to the current platform.
              │              │   - `VCPKG_INSTALLED_DIR` is used as value for
              │              │     `--x-install-root` when running `vcpkg install`.
              │              │     Check out the `runVcpkgFormatString` input.
              ▼              │   - `VCPKG_BINARY_SOURCES` is used. If not yet
 ┌─────────────────────────┐ │      set, it is set to leverage the GitHub Action
 │ Set `VCPKG_ROOT` and    │ │      cache storage for Binary Caching artifacts.
 │ `VCPKG_DEFAULT_TRIPLET` │ │
 │ workflow-wide env vars. │ │
 └────────────┬────────────┘ │
              ├───────────── ┘
              ▼
 ┌─────────────────────────┐
 | Skipped by default.     |
 │ If no cache-hit,        │  Inputs:
 │ store vcpkg onto        │  - `doNotCache`: set to false to
 │ GH cache.               │    run this block.
 └────────────┬────────────┘
              |
              ▼
              ⬬
```

<br>

## Best practices

### Use **vcpkg** as a submodule of your repository

 **It is highly suggested to pin the specific version of vcpkg you want to use to keep a consistent development experience between local and remote build environments.** This is accomplished by **using vcpkg as submodule of your Git repository**; this way the version of `vcpkg` used is implied by the commit id specified by the submodule for `vcpkg`.

### Use vcpkg's vcpkg.json file to specify the dependencies

The [vcpkg.json](https://learn.microsoft.com/en-us/vcpkg/reference/vcpkg-json) is a manifest file that declaratively specifies the dependencies to be installed.
The file is being used automatically by running CMake (e.g. by using [run-cmake](https://github.com/lukka/run-cmake)) when:
 - starting CMake with the `vcpkg.cmake` toolchain file.
 - the root CMake source directory contains a [vcpkg.json](https://learn.microsoft.com/en-us/vcpkg/reference/vcpkg-json) file.

Or it can also be used by invoking `vcpkg install` in a directory where `vcpkg.json` is located (e.g., input `runVcpkgInstall : true`).

When conditions are satisfied, the toolchain execution starts [vcpkg](https://github.com/microsoft/vcpkg) to install the packages declared in the manifest file.

 **Putting this manifest-like file under source control is highly recommended as this helps to run vcpkg the same exact way locally and remotely on the build servers.**
The dependencies specified in the vcpkg.json file are installed when CMake runs (i.e. at `run-cmake` execution time).

### Usage of github.workspace in multi platform workflows

Using `github.workspace` may be challenging since it contains backslashes on Windows which are interpreted as escape sequences when used as base path of additional arguments. To work around this, you could use the `String.raw` function which prevents the escape sequences from being processed, e.g.:

```yaml
  with:
    configurePresetAdditionalArgs: "[ String.raw`-DD3D9_INCLUDE_DIR=${{ github.workspace }}/cache/Include` ]"
````

## Samples

_Checkmarks_ indicates whether the samples "uses" or specifies the thing in the header or whether it is true.

| workflow link                                                                                                              | `vcpkg` as submodule | explicit triplet | `vcpkg` toolchain | `CMake`'s Presets | `Ninja` | `run-vcpkg` runs vcpkg | `CMake` runs `vcpkg` |
| :------------------------------------------------------------------------------------------------------------------------- | :------------------: | :--------------: | :---------------: | :---------------: | :-----: | :--------------------: | :------------------: |
| [link](https://github.com/lukka/CppBuildTasks-Validation/blob/v10/.github/workflows/hosted-ninja-vcpkg_submod.yml)         |          ✅           |        ❌         |         ✅         |         ✅         |    ✅    |           ❌            |          ✅           |
| [link](https://github.com/lukka/CppBuildTasks-Validation/blob/v10/.github/workflows/hosted-ninja-vcpkg.yml)                |          ❌           |        ❌         |         ✅         |         ✅         |    ✅    |           ❌            |          ✅           |
| [link](https://github.com/lukka/CppBuildTasks-Validation/blob/v10/.github/workflows/hosted-ninja-vcpkg-install.yml)        |          ❌           |        ❌         |         ✅         |         ✅         |    ✅    |           ✅            |          ❌           |
| [link](https://github.com/lukka/CppBuildTasks-Validation/blob/v10/.github/workflows/hosted-ninja-vcpkg_submod-triplet.yml) |          ✅           |        ✅         |         ✅         |         ✅         |    ✅    |           ❌            |          ✅           |

<br>

## Who is using `run-vcpkg`

[This graph](https://lukka.github.io/graph/graph.html) shows the list of public repositories with more than 25 stars using `run-vcpkg`.

<br>

# License

All the content in this repository is licensed under the [MIT License](LICENSE.txt).

Copyright © 2019-2020-2021-2022-2023-2024-2025 Luca Cappa

<br>

# Disclaimer

The software is provided as is, there is no warranty of any kind. All users are encouraged to improve the [source code](https://github.com/lukka/run-vcpkg) with fixes and new features.

<br>

# Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md)
