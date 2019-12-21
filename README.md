[![Action Status](https://github.com/lukka/run-vcpkg/workflows/build/badge.svg)](https://github.com/lukka/run-vcpkg/actions)

# [GitHub Action for vcpkg](https://marketplace.github.com/run-vcpkg)

 ## User Manual
 * [Introduction](#intro)
 * [The <strong>run-vpkg</strong> action](#run-vcpkg)
 * [Action reference: all input/output parameters](#reference)
 * [Samples](#samples)

 ## Developer Manual
 * [Developers information](#developers-information)
   * [Prerequisites](#prerequisites)
   * [Packaging](#packaging)
   * [Testing](#testing)
  * [Contributing](#contributing)
  * [License](#license)

## <a id='intro'>Introduction</a>

Build C++ software with [vcpkg](https://github.com/microsoft/vcpkg). Samples provided use [GitHub hosted runners](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/virtual-environments-for-github-hosted-runners), [Caching](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/caching-dependencies-to-speed-up-workflows).

## <a id='run-vcpkg'>The ***run-vcpkg*** action</a>

The documentation of the **'run-vcpkg"** action is identical to the [**'run-vcpkg'** task's one](https://github.com/lukka/CppBuildTasks/blob/master/README.md#runvcpkg
) for Azure DevOps.

### <a id='reference'>Action reference: all input/output parameters</a>

[action.yml](https://github.com/lukka/run-vcpkg/action.yml)

## <a id="samples">Samples</a>

[View the workflows based on the run-cmake and run-vcpkg actions](https://github.com/lukka/CppBuildTasks-Validation/actions).

|CMakeLists.txt samples | |
|----------|-------|
[Linux/macOS/Windows, hosted runner, basic](https://github.com/lukka/CppBuildTasks-Validation/blob/master/.github/workflows/hosted-basic.yml)| [![Actions Status](https://github.com/lukka/CppBuildTasks-Validation/workflows/hosted-basic/badge.svg)](https://github.com/lukka/CppBuildTasks-Validation/actions)
[Linux/macOS/Windows, hosted runner, advanced](https://github.com/lukka/CppBuildTasks-Validation/blob/master/.github/workflows/hosted-advanced.yml)| [![Actions Status](https://github.com/lukka/CppBuildTasks-Validation/workflows/hosted-advanced/badge.svg)](https://github.com/lukka/CppBuildTasks-Validation/actions)
[Linux/macOS/Windows, hosted runner, with cache and vcpkg as submodule](https://github.com/lukka/CppBuildTasks-Validation/blob/master/.github/workflows/hosted-basic-cache-submod_vcpkg.yml)| [![Actions Status](https://github.com/lukka/CppBuildTasks-Validation/workflows/hosted-basic-cache-submod_vcpkg/badge.svg)](https://github.com/lukka/CppBuildTasks-Validation/actions)

|CMakeSettings.json samples | |
|----------|-------|
[Linux/macOS/Windows, hosted runner, with cache and vcpkg as submodule](https://github.com/lukka/CppBuildTasks-Validation/blob/master/.github/workflows/hosted-cmakesettingsjson-cache-submod_vcpkg.yml)| [![Actions Status](https://github.com/lukka/CppBuildTasks-Validation/workflows/hosted-cmakesettingsjson-cache-submod_vcpkg/badge.svg)](https://github.com/lukka/CppBuildTasks-Validation/actions)

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

No unit test are available in [run-vcpkg](https://github.com/lukka/run-vcpkg) repository.

All unit testing is executed in the [CppBuildTasks](https://github.com/lukka/CppBuildTasks/) repository that share the core functionality in the [shared Git submodule](https://github.com/lukka/run-cmake-vcpkg-action-libs).

It is desirable to have unit tests implemented in this repository as well.

Smoke tests are run using the [Samples](#samples).

## <a id='contributing'>Contributing</a>

The software is provided as is, there is no warranty of any kind. All users are encouraged to improve the [source code](https://github.com/lukka/run-vcpkg) with fixes and new features.

# License
All the content in this repository, of the extension and of the 'run-cmake' and 'run-vcpkg' tasks are licensed under the [MIT License](LICENSE.txt).

Copyright (c) 2019 Luca Cappa
