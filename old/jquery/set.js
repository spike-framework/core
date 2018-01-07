/**
 * @public
 *
 * jQuery extension to invoke specified jQuery method on HTML tags
 *
 * Example invoking set('www.someSite.com/image.png') on @image tag sets value for @attr src
 * Example invoking set('Name') on @span tag sets @innerHtml
 * Example invoking set('England') on @input tag sets value for @attr value
 *
 * Optional value can be passed by custom filter.
 *
 * @param value
 * @param filter --optional
 */

function _spike_jquery_set_setFunction(selector, value) {

    var elementType = selector.prop('tagName');

    if (!elementType) {
        elementType = selector.prop('nodeName');
    }

    elementType = elementType.toLowerCase();

    if (elementType == 'label' || elementType == 'div' || elementType == 'span' || elementType == 'button' || elementType == 'p' || elementType.indexOf('h') > -1) {
        selector.html(value.toString());
    } else if (elementType == 'img') {
        selector.attr('src', value);
    } else if (selector.is(':checkbox')) {
        if (value == true || parseInt(value) == 1) {
            selector.prop('checked', true);
        } else {
            selector.prop('checked', false);
        }
    } else if (elementType == 'a') {
        selector.attr('href', value);
    } else {
        selector.val(value);
    }

};

function _spike_jquery_set_populateFunction(selector, data, prefix, selectors) {

    if (!prefix) {
        prefix = '';
    }

    if (!selectors) {
        selectors = Array.prototype.slice.call(selector[0].querySelectorAll('[id]')).concat(Array.prototype.slice.call(selector[0].querySelectorAll('['+app.__attributes.SET_VAL+']')));
    }

    Object.keys(data).map(function (itemName) {

        var reducedSelectors = [];
        for (var i = 0; i < selectors.length; i++) {

            if (selectors[i].id == prefix + itemName || $(selectors[i]).attr(app.__attributes.SET_VAL) == prefix + itemName) {
                $(selectors[i]).set(data[itemName]);
            } else {
                reducedSelectors.push(selectors[i]);
            }
        }

        if (app.util.System.isObject(data[itemName])) {
            _spike_jquery_set_populateFunction(selector, data[itemName], itemName + '.', reducedSelectors);
        }

    });

};

jQuery.fn.extend({

    set: function (_value, _filter) {

        if (_value === undefined || _value == null) {
            return;
        }

        if (_filter && _value !== undefined && _value !== null) {
            _value = _filter(_value);
        }

        if (app.util.System.isObject(_value)) {
            _spike_jquery_set_populateFunction($(this), _value);
        } else {
            _spike_jquery_set_setFunction($(this), _value);
        }

        return $(this);

    },


});