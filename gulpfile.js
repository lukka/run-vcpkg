// Copyright (c) 2019 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

const gulp = require('gulp');
const path = require('path');
const install = require('gulp-install');
const ts = require("gulp-typescript");
const sourcemaps = require("gulp-sourcemaps");
const eslint = require('gulp-eslint');
const jest = require('gulp-jest').default;

var installPackages = function () {
  return gulp.src([
    "./package.json"]).pipe(install());
}

var build = function () {
  tsProject = ts.createProject('./tsconfig.json');
  return tsProject.src()
    .pipe(sourcemaps.init())
    .pipe(tsProject())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(path.join('build')))
}

// Copy action's library to its deployment directory.
var copyLib = function () {
  return gulp.src(
    ['./build/libs/run-vcpkg-lib/src/*.js'])
    .pipe(gulp.dest('./build/src/'))
}

var eslinter = function () {
  // lint only the files of the action, e.g. not of the /libs/
  return gulp.src(['src/**/*.ts'])
    // eslint() attaches the lint output to the "eslint" property
    // of the file object so it can be used by other modules.
    .pipe(eslint())
    // eslint.format() outputs the lint results to the console.
    // Alternatively use eslint.formatEach() (see Docs).
    .pipe(eslint.format())
    // To have the process exit with an error code (1) on
    // lint error, return the stream and pipe to failAfterError last.
    .pipe(eslint.failAfterError());
}

// Copy shared library files to consumers.
var copyBaseLib = function () {
  return gulp.src(
    ['./build/libs/action-base-lib/src/*.js',
      './build/libs/base-lib/src/*.js'])
    .pipe(gulp.dest('./build/src/'));
}

var test = function () {
  return gulp.src('__tests__').pipe(jest({
    "preprocessorIgnorePatterns": [
      "<rootDir>/dist/", "<rootDir>/node_modules/"
    ],
    "testPathIgnorePatterns" : [
      "<rootDir>/actions/" 
    ],
    "automock": false
  }));
}

gulp.task('test', test);
gulp.task('eslint', eslinter);
gulp.task('copyLib', copyLib);
gulp.task('copyBaseLib', copyBaseLib);
gulp.task('build', build);
gulp.task('installPackages', installPackages);
// 'test' must not be part of the 'default' target, as it is started explicitly *after* ncc has been run by the package.json run script.
gulp.task('default', gulp.series('installPackages', 'eslint', 'build', 'copyLib', 'copyBaseLib'));

