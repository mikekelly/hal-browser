module.exports = function(grunt) {
  grunt.initConfig({
    concat: {
      options: {
        separator: ';',
      },
      dist: {
        src: ['js/hal.js', 'js/hal/**/*.js'],
        dest: 'hal.js',
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
};
