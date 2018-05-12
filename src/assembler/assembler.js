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

  spikeLoading: false,

  throwError: function (message) {
    throw new Error('Spike Framework: ' + message);
  },

  resetNamespaces: function (namespacesCount, package) {
    this.totalNamespaces = namespacesCount;
    this.namespacesCount = 0;
    this.spikeLoading = false;

    if (package === 'spike.core') {
      this.spikeLoading = true;
    } else {
      this.staticClasses = {};
      this.objectiveClasses = {};
    }

  },

  extendDynamicClass: function (from, to) {

    if (from === null) {
      return to;
    }

    from = from('EXT');
    return this.extend(from, to);

  },

  constructSuper: function ($this) {

    // console.log($this.getSuper());
    //  console.log(typeof $this.getSuper());
    if ($this.getSuper() == 'null') {
      //  console.log('return');
      return;
    }

    $this.super = spike.core.Assembler.getClassByName($this.getSuper());

    if ($this.super !== null) {
      $this.super = $this.super('EXT');
    }

    spike.core.Assembler.constructSuper($this.super);

    // console.log($this);

  },

  extend: function (from, to) {

    if (to !== null && to !== undefined) {

      var overrides = {};
      var supers = {};

      for (var prop in from) {

        if (from.hasOwnProperty(prop)) {

          if (to[prop] !== undefined) {
            supers[prop] = from[prop];
            overrides[prop] = to[prop];
          } else {
            to[prop] = from[prop];
          }

        }

      }

      for (var prop in overrides) {
        to[prop] = overrides[prop];
      }

      to.super = function () {
        return spike.core.Assembler.getClassByName(this.getSuper());
      };

    }

    return to;

  },

  getDotPathObject: function (obj, package) {

    package = package.split(".");
    for (var i = 0, l = package.length; i < l; i++) {

      if (obj[package[i]] === undefined) {
        break;
      }

      obj = obj[package[i]];

    }

    return obj;

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
      this.throwError('FATAL No package declaration');
    }

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
    this.createDotPath(classFullName, namespaceCreator);

    this.objectiveClasses[classFullName] = namespaceCreator;

  },

  createStaticClass: function (package, name, inheritsPackage, classBody) {

    if (name.indexOf(package) > -1) {
      name = name.replace(package + '.', '');
    }

    this.namespacesCount++;
    var classBody = classBody();
    if (inheritsPackage && inheritsPackage !== 'null') {
      var inheritsClass = this.getClassByName(inheritsPackage);
      if (inheritsClass === undefined) {
        this.throwError('Superclass ' + inheritsPackage + 'not found');
      }

      this.extend(inheritsClass, classBody);
    }

    this.staticClasses[package + '.' + name] = classBody;
    this.createDotPath(package + '.' + name, classBody);

  },


  checkIfCanBootstrap: function () {

    if (this.namespacesCount !== this.totalNamespaces) {
      this.throwError("FATAL Some namespaces damaged");
    }

    if (this.namespacesCount === this.totalNamespaces) {
      this.bootstrap();

      if (this.appLoaded === true && this.spikeLoading === false) {
        spike.core.System.init();
      }

    }

  },

  bootstrap: function () {
    //
    // for (var className in this.objectiveClasses) {
    //   this.objectiveClasses[className]();
    // }

    this.loadTemplates();

  },

  loadTemplates: function () {

    var self = this;

    if (this.templatesLoaded === false) {

      if (document.querySelector('[templates-src]') === null) {
        this.throwError('Cannot find script tag with templates-src definition');
      }

      if (document.querySelector('[app-src]') === null) {
        this.throwError('Cannot find script tag with app-src definition')
      }

      var script = document.createElement("script");
      script.type = "application/javascript";
      script.src = document.querySelector('[templates-src]').getAttribute('templates-src');
      script.onload = function () {

        self.templatesLoaded = true;

        self.namespacesCount = 0;
        self.appLoaded = true;
        var app = document.createElement("script");
        app.type = "application/javascript";
        app.src = document.querySelector('[app-src]').getAttribute('app-src');
        document.body.appendChild(app);


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

          if (loader === null) {
            this.throwError('No loader defined');
          }

          loader = loader();
          return loader;

        }

      }

    }

    this.throwError('No loader defined');

  },

  findConfigClass: function () {

    for (var className in this.staticClasses) {

      if (this.staticClasses.hasOwnProperty(className)) {

        if (this.staticClasses[className].getSuper() === 'spike.core.Config') {
          return this.staticClasses[className];
        }

      }

    }

    this.throwError('No config defined');

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
    var className = classFullName.substring(classFullName.lastIndexOf('.') + 1, classFullName.length);

    return getObjectFromPath(packageName)[className];

  },

  getClassSuper: function (module) {

    if (module.super) {
      return this.getClassSuper(module.super());
    } else {
      return module.getClass();
    }

  },

  getClassExtendingList: function (module, inheritsList) {

    inheritsList = inheritsList || [];

    if (module.super) {
      inheritsList.push(module.getClass());

      if(spike.core.Util.isFunction(module.super)){
        return this.getClassExtendingList(module.super()('EXT'), inheritsList);
      }else{
        return this.getClassExtendingList(module.super, inheritsList);
      }

    } else {
      inheritsList.push(module.getClass());
      return inheritsList;
    }

  },

  getClassInstance: function (classFullName, argsArray) {
    var clazz = this.getClassByName(classFullName);

    if (clazz === undefined) {
      this.throwError('Class ' + classFullName + ' not found');
    }


    argsArray.unshift(null);

    return this.newCall(clazz, argsArray);

  },

  newCall: function (cls, args) {
    return new (Function.prototype.bind.apply(cls, args));
  },

  destroy: function () {
    this.objectiveClasses = null;
    this.staticClasses = null;
  }

};

function getElementById(id) {
  return document.querySelector('[sp-id="' + id + '"]');
}

function getElementBySpikeId(element, id) {

  return element.querySelector('[sp-id="' + id + '"]');
}

function getSpikeId(element) {

  if (!element) {
    spike.core.Log.warn('Get id on not existing element');
    return null;
  }

  if (element.nodeType === 3 || element.nodeType === 8) {
    spike.core.Log.warn('Get id on text element');
    return null;
  }

  return element.getAttribute('sp-id');
}

function setSpikeId(element, id) {

  if (!element) {
    spike.core.Log.warn('Set id on not existing element');
    return null;
  }

  if (element.nodeType === 3 || element.nodeType === 8) {
    spike.core.Log.warn('Set id on text element');
    return null;
  }


  element.setAttribute('sp-id', id);

}