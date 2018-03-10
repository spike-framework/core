(function (history) {

    var pushState = history.pushState;

    history.pushState = function (state) {

        if (typeof history.onpushstate === "function") {
            history.onpushstate({state: state});
        }

        var result = pushState.apply(history, arguments);
        spike.core.Router.onHistoryChanges();

        return result;

    };

    window.addEventListener('popstate', function (e) {
        spike.core.Router.onHistoryChanges();
    });

})(window.history);

