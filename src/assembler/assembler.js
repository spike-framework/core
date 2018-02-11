var spike = {
    core: {}
};

spike.core.Assembler = {

    sourcePath: '',

    constructorsMap: {},
    constructorsFunctions: {},

    templatesLoaded: false,
    appLoaded: false,

    totalNamespaces: 0,
    namespacesCount: 0,

    staticClasses: {},
    objectiveClasses: {},

    dependenciesFn: null,
    spikeLoading: false,


    // setConstructorsMap: function (constructorsMap) {
    //     this.constructorsMap = constructorsMap;
    //     this.checkIfCanBootstrap();
    // },

    // appendConstructorsFunctions: function (constructorsFunctions) {
    //
    //     for(var constructorFullName in constructorsFunctions){
    //         this.constructorsFunctions[constructorFullName] = constructorsFunctions[constructorFullName];
    //     }
    //
    // },
    //
    // getConstructorFunction: function(constructorFullName){
    //     return new this.constructorsFunctions[constructorFullName]();
    // },

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
    extend: function (from, to) {

        if (to !== null && to !== undefined) {

            var overrides = {};

            for (var prop in from) {

                if (from.hasOwnProperty(prop)) {

                    if (to[prop] !== undefined) {
                        overrides[prop] = to[prop];
                    }else{
                        to[prop] = from[prop];
                    }

                }

            }

            for(var prop in overrides){
                to[prop] = overrides[prop];
            }

        }

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

    defineNamespace: function (classFullName, namespaceCreator) {

        this.namespacesCount++;
        this.createDotPath(classFullName, null);

        this.objectiveClasses[classFullName] = namespaceCreator;

    },

    createStaticClass: function (package, name, inherits, classBody) {

        if (name.indexOf(package) > -1) {
            name = name.replace(package + '.', '');
        }

        this.namespacesCount++;
        this.createDotPath(package + '.' + name, null);

        this.staticClasses[package + '.' + name] = classBody;

    },


    checkIfCanBootstrap: function () {

        console.log('this.spikeLoading  : ' + this.spikeLoading);
        console.log('this.namespacesCount : '+this.namespacesCount);
        console.log('this.totalNamespaces : '+this.totalNamespaces);

        if (this.namespacesCount === this.totalNamespaces && this.dependenciesFn) {
            this.bootstrap();

            if (this.appLoaded === true && this.spikeLoading === false) {
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

            if (this.objectiveClasses.hasOwnProperty(className)) {

                if (this.objectiveClasses[className].toString().indexOf('return \'spike.core.LoaderInterface\'') > -1) {

                    var loader = window;

                    var split = className.split('.');
                    for (var i = 0; i < split.length; i++) {

                        loader = loader[split[i]];

                    }

                    loader = new loader([]);
                    return loader;

                }

            }

        }

        throw new Error('Spike Framework: No loader defined');

    },

    getClassByName: function (classFullName) {

        function getObjectFromPath(path) {
            var obj = window;

            var split = path.split('.');
            for (var i = 0; i < split.length; i++) {
                obj = obj[split[i]];
            }

            return obj;
        }

        var packageName = classFullName.substring(0, classFullName.lastIndexOf('.'));
        var className = classFullName.substring(classFullName.lastIndexOf('.')+1, classFullName.length);
        var clazz = getObjectFromPath(packageName)[className];

        return clazz;

    },

    getClassInstance: function (classFullName, argsArray) {
        var clazz = this.getClassByName(classFullName);
        return new clazz(argsArray);
    }

};

