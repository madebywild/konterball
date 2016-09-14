var config       = require('../config')
if(!config.tasks.lint) return

var path         = require('path')
var gulp         = require('gulp')
var eslint       = require('gulp-eslint')

var exclude = path.normalize('!**/{' + config.tasks.html.excludeFolders.join(',') + '}/**')
var paths = {
  src: [path.join(config.root.src, config.tasks.js.src, '/**/*.{' + config.tasks.html.extensions + '}'), exclude],
}

var lintTask = function() {
  return gulp.src(paths.src)
    .pipe(eslint())
    //.pipe(eslint.format())
    .pipe(eslint.formatEach('compact', console.log));
    //.pipe(eslint.failAfterError());
}

gulp.task('lint', lintTask)
module.exports = lintTask
