# Contributing

The software is provided as is, there is no warranty of any kind. All users are encouraged to improve the [source code](https://github.com/lukka/run-vcpkg) with fixes and new features contributed by menas of Pull Requests.

 # Developer Manual
  * [Prerequisites](#prerequisites)
  * [Building](#build-and-lint)
  * [Packaging](#packaging)
  * [Testing](#testing)

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

Validation tests on various scenarios are run using the workflows of the [Samples](./README.md#samples).
