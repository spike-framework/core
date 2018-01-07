/**
 * Added default @public config.bootstrapModal
 * configuration option for custom Bootstrap modal implementation
 *
 * @fields
 * @public {bootstrapModal}
 */
app.config.extend({
    bootstrapModal: false
});


/**
 * @annonymus
 * @overriding
 *
 * Custom implementation of register event for Bootstrap modals
 */
app.modal.implement('register', function(modalObject){

    if(app.config.bootstrapModal){

        if(modalObject.preventDismiss){
            modalObject.__preventDismiss = true;
        }else{
            modalObject.__preventDismiss = false;
        }

    }

});

/**
 * @annonymus
 * @overriding
 *
 * Custom implementation of render event for Bootstrap modals
 */
app.modal.implement('render', function(modalSelector, modalObject){

    if (app.config.bootstrapModal){

        if(modalObject.__preventDismiss) {

            modalSelector.modal({
                backdrop: 'static',
                keyboard: false
            });

        } else if(app.config.bootstrapModal) {
            modalSelector.modal();
        }

        modalSelector.on('hidden.bs.modal', function () {
            modalObject.hide();
        })
    }

});

/**
 * @annonymus
 * @overriding
 *
 * Custom implementation of show event for Bootstrap modals
 * If @public config.bootstrapModal is true, then use Bootstrap show event
 * In other case use default jQuery implementation
 */
app.modal.implement('show', function (modalSelector, modalObject, defaultImpl) {

    if(app.config.bootstrapModal){
        modalSelector.modal('show');
    }else{
        defaultImpl(modalSelector);
    }

});

/**
 * @annonymus
 * @overriding
 *
 * Custom implementation of register hide for Bootstrap modals
 * If @public config.bootstrapModal is true, then use Bootstrap hide event
 * In other case use default jQuery implementation
 */
app.modal.implement('hide', function (modalSelector, modalObject, defaultImpl) {

    if(app.config.bootstrapModal){
        modalSelector.modal('hide');
        $('body').removeClass('modal-open');
        $('div.modal-backdrop').remove();

    }else{
        defaultImpl(modalSelector);
    }



});