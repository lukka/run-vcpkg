# Contributing
- [Contributing](#contributing)
  - [Prerequisites](#prerequisites)
    - [Setup for consuming GitHub Registry public packages](#setup-for-consuming-github-registry-public-packages)
  - [Build and lint](#build-and-lint)
  - [Packaging](#packaging)
  - [Testing](#testing)

The software is provided as is, there is no warranty of any kind. All users are encouraged to improve the [source code](https://github.com/lukka/run-vcpkg) with fixes and new features contributed by means of Pull Requests.


## Prerequisites

Run 

```bash
npm install
```

to populate the dependencies in `./node_modules` directory.

### Setup for consuming GitHub Registry public packages

`run-vcpkg` depends on public NPM packages published by [lukka/run-cmake-vcpkg-action-libs](https://github.com/lukka/run-cmake-vcpkg-action-libs) in the [GitHub Packages registry](https://docs.github.com/en/free-pro-team@latest/packages/using-github-packages-with-your-projects-ecosystem/configuring-npm-for-use-with-github-packages).
Unexpectedly, a public package still requires authentication when downloading it, hence if you want to `npm install` those packages correctly, you need to obtain a token with `read:packages` scope. Then create in the root of the repository a `.npmrc` file with the following content:

    //npm.pkg.github.com/:_authToken=YOURTOKEN
    @lukka:registry=https://npm.pkg.github.com/

__Note__: **Never commit this `.npmrc` file!**

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
 
 > npx jest

Validation tests on various scenarios are run using the workflows of the [Samples](./README.md#samples).
