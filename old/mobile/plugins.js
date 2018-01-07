/**
 * @public
 *
 * Plugins module
 * Module designed for usage as singleton during application lifecycle.
 * Can be used in any other modules.
 *
 * Only one active instance in time is available
 *
 * @functions
 * @public  {add}
 * @public  {register}
 *
 */
app.plugins = {

    /**
     * @public
     *
     * Substitute method for register
     *
     * @param pluginName
     * @param pluginWrapperFunction
     */
    add: function(pluginName, pluginWrapperFunction){
        this.register(pluginName, pluginWrapperFunction);
    },

    /**
     * @public
     *
     * Registering new wrapper for plugin
     *
     * @param pluginName
     * @param pluginWrapperFunction
     */
    register: function(pluginName, pluginWrapperFunction){

        app.plugins[pluginName] = pluginWrapperFunction;

    },

    /**
     * @public
     *
     * Registering map of wrapper functions in application
     *
     * @param pluginsWrapperFunctionsMap
     */
    list: function(pluginsWrapperFunctionsMap){

        $.each(pluginsWrapperFunctionsMap, function(pluginName, pluginWrapperFunction){
            app.global.add(pluginName, pluginWrapperFunction);
        });

    },



};
