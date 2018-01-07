/**
 * @public
 *
 * Query module
 * Module designed for usage as singleton during application lifecycle.
 * Can be used in any other modules.
 *
 * Only one active instance in time is available
 *
 * @functions
 * @public  {add}
 * @public  {register}
 * @public  {list}
 *
 */
app.query = {

    /**
     * @public
     *
     * Registering @array of query @object
     *
     * @param queryObjectsList {
     *  @fields
     *  @public name
     *  @public sql
     *  @public group
     * }
     *
     */
    list: function(queryObjectsList){

        $.each(queryObjectsList, function(i, queryObj){
            app.query.register(queryObj.name, queryObj.sql, queryObj.group);
        });

    },

    /**
     * @public
     *
     * Substitute method for register
     *
     * @param languageName
     * @param laguageFilePath
     */
    add: function(queryName, querySQL, queryGroup){
        this.register(queryName, querySQL, queryGroup);
    },

    /**
     * @public
     *
     * Creates new @query object containing binding functions, SQL scripts,
     * execution function.
     *
     * @param queryName
     * @param querySQL
     * @param queryGroup
     *
     */
    register: function(queryName, querySQL, queryGroup){

        //If @param querySQL is function, then execute it for final SQL string
        if(app.util.System.isFunction(querySQL)){
            querySQL = querySQL();
        }

        /**
         * @public
         *
         * Query object with build-in functions to query operations
         *
         * @functions
         * @public {bind}
         * @public {execute}
         *
         * @private {__bindArrayParams}
         * @private {__bindMapParams}
         *
         * @fields
         * @private {__sql}
         */
        var queryObj = {

            /**
             * @private
             *
             * Variable to store plain SQL query
             */
            __sql: querySQL,

            /**
             * @public
             *
             * Function returns SQL query with binded params passed as @array or @object
             *
             * Example:
             *
             * if SQL is "select * from person where id = ? "
             *
             * "select * from person where id = 1 " = app.query.SomeQuery.bind([1])
             *
             * if SQL is "select * from person where id = :id "
             * "select * from person where id = 2 " = app.query.SomeQuery.bind({ id: 2 })
             *
             *
             * @param queryParamsListOrMap
             */
            bind: function(queryParamsListOrMap){

                var sql = this.__sql;

                //If @param queryParamsListOrMap is @array then bind as array params
                if(queryParamsListOrMap instanceof Array) {
                    sql = this.__bindArrayParams(queryParamsListOrMap, sql);
                }else{
                    sql = this.__bindMapParams(queryParamsListOrMap, sql);
                }


                return sql;

            },

            /**
             * @private
             *
             * Function binds @array of params to passed SQL query @string
             * and returns binded @string query
             *
             * @param paramsList
             * @param sql
             */
            __bindArrayParams: function(paramsList, sql){

                for (var i = 0; i < paramsList.length; i++) {

                    if (typeof paramsList[i] == 'string') {
                        sql = sql.replace('?', "'" + paramsList[i] + "'");
                    } else {
                        sql = sql.replace('?', paramsList[i]);
                    }

                }

                return sql;

            },

            /**
             * @private
             *
             * Function binds params @object to passed SQL query @string
             * and returns binded @string query
             *
             * @param paramsObject
             * @param sql
             */
            __bindMapParams: function(paramsObject, sql){

                for (var fieldName in paramsObject){

                    var fieldValue = paramsObject[fieldName];

                    if (typeof fieldValue == 'string') {
                        sql = sql.replace(':'+fieldName, "'" + fieldValue + "'");
                    } else {
                        sql = sql.replace(':'+fieldName, fieldValue);
                    }

                }

                return sql;

            },

            /**
             * @public
             *
             * Function executes query on local DB (SQLLite) and invokes
             * @param @function successCallback returning query result
             * or @param @function errorCallback returning database error
             *
             * Optionally can handle @param queryParamsListOrMap to bind
             * query params (see @bind)
             *
             * @param successCallback
             * @param errorCallback
             * @param queryParamsListOrMap -- optional for binding
             */
            execute: function(successCallback, errorCallback, queryParamsListOrMap){

                var sqlToExecute = this.__sql;

                //If @param queryParamsListOrMap exist then bind query params
                if(!app.util.System.isNull(queryParamsListOrMap)){
                    sqlToExecute = this.bind(queryParamsListOrMap);
                }

                //Execute query on CRUD @__execute method
                app.crud.execute(sqlToExecute, successCallback, errorCallback);
            }



        }

        //If query group not passed, then create typical query
        if(app.util.System.isNull(queryGroup)){

            app.query[queryName] = queryObj;

        }else{

            //If query group not exist yet, create empty object
            if(app.util.System.isNull(app.query[queryGroup])){
                app.query[queryGroup] = {};
            }

            //Assign query object to query group
            app.query[queryGroup][queryName] = queryObj;
        }

    }

};