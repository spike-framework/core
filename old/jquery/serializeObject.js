/**
 * @public
 *
 * jQuery extension to invoke on elements like forms
 * which one's have @attr name
 *
 * Creating object from jQuery.fn.serializeArray() result
 *
 */
jQuery.fn.extend({

  serializeObject: function (omitNumberParsingFields) {

    var formSelector = $(this);
    var serializedObject = {};

    var serializeField = function(){

      var value = $(this).val();
      var name = $(this).attr('name');

      if (value == 'on') {
        value = true;
      } else if (value == 'off') {
        value = false;
      }

      if(omitNumberParsingFields && omitNumberParsingFields.indexOf(name) > -1){
        serializedObject[name] = value;
      }else{
        serializedObject[name] = app.util.System.tryParseNumber(value);
      }

    };

    formSelector.find('input[name]').each(serializeField);
    formSelector.find('select[name]').each(serializeField);
    formSelector.find('textarea[name]').each(serializeField);

    formSelector.find('input[type="checkbox"][name]').each(function () {

      var name = $(this).attr('name');
      serializedObject[name] = $(this).is(':checked');

    });

    return serializedObject;

  },

  serializeObjectWithoutNumberParsing: function () {

    var formSelector = $(this);
    var serializedObject = {};

    var serializeField = function(){

      var value = $(this).val();
      var name = $(this).attr('name');

      if (value == 'on') {
        value = true;
      } else if (value == 'off') {
        value = false;
      }

      serializedObject[name] = value;

    };

    formSelector.find('input[name]').each(serializeField);
    formSelector.find('select[name]').each(serializeField);
    formSelector.find('textarea[name]').each(serializeField);

    formSelector.find('input[type="checkbox"][name]').each(function () {

      var name = $(this).attr('name');
      serializedObject[name] = $(this).is(':checked');

    });

    return serializedObject;

  }

});