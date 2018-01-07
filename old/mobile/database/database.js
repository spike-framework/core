/**
 * @private
 *
 * Database module
 * Module designed for usage as local database (SQLLite) provider.
 * Should be used only by framework
 *
 * Only one active instance in time is available
 *
 * @functions
 * @private {__createDB}
 * @private {__dbLoadData}
 * @private {__dbCreate}
 * @private {__dbDrop}
 *
 * @fields
 * @private {__dbName}
 * @private {__dbVersion}
 * @private {__dbSize}
 *
 */
app.__database = {


    /**
     * @private
     *
     * Storage for current instance of database
     */
    __dbInstance: null,

    /**
     * @private
     *
     * Storage for counting tables
     */
    __tablesCount: 0,
    
    /**
     * @private
     *
     * Defines database name
     * Value is getted from @app.config.dbName on initialization
     */
    __dbName: '',

    /**
     * @private
     *
     * Defines database version
     */
    __dbVersion: '1.0',

    /**
     * @private
     *
     * Defines maximum database size
     */
    __dbSize: 2097152,

    /**
     * @private
     *
     *  Function initializes local sqllite database depending on device or local running
     *  and database create mode.
     *
     *  For local running WebSQL in Chrome is used
     *  For device running cordova-sqlite-storage is used
     *  https://www.npmjs.com/package/cordova-sqlite-storage
     *
     *  Invokes @app.system.__mainRender when database stuff done
     * @param callBack
     *
     */
    __createDB: function (callBack) {

        //Assing database name from config to private field
        app.__database.__dbName = app.config.dbName;

        //If database mode is not setted, database won't be created
        if (app.config.dbMode == 'none') {

            app.__database.__dbInstance = null;
            app.system.__mainRender(callBack);

        } else {

            //If device running then use @sqlitePlugin
            if (app.config.mobileRun) {
               app.__database.__dbInstance = window.sqlitePlugin.openDatabase({ name: app.__database.__dbName, location: 'default' });
            } else {

                //If local running then use @webSQL
                try {
                    app.__database.__dbInstance = openDatabase(app.__database.__dbName, app.__database.__dbVersion, app.__database.__dbName + '_manager', app.__database.__dbSize);
                } catch(error){
                    //No support for @webSQL in current browser
                    app.system.__noSupport();
                }
            }


            //If database mode is 'create-drop' then drop database, create new and insert data
            if (app.config.dbMode == 'create-drop') {

                app.__database.__dbDrop(function () {
                    app.__database.__dbCreate(function () {
                        app.__database.__dbLoadData(function () {
                            app.system.__mainRender(callBack);
                        });
                    });
                });

            } else if (app.config.dbMode == 'create') {
            //If database mode is 'create' then create database and insert data

                    app.__database.__dbCreate(function () {
                        app.__database.__dbLoadData(function () {
                            app.system.__mainRender(callBack);
                        });
                    });

            }

        }

    },

    /**
     * @private
     *
     *  Function loads SQL script defined in @app.config.dbTestScript and @app.config.dbProductionScript
     *  into database depending on @app.config.dbTestMode value
     *
     * @param callBack
     *
     */
    __dbLoadData: function (callBack) {
        app.debug('Invoke database.__dbLoadData');

        var finished = false;

        if (app.config.dbTestMode) {

            //Retrieve SQL script with test data
            $.get(app.config.dbTestScript, function (data) {

                if (data.trim().length == 0) {
                    finished = true;
                    callBack();
                } else {

                    var queries = [];
                    var splitted = data.split(';');

                    for (var i = 0; i < splitted.length; i++) {

                        if (splitted[i].trim().length > 0) {
                            queries.push(splitted[i].trim());
                        }

                    }


                    for (var i = 0; i < queries.length; i++) {

                        app.crud.execute(queries[i], function (data) {

                            app.__database.__tablesCount++;

                            if (app.__database.__tablesCount >= queries.length) {
                                app.__database.__tablesCount = 0;

                                if (!finished) {
                                    finished = true;
                                    callBack();

                                }

                            }

                        });

                    }

                }


            });

        } else {

            //Retrieve SQL script with production data
            $.get(app.config.dbProductionScript, function (data) {

                if (data.trim().length == 0) {
                    finished = true;
                    callBack();

                } else {

                    var queries = [];
                    var splitted = data.split(';');

                    for (var i = 0; i < splitted.length; i++) {
                        if (splitted[i].trim().length > 0) {
                            queries.push(splitted[i].trim());
                        }
                    }

                    for (var i = 0; i < queries.length; i++) {

                        app.crud.execute(queries[i], function (data) {

                            app.__database.__tablesCount++;

                            if (app.__database.__tablesCount >= queries.length) {
                                app.__database.__tablesCount = 0;

                                if (!finished) {
                                    finished = true;
                                    callBack();

                                }

                            }

                        });

                    }

                }


            });

        }

    },

    /**
     * @private
     *
     * Function executes create table scripts
     *
     * @param callBack
     *
     */
    __dbCreate: function (callBack) {
        app.debug('Invoke database.__dbCreate');

            if(app.model.__createScripts.length > 0){

                for (var i = 0; i < app.model.__createScripts.length; i++) {

                    app.crud.execute(app.model.__createScripts[i], function (data) {

                        app.__database.__tablesCount++;

                        if (app.__database.__tablesCount == app.model.__createScripts.length) {
                            app.__database.__tablesCount = 0;
                            callBack();
                        }

                    });

                }

            }else{
                callBack();
            }




    },

    /**
     * @private
     *
     * Function executes drop table scripts
     *
     * @param callBack
     *
     */
    __dbDrop: function (callBack) {
        app.debug('Invoke database.__dbDrop');


            if(app.model.__dropScripts.length > 0){

                for (var i = 0; i < app.model.__dropScripts.length; i++) {

                    app.crud.execute(app.model.__dropScripts[i], function (data) {

                        app.__database.__tablesCount++;

                        if (app.__database.__tablesCount == app.model.__dropScripts.length) {
                            app.__database.__tablesCount = 0;
                            callBack();
                        }

                    });

                }

            }else{
                callBack();
            }




    }


};
