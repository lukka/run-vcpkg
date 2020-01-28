[![Action Status](https://github.com/lukka/run-vcpkg/workflows/build/badge.svg)](https://github.com/lukka/run-vcpkg/actions)

# [The **run-vcpkg** action for using vcpkg on GitHub](https://github.com/marketplace/actions/run-vcpkg)

Build C++ software with the multi-platform **run-vcpkg** action, that runs [vcpkg](https://github.com/microsoft/vcpkg) on GitHub workflows. Samples provided use [GitHub hosted runners](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/virtual-environments-for-github-hosted-runners) and [Caching](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/caching-dependencies-to-speed-up-workflows).

A good companion is the [run-cmake](https://github.com/marketplace/actions/run-cmake) action.

 ## User Manual
 * [The <strong>run-vcpkg</strong> action](#run-vcpkg)
 * [Action reference: all input/output parameters](#reference)
 * [Samples](#samples)

 ## Developer Manual
 * [Developers information](#developers-information)
   * [Prerequisites](#prerequisites)
   * [Packaging](#packaging)
   * [Testing](#testing)
  * [Contributing](#contributing)
  * [License](#license)

## <a id='run-vcpkg'>The ***run-vcpkg*** action</a>

This action behaves the same way as it does the [run-vcpkg](https://marketplace.visualstudio.com/items?itemName=lucappa.cmake-ninja-vcpkg-tasks) task for Azure DevOps.

The documentation of the **'run-vcpkg"** action is identical to the [**'run-vcpkg'** task's one](https://github.com/lukka/CppBuildTasks/blob/master/README.md#runvcpkg
) for Azure DevOps.

### <a id='reference'>Action reference: all input/output parameters</a>

[action.yml](https://github.com/lukka/run-vcpkg/blob/v0/action.yml)

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

To build, pack and test:
 
 > npm run test

 To run test directly:
 
 > jest

[Smoke tests](https://en.wikipedia.org/wiki/Smoke_testing_(software)) are implemented in this repository, which tun the action on all platforms.

Rigorous tests are executed in the builds of [CppBuildTasks](https://github.com/lukka/CppBuildTasks/) repository that shares the same engine in the [run-cmake-vcpkg-action-libs](https://github.com/lukka/run-cmake-vcpkg-action-libs) submodule.

It would be desirable to have extensive tests implemented in this repository as well.


Validation tests on various scenarios are run using the workflows of the [Samples](#samples).

## <a id='contributing'>Contributing</a>

The software is provided as is, there is no warranty of any kind. All users are encouraged to improve the [source code](https://github.com/lukka/run-vcpkg) with fixes and new features.

# License
All the content in this repository is licensed under the [MIT License](LICENSE.txt).

Copyright (c) 2019-2020 Luca Cappa
