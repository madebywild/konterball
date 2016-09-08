var config       = require('../config')
if(!config.tasks.libs) return

var gulp         = require('gulp')
var browserSync  = require('browser-sync')
var handleErrors = require('../lib/handleErrors')
var path         = require('path')

var paths = {
  src: path.join(config.root.src, config.tasks.libs.src, '/**/*'),
  dest: path.join(config.root.dest, config.tasks.libs.dest)
}

var libsTask = function () {
  return gulp.src(paths.src)
    .pipe(gulp.dest(paths.dest))
    .pipe(browserSync.stream())
}

gulp.task('libs', libsTask)
module.exports = libsTask
