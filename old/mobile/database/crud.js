/**
 * @public
 *
 * Crud module
 * Module designed for as globals storage instead of window global during application lifecycle.
 * Can be used anywhere.
 *
 * Only one active instance in time is available (singleton)
 *
 * @functions
 * @private {__replaceBooleanToString}
 * @private {execute}
 *
 * @fields
 * @public builder
 *
 */
app.crud = {

    /**
     * @private
     *
     * Function converts passed sql @string into boolean value for DB operations
     *
     * @param sql
     */
    __replaceBooleanToString: function(sql){

        sql = sql.split("'true'").join("'bool_true'");
        sql = sql.split("'false'").join("'bool_false'");
        sql = sql.split(" true").join("'bool_true'");
        sql = sql.split(" false").join("'bool_false'");

        return sql;

    },

    /**
     * @public
     *
     * Function prepares and executes given sql @string or @function
     *
     *
     * @param sql can be @string or @function
     * @param successCallback
     * @param errorCallback
     *
     */
    execute: function (sql, successCallback, errorCallback) {

        //If @param sql is function, then execute it for final SQL string
        if(app.util.System.isFunction(sql)){
            sql = sql();
        }

        //Replace boolean values into special string equivalent
        sql = this.__replaceBooleanToString(sql);

        //Result array
        var array = [];

        //Result lastId for insert operation
        var lastId = null;

        //Executing query with transaction on database
        app.__database.__dbInstance.transaction(function (tx) {

            tx.executeSql(sql, [], function (tx, results) {

                //If operation is insert then sets lastId
                if(sql.toLowerCase().indexOf('insert') > -1){
                    lastId =  results.insertId;
                }else{
                    //Adding result objects into result array
                    var len = results.rows.length, i;
                    for (i = 0; i < len; i++) {
                        var item = results.rows.item(i);
                        array.push(item);
                    }
                }

            }, null);

        }, function (err) {

            //If errorCallback exist then invoke callback
            if (errorCallback !== undefined) {
                errorCallback();
            }

            app.error('Error executing query {0}', [sql]);

        }, function () {

            //If successCallback exist then invoke callback
            if(successCallback !== undefined){

                //If operation is insert then pass lastId as result
                if(sql.toLowerCase().indexOf('insert') != -1){
                    successCallback(lastId);
                }else{
                    //Pass array with result items
                    successCallback(array);
                }

            }

        });

    },

    /**
     * @public
     *
     * Builder object containing CRUD functions
     *
     */
    builder: {

        /**
         * @public
         *
         * Returns SQL query to find item by id in table
         *
         * @param tableName
         * @param id
         */
        findById: function(tableName, id){
            return "select * from "+tableName+" where id = "+id;
        },

        /**
         * @public
         *
         * Returns SQL query to delete item by id in table
         *
         * @param tableName
         * @param id
         */
        deleteById: function(tableName, id){
            return "delete from "+tableName+" where id = "+id;
        },

        /**
         * @public
         *
         * Returns SQL query to drop table
         *
         * @param tableName
         */
        drop: function (tableName) {
            return 'DROP TABLE IF EXISTS ' + tableName;
        },

        /**
         * @public
         *
         * Returns SQL query to count in table
         *
         * @param tableName
         */
        count: function(tableName){
            return 'select count(*) as count from '+tableName;
        },

        /**
         * @public
         *
         * Returns SQL query to create table with columns
         *
         * @param tableName
         * @param columns
         */
        create: function (tableName, columns) {

            var sql = 'CREATE TABLE IF NOT EXISTS ' + tableName + ' (id INTEGER PRIMARY KEY';

            for (var i = 0; i < columns.length; i++) {
                sql += ', ' + columns[i];
            }

            sql += ')';

            return sql;
        },


        /**
         * @public
         *
         * Returns SQL query to find all rows in table
         *
         * @param tableName
         */
        findAll: function (tableName) {
            return 'SELECT * FROM ' + tableName;
        },


        /**
         * @public
         *
         * Returns SQL query to select rows from table based on
         * specified columns names and its values
         *
         * @param tableName
         * @param values
         * @param columns
         */
        select: function (tableName, values, columns) {

            var sql = "";


                sql = "select * from " + tableName + " where ";


            for (var i = 0; i < values.length; i++) {

                if(typeof values[i] == 'string' || typeof values[i] == 'boolean'){
                    sql +=  ' '+columns[i]+"='"+values[i] + "' and ";
                }else{
                    sql +=  ' '+columns[i]+"="+values[i] + " and ";
                }

            }

            sql = sql.substr(0, sql.length - 4);

            return sql;

        },

        /**
         * @public
         *
         * Returns SQL query to insert row into table with
         * specified columns names and its values
         *
         * @param tableName
         * @param values
         * @param columns
         */
        insert: function (tableName, values, columns) {

            var sql = "";

            if(columns !== undefined){

                sql = "INSERT INTO " + tableName + " (";

                for (var i = 0; i < columns.length; i++) {
                    sql += columns[i] + ',';
                }

                sql = sql.substr(0, sql.length - 1);

                sql += ") VALUES (";

            }else{
                sql = "INSERT INTO " + tableName + " VALUES (";
            }


            for (var i = 0; i < values.length; i++) {

                if(typeof values[i] == 'string' || typeof values[i] == 'boolean'){
                    sql +=  " '"+values[i] + "',";
                }else{
                    sql +=  " "+values[i] + ",";
                }


            }

            sql = sql.substr(0, sql.length - 1);

            sql += ")";

            return sql;

        },

        /**
         * @public
         *
         * Returns SQL query to update rows in table with
         * specified columns names and its values by row id
         *
         * @param tableName
         * @param id
         * @param values
         * @param columns
         */
        update: function (tableName, id, values, columns) {

            var sql = "";

            sql = "UPDATE " + tableName + " SET ";


            for (var i = 0; i < values.length; i++) {

                if(typeof values[i] == 'string' || typeof values[i] == 'boolean'){
                    sql +=  ' '+ columns[i]+"= '"+values[i] + "',";
                }else{
                    sql += ' '+columns[i]+"= "+values[i] + ",";
                }


            }

            sql = sql.substr(0, sql.length - 1);

            sql += " where id = "+id;

            return sql;

        }


    }

};