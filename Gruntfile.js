/**
 *  @References
 * [0] http://gruntjs.com/getting-started to install grunt-cli
 * [1]: https://github.com/01org/grunt-zipup
**/

module.exports = function (grunt) {

  grunt.initConfig({
    zipup: {
      package: {
        appName: 'StackEye',
        version: '2.3.1',
        files: [
          { cwd: 'src', src: '**', expand: true, dest: 'src' },
          { cwd: 'resources', src: '**', expand: true, dest: 'resources' },
          { src: 'manifest.json'}
        ],
        outDir: 'build'
      }
    },

    browserify: {
      buildLibs: {
        options: {
          debug: true,
          transform: [require('grunt-react').browserify]
        },
        files: {
          'src/pages/index/bundle.js': 'src/pages/index/**/*.jsx'
        }
      }
    },

    watch: {
      browserify: {
        files: ['src/pages/index/**/*.jsx'],
        tasks: ['browserify:buildLibs']
      },
      options: {
        nospawn: true
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-zipup');
  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask('default', ['zipup']);
  grunt.registerTask('libs', ['browserify:buildLibs']);
  grunt.registerTask('dev', ['watch']);
};

