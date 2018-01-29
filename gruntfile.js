var spike = {

    docs: {

        rootDir: 'app',

        dirs: [
            'core',
            'assembler'
        ],

        dist: './docs',
        commandDirs: '',
        commandGenerate: '',
    },

    output: {

        prod: './dist/spike-framework.min.js',
        dev: './dist/spike-framework.spike',
        devJs: './dist/spike-framework.js',

        uglify: {}

    },

    modules: [

        './src/core/config.spike',
        './src/core/errors.spike',
        './src/core/events.spike',
        './src/core/eventsInterface.spike',
        './src/core/routingInterface.spike',
        './src/core/loaderInterface.spike',
        './src/core/modalInterface.spike',
        './src/core/system.spike',
        './src/core/log.spike',
        './src/core/selectors.spike',
        './src/core/util.spike',
        './src/core/request.spike',
        './src/core/rest.spike',
        './src/core/message.spike',
        './src/core/templates.spike',
        './src/core/router.spike',
        './src/core/element.spike',
        './src/core/globalElement.spike',
        './src/core/controller.spike',
        './src/core/modal.spike',
        './src/core/broadcaster.spike'

    ],

    build: [
        './src/assembler/additions.js',
        './src/assembler/assembler.js',
        './dist/spike-framework.js'
    ]

};

spike.output.uglify[spike.output.prod] = spike.output.devJs;

module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.initConfig({

        clean: {
            dist: ['./dist'],
            docs: ['./docs']
        },

        copy: {

            starter: {
                files: [
                    {
                        expand: true,
                        cwd: './dist',
                        src: ['spike-framework.js'],
                        dest: 'F:\\starter\\dist'
                      //  dest: 'D:\\xampp\\htdocs\\spike-framework-starter\\dist'
                    }
                ],
            }

        },

        concat: {

            options: {
                separator: '',
            },

            files: {
                src: spike.modules,
                dest: spike.output.dev,
            },
            build: {
                src: spike.build,
                dest: spike.output.devJs
            }

        },

        watch: {
            dev: {
                files: spike.modules,
                tasks: ['build'],
                options: {
                    nospawn: true
                }
            },
            dev2: {
                files: spike.build,
                tasks: ['build'],
                options: {
                    nospawn: true
                }
            }
        },

        uglify: {
            options: {
                mangle: false
            },
            prod: {
                files: spike.output.uglify
            }
        },

        shell: {
            options: {
                stderr: true
            },
            docsDirs: {
                command: spike.docs.commandDirs
            },
            docsGenerate: {
                command: spike.docs.commandGenerate
            },
            transpile: {
                command: "java -jar F:\\transpiler\\build\\libs\\spike-compiler.jar transpiler dist/spike-framework.spike dist/spike-framework.js"
            }
        },

        concurrent: {
            options: {
                logConcurrentOutput: true
            },
            dev: {
                tasks: ["watch:dev", "watch:dev2"]
            }
        }

    });

    grunt.registerTask('docs', ['clean:docs', 'shell:docsDirs', 'shell:docsGenerate']);
    grunt.registerTask('build', ['clean:dist', 'concat:files', 'shell:transpile', 'concat:build', 'copy:starter']);
    grunt.registerTask('dev', ['build', 'concurrent:dev']);
};