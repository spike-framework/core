/**
 * @public
 *
 * Model module
 * Module designed for usage as class representation of database tables.
 * Can be used in another modules.
 *
 * Database representation is created directly from model classes during database initialization.
 *
 *
 * @functions
 * @public  {add}
 * @public  {register}
 * @private {__verifyView}
 *
 * @fields
 * @private {__dataArchive}
 *
 */
app.model = {

    /**
     * @private
     *
     * Storage for create table scripts generated during adding new @model
     */
    __createScripts: [],

    /**
     * @private
     *
     * Storage for drop table scripts generated during adding new @model
     */
    __dropScripts: [],

    /**
     * @public
     *
     * Substitute method for register
     *
     * @param modelName
     * @param modelColumns
     */
    add: function(modelName, modelColumns){
        this.register(modelName, modelColumns);
    },

    /**
     * @public
     *
     * Registering new model in application
     * Creates set of scripts for model
     *
     * @param modelName
     * @param modelColumns
     */
    register: function (modelName, modelColumns) {

        //Creates columns array without id column
        var _columns = app.util.System.copyArray(modelColumns);
        var columns = [];
        for(var i = 0;i<_columns.length;i++){
            if(_columns[i].toLowerCase() !== 'id'){
                columns.push(_columns[i]);
            }
        }

        var nameUpperCase = modelName.toUpperCase();

        //Creates set of scripts to drop table, create table and find all rows
        var dropTableSql =  app.crud.builder.drop(nameUpperCase);
        var createTableSql =  app.crud.builder.create(nameUpperCase, columns);
        var findAllSql =  app.crud.builder.findAll(nameUpperCase);

        app.model.__createScripts.push(createTableSql);
        app.model.__dropScripts.push(dropTableSql);

        var columnsAll = app.util.System.copyArray(columns).push("id");
        /**
         * @public
         *
         * @functions
         * @public {new}
         *
         * @fields
         * @public {table}
         * @public {columns}
         *
         * @private {__columnsAll}
         * @private {__dropSQL}
         * @private {__createSQL}
         *
         */
        var modelObject = {

            /**
             * @public
             * Name of the database table
             */
            table: nameUpperCase,

            /**
             * @public
             * List of columns (without identifier)
             */
            columns: columns,

            /**
             * @private
             * List of columns (with identifier)
             */
            __columnsAll: columnsAll,

            /**
             * @private
             * Script for dropping table
             */
            __dropSQL: dropTableSql,

            /**
             * @private
             * Script for creating table
             */
            __createSQL: createTableSql,

            /**
             * @public
             *
             * Returns new @model object with assigned values from @param valueList
             * Values are assigned without @column id and in order as @model object has been
             * defined.
             *
             * Example:
             *
             * model.add("SomeTable",  ["id", "name", "surname"]);
             *
             * {name: 'Patrick', surname: 'Jackson' } == model.SomeTable.new(['Patrick', 'Jackson']);
             *
             * @param valueList
             *
             */
            new: function (valueList) {

                var modelObj = {};

                for (var i = 0; i < this.columns; i++) {

                    if (valueList[this.columns[i]] !== undefined) {
                        modelObj[this.columns[i]] = valueList[this.columns[i]];
                    } else {
                        modelObj[this.columns[i]] = null;
                    }

                }

                return modelObj;

            },


        }

        //Create new modal instance
        app.model[modelName] = modelObject;

    }
};