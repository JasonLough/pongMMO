var gulp = require('gulp'); 
var jshint = require('gulp-jshint');
var less = require('gulp-less');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var gutil = require('gulp-util');

var mode = 'production'; //development | production

// Lint Task
gulp.task('lint', function() {
    return gulp.src('./dev/js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// Compile Our less
gulp.task('less', function() {
    return gulp.src('./dev/less/*.less')
        .pipe(less())
        .pipe(rename('styles.min.css'))
        .pipe(gulp.dest('./public/css/'));
});

// Concatenate & Minify JS
gulp.task('scripts', function() {
    return gulp.src('./dev/js/pong.js')
        .pipe(rename('pong.min.js'))
        .pipe(gulp.dest('./public/js/'));
});

gulp.task('scripts', function() {

    switch(mode) {
        
        case 'development' :
            return gulp.src('./dev/js/pong.js')
            .pipe(rename('pong.min.js'))
            .pipe(gulp.dest('./public/js/'));
        break;

        case 'production' :
            return gulp.src('./dev/js/pong.js')
            .pipe(concat('all.js'))
            .pipe(rename('pong.min.js'))
            .pipe(uglify())
            .pipe(gulp.dest('./public/js/'));
        break;

        default :
            console.log('not a valid mode in gulp');
    }

    
});

gulp.task('watch', function() {
    gulp.watch('./dev/js/*.js', ['lint', 'scripts']);
    gulp.watch('./dev/less/*.less', ['less']);
});

gulp.task('default', ['lint', 'less', 'scripts', 'watch']);