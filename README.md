[![Action Status](https://github.com/lukka/run-vcpkg/workflows/build/badge.svg)](https://github.com/lukka/run-vcpkg/actions)

# [GitHub Action for vcpkg](https://marketplace.github.com/items?itemName=lucappa.cmake-ninja-vcpkg-tasks)

 ## User Manual
 * [Introduction](#intro)
 * [Quickstart](#quickstart)
 * [The <strong>run-vpkg</strong> action](#run-vcpkg)
 * [Tasks reference: all input parameters](#reference)
 * [Samples](#samples)
 * [Real world project samples](#realworldprojects)
 * [Q&As](#faqs)

 ## Developer Manual
 * [Developers information](#developers-information)
   * [Prerequisites](#prerequisites)
   * [Packaging](#packaging)
   * [Testing](#testing)
     * [Run a test with its javascript file](#run-a-test-with-its-javascript-file)
     * [Run a test with its typescript file](#run-a-test-with-its-typescript-file)
     * [Run a specific test](#run-a-specific-test)
  * [Contributing](#contributing)
  * [License](#license)

## <a id='intro'>Introduction</a>

Build C++ software with [vcpkg](https://github.com/microsoft/vcpkg). Samples provided use both [self-hosted runners](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/about-self-hosted-runners) or [GitHub hosted runners](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/virtual-environments-for-github-hosted-runners), using [Docker](https://www.docker.com/) and [Pipeline Caching](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/caching-dependencies-to-speed-up-workflows) as well.

## <a id='quickstart'>Quickstart</a>

It is highly recommended to use __vcpkg as a Git submodule__. Here below the sample where vcpkg is a Git submodule:

```yaml
  TBD
```

Another sample when vcpkg is NOT a submodule (not recommended):


```yaml
  TBD
```

## <a id='run-vcpkg'>The ***run-vcpkg*** action</a>

The documentatino of the **'run-vcpkg"** action is identical to the [**'run-vcpkg'** task's one](https://github.com/lukka/CppBuildTasks/blob/master/README.md#runvcpkg
) for Azure DevOps.


### <a id='reference'>Action reference: all input parameters</a>

[action.yml](https://github.com/lukka/run-vcpkg-action/action.yml)

## <a id="samples">Samples</a>

[Samples](https://github.com/lukka/CppBuildTasks/blob/master/README.md#samples)

## <a id='realworldprojects'>Real world project samples</a>

[Read world project samples](https://github.com/lukka/CppBuildTasks/blob/master/README.md#realworldprojects)

## <a id='faqs'>Questions and Answers</a>

### Why not one single action?

Because you could use vcpkg without CMake. Or you could use CMake without vcpkg.

### Would creating an ad-hoc bash/powershell script be easier?

Absolutely! Anyone can use this action as an inspiration for writing their own scripts to suite specific needs.
The purpose of the action is to streamline and to simplify the usage of vcpkg on build servers.

### Why the **'run-vcpkg'** task runs vcpkg in any case, even when cached port files are restored?

Indeed it is not needed to run vcpkg when the cache is being restored, and you could use [Cache task](https://github.com/actions/cache)'s  `cache-hit` parameter to control the execution of the **'run-vcpkg'** task. Currently **'run-vcpkg'** task defensively runs vcpkg as a sanity check: it should output in the build log that all the requested ports are installed already, spending a neglibile amount of time.


# Developers information

## Prerequisites
[gulp 4](https://www.npmjs.com/package/gulp4) globally installed.

## Build and lint
Build using `tsc` by:

 > npm run compile

Launch `lint` by:

 > npm run lint

## Packaging
To build, lint validate and package the extension for release purpose, run:

  > npm run pack

## Testing

TBD

### Run a test with its javascript file

TBD

### Run a test with its typescript file

TBD

### Run a specific test

TBD

## <a id='contributing'>Contributing</a>

The software is provided as is, there is no warranty of any kind. All users are encouraged to get the [source code](https://github.com/lukka/run-vcpkg) and improve the tasks with fixes and new features.

# License
All the content in this repository, of the extension and of the 'run-cmake' and 'run-vcpkg' tasks are licensed under the [MIT License](LICENSE.txt).

Copyright (c) 2019 Luca Cappa
