var gulp = require('gulp');
var gutil = require('gulp-util');
var notify = require('gulp-notify');
var tarsConfig = require('../../../tars-config');
var replace = require('gulp-replace-task');
var notifier = require('../../helpers/notifier');
var browserSync = require('browser-sync');
var fs = require('fs');
var handlebars = require('gulp-compile-handlebars');
var through2 = require('through2');

var handlebarsOptions = {
        batch: ['./markup/modules'],
        helpers: require('../../helpers/handlebars-helpers')
    };

/**
 * Handlebars compilation of pages templates.
 * Templates with _ prefix won't be compiled
 * @param  {Object} buildOptions
 */
module.exports = function(buildOptions) {

    function concatModulesData() {
        eval('var readyModulesData = {' + fs.readFileSync('./dev/temp/modulesData.js', "utf8") + '}');
        return readyModulesData;
    }

    var patterns = [];

    if (!gutil.env.ie8) {
        patterns.push(
            {
                match: '<link href="%=staticPrefix=%/css/main_ie8%=hash=%%=min=%.css" rel="stylesheet" type="text/css">',
                replacement: ''
            }
        );
    }

    if (gutil.env.min || gutil.env.release) {
        patterns.push(
            {
                match: '%=min=%',
                replacement: '.min'
            }
        );
    } else {
        patterns.push(
            {
                match: '%=min=%',
                replacement: ''
            }
        );
    }

    if (gutil.env.release) {
        patterns.push(
            {
                match: '%=hash=%',
                replacement: buildOptions.hash
            }
        );
    } else {
        patterns.push(
            {
                match: '%=hash=%',
                replacement: ''
            }
        );
    }

    patterns.push(
        {
            match: '%=staticPrefix=%',
            replacement: tarsConfig.staticPrefix
        }
    );

    return gulp.task('html:compile-templates', function(cb) {
        var modulesData, error;

        try {
            modulesData = concatModulesData();
        } catch(er) {
            error = er;
        }

        gulp.src(['./markup/pages/**/*.html', '!./markup/pages/**/_*.html'])
            .pipe(error ? through2(function () {this.emit('error', '\nAn error occurred while modules data processing:\n' + error)}) : handlebars(modulesData, handlebarsOptions))
            .on('error', notify.onError(function (error) {
                return '\nAn error occurred while compiling handlebars.\nLook in the console for details.\n' + error;
            }))
            .pipe(replace({
              patterns: patterns,
              usePrefix: false
            }))
            .on('error', notify.onError(function (error) {
                return '\nAn error occurred while replacing placeholdres.\nLook in the console for details.\n' + error;
            }))
            .pipe(gulp.dest('./dev/'))
            .pipe(browserSync.reload({stream:true}))
            .pipe(
                notifier('Templates\'ve been compiled')
            );

        cb(null);
    });
};