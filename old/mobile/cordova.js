/**
 * @private
 *
 * Cordova module
 * Module designed for usage as cordova provider.
 * Should be used only by framework
 *
 * Only one active instance in time is available
 *
 * @functions
 * @private {__initializeCordova}
 * @private {__bindDOMEvents}
 * @private {__checkNetwork}
 * @private {__onBack}
 * @private {__onDeviceReady}
 * @private {__onOnline}
 * @private {__onOffline}
 *
 * @fields
 * @private {__deviceReadyCallBack}
 *
 */
app.__cordova = {

    /**
     * @public
     *
     * Function exits application
     *
     */
    exit: function () {
        app.debug('Invoke system.exit');

        if (Config.mobileRun) {
            navigator.app.exitApp();
        } else {
            console.warn('EXIT APP');
            app.modal.invalidateAll();
        }


    },

    /**
     * @private
     *
     * Function executed when Spike cannot create SQLLite
     * database using WebSQL or cordova-sqlite-storage
     *
     * Practically Spike local testing works only with Chrome
     *
     */
    __noSupport: function () {

        var isChromium = window.chrome, winNav = window.navigator, vendorName = winNav.vendor, isOpera = winNav.userAgent.indexOf("OPR") > -1, isIEedge = winNav.userAgent.indexOf("Edge") > -1, isIOSChrome = winNav.userAgent.match("CriOS");

        if (!isIOSChrome && !isChromium && !isOpera) {
            $('body').append('<div class="no-browser">Sorry,</br>you can test mobile app only in Chrome</div>');
            Errors.throwError(Errors.messages.WEBSQL_SUPPORT);
        }

    },

    /**
     * @private
     *
     * Callback executed when device is ready
     */
    __deviceReadyCallBack: null,

    /**
     * @private
     *
     * Function to initialize Cordova application
     * Invokes passed callback function if initialization ends
     * @param callBack
     */
    __initializeCordova: function (callBack) {
        app.debug('Invoke cordova.__initializeCordova with params', []);
        app.__cordova.__bindDOMEvents();
        callBack();
    },

    /**
     * @private
     *
     * Function binding Cordova events
     * If @app.events.domEvents exitst then executes
     *
     */
    __bindDOMEvents: function () {
        app.debug('Invoke cordova.__bindDOMEvents');

        document.addEventListener('deviceready', app.__cordova.__onDeviceReady, false);
        document.addEventListener('backbutton', app.__cordova.__onBack, false);

        if (app.events.domEvents !== undefined) {
            app.events.domEvents();
        }

    },

    /**
     * @private
     *
     * Function to initialize Cordova application
     *
     * @param callBack
     */
    __checkNetwork: function () {
        app.debug('Invoke cordova.__checkNetwork');

        app.plugins.wrapper.network.connection(function () {
            app.__cordova.__onOnline();
        }, function () {
            app.__cordova.__onOffline();
        });

    },


    /**
     * @private
     *
     * Function to realize back @event
     *
     * If modal is rendered and has overriden @onBack function
     * then invoke overriden @onBack
     *
     * If modal is rendered and has not overriden @onBack function
     * then invoke @app.modal.invalidateAll() function to hide modal
     *
     * if controller is rendered and has overriden @onBack function
     * then invoke  @app.modal.invalidateAll() function to hide modal
     * and then invoke overriden @onBack
     *
     * If there aren't rendered modals and current controller has not
     * overriden @onBack function then invoke @app.events.onBack
     *
     * @param e
     *
     */
    __onBack: function (e) {
        app.debug('Invoke cordova.__onBack');

        if (e) {
            e.preventDefault();
        }

        if (app.mCtx !== null && app.mCtx.onBack !== undefined) {
            app.mCtx.onBack();
        } else if (app.mCtx !== null && app.mCtx.onBack == undefined) {
            app.modal.invalidateAll()
        } else if (app.ctx !== null && app.ctx.onBack !== undefined) {
            app.modal.invalidateAll()
            app.ctx.onBack();
        } else {

            if (app.events.onBack) {
                app.events.onBack();
            }

        }

    },

    /**
     * @private
     *
     * Function executed when Cordova app is ready
     * Invokes @private __deviceReadyCallBack
     *
     */
    __onDeviceReady: function () {
        app.debug('Invoke cordova.__onDeviceReady');

        if (app.__cordova.__deviceReadyCallBack) {
            app.__cordova.__deviceReadyCallBack();
        }

    },

    /**
     * @private
     *
     * Function executes when application is in @online state
     * Invokes @app.events.onOnline
     *
     */
    __onOnline: function () {
        app.debug('Invoke cordova.__onOnline');

        app.online = true;

        if (app.events.onOnline) {
            app.events.onOnline();
        }

    },

    /**
     * @private
     *
     * Function executes when application is in @offline state
     * Invokes @app.events.onOffline
     *
     */
    __onOffline: function () {
        app.debug('Invoke cordova.__onOffline');

        app.online = false;

        if (app.events.onOffline) {
            app.events.onOffline();
        }

    },

};