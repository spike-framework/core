var spike = {
    core: {}
};

spike.core.Assembler = {

    constructorsMap: {},

    templatesLoaded: false,
    appLoaded: false,

    totalNamespaces: 0,
    namespacesCount: 0,

    staticClasses: {},
    objectiveClasses: {},

    dependenciesFn: null,
    spikeLoading: false,

    setConstructorsMap: function(constructorsMap){
        this.constructorsMap = this.extend(this.constructorsMap, constructorsMap);
    },

    resetNamespaces: function (namespacesCount, package) {
        this.totalNamespaces = namespacesCount;
        this.namespacesCount = 0;
        this.dependenciesFn = null;
        this.spikeLoading = false;

        if (package === 'spike.core') {
            this.spikeLoading = true;
        } else {
            this.staticClasses = {};
            this.objectiveClasses = {};
        }

    },


    /**
     var newObjectShallow = extend(object1, object2, object3);
     var newObjectDeep = extend(true, object1, object2, object3);


     UWAGA!!!! TRZEBA WYKLUCZYC FUNKCJE O NAZWACH getSuper i getClass BO SIE NADPISZA
     ZROBIONE
     SPRAWDZIC W TESTACH

     */
    extend: function () {
        var extended = {};
        var deep = false;
        var i = 0;
        var length = arguments.length;

        if (Object.prototype.toString.call(arguments[0]) === '[object Boolean]') {
            deep = arguments[0];
            i++;
        }

        var merge = function (obj) {
            for (var prop in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, prop)) {

                    if (prop !== 'getSuper' && prop !== 'getClass') {

                        if (deep && Object.prototype.toString.call(obj[prop]) === '[object Object]') {
                            extended[prop] = extend(true, extended[prop], obj[prop]);
                        } else {
                            extended[prop] = obj[prop];
                        }

                    }

                }
            }
        };

        for (; i < length; i++) {
            var obj = arguments[i];
            merge(obj);
        }

        return extended;
    },

    dependencies: function (dependenciesFn) {
        this.dependenciesFn = dependenciesFn;
        this.checkIfCanBootstrap();
    },

    getDotPath: function (package) {

        var obj = window;

        package = package.split(".");
        for (var i = 0, l = package.length; i < l; i++) {

            if (obj[package[i]] === undefined) {
                break;
            }

            obj = obj[package[i]];

        }

        return obj;

    },

    createDotPath: function (package, fillObject) {

        if (package.trim().length === 0) {
            throw new Error();
        }

        //  package = package.substring(4, package.length);


        var createNodesFnBody = '';
        var splitPackage = package.split('.');

        var packageCheck = 'window';
        for (var i = 0, l = splitPackage.length; i < l; i++) {

            packageCheck += '.' + splitPackage[i];

            createNodesFnBody += 'if(' + packageCheck + ' === undefined){';
            createNodesFnBody += '    ' + packageCheck + ' = {};';
            createNodesFnBody += '}';

        }

        createNodesFnBody += '    ' + packageCheck + ' = fillObject';

        Function('fillObject', createNodesFnBody)(fillObject);

    },

    defineNamespace: function (package, names, namespaceCreator) {

        this.namespacesCount++;
        for (var i = 0, l = names.length; i < l; i++) {
            this.createDotPath(package + '.' + names[i], null);
        }

        this.objectiveClasses[package + '.' + names[0]] = namespaceCreator;

    },

    createStaticClass: function (package, name, inherits, classBody) {

        if (name.indexOf(package) > -1) {
            name = name.replace(package + '.', '');
        }

        this.namespacesCount++;
        this.createDotPath(package + '.' + name, null);

        // if (inherits === null) {
        //     inherits = {};
        // } else {
        //     inherits = this.getDotPath(inherits);
        // }

        this.staticClasses[package + '.' + name] = classBody;

        //
        // this.staticClasses[package + '.' + name] = {
        //     package: package + '.' + name,
        //     inherits: inherits,
        //     classBody: classBody
        // };

    },


    checkIfCanBootstrap: function () {

        if (this.namespacesCount === this.totalNamespaces && this.dependenciesFn) {
            this.bootstrap();

            if (this.appLoaded === true && this.spikeLoading == false) {
                spike.core.System.init();
            }

        }

    },

    bootstrap: function () {

        for (var className in this.staticClasses) {
            this.createDotPath(className, this.staticClasses[className]);
        }

        for (var className in this.objectiveClasses) {
            this.objectiveClasses[className]();
        }

        this.dependenciesFn();
        this.loadTemplates();

    },

    loadTemplates: function () {

        var self = this;

        if (this.templatesLoaded === false) {

            if (document.querySelector('[templates-src]') === null) {
                throw new Error('Spike Framework: Cannot find script tag with templates-src definition')
            }

            if (document.querySelector('[app-src]') === null) {
                throw new Error('Spike Framework: Cannot find script tag with app-src definition')
            }

            var script = document.createElement("script");
            script.type = "application/javascript";
            script.src = document.querySelector('[templates-src]').getAttribute('templates-src');
            script.onload = function () {
                self.templatesLoaded = true;

                self.namespacesCount = 0;
                self.appLoaded = true;
                var script2 = document.createElement("script");
                script2.type = "application/javascript";
                script2.src = document.querySelector('[app-src]').getAttribute('app-src');
                document.body.appendChild(script2);

            };

            document.body.appendChild(script);

        }

    },

    findLoaderClass: function () {

        for (var className in this.objectiveClasses) {

            if (this.objectiveClasses[className].toString().indexOf('return \'spike.core.LoaderInterface\'') > -1) {

                var loader = window;

                var split = className.split('.');
                for (var i = 0; i < split.length; i++) {

                    loader = loader[split[i]];

                }

                loader = new loader();

                return loader;
            }

        }

        throw new Error('Spike Framework: No loader defined');

    },

    getClassObject: function (className, argsArray) {

        function getObjectFromPath(path) {
            console.log('path : '+path);
            var obj = window;

            var split = path.split('.');
            for (var i = 0; i < split.length; i++) {
                obj = obj[split[i]];
            }

            return obj;
        }

        var packageName = className.substring(0, className.lastIndexOf('.'));
        var classPackage = getObjectFromPath(packageName);
        var constructor = this.constructorsMap[className][argsArray.length];

        console.log('className ' + className);
        console.log(classPackage);
        console.log('argsArray.length : '+argsArray.length);
        console.log(this.constructorsMap);
        console.log('constructor ' + constructor);

        var classObject = classPackage[constructor];

        console.log(classObject);

        classObject = classObject.apply(this, argsArray);

        return classObject;

    }

};

