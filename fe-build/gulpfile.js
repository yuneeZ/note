'use strict';

const gulp = require('gulp');

// sass
const sass = require('gulp-sass');
const csscomb = require('gulp-csscomb');
const sourcemaps = require('gulp-sourcemaps');

// spritesmith
const glob = require('glob');
const buffer = require('vinyl-buffer');
const imagemin = require('gulp-imagemin');
const spritesmith = require('gulp.spritesmith');
const merge = require('merge-stream');

const sprite_path = '../img/**/sprites/*/';
const sass_path = '../sass/**/*.scss';

// replace
const gulpif = require('gulp-if');
const frep = require('gulp-frep');
const pattern = [
    {
        pattern: /\\r\\n/g,
        replacement: '\\n'
    }
];

function optimize(path) {
    const dir = path.split('sprites/');
    const dirPath = dir[0].substring(dir[0].length, 1);
    const fileName = dir[1].substring(dir[1].length-1, 0);

    const result = {
        path: dirPath + 'sprites/',
        imgPath: '.' + dirPath  + 'sprites/',
        cssPath: '.' + dirPath.replace('/img/', '/sass/'),
        imgName: 'sp_' + fileName + '.png',
        cssName: '_sp_' + fileName + '.scss',
    };

    return result;
}

gulp.task('styles', function() {
    return gulp.src(sass_path)
        .pipe(csscomb())
        .pipe(gulp.dest('../sass/'));
});

gulp.task('sass', function() {
    return gulp.src(sass_path)
        .pipe(sourcemaps.init())
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(sourcemaps.write('../css/'))
        .pipe(gulpif('*.map', frep(pattern)))
        .pipe(gulp.dest('../css/'));
});

gulp.task('sprite', function() {
    new Promise((resolve, reject) => {
        glob(sprite_path, function(error, directories) {
            resolve(directories);
        });
    }).then((directories) => {
        directories.forEach((directory) => {
            const dir = optimize(directory);

            const spriteData = gulp.src(directory + '*.png').pipe(spritesmith({
                imgName: dir.imgName,
                imgPath: dir.path + dir.imgName,
                cssName: dir.cssName
            }));

            const imgStream = spriteData.img
                .pipe(buffer())
                .pipe(imagemin())
                .pipe(gulp.dest(dir.imgPath));

            const cssStream = spriteData.css
                .pipe(gulp.dest(dir.cssPath));

            return merge(imgStream, cssStream);
        });
    });
});

gulp.task('sass:watch', function() {
    gulp.watch('../sass/**', gulp.series('sass'));
});
