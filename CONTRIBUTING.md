# Contributing
  * [Prerequisites](#prerequisites)
  * [Building](#build-and-lint)
  * [Packaging](#packaging)
  * [Testing](#testing)

The software is provided as is, there is no warranty of any kind. All users are encouraged to improve the [source code](https://github.com/lukka/run-vcpkg) with fixes and new features contributed by means of Pull Requests.


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

Validation tests on various scenarios are run using the workflows of the [Samples](./README.md#samples).
