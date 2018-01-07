var spike = {
    core: {}
};

spike.core.Assembler = {

    templatesLoaded: false,
    appLoaded: false,

    namespacesCount: 0,

    staticClasses: {},
    objectiveClasses: {},

    /**
     var newObjectShallow = extend(object1, object2, object3);
     var newObjectDeep = extend(true, object1, object2, object3);
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
                    if (deep && Object.prototype.toString.call(obj[prop]) === '[object Object]') {
                        extended[prop] = extend(true, extended[prop], obj[prop]);
                    } else {
                        extended[prop] = obj[prop];
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

    getDotPath: function (package) {

        var obj = window;

        package = package.split(".");
        for (var i = 0, l = package.length; i < l; i++) {

            if(obj[package[i]] === undefined){
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

        //     namespaceCreator();
        // }else{
            this.objectiveClasses[package + '.' + names[0]] = namespaceCreator;

        this.checkIfCanBootstrap();

    },

    createStaticClass: function (package, name, inherits, classBody) {

        if(name.indexOf(package) > -1){
            name = name.replace(package+'.', '');
        }

        this.namespacesCount++;
        this.createDotPath(package + '.' + name, null);

        if (inherits === null) {
            inherits = {};
        } else {
            inherits = this.getDotPath(inherits);
        }

        //if(package.indexOf('spike.core') > -1){
        //     this.createDotPath(package + '.' + name, this.extend({}, inherits, classBody));
        // }else{
            this.staticClasses[package + '.' + name] = { package: package + '.' + name, inherits: inherits, classBody: classBody };
      //  }

        this.checkIfCanBootstrap();

    },


    checkIfCanBootstrap: function(){

        if(this.namespacesCount === window.__spike_tn){
            this.bootstrap();

            if(this.appLoaded === true){
                spike.core.System.init();
            }

        }

    },

    bootstrap: function(){

        var arrayOrder = [];
        var mapOrdered = {};
        var orderPrefix = 0;

        for(var className in this.staticClasses){

            var classDefinition = this.staticClasses[className];
            mapOrdered[orderPrefix+'_'+Object.keys(classDefinition.inherits).length] = classDefinition;
            arrayOrder.push(orderPrefix+'_'+Object.keys(classDefinition.inherits).length);

            orderPrefix++;
        }

        arrayOrder.sort(function(a,b){
            return a.split('_')[1] > b.split('_')[1] ? 1 : -1;
        });

        for(var i = 0; i < arrayOrder.length; i++){
            this.createDotPath(mapOrdered[arrayOrder[i]].package, this.extend({}, mapOrdered[arrayOrder[i]].inherits, mapOrdered[arrayOrder[i]].classBody));
        }

        for(var className in this.objectiveClasses){
            this.objectiveClasses[className]();
        }

        this.loadTemplates();

    },

    loadTemplates: function(){

        var self = this;

        if(this.templatesLoaded === false){

            if(document.querySelector('[templates-src]') === null){
                throw new Error('Spike Framework: Cannot find script tag with templates-src definition')
            }

            if(document.querySelector('[app-src]') === null){
                throw new Error('Spike Framework: Cannot find script tag with app-src definition')
            }

            var script = document.createElement("script");
            script.type = "application/javascript";
            script.src = document.querySelector('[templates-src]').getAttribute('templates-src');
            script.onload = function(){
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

    findLoaderClass: function(){

        for(var className in this.objectiveClasses){

            if(this.objectiveClasses[className].toString().indexOf('LoaderInterface.apply') > -1){

               var loader = window;

               var split = className.split('.');
               for(var i = 0; i < split.length; i++){

                   loader = loader[split[i]];

               }

               loader = new loader();

               return  loader;
            }

        }

        throw new Error('Spike Framework: No loader defined');

    },

    getClassObject: function(className, argsArray){

        function getObjectFromPath(path){
            var obj = window;

            var split = path.split('.');
            for(var i = 0; i < split.length; i++){
                obj = obj[split[i]];
            }

            return obj;
        }

        function countArgs(str){
            return str.split('_').length - 1;
        }

        var classObject = null;

        var classArgs = countArgs(className);

        if(classArgs !== argsArray.length){

            var classStrictName = className.split('.')[className.split('.').length -1];

            var classPackage = getObjectFromPath(className.replace('.'+classStrictName,''));


            for(var classNameInPackage in classPackage){

                if(countArgs(classNameInPackage) === argsArray.length){
                    classObject = classPackage[classNameInPackage];
                }

            }

        }

        console.log(classObject);
        console.log(className);

        if(classObject == null){
            classObject = getObjectFromPath(className);
        }

        console.log(classObject);

        if(classObject.length !== argsArray.length){
            spike.core.Log.warn('Spike Assembler: Skipping arguments for {0}', [className]);
        }

        classObject = classObject.apply(this, argsArray);

        console.log(classObject);

        return classObject;

    }

};

