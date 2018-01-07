/**
 * @public
 *
 * jQuery extension to receive all tag additional attributes
 *
 * Creating object from jQuery.fn.attrs() result
 *
 */
jQuery.fn.extend({

    attrs: function () {

        var attributesMap = {};

        jQuery.each(this[0].attributes, function () {
            if (this.specified) {

                this.name = this.name.replace('data-','');

                attributesMap[app.util.System.toCamelCase(this.name)] = app.util.System.tryParseNumber(this.value);
            }
        });

        return attributesMap;

    },

});