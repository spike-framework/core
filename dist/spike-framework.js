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

}spike.core.Assembler.resetNamespaces(25, 'spike.core');spike.core.Assembler.createStaticClass('spike.core','Config', 'null',function(){var __compilant = {};var $this = __compilant;__compilant = {languageFilePath: "/{lang}.json",html5Mode: false,mobileRun: false,showLog: true,showObj: true,showDebug: false,showWarn: true,showOk: true,mainController: null,initialView: null,rootPath: 'app',lang: "en",getSuper: function(){var $this=this; return 'null'; },getClass: function(){var $this=this; return 'spike.core.Config'; },}; return __compilant; });spike.core.Assembler.createStaticClass('spike.core','Errors', 'null',function(){var __compilant = {};var $this = __compilant;__compilant = {messages: {

CACHED_PROMISE_DEPRECADES: '@createCachedPromise has been deprecated. Use @cache param instead',
REST_API_NULL_PATHPARAM: 'REST endpoint has undefined or null path params: {0}',
APPLICATION_EVENT_CALLBACK_NULL: 'Applicaton event listener {0} is null',
APPLICATION_EVENT_NOT_EXIST: 'Application event {0} not exists',
APPLICATION_EVENT_ALREADY_EXIST: 'Application event {0} already exists',
ROUTING_ENABLED_NOT_DEFINED: 'Routing is enabled but not defined in Config',
ROUTE_NAME_NOT_EXIST: 'Route name {0} not exists',
ROUTE_NAME_EXIST: 'Route name {0} already exists, must be unique',
INTERCEPTOR_ALREADY_REGISTRED: 'Interceptor {0} is already registred',
REDIRECT_NO_PATH: 'Try redirect to path but path argument is not defined',
TRANSLATION_PARSING: 'Translation parsing error for language {0}',
TEMPLATE_NOT_FOUND_ERROR: 'Template named {0} not found',
INITIAL_VIEW_ERROR: 'No initial view with name: {0}',
WEBSQL_SUPPORT: 'No WebSQL support in this browser',
PATH_DEFINITION: 'Path URI and Path object cannot be empty',
PATH_ALREADY_EXIST: 'Path {0} is already defined',
PATH_PATTERN_ALREADY_EXIST: 'Path {0} is already defined. Pattern {1} is duplicated',
MODULE_NOT_EXIST: 'Try rendering not existing module',
RESTRICTED_NAME: 'Name {0} is restricted in usage in application',
TRANSLATION_MESSAGE_NOT_FOUND: 'Translation for message {0} not found',
TRANSLATION_NOT_EXIST: 'No defined language: {0}',
TRANSLATION_LOAD_WARN: 'Translation file for language: {0} cannot be downloaded, status: {1}',
OUTSIDE_CONTEXT_COMPONENT_NOT_FOUND: 'Component {0} outside "spike-view" is not defined and cannot be rendered',
OUTSIDE_CONTEXT_COMPONENT_NOT_GLOBAL: 'Component {0} outside "spike-view" cannot be rendered because is not GLOBAL',
OUTSIDE_CONTEXT_COMPONENT_NO_NAME: 'One of global component has not defined name',

SPIKE_APP_NOT_DEFINED: 'No DOM element with {0} or {1} attribute specified',
REQUEST_WRONG_PARAMS: 'Request url and type not defined',
JSON_PARSE_ERROR: 'JSON parse error during execution {0}',

TRIGGER_NOT_DEFINED: 'Trigger {0} is not defined for scope {1}'

},errors: [],throwError: function (errorMessage, errorMessageBinding) {var $this=this;

var error = 'Spike Framework: ' + spike.core.Util.bindStringParams(errorMessage, errorMessageBinding);
this.errors.push(error);
this.printExceptions();
throw new Error(error);

},printExceptions: function () {var $this=this;

for (var i = 0; i < this.errors.length; i++) {
console.error('Error ' + i + ': ' + this.errors[i]);
}

},throwWarn: function (warnMessage, warnMessageBinding) {var $this=this;
spike.core.Log.warn('Spike Framework: ' + spike.core.Util.bindStringParams(warnMessage, warnMessageBinding));
},getSuper: function(){var $this=this; return 'null'; },getClass: function(){var $this=this; return 'spike.core.Errors'; },}; return __compilant; });spike.core.Assembler.createStaticClass('spike.core','Events', 'null',function(){var __compilant = {};var $this = __compilant;__compilant = {allowedEvents: [
'click',
'change',
'keyup',
'keydown',
'keypress',
'blur',
'focus',
'dblclick',
'die',
'hover',
'keydown',
'submit',
'load',
'unload'
],__linkReferences: {},bindEvents: function(){var $this=this;

for (var k = 0; k < this.allowedEvents.length; k++) {

document.addEventListener(this.allowedEvents[k], function(e){

if(e.target){

if(e.target.hasAttribute('spike-event')){

var eventId = e.target.getAttribute('spike-event-'+e.type+'-link');

if(eventId !== null){
$this.__linkReferences[eventId](e);
}

}

}

}, true);

}

},linkEvent: function(eventFn){var $this=this;

var linkId = spike.core.Util.hash();
$this.__linkReferences[linkId] = eventFn;
return linkId;

},getSuper: function(){var $this=this; return 'null'; },getClass: function(){var $this=this; return 'spike.core.Events'; },}; return __compilant; });spike.core.Assembler.defineNamespace('spike.core.EventsInterface',function(firstArgument){var __compilant = {};var $this = __compilant;__compilant.constructor=function(args){var __args = [];if (args.length == 1) {    if (args.length == 1 && args[0] instanceof Array) {        __args = args.length == 0 ? args : [args];    } else {        __args = args.length == 0 ? args : args;    }} else if (args === undefined) {    __args = [];} else {    __args = args;}if($this['constructor_'+__args.length] !== undefined){$this['constructor_'+__args.length].apply($this, __args);}else{throw new Error('Spike: No matching constructor found spike.core.EventsInterface with arguments count: '+__args.length);} return $this; };__compilant.constructor_0=function(){if(this['constructor_'+arguments.length] !== undefined){$this['constructor_'+arguments.length].apply(this, arguments);}else{throw new Error('Spike: No matching constructor found spike.core.EventsInterface with arguments count: '+arguments.length);}};__compilant.constructor_0=function(){};__compilant.onIncompatible=function(){

};__compilant.onRender=function(){

};__compilant.domEvents=function(){

};__compilant.onOnline=function(){
};__compilant.onOffline=function(){
};__compilant.onBack=function(){
};__compilant.onDeviceReady=function(){
};__compilant.onReady=function(){
};__compilant.onRouteChange=function(){

};__compilant.getSuper=function(){ return 'null'; };__compilant.getClass=function(){ return 'spike.core.EventsInterface'; };spike.core.Assembler.extendDynamicClass(null,__compilant);if(firstArgument === 'EXT') {return __compilant;} else {return __compilant.constructor(arguments);}});spike.core.Assembler.defineNamespace('spike.core.XhrInterface',function(firstArgument){var __compilant = {};var $this = __compilant;__compilant.constructor=function(args){var __args = [];if (args.length == 1) {    if (args.length == 1 && args[0] instanceof Array) {        __args = args.length == 0 ? args : [args];    } else {        __args = args.length == 0 ? args : args;    }} else if (args === undefined) {    __args = [];} else {    __args = args;}if($this['constructor_'+__args.length] !== undefined){$this['constructor_'+__args.length].apply($this, __args);}else{throw new Error('Spike: No matching constructor found spike.core.XhrInterface with arguments count: '+__args.length);} return $this; };__compilant.constructor_0=function(){if(this['constructor_'+arguments.length] !== undefined){$this['constructor_'+arguments.length].apply(this, arguments);}else{throw new Error('Spike: No matching constructor found spike.core.XhrInterface with arguments count: '+arguments.length);}};__compilant.constructor_0=function(){};__compilant.xhrFields= {
withCredentials: false
};__compilant.onBefore=function(){};__compilant.onComplete=function(){};__compilant.onCatch=function(){};__compilant.getSuper=function(){ return 'null'; };__compilant.getClass=function(){ return 'spike.core.XhrInterface'; };spike.core.Assembler.extendDynamicClass(null,__compilant);if(firstArgument === 'EXT') {return __compilant;} else {return __compilant.constructor(arguments);}});spike.core.Assembler.defineNamespace('spike.core.RoutingInterface',function(firstArgument){var __compilant = {};var $this = __compilant;__compilant.constructor=function(args){var __args = [];if (args.length == 1) {    if (args.length == 1 && args[0] instanceof Array) {        __args = args.length == 0 ? args : [args];    } else {        __args = args.length == 0 ? args : args;    }} else if (args === undefined) {    __args = [];} else {    __args = args;}if($this['constructor_'+__args.length] !== undefined){$this['constructor_'+__args.length].apply($this, __args);}else{throw new Error('Spike: No matching constructor found spike.core.RoutingInterface with arguments count: '+__args.length);} return $this; };__compilant.constructor_0=function(){if(this['constructor_'+arguments.length] !== undefined){$this['constructor_'+arguments.length].apply(this, arguments);}else{throw new Error('Spike: No matching constructor found spike.core.RoutingInterface with arguments count: '+arguments.length);}};__compilant.constructor_0=function(){};__compilant.create=function(router){

};__compilant.getSuper=function(){ return 'null'; };__compilant.getClass=function(){ return 'spike.core.RoutingInterface'; };spike.core.Assembler.extendDynamicClass(null,__compilant);if(firstArgument === 'EXT') {return __compilant;} else {return __compilant.constructor(arguments);}});spike.core.Assembler.defineNamespace('spike.core.LoaderInterface',function(firstArgument){var __compilant = {};var $this = __compilant;__compilant.constructor=function(args){var __args = [];if (args.length == 1) {    if (args.length == 1 && args[0] instanceof Array) {        __args = args.length == 0 ? args : [args];    } else {        __args = args.length == 0 ? args : args;    }} else if (args === undefined) {    __args = [];} else {    __args = args;}if($this['constructor_'+__args.length] !== undefined){$this['constructor_'+__args.length].apply($this, __args);}else{throw new Error('Spike: No matching constructor found spike.core.LoaderInterface with arguments count: '+__args.length);} return $this; };__compilant.constructor_0=function(){if(this['constructor_'+arguments.length] !== undefined){$this['constructor_'+arguments.length].apply(this, arguments);}else{throw new Error('Spike: No matching constructor found spike.core.LoaderInterface with arguments count: '+arguments.length);}};__compilant.constructor_0=function(){};__compilant.loadApplication=function(){

};__compilant.onLoadApplication=function(){
};__compilant.getSuper=function(){ return 'null'; };__compilant.getClass=function(){ return 'spike.core.LoaderInterface'; };spike.core.Assembler.extendDynamicClass(null,__compilant);if(firstArgument === 'EXT') {return __compilant;} else {return __compilant.constructor(arguments);}});spike.core.Assembler.defineNamespace('spike.core.ModalInterface',function(firstArgument){var __compilant = {};var $this = __compilant;__compilant.constructor=function(args){var __args = [];if (args.length == 1) {    if (args.length == 1 && args[0] instanceof Array) {        __args = args.length == 0 ? args : [args];    } else {        __args = args.length == 0 ? args : args;    }} else if (args === undefined) {    __args = [];} else {    __args = args;}if($this['constructor_'+__args.length] !== undefined){$this['constructor_'+__args.length].apply($this, __args);}else{throw new Error('Spike: No matching constructor found spike.core.ModalInterface with arguments count: '+__args.length);} return $this; };__compilant.constructor_0=function(){if(this['constructor_'+arguments.length] !== undefined){$this['constructor_'+arguments.length].apply(this, arguments);}else{throw new Error('Spike: No matching constructor found spike.core.ModalInterface with arguments count: '+arguments.length);}};__compilant.constructor_0=function(){};__compilant.modals= [];__compilant.onRender=function(modal){
this.modals.push(modal);
};__compilant.onShow=function(modal){
modal.rootSelector().style = 'display: block;';
};__compilant.onHide=function(modal){
modal.rootSelector().style = 'display: hide;';
};__compilant.onConstruct=function(modalElement){
return modalElement;
};__compilant.onDestroy=function(modal){

for(var i = 0; i < this.modals.length; i++){

if(this.modals[i].elementId === modal.elementId){
this.modals.splice(i, 1);
}

}

};__compilant.removeAll=function(){

for(var i = 0; i < this.modals.length; i++){
this.modals[i].destroy();
}

this.modals = [];

};__compilant.getSuper=function(){ return 'null'; };__compilant.getClass=function(){ return 'spike.core.ModalInterface'; };spike.core.Assembler.extendDynamicClass(null,__compilant);if(firstArgument === 'EXT') {return __compilant;} else {return __compilant.constructor(arguments);}});spike.core.Assembler.createStaticClass('spike.core','spike.core.System', 'null',function(){var __compilant = {};var $this = __compilant;__compilant = {config: null,eventsInterface: null,modalInterface: null,xhrInterface: null,routing: null,idCounter: 1,attributes: {
APP: 'spike-app',
VIEW: 'spike-view',
MODALS: 'spike-modals',
},version: '3.0.0',currentController: null,previousController: null,currentRenderedController: null,viewSelector: null,appViewSelector: null,modalsSelector: null,loader: null,globalElements: [],setConfig: function(configObject){var $this=this;
this.config = configObject;
},setRouting: function(routing){var $this=this;
this.routing = routing;
},setEventsInterface: function(eventsInterface){var $this=this;
this.eventsInterface = eventsInterface;
},setXhrInterface: function(xhrInterface){var $this=this;
this.xhrInterface = xhrInterface;
},setModalInterface: function(modalInterface){var $this=this;
this.modalInterface = modalInterface;
},assignId: function(){var $this=this;
idCounter++;
return 'element-'+idCounter;
},getCurrentController: function () {var $this=this;

var endpoint = spike.core.Router.getCurrentViewData().endpoint;

if (endpoint) {
return endpoint.controller;
}

return this.currentController || this.config.mainController;
},execOnRenderEvent: function () {var $this=this;

if (this.eventsInterface.onRender) {
this.eventsInterface.onRender();
}

},renderModal: function (modalObject, modalInitialData, afterRenderCallback) {var $this=this;

spike.core.Log.debug('Invoke system.renderModal', []);
spike.core.Log.log('Rendering modal {0}', [modalObject.name]);

if (modalObject.checkNetwork === true) {
app.cordova.checkNetwork();
}

if (modalInitialData === undefined) {
modalInitialData = null;
}

modalObject.render(modalInitialData);

spike.core.System.execOnRenderEvent();

if (afterRenderCallback) {
afterRenderCallback();
}

},renderController: function (controller, afterRenderCallback) {var $this=this;
spike.core.Log.debug('Invoke system.renderController with params', []);
spike.core.Log.log('Rendering controller {0}', [controller.getClass()]);

if (controller.scrollTop === true) {
window.scrollTo(0,0);
}

this.modalInterface.removeAll();



if(this.currentRenderedController){
this.currentRenderedController.destroy();
}

controller.render();

spike.core.System.execOnRenderEvent();

if (afterRenderCallback) {
afterRenderCallback();
}


},render: function (moduleClass, moduleInitialModel, afterRenderCallback) {var $this=this;

if (!moduleClass) {
spike.core.Errors.throwError(spike.core.Errors.messages.MODULE_NOT_EXIST);
}


spike.core.Router.clearCacheViewData();

var module = spike.core.Assembler.getClassInstance(moduleClass, [moduleInitialModel]);

var inheritsModuleList = spike.core.Assembler.getClassExtendingList(module);

if (inheritsModuleList.indexOf('spike.core.Controller') > -1) {
spike.core.System.renderController(module, afterRenderCallback);
} else if (inheritsModuleList.indexOf('spike.core.Modal') > -1) {
spike.core.System.renderModal(module, afterRenderCallback);
}

},getView: function () {var $this=this;

if(this.viewSelector === null){
this.viewSelector = document.querySelector('['+this.attributes.VIEW+']');
}

return this.viewSelector;

},getAppView: function(){var $this=this;

if(this.appViewSelector === null){
this.appViewSelector = document.querySelector('['+this.attributes.APP+']');
}

return this.appViewSelector;

},getModalsView: function(){var $this=this;

if(this.modalsSelector === null){
this.modalsSelector = document.querySelector('['+this.attributes.MODALS+']');
}

return this.modalsSelector;

},verifyViews: function(){var $this=this;

if(this.getView() === null || this.getModalsView() === null){
spike.core.Errors.throwError(spike.core.Errors.messages.SPIKE_APP_NOT_DEFINED, [this.attributes.VIEW, this.attributes.MODALS]);
}

},init: function () {var $this=this;

spike.core.Log.init();

spike.core.Reconcile.constructRestrictedAttributes();

this.loader = spike.core.Assembler.findLoaderClass();
this.config = spike.core.Assembler.findConfigClass();
this.loader.loadApplication();

spike.core.Log.debug('Invoke spike.core.System.init with params', []);

if(this.config === null){
this.setConfig(new spike.core.Config());
}

if(this.modalInterface === null){
this.setModalInterface(new spike.core.ModalInterface());
}

if(this.eventsInterface === null){
this.setEventsInterface(new spike.core.EventsInterface());
}

if(this.xhrInterface === null){
this.setXhrInterface(new spike.core.XhrInterface());
}

spike.core.Log.log('Destroy assembler');
spike.core.Assembler.destroy();

spike.core.Log.warn('Spike version: {0}', [spike.core.System.version]);
spike.core.Log.ok('Spike application initializing.');

spike.core.System.getView().setAttribute('sp-id', 'view-'+spike.core.Util.hash());

this.verifyViews();
spike.core.Router.detectHTML5Mode();
spike.core.Events.bindEvents();

spike.core.Message.loadLanguage().then(function(){

spike.core.Log.log('Translations loaded');

if ($this.eventsInterface.onReady !== undefined) {
$this.eventsInterface.onReady();
}

spike.core.Router.registerRouter();
spike.core.Watchers.createWatchLoop();
$this.initGlobalElements();

$this.loader.onLoadApplication();

spike.core.Log.ok('Spike application ready to work.');

});

},initGlobalElements: function(){var $this=this;

var globalElements = document.querySelectorAll('spike[sp-global-element]');

for(var i = 0; i < globalElements.length; i++){

setSpikeId(globalElements[i], 'global-'+spike.core.Util.hash());
var className = globalElements[i].getAttribute('sp-global-element');

var globalElement = spike.core.Assembler.getClassInstance(className, [getSpikeId(globalElements[i])]);
this.globalElements.push(globalElement);

}

},getSuper: function(){var $this=this; return 'null'; },getClass: function(){var $this=this; return 'spike.core.System'; },}; return __compilant; });spike.core.Assembler.createStaticClass('spike.core','Log', 'null',function(){var __compilant = {};var $this = __compilant;__compilant = {init: function(){var $this=this;
if (!window.console) window.console = {};
if (!window.console.log) window.console.log = function () { };
},obj: function (jsObject) {var $this=this;

if (spike.core.System.config.showObj) {
console.log(jsObject);
}

},log: function (logMessage, logData) {var $this=this;

if (spike.core.System.config.showLog) {
this.print(logMessage, logData, 'LOG');
}

},templateLog: function (logMessage, logData) {var $this=this;

if (spike.core.System.config.showLog) {
this.print(logMessage, logData, 'TEMPLATE_LOG');
}

},error: function (errorMessage, errorData) {var $this=this;

if (spike.core.System.config.showError) {
this.print(errorMessage, errorData, 'ERROR');
}

},debug: function (debugMessage, debugData) {var $this=this;

if (spike.core.System.config.showDebug) {
this.print(debugMessage, debugData, 'DEBUG');
}

},warn: function (warnMessage, warnData) {var $this=this;

if (spike.core.System.config.showWarn) {
this.print(warnMessage, warnData, 'WARN');
}

},ok: function (okMessage, okData) {var $this=this;

if (spike.core.System.config.showOk) {
this.print(okMessage, okData, 'OK');
}

},print: function (message, data, type) {var $this=this;

if (typeof message !== 'string') {
message = JSON.stringify(message);
}

if (data) {
message = spike.core.Util.bindStringParams(message, data);
}

var color = '';
switch (type) {
case 'TEMPLATE_LOG' :
color = 'chocolate ';
break;
case 'LOG' :
color = 'blue';
break;
case 'ERROR' :
color = 'red';
break;
case 'DEBUG' :
color = 'gray';
break;
case 'WARN' :
color = 'orange';
break;
case 'OK' :
color = 'green';
break;
default:
color = 'black';
}

console.log('%c' + spike.core.Util.currentDateLog() + ' Spike Framework: ' + message, 'color: ' + color);

},getSuper: function(){var $this=this; return 'null'; },getClass: function(){var $this=this; return 'spike.core.Log'; },}; return __compilant; });spike.core.Assembler.createStaticClass('spike.core','spike.core.Selectors', 'null',function(){var __compilant = {};var $this = __compilant;__compilant = {cacheUsageCounter: 0,selectorsCache: {},clearSelectorsCache: function () {var $this=this;
this.selectorsCache = {};
},clearSelectorInCache: function (selectorId) {var $this=this;

if (this.selectorsCache[selectorId]) {
this.selectorsCache[selectorId] = null;
}

},createFormsSelectors: function(element, selectors){var $this=this;

var formsWithNames = element.querySelectorAll('form[name]');

function getSelectorFn(name, newName) {
return function() {

var selector = spike.core.Selectors.selectorsCache[newName];

if (selector === undefined) {
selector = document.querySelector('form[name="'+newName+'"]');
selector.plainName = name;
selector.serialize = spike.core.Util.serializeForm.bind(selector);

spike.core.Selectors.selectorsCache[newName] = selector;
} else {
spike.core.Selectors.cacheUsageCounter++;
}

return selector;

};
};

for(var i = 0; i < formsWithNames.length; i++){

if(formsWithNames[i].getAttribute('sp-keep-name') != null){
continue;
}

var name = formsWithNames[i].getAttribute('name');

var newName = name + '-' + spike.core.Util.hash();
selectors.forms[name] = getSelectorFn(name, newName);
formsWithNames[i].setAttribute('name', newName);

}

return element.innerHTML;

},createNamesSelectors: function(element, selectors){var $this=this;

var elementsWithNames = element.querySelectorAll('[name]');

function getSelectorFn(name, newName) {
return function() {

var selector = spike.core.Selectors.selectorsCache[newName];

if (selector === undefined) {
selector = document.querySelector('[name="'+newName+'"]');
selector.plainName = name;
spike.core.Selectors.selectorsCache[newName] = selector;
} else {
spike.core.Selectors.cacheUsageCounter++;
}

return selector;

};
};

for(var i = 0; i < elementsWithNames.length; i++){

if(elementsWithNames[i].getAttribute('sp-keep-name') != null || elementsWithNames[i].tagName.toLowerCase() === 'form' || elementsWithNames[i].type === 'radio'){
continue;
}

var name = elementsWithNames[i].getAttribute('name');

var newName = name + '-' + spike.core.Util.hash();
selectors.names[name] = getSelectorFn(name, newName);
elementsWithNames[i].setAttribute('name', newName);

}

return element.innerHTML;

},createIdSelectors: function(element, selectors, eventsSelectors, linksSelectors){var $this=this;

var elementsWithId = element.querySelectorAll('[sp-handle]');

function getSelectorFn(newId) {
return function() {

var selector = spike.core.Selectors.selectorsCache[newId];

if (selector === undefined) {
selector = document.querySelector('[sp-handle="'+newId+'"]');
selector.plainId = newId;
spike.core.Selectors.selectorsCache[newId] = selector;
} else {
spike.core.Selectors.cacheUsageCounter++;
}

return selector;

};
};

for(var i = 0; i < elementsWithId.length; i++){

var newId = elementsWithId[i].getAttribute('sp-handle') + '-sp-' + spike.core.Util.hash();

selectors[elementsWithId[i].getAttribute('sp-handle')] = getSelectorFn(newId);

if(elementsWithId[i].getAttribute('spike-href') != null){
linksSelectors.push(newId);
}

elementsWithId[i].setAttribute('sp-handle', newId);

}

return element.innerHTML;

},createUniqueSelectors: function (scope) {var $this=this;

var element = document.createElement('div');
element.innerHTML = scope.compiledHtml;

scope.selector = {
names: {},
forms: {}
};

scope.eventsSelectors = [];
scope.linksSelectors = [];

newCompiledHtml = this.createIdSelectors(element, scope.selector, scope.eventsSelectors, scope.linksSelectors);

scope.compiledHtml = newCompiledHtml;

},createUniqueSelectorsForElement: function(scope, element){var $this=this;

var newCompiledHtml = this.createFormsSelectors(element, scope.selector, scope.selector);
newCompiledHtml = this.createNamesSelectors(element, scope.selector);
newCompiledHtml = this.createIdSelectors(element, scope.selector, scope.eventsSelectors, scope.linksSelectors);

return newCompiledHtml;

},getSuper: function(){var $this=this; return 'null'; },getClass: function(){var $this=this; return 'spike.core.Selectors'; },}; return __compilant; });spike.core.Assembler.createStaticClass('spike.core','Util', 'null',function(){var __compilant = {};var $this = __compilant;__compilant = {currentDateLog: function () {var $this=this;
return new Date().toLocaleTimeString();
},isFunction: function (functionToCheck) {var $this=this;
var getType = {};
return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
},bindStringParams: function (string, objectOrArrayParams) {var $this=this;

if (!string) {
return '';
}

if (string.indexOf('{') === -1 || !objectOrArrayParams) {
return string;
}

try {

if (objectOrArrayParams instanceof Array) {


for (var i = 0; i < objectOrArrayParams.length; i++) {
string = string.replace('{' + i + '}', $this.isObject(objectOrArrayParams[i]) ? JSON.stringify(objectOrArrayParams[i]) : objectOrArrayParams[i])
}

} else {

for (var paramName in objectOrArrayParams) {
string = string.replace('{' + paramName + '}', $this.isObject(objectOrArrayParams[paramName]) ? JSON.stringify(objectOrArrayParams[paramName]) : objectOrArrayParams[paramName]);
}

}

} catch (err) {
console.log(err);
}

return string;

},isObject: function(obj){var $this=this;
return typeof obj === 'object';
},getRadioValue: function(radio){var $this=this;

var value = null;
var radios = radio.parentNode.querySelectorAll('input[type=radio][name="'+radio.name+'"]');

for(var i = 0; i < radios.length; i++){

if(radios[i].checked === true){
value = radios[i].value;
break;
}

}

return value;

},serializeForm: function(){var $this=this;

var serializedObject = {};

var serializeField = function(field){

var value = field.value;
var name = field.getAttribute('sp-name');

if(field.type === 'radio'){

if(field.checked === true){
value = field.value;
serializedObject[name] = value;
}

} else if (field.type == 'checkbox') {
value = field.checked;
serializedObject[name] = value;
}else{
serializedObject[name] = value;
}

};

var fields = this.querySelectorAll('input[name], select[name], textarea[name]');

for(var i = 0; i < fields.length; i++){
serializeField(fields[i]);
}

return serializedObject;

},isEmpty: function (obj) {var $this=this;

if (obj === undefined || obj === null) {
return true;
}

if (typeof obj === 'string') {
if (obj.trim().length === 0) {
return true;
}
}

return false;

},tryParseNumber: function (obj) {var $this=this;

if (!this.isEmpty(obj) && this.isNumeric(obj)) {

if(obj.indexOf('e') > -1 || obj.indexOf('E') > -1 || obj.charAt(0) === '0'){
return obj;
}

if (this.isInt(parseFloat(obj))) {
return parseInt(obj, 10);
} else {
return parseFloat(obj);
}

}

return obj;


},isNumeric: function( obj ) {var $this=this;
return ( typeof obj === "number" || typeof obj === "string" ) && !isNaN( obj - parseFloat( obj ) );
},isInt: function (n) {var $this=this;
return Number(n) === n && n % 1 === 0;
},isFloat: function (n) {var $this=this;
return Number(n) === n && n % 1 !== 0;
},isNull: function (obj) {var $this=this;

if (obj === undefined || obj === null) {
return true;
}

return false;

},preparePathDottedParams: function (url, params) {var $this=this;

for (var prop in params) {
url = url.replace(':' + prop, params[prop]);
}

return url;

},removeUndefinedPathParams: function (url) {var $this=this;
return url.split('/undefined').join('').split('/null').join('');
},prepareUrlParams: function (url, params) {var $this=this;

var i = 0;
for (var prop in params) {

if (i === 0) {
url = url + '?' + prop + '=' + params[prop];
} else {
url = url + '&' + prop + '=' + params[prop];
}

i++;

}

return url;

},findStringBetween: function (str, first, last) {var $this=this;

var r = new RegExp(first + '(.*?)' + last, 'gm');
var arr = str.match(r);

if (arr === null || arr.length === 0) {
return [];
}

var arr2 = [];

for (var i = 0; i < arr.length; i++) {
arr2.push(arr[i].replace(first, '').replace(last, ''));
}

return arr2;

},hash: function () {var $this=this;
var text = "";
var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

for (var i = 0; i < 10; i++)
text += possible.charAt(Math.floor(Math.random() * possible.length));

return text;
},hashString: function(str) {var $this=this;

var hash = 5381, i    = str.length;

while(i) {
hash = (hash * 33) ^ str.charCodeAt(--i);
}

return hash >>> 0;
},escapeQuotes: function (text) {var $this=this;

try {
text = text.replace(/"/g, "&quot;").replace(/'/g, "&quot;");
} catch (err) {
console.log(err);
Log.warn('Could not escape single quotes in string: ' + text);
}

return text;

},bindTranslationParams: function (string, objectOrArrayParams) {var $this=this;

if(!string){
return '';
}

if(string.indexOf('{') === -1 || !objectOrArrayParams){
return string;
}

if (objectOrArrayParams instanceof Array) {

for (var i = 0; i < objectOrArrayParams.length; i++) {
string = string.replace('{' + i + '}', objectOrArrayParams[i])
}

} else {

for (var paramName in objectOrArrayParams) {
string = string.replace('{' + paramName + '}', objectOrArrayParams[paramName]);
}

}

return string;

},getSuper: function(){var $this=this; return 'null'; },getClass: function(){var $this=this; return 'spike.core.Util'; },}; return __compilant; });spike.core.Assembler.defineNamespace('spike.core.Request',function(firstArgument){var __compilant = {};var $this = __compilant;__compilant.constructor=function(args){var __args = [];if (args.length == 1) {    if (args.length == 1 && args[0] instanceof Array) {        __args = args.length == 0 ? args : [args];    } else {        __args = args.length == 0 ? args : args;    }} else if (args === undefined) {    __args = [];} else {    __args = args;}if($this['constructor_'+__args.length] !== undefined){$this['constructor_'+__args.length].apply($this, __args);}else{throw new Error('Spike: No matching constructor found spike.core.Request with arguments count: '+__args.length);} return $this; };__compilant.constructor_0=function(){if(this['constructor_'+arguments.length] !== undefined){$this['constructor_'+arguments.length].apply(this, arguments);}else{throw new Error('Spike: No matching constructor found spike.core.Request with arguments count: '+arguments.length);}};__compilant.constructor_1=function(config){

this.config = this.setConfig(config);
this.xhr = this.createXHR();

this.xhr.alias = this.config.alias;

this.setXhrInterface();
this.setEvents();
this.setHeaders();

this.config.beforeSend();
spike.core.System.xhrInterface.onBefore(this.xhr, this);

this.xhr.send(this.config.data);


};__compilant.constructor_0=function(){};__compilant.config= null;__compilant.xhr= null;__compilant.catchCallbacks= [];__compilant.thenCallbacks= [];__compilant.alwaysCallbacks= [];__compilant.response= null;__compilant.responseType= 'json';__compilant.STATUS= {
DONE: 4,
LOADING: 3,
HEADERS_RECEIVED: 2,
OPENED: 1,
UNSENT: 0
};__compilant.setXhrInterface=function(){

for(var option in spike.core.System.xhrInterface.xhrFields){
this.xhr[option] = spike.core.System.xhrInterface.xhrFields[option];
}

};__compilant.setConfig=function(config){

if(config === undefined || config === null){
spike.core.Errors.throwError(spike.core.Errors.messages.REQUEST_WRONG_PARAMS, []);
}

if(config.url === undefined || config.type === undefined){
spike.core.Errors.throwError(spike.core.Errors.messages.REQUEST_WRONG_PARAMS, []);
}

if(config.headers === undefined){
config.headers = {};
}

if(config.contentType === undefined){
config.contentType = 'application/json';
}

config.headers['Content-Type'] = config.contentType;

if(config.request === undefined){
config.request = {};
}

if(typeof config.request !== 'string'){

try {
config.data = JSON.stringify(config.data);
}catch(e){
console.error(e);
spike.core.Errors.thrownError(spike.core.Errors.JSON_PARSE_ERROR, [config.url]);
}

}

if(config.beforeSend === undefined){
config.beforeSend = function() { };
}

if(config.complete === undefined){
config.complete = function() { };
}

return config;

};__compilant.setEvents=function(){

this.xhr.open(this.config.type, this.config.url, true);

this.xhr.onreadystatechange = function() {

if($this.xhr.readyState === $this.STATUS.DONE && $this.xhr.status === 200) {

if($this.responseType === 'json'){

try {
$this.xhr.responseJSON = JSON.parse($this.xhr.responseText);
$this.response = JSON.parse($this.xhr.responseText);
$this.resolveThen($this.response, $this.xhr, $this.xhr.status);
$this.resolveAlways($this.xhr, $this.response, $this.xhr.status);
}catch(e){
console.error(e);
$this.resolveCatch($this.xhr, 0, e);
$this.resolveAlways($this.xhr, $this.response, $this.xhr.status);
}


}else if($this.responseType === 'xml'){
$this.resolveThen($this.xhr.responseXML, $this.xhr, $this.xhr.status);
$this.resolveAlways($this.xhr, $this.response, $this.xhr.status);
}

}else if($this.xhr.readyState === $this.STATUS.DONE && $this.xhr.status === 204){
$this.resolveThen(null, $this.xhr, $this.xhr.status);
$this.resolveAlways($this.xhr, $this.response, $this.xhr.status);
}else if($this.xhr.readyState === $this.STATUS.DONE && $this.xhr.status !== 200){
$this.resolveCatch($this.xhr, $this.xhr.status, new Error('Response error: '+$this.xhr.status));
$this.resolveAlways($this.xhr, $this.response, $this.xhr.status);
}


};


};__compilant.setHeaders=function(){

this.xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

for(var headerName in this.config.headers){
this.xhr.setRequestHeader(headerName, this.config.headers[headerName]);
}

if(this.config.headers['Content-Type'].indexOf('xml') > -1){
this.responseType = 'xml';
}

};__compilant.always=function(callback){
this.alwaysCallbacks.push(callback);
return this;
};__compilant.resolveAlways=function(response, xhr, status){

for(var i = 0; i < this.alwaysCallbacks.length; i++){
this.alwaysCallbacks[i](response, xhr, status);
}

};__compilant.then=function(callback){
this.thenCallbacks.push(callback);
return this;
};__compilant.resolveThen=function(response, xhr, status){

spike.core.System.xhrInterface.onComplete(response, xhr, status);
for(var i = 0; i < this.thenCallbacks.length; i++){
this.thenCallbacks[i](response, xhr, status);
}

};__compilant.catch=function(callback){
this.catchCallbacks.push(callback);
return this;
};__compilant.resolveCatch=function(xhr, status, thrownError){

spike.core.System.xhrInterface.onCatch(xhr, status, thrownError);
for(var i = 0; i < this.catchCallbacks.length; i++){
this.catchCallbacks[i](xhr, status, thrownError);
}

};__compilant.createXHR=function(){

var xhr;
if (window.XMLHttpRequest) {
xhr = new XMLHttpRequest();
} else if (window.ActiveXObject) {
try {
xhr = new ActiveXObject("Msxml2.XMLHTTP");
} catch (e) {
console.warn(e);
xhr = new ActiveXObject("Microsoft.XMLHTTP");
}
}

return xhr;

};__compilant.getSuper=function(){ return 'null'; };__compilant.getClass=function(){ return 'spike.core.Request'; };spike.core.Assembler.extendDynamicClass(null,__compilant);if(firstArgument === 'EXT') {return __compilant;} else {return __compilant.constructor(arguments);}});spike.core.Assembler.defineNamespace('spike.core.MultiRequest',function(firstArgument){var __compilant = {};var $this = __compilant;__compilant.constructor=function(args){var __args = [];if (args.length == 1) {    if (args.length == 1 && args[0] instanceof Array) {        __args = args.length == 0 ? args : [args];    } else {        __args = args.length == 0 ? args : args;    }} else if (args === undefined) {    __args = [];} else {    __args = args;}if($this['constructor_'+__args.length] !== undefined){$this['constructor_'+__args.length].apply($this, __args);}else{throw new Error('Spike: No matching constructor found spike.core.MultiRequest with arguments count: '+__args.length);} return $this; };__compilant.constructor_0=function(){if(this['constructor_'+arguments.length] !== undefined){$this['constructor_'+arguments.length].apply(this, arguments);}else{throw new Error('Spike: No matching constructor found spike.core.MultiRequest with arguments count: '+arguments.length);}};__compilant.constructor_1=function(promises){

$this.promisesLength = promises.length;

for(var i = 0; i < promises.length; i++){

promises[i].always(function(xhr, response, status){
$this.countResponses++;

if(this instanceof spike.core.Request){

if(xhr.response){
xhr.response = JSON.parse(xhr.response);
}

$this.responseData.push(xhr);
}else{
$this.responseData.push(xhr);
}

if($this.resolved == false && $this.countResponses === $this.promisesLength){
$this.resolveAlways();
$this.resolved = true;
}

});

}

};__compilant.constructor_0=function(){};__compilant.responseData= [];__compilant.alwaysCallbacks= [];__compilant.countResponses= 0;__compilant.promisesLength= 0;__compilant.resolved= false;__compilant.always=function(callback){
$this.alwaysCallbacks.push(callback);
return $this;
};__compilant.resolveAlways=function(){

for(var i = 0; i < $this.alwaysCallbacks.length; i++){
$this.alwaysCallbacks[i].apply($this, [$this.responseData]);
}

};__compilant.getSuper=function(){ return 'null'; };__compilant.getClass=function(){ return 'spike.core.MultiRequest'; };spike.core.Assembler.extendDynamicClass(null,__compilant);if(firstArgument === 'EXT') {return __compilant;} else {return __compilant.constructor(arguments);}});spike.core.Assembler.createStaticClass('spike.core','spike.core.Rest', 'null',function(){var __compilant = {};var $this = __compilant;__compilant = {cacheData: {},interceptors: {},globalInterceptors: {},interceptor: function (interceptorName, interceptorFunction, isGlobal) {var $this=this;

if (isGlobal) {

if (spike.core.Rest.globalInterceptors[interceptorName]) {
spike.core.Errors.throwError(spike.core.Errors.messages.INTERCEPTOR_ALREADY_REGISTRED, [interceptorName]);
}

spike.core.Rest.globalInterceptors[interceptorName] = interceptorFunction;

} else {

if (spike.core.Rest.interceptors[interceptorName]) {
spike.core.Errors.throwError(spike.core.Errors.messages.INTERCEPTOR_ALREADY_REGISTRED, [interceptorName]);
}

spike.core.Rest.interceptors[interceptorName] = interceptorFunction;

}

},invokeInterceptors: function (requestData, response, promise, interceptors) {var $this=this;

if (interceptors) {

for (var i = 0; i < interceptors.length; i++) {

if (!spike.core.Rest.interceptors[interceptors[i]]) {
spike.core.Errors.throwWarn(spike.core.Errors.messages.INTERCEPTOR_NOT_EXISTS, [interceptors[i]]);
} else {
spike.core.Rest.interceptors[interceptors[i]](response, promise, requestData);
}

}

}

for (var interceptorName in spike.core.Rest.globalInterceptors) {
spike.core.Rest.globalInterceptors[interceptorName](response, promise, requestData);
}

},createCachedPromise: function (url, method, interceptors) {var $this=this;

var data = spike.core.Rest.cacheData[url + '_' + method].data;

var promise = {
result: data,
then: function (callback) {

if (promise.result) {
data = promise.result;
}

var _result = callback(data);

if (_result) {
promise.result = _result;
}

return promise;

},
catch: function () {
return promise;
}
};

spike.core.Rest.invokeInterceptors({}, data, promise, interceptors);

return promise;


},isCached: function (url, method) {var $this=this;

var data = spike.core.Rest.cacheData[url + '_' + method];

if (spike.core.Util.isNull(data)) {
return false;
}

if (data.filled === false) {
return false;
}

if (data.cacheType === 'TIME') {

if (data.cacheTime + data.cachePeriod < new Date().getTime()) {
return false;
}

return true;

} else if (data.cacheType === 'PERSIST') {
return true;
}

return false;

},get: function (url, propertiesObject) {var $this=this;

propertiesObject = propertiesObject || {};

if (typeof url === 'string') {

if (spike.core.Rest.isCached(url, 'GET', propertiesObject)) {
return spike.core.Rest.createCachedPromise(url, 'GET', propertiesObject.interceptors || []);
} else {
return spike.core.Rest.getDelete(url, 'GET', propertiesObject);
}

} else {
spike.core.Errors.throwWarn(spike.core.Errors.messages.CACHED_PROMISE_DEPRECADES);
}

},delete: function (url, propertiesObject) {var $this=this;

propertiesObject = propertiesObject || {};

if (typeof url === 'string') {

if (spike.core.Rest.isCached(url, 'DELETE', propertiesObject)) {
return spike.core.Rest.createCachedPromise(url, 'DELETE', propertiesObject.interceptors || []);
} else {
return spike.core.Rest.getDelete(url, 'DELETE', propertiesObject);
}

} else {
spike.core.Errors.throwWarn(spike.core.Errors.messages.CACHED_PROMISE_DEPRECADES);
}


},update: function (url, request, propertiesObject) {var $this=this;

propertiesObject = propertiesObject || {};

if (typeof url === 'string') {

if (spike.core.Rest.isCached(url, 'PUT', propertiesObject)) {
return spike.core.Rest.createCachedPromise(url, 'PUT', propertiesObject.interceptors || []);
} else {
return spike.core.Rest.postPut(url, 'PUT', request, propertiesObject);
}

} else {
spike.core.Errors.throwWarn(spike.core.Errors.messages.CACHED_PROMISE_DEPRECADES);
}

},put: function (url, request, propertiesObject) {var $this=this;
return spike.core.Rest.update(url, request, propertiesObject);
},post: function (url, request, propertiesObject) {var $this=this;

propertiesObject = propertiesObject || {};

if (typeof url === 'string') {

if (spike.core.Rest.isCached(url, 'POST', propertiesObject)) {
return spike.core.Rest.createCachedPromise(url, 'POST', propertiesObject.interceptors || []);
} else {
return spike.core.Rest.postPut(url, 'POST', request, propertiesObject);
}

} else {
spike.core.Errors.throwWarn(spike.core.Errors.messages.CACHED_PROMISE_DEPRECADES);
}

},getDelete: function (url, method, propertiesObject) {var $this=this;

var pathParams = propertiesObject.pathParams;
var headers = propertiesObject.headers;
var urlParams = propertiesObject.urlParams;
var interceptors = propertiesObject.interceptors || [];

var preparedUrl = url;

if (pathParams !== undefined && pathParams !== null) {
preparedUrl = spike.core.Util.preparePathDottedParams(url, pathParams);

if (preparedUrl.indexOf('/undefined') > -1 || preparedUrl.indexOf('/null') > -1) {
spike.core.Errors.throwWarn(spike.core.Errors.messages.REST_API_NULL_PATHPARAM, [preparedUrl]);
preparedUrl = spike.core.Util.removeUndefinedPathParams(preparedUrl);
}

}

if (urlParams !== undefined && urlParams !== null) {
preparedUrl = spike.core.Util.prepareUrlParams(preparedUrl, urlParams);
}

var dataType = "json";
var contentType = "application/json; charset=utf-8";

if (!spike.core.Util.isNull(propertiesObject.cache) && spike.core.Util.isNull(spike.core.Rest.cacheData[url + '_' + method])) {
spike.core.Rest.createCacheObject(url, method, propertiesObject.cache);
}

var promiseObj = {
url: preparedUrl,
type: method,
beforeSend: function () {

},
complete: function (xhr) {

if (!spike.core.Util.isNull(propertiesObject.cache)) {
spike.core.Rest.fillCache(url, method, xhr.responseJSON);
}

}

};

if(propertiesObject.async !== undefined){
promiseObj.async = propertiesObject.async;
}

if (!headers) {
headers = {}
}

if (headers['Content-Type'] !== null && headers['Content-Type'] !== undefined) {
contentType = headers['Content-Type'];
}

if (headers['Data-Type'] !== null && headers['Data-Type'] !== undefined) {
dataType = headers['Data-Type'];
headers['Data-Type'] = undefined;
}


if (headers['Content-Type'] !== null) {
promiseObj.contentType = headers['Content-Type'] || contentType;
}

if (headers['Data-Type'] !== null) {
promiseObj.dataType = headers['Data-Type'] || dataType;
headers['Data-Type'] = undefined;
}

var newHeaders = {};
for (var prop in headers) {
if (headers[prop] !== undefined && headers[prop] !== null) {
newHeaders[prop] = headers[prop];
}
}

headers = newHeaders;


promiseObj.headers = headers;
promiseObj.alias = propertiesObject.alias;

var promise = new spike.core.Request(promiseObj);

var requestData = {url: url, method: method, pathParams: pathParams, urlParams: urlParams, headers: headers};

promise.then(function (result) {
spike.core.Rest.invokeInterceptors(requestData, result, promise, interceptors);
});

promise.catch(function (error) {
spike.core.Rest.invokeInterceptors(requestData, error, promise, interceptors);
});

return promise;


},postPut: function (url, method, request, propertiesObject) {var $this=this;

var pathParams = propertiesObject.pathParams;
var headers = propertiesObject.headers;
var urlParams = propertiesObject.urlParams;
var interceptors = propertiesObject.interceptors || [];

var preparedUrl = url;

if (pathParams !== undefined && pathParams !== null) {
preparedUrl = spike.core.Util.preparePathDottedParams(url, pathParams);

if (preparedUrl.indexOf('/undefined') > -1 || preparedUrl.indexOf('/null') > -1) {
spike.core.Errors.throwWarn(spike.core.Errors.messages.REST_API_NULL_PATHPARAM, [preparedUrl]);
preparedUrl = spike.core.Util.removeUndefinedPathParams(preparedUrl);
}

}

if (urlParams !== undefined && urlParams !== null) {
preparedUrl = spike.core.Util.prepareUrlParams(preparedUrl, urlParams);
}

var dataType = "json";
var contentType = "application/json; charset=utf-8";

if (!spike.core.Util.isNull(propertiesObject.cache) && spike.core.Util.isNull(spike.core.Rest.cacheData[url + '_' + method])) {
spike.core.Rest.createCacheObject(url, method, propertiesObject.cache);
}

var promiseObj = {
url: preparedUrl,
data: request,
type: method,
beforeSend: function () {

},
complete: function (xhr) {

if (!spike.core.Util.isNull(propertiesObject.cache)) {
spike.core.Rest.fillCache(url, method, xhr.responseJSON);
}

}

};

if(propertiesObject.async !== undefined){
promiseObj.async = propertiesObject.async;
}

if (!headers) {
headers = {}
}

if (headers['Content-Type'] !== null && headers['Content-Type'] !== undefined) {
contentType = headers['Content-Type'];
}

if (headers['Data-Type'] !== null && headers['Data-Type'] !== undefined) {
dataType = headers['Data-Type'];
headers['Data-Type'] = undefined;
}


if (headers['Content-Type'] !== null) {
promiseObj.contentType = headers['Content-Type'] || contentType;
}

if (headers['Data-Type'] !== null) {
promiseObj.dataType = headers['Data-Type'] || dataType;
headers['Data-Type'] = undefined;
}

var newHeaders = {};
for (var prop in headers) {
if (headers[prop] !== undefined && headers[prop] !== null) {
newHeaders[prop] = headers[prop];
}
}

headers = newHeaders;
promiseObj.headers = headers;
promiseObj.alias = propertiesObject.alias;

var promise = new spike.core.Request(promiseObj);

var requestData = {
url: url,
method: method,
request: request,
pathParams: pathParams,
urlParams: urlParams,
headers: headers
};

promise.then(function (result) {
spike.core.Rest.invokeInterceptors(requestData, result, promise, interceptors);
});

promise.catch(function (error) {
spike.core.Rest.invokeInterceptors(requestData, error, promise, interceptors);
});

return promise;

},fillCache: function (url, method, data) {var $this=this;

spike.core.Rest.cacheData[url + '_' + method].filled = true;
spike.core.Rest.cacheData[url + '_' + method].data = data;
spike.core.Rest.cacheData[url + '_' + method].cacheTime = new Date().getTime();

},createCacheObject: function (url, method, cache) {var $this=this;

spike.core.Rest.cacheData[url + '_' + method] = {
filled: false,
cacheTime: new Date().getTime(),
cacheType: cache === true ? 'PERSIST' : 'TIME',
cachePeriod: cache === true ? null : cache,
data: null
};

},getSuper: function(){var $this=this; return 'null'; },getClass: function(){var $this=this; return 'spike.core.Rest'; },}; return __compilant; });spike.core.Assembler.createStaticClass('spike.core','spike.core.Message', 'null',function(){var __compilant = {};var $this = __compilant;__compilant = {waitingForTranslations: {},messages: {},loadLanguage: function(){var $this=this;
return spike.core.Message.add(spike.core.System.config.lang, spike.core.Util.bindStringParams(spike.core.System.config.languageFilePath, { lang: spike.core.System.config.lang }));
},add: function (languageName, languageFilePath) {var $this=this;

spike.core.Log.log('register translation {0}', [languageName]);

this.waitingForTranslations[languageName] = false;

var promise = new spike.core.Request({
url: languageFilePath,
type: 'GET'
});

promise.then(function (data) {

spike.core.Message.setTranslation(languageName, data);

return data;

});

promise.catch(function (error) {

if (error.status === 200) {
spike.core.Message.setTranslation(languageName, error.responseText);
} else {
spike.core.Message.messages[languageName] = {};
spike.core.Errors.throwWarn(spike.core.Errors.messages.TRANSLATION_LOAD_WARN, [languageName, error.status]);
}

return error;

});

return promise;

},setTranslation: function (languageName, translationData) {var $this=this;

if (typeof translationData === 'string') {

try {
translationData = JSON.parse(translationData);
} catch (err) {
console.error(err);
spike.core.Errors.throwError(spike.core.Errors.messages.TRANSLATION_PARSING, [languageName]);
}

}

spike.core.Message.messages[languageName] = translationData;
spike.core.Message.waitingForTranslations[languageName] = true;
},get: function (messageName, arrayOrMapParams) {var $this=this;

var message = this.messages[spike.core.System.config.lang][messageName];
if(!message){
spike.core.Errors.throwWarn(spike.core.Errors.messages.TRANSLATION_MESSAGE_NOT_FOUND, [messageName])
}

if(arrayOrMapParams && message){
message = spike.core.Util.bindTranslationParams(message, arrayOrMapParams);
}

return message || messageName;
},getSuper: function(){var $this=this; return 'null'; },getClass: function(){var $this=this; return 'spike.core.Message'; },}; return __compilant; });spike.core.Assembler.createStaticClass('spike.core','Templates', 'null',function(){var __compilant = {};var $this = __compilant;__compilant = {templates: {},scopesRef: {},compileTemplate: function(scope, name){var $this=this;
return this.templates[spike.core.Assembler.sourcePath+"_"+name](scope);
},includeTemplate: function(name, scope){var $this=this;

name = name.split('.').join('_')+'_html';
return this.templates[spike.core.Assembler.sourcePath+"_"+name](scope);

},getSuper: function(){var $this=this; return 'null'; },getClass: function(){var $this=this; return 'spike.core.Templates'; },}; return __compilant; });spike.core.Assembler.createStaticClass('spike.core','spike.core.Router', 'null',function(){var __compilant = {};var $this = __compilant;__compilant = {preventReloadPage: null,events: {},otherwisePath: '/',pathParamReplacement: 'var',endpoints: {},routerHTML5Mode: false,commonRoutingParams: {},pathFunctionHandler: null,hashChangeInterval: null,lastHashValue: null,getCurrentViewCache: null,getCurrentViewRouteCache: null,getCurrentViewDataCache: null,getCurrentViewDataRouteCache: null,redirectToViewHandler: null,createLinkHandler: null,getRouterFactory: function () {var $this=this;
return {
routingParams: spike.core.Router.routingParamsFunction,
path: spike.core.Router.pathFunction,
other: spike.core.Router.otherFunction
}
},otherFunction: function (pathValue) {var $this=this;
spike.core.Router.otherwisePath = pathValue;
return spike.core.Router.getRouterFactory();
},routingParamsFunction: function(routingParams){var $this=this;
spike.core.Router.commonRoutingParams = routingParams;
return spike.core.Router.getRouterFactory();
},pathFunction: function (pathValue, pathObject) {var $this=this;

if (spike.core.Util.isEmpty(pathValue) || spike.core.Util.isNull(pathObject)) {
spike.core.Errors.throwError(spike.core.Errors.messages.PATH_DEFINITION);
}

if(spike.core.Router.pathFunctionHandler){
pathValue = spike.core.Router.pathFunctionHandler(pathValue, pathObject);
}

spike.core.Router.registerPath(pathValue, pathObject.controller, pathObject.routingParams, pathObject.onRoute, pathObject.name, pathObject.modal, pathObject.defaultController);

return spike.core.Router.getRouterFactory();

},registerPath: function (pathValue, pathController, routingParams, onRoute, routeName, pathModal, pathModalDefaultController) {var $this=this;

if (spike.core.Router.endpoints[pathValue]) {
spike.core.Errors.throwError(spike.core.Errors.messages.PATH_ALREADY_EXIST, [pathValue]);
}

if (routeName && spike.core.Router.routeNameExist(routeName)) {
spike.core.Errors.throwError(spike.core.Errors.messages.ROUTE_NAME_EXIST, [routeName]);
}

var pathPattern = spike.core.Router.createPathPattern(pathValue);

if (spike.core.Router.pathPatternExist(pathPattern)) {
spike.core.Errors.throwError(spike.core.Errors.messages.PATH_PATTERN_ALREADY_EXIST, [pathValue, pathPattern.join("").split(spike.core.Router.pathParamReplacement).join("/PATH_PARAM")]);
}

spike.core.Router.endpoints[pathValue] = {
pathValue: pathValue,
controller: pathController,
defaultController: pathModalDefaultController,
modal: pathModal,
routingParams: spike.core.Router.mergeRoutingParams(routingParams || {}),
onRoute: onRoute,
pathPattern: pathPattern,
routeName: routeName,
isModal: !spike.core.Util.isEmpty(pathModal)
};

},byName: function (routeName) {var $this=this;

for (var pathValue in spike.core.Router.endpoints) {

if (spike.core.Router.endpoints[pathValue].routeName === routeName) {
return pathValue;
}

}

spike.core.Errors.throwError(spike.core.Errors.messages.ROUTE_NAME_NOT_EXIST, [routeName]);

},routeNameExist: function (routeName) {var $this=this;

for (var pathValue in spike.core.Router.endpoints) {

if (spike.core.Router.endpoints[pathValue].routeName === routeName) {
return true;
}

}

return false;

},pathPatternExist: function (pathPattern) {var $this=this;

for (var pathValue in spike.core.Router.endpoints) {

if (spike.core.Router.endpoints[pathValue].pathPattern.pattern.join("") === pathPattern.pattern.join("")) {
return true;
}

}

return false;

},createPathPattern: function (pathValue) {var $this=this;

var pathPattern = {
pattern: [],
pathParams: []
};

var split = pathValue.substring(0, pathValue.indexOf('?') > -1 ? pathValue.indexOf('?') : pathValue.length).split('/');

for (var i = 0; i < split.length; i++) {

if (split[i].indexOf(':') > -1) {
pathPattern.pathParams.push(split[i].replace(':', ''));
pathPattern.pattern.push(spike.core.Router.pathParamReplacement)
} else if (split[i].trim().length > 0) {
pathPattern.pattern.push(split[i])
}

}

return pathPattern;

},detectHTML5Mode: function () {var $this=this;

if (window.history && window.history.pushState && spike.core.System.config.html5Mode === true) {
spike.core.Router.routerHTML5Mode = true;
}else{
spike.core.System.eventsInterface.onIncompatible('HISTORY_API');
}

},registerRouter: function () {var $this=this;

spike.core.Log.ok('HTML5 router mode status: {0}', [spike.core.Router.routerHTML5Mode]);

if (spike.core.Util.isEmpty(spike.core.System.routing)) {
spike.core.Errors.throwError(spike.core.Errors.messages.ROUTING_ENABLED_NOT_DEFINED, []);
}

spike.core.System.routing.create(spike.core.Router.getRouterFactory());

if (spike.core.Router.routerHTML5Mode === false && window.location.hash.substring(0, 2) !== '#/') {
window.location.hash = '#/';
}

spike.core.Router.renderCurrentView();

if (spike.core.Router.routerHTML5Mode === false) {
this.initHashChangeEvent();
}

},initHashChangeEvent: function(){var $this=this;

function hashChangeCallback(){

if(spike.core.Router.lastHashValue !== window.location.hash){
spike.core.Router.lastHashValue = window.location.hash;
spike.core.Router.onHashChanges();
}

}

spike.core.Router.hashChangeInterval = setInterval(hashChangeCallback, 100);

},onHashChanges: function () {var $this=this;

spike.core.Log.debug('Executes spike.core.Router.onHashChanges');

if (window.location.hash.replace('#', '') === spike.core.Router.preventReloadPage) {
spike.core.Router.preventReloadPage = null;
spike.core.Router.fireRouteEvents();
return false;
}

spike.core.Router.clearCacheViewData();
spike.core.Router.fireRouteEvents();
spike.core.Router.renderCurrentView();

},onHistoryChanges: function () {var $this=this;

if (spike.core.Router.routerHTML5Mode === true) {

spike.core.Log.debug('Executes spike.core.Router.onHistoryChanges');

if (spike.core.Router.getPathName() === spike.core.Router.preventReloadPage) {
spike.core.Router.preventReloadPage = null;
spike.core.Router.fireRouteEvents();
return false;
}

spike.core.Router.clearCacheViewData();
spike.core.Router.fireRouteEvents();
spike.core.Router.renderCurrentView();

}

},fireRouteEvents: function () {var $this=this;

var currentRoute = spike.core.Router.getCurrentRoute();

for(var eventName in spike.core.Router.events){

if (spike.core.Router.events[eventName]) {
spike.core.Router.events[eventName](currentRoute, app.currentController);
}

}

spike.core.System.eventsInterface.onRouteChange(currentRoute, app.currentController);

},onRouteChange: function (eventName, eventFunction) {var $this=this;

if (spike.core.Router.events[eventName]) {
spike.core.Errors.throwWarn(spike.core.Errors.messages.ROUTE_EVENT_ALREADY_REGISTRED, [eventName]);
}

spike.core.Router.events[eventName] = eventFunction;

},offRouteChange: function (eventName) {var $this=this;

if (spike.core.Router.events[eventName]) {
spike.core.Router.events[eventName] = null;
}

},checkPathIntegrity: function (hashPattern, endpointPattern) {var $this=this;

for (var i = 0; i < endpointPattern.pattern.length; i++) {

if (endpointPattern.pattern[i] !== spike.core.Router.pathParamReplacement
&& endpointPattern.pattern[i] !== hashPattern.pattern[i]) {
return false;
}

}

return true;

},getURLParams: function () {var $this=this;
return spike.core.Router.getURLParams();
},getQueryParams: function () {var $this=this;
return spike.core.Router.getURLParams();
},getURLParams: function () {var $this=this;

var params = {};

if (window.location.href.indexOf('?') > -1) {
window.location.href.substring(window.location.href.indexOf('?'), window.location.href.length).replace(/[?&]+([^=&]+)=([^&]*)/gi, function (str, key, value) {
params[key] = spike.core.Util.tryParseNumber(value);

if (!spike.core.Util.isNull(params[key]) && typeof params[key] === 'string') {
if (params[key].indexOf('#/') > -1) {
params[key] = params[key].replace('#/', '');
}
}

});
}

return params;

},getPathParams: function () {var $this=this;
return spike.core.Router.getCurrentViewData().data.pathParams;
},getRoutingParams: function () {var $this=this;
return spike.core.Router.getCurrentViewData().data.routingParams;
},getPathData: function (hashPattern, endpointPattern) {var $this=this;

var urlParams = spike.core.Router.getURLParams();
var pathParams = {};
var pathParamsIndex = 0;
for (var i = 0; i < endpointPattern.pattern.length; i++) {

if (endpointPattern.pattern[i] === spike.core.Router.pathParamReplacement) {
pathParams[endpointPattern.pathParams[pathParamsIndex]] = spike.core.Util.tryParseNumber(hashPattern.pattern[i]);
pathParamsIndex++;
}

}

return {
urlParams: urlParams,
pathParams: pathParams,
};

},clearCacheViewData: function () {var $this=this;

spike.core.Router.getCurrentViewCache = null;
spike.core.Router.getCurrentViewDataCache = null;

},setCacheViewData: function(type, data) {var $this=this;

if(type === 'DATA'){
spike.core.Router.getCurrentViewDataCache = data;
spike.core.Router.getCurrentViewDataRouteCache = spike.core.Router.getCurrentRoute();
}else {
spike.core.Router.getCurrentViewCache = data;
spike.core.Router.getCurrentViewRouteCache = spike.core.Router.getCurrentRoute();
}

},getCurrentView: function () {var $this=this;

if (spike.core.Router.getCurrentViewCache !== null && spike.core.Router.getCurrentRoute() != spike.core.Router.getCurrentViewRouteCache) {
spike.core.Log.debug('Using @getCurrentViewCache cache');
return spike.core.Router.getCurrentViewCache;
}

var currentEndpointObject = spike.core.Router.getCurrentViewData();

if(currentEndpointObject.endpoint == null && currentEndpointObject.data == null){
spike.core.Router.redirect(spike.core.Router.otherwisePath);
return;
}

var currentEndpointData = currentEndpointObject.data;
var currentEndpoint = currentEndpointObject.endpoint;

if (currentEndpointData.isModal === true && !spike.core.Util.isEmpty(app.previousController)) {
currentEndpointData.controller = app.previousController;
} else {
currentEndpointData.controller = currentEndpoint.controller;
}

currentEndpointData.defaultController = currentEndpoint.defaultController;
currentEndpointData.modal = currentEndpoint.modal;
currentEndpointData.isModal = currentEndpoint.isModal;
currentEndpointData.routingParams = currentEndpoint.routingParams;
currentEndpointData.onRoute = currentEndpoint.onRoute;
currentEndpointData.onRouteWithModal = function () {
spike.core.System.render(currentEndpointData.modal, currentEndpointData, currentEndpointData.onRoute);
}

spike.core.Router.setCacheViewData('VIEW', currentEndpointData);

return currentEndpointData;

},getCurrentViewData: function () {var $this=this;

if (spike.core.Router.getCurrentViewDataCache !== null && spike.core.Router.getCurrentRoute() != spike.core.Router.getCurrentViewDataRouteCache) {
spike.core.Log.debug('Using @getCurrentViewDataCache cache');
return spike.core.Router.getCurrentViewDataCache;
}

var hash = null;

if (spike.core.Router.routerHTML5Mode === false) {
hash = window.location.hash.replace(/^#\//, '');
} else if (spike.core.Router.getPathName().indexOf('/') > 0) {
hash = '/' + spike.core.Router.getPathName();
} else {
hash = spike.core.Router.getPathName();
}

var hashPattern = spike.core.Router.createPathPattern(hash);

var viewData = {
endpoint: null,
data: null
};

var currentEndpoint = spike.core.Router.findSamePatternEndpoint(hashPattern);
var currentEndpointData = spike.core.Router.getPathData(hashPattern, currentEndpoint.pathPattern);

if (currentEndpoint.isModal === true) {

if (spike.core.Util.isEmpty(app.previousController)) {
currentEndpoint.controller = currentEndpoint.defaultController;
} else {
currentEndpoint.controller = app.previousController;
}

}

currentEndpointData.routingParams = spike.core.Router.mergeRoutingParams(currentEndpoint.routingParams || {});

if(spike.core.Util.isFunction(currentEndpoint.controller)){
currentEndpoint.controller = currentEndpoint.controller(currentEndpointData);
}

viewData = {
endpoint: currentEndpoint,
data: currentEndpointData
};

spike.core.Router.setCacheViewData('DATA', viewData);

return viewData;

},findSamePatternEndpoint: function(hashPattern){var $this=this;

for (var pathValue in spike.core.Router.endpoints) {

var hashPatternPathValue = '';
for(var i = 0; i < hashPattern.pattern.length; i++){
hashPatternPathValue += hashPattern.pattern[i]+'/';
}

if(pathValue+'/' === '/'+hashPatternPathValue){
return spike.core.Router.endpoints[pathValue];
}

}

for (var pathValue in spike.core.Router.endpoints) {

if (spike.core.Router.endpoints[pathValue].pathPattern.pattern.length === hashPattern.pattern.length
&& spike.core.Router.checkPathIntegrity(hashPattern, spike.core.Router.endpoints[pathValue].pathPattern)) {

return spike.core.Router.endpoints[pathValue];

}

}

},mergeRoutingParams: function(routingParams){var $this=this;

for(var prop in spike.core.Router.commonRoutingParams){
if(spike.core.Router.commonRoutingParams.hasOwnProperty(prop)){

if(routingParams[prop] === undefined){
routingParams[prop] = spike.core.Router.commonRoutingParams[prop];
}

}
}

return routingParams;

},setPathParams: function (pathParams) {var $this=this;

var currentViewData = spike.core.Router.getCurrentViewData();

for (var pathParam in pathParams) {

if (currentViewData.data.pathParams[pathParam]
&& !spike.core.Util.isNull(pathParams[pathParam])) {
currentViewData.data.pathParams[pathParam] = pathParams[pathParam];
}

}

spike.core.Router.redirectToView(currentViewData.endpoint.pathValue, currentViewData.data.pathParams, currentViewData.data.urlParams, true);


},setURLParams: function (urlParams) {var $this=this;

var currentViewData = spike.core.Router.getCurrentViewData();

var newURLParams = {};

for (var urlParam in urlParams) {

if (urlParams[urlParam] !== null) {
newURLParams[urlParam] = urlParams[urlParam];
}

}

currentViewData.data.urlParams = newURLParams;

spike.core.Router.redirectToView(currentViewData.endpoint.pathValue, currentViewData.data.pathParams, currentViewData.data.urlParams, true);

},getCurrentRoute: function () {var $this=this;

if (spike.core.Router.routerHTML5Mode === true) {
return spike.core.Router.getPathName().substring(1, spike.core.Router.getPathName().length);
}

return window.location.hash.replace('#/', '');

},redirectToView: function (path, pathParams, urlParams, preventReloadPage) {var $this=this;

spike.core.Router.clearCacheViewData();

if (!path) {
spike.core.Errors.throwError(spike.core.Errors.messages.REDIRECT_NO_PATH);
}

path = path.replace('#/', '/');

if (path[0] !== '/') {
path = '/' + path;
}

path = spike.core.Util.preparePathDottedParams(path, pathParams);
path = spike.core.Util.prepareUrlParams(path, urlParams);

if(spike.core.Router.redirectToViewHandler){
path = spike.core.Router.redirectToViewHandler(path, pathParams, urlParams, preventReloadPage);
}
if (preventReloadPage === true) {
spike.core.Router.preventReloadPage = path;
}

if (spike.core.Router.routerHTML5Mode === true) {
spike.core.Router.pushState(path);
} else {
window.location.hash = path;
}

},pushState: function (path) {var $this=this;
history.pushState({state: path}, null, path);
},getViewData: function () {var $this=this;
var currentViewData = spike.core.Router.getCurrentViewData();
return spike.core.Assembler.extend(currentViewData.endpoint, currentViewData.data);
},reloadView: function () {var $this=this;
spike.core.Router.renderCurrentView();
},renderCurrentView: function () {var $this=this;

var currentEndpointData = spike.core.Router.getCurrentView();

if(currentEndpointData === undefined){
return;
}

if (currentEndpointData.isModal === true) {

spike.core.Log.debug('rendering controller & modal, previous controller: ' + app.previousController);

if (app.previousController === null) {

spike.core.Log.debug('rendering controller & modal, default controller: ' + currentEndpointData.defaultController);

spike.core.System.render(currentEndpointData.defaultController, currentEndpointData, currentEndpointData.onRouteWithModal);
} else {
spike.core.System.render(currentEndpointData.modal, currentEndpointData, currentEndpointData.onRoute);
}

} else {
spike.core.System.render(currentEndpointData.controller, currentEndpointData, currentEndpointData.onRoute);
}

app.previousController = currentEndpointData.controller;

},getPathValueWithoutParams: function (pathValue) {var $this=this;

if (pathValue.indexOf(':') > -1) {
return pathValue.substring(0, pathValue.indexOf(':'));
}

return pathValue;

},redirect: function (path, pathParams, urlParams, preventReloadPage) {var $this=this;
spike.core.Router.redirectToView(path, pathParams, urlParams, preventReloadPage);
},redirectByName: function (routeName, pathParams, urlParams, preventReloadPage) {var $this=this;
spike.core.Router.redirectToView(spike.core.Router.byName(routeName), pathParams, urlParams, preventReloadPage);
},location: function (url, redirectType) {var $this=this;

spike.core.Router.clearCacheViewData();

if (redirectType) {

redirectType = redirectType.toLowerCase();

if (redirectType.indexOf('blank') > -1) {
redirectType = '_blank';
} else if (redirectType.indexOf('self') > -1) {
redirectType = '_self';
} else if (redirectType.indexOf('parent') > -1) {
redirectType = '_parent';
} else if (redirectType.indexOf('top') > -1) {
redirectType = '_top';
}

window.open(url, redirectType);

} else {
window.location = url;
}

},createLink: function (path, pathParams, urlParams) {var $this=this;

if (spike.core.Router.routerHTML5Mode === false) {

if (path.substring(0, 1) === '/') {
path = '#' + path;
} else if (path.substring(0, 1) !== '#') {
path = '#/' + path;
}

}

path = spike.core.Util.preparePathDottedParams(path, pathParams);
path = spike.core.Util.prepareUrlParams(path, urlParams);

if(spike.core.Router.createLinkHandler){
path = spike.core.Router.createLinkHandler(path, pathParams, urlParams);
}

return path;

},back: function () {var $this=this;
window.history.go(-1);
},getPathName: function(){var $this=this;
return window.location.pathname;
},bindLinks: function(element){var $this=this;


},bindLinksForElement: function (element) {var $this=this;

for(var i = 0; i < element.linksSelectors.length; i++){

var selector = getElementBySpikeId(document, element.linksSelectors[i]);

selector.addEventListener('click', function (e) {
e.preventDefault();

var link = this.getAttribute('href');

if (spike.core.Router.routerHTML5Mode === true) {
link = link.replace('#', '');

if (link.trim() === '') {
link = '/';
}

} else {

if (link.trim() === '') {
link = '/#/';
}

}

if (link.indexOf('www') > -1 || link.indexOf('http') > -1) {
spike.core.Router.location(link,this.getAttribute('target') || '_blank');
} else {
spike.core.Router.redirect(link);
}

});

}

},getSuper: function(){var $this=this; return 'null'; },getClass: function(){var $this=this; return 'spike.core.Router'; },}; return __compilant; });spike.core.Assembler.defineNamespace('spike.core.Element',function(firstArgument){var __compilant = {};var $this = __compilant;__compilant.constructor=function(args){var __args = [];if (args.length == 1) {    if (args.length == 1 && args[0] instanceof Array) {        __args = args.length == 0 ? args : [args];    } else {        __args = args.length == 0 ? args : args;    }} else if (args === undefined) {    __args = [];} else {    __args = args;}if($this['constructor_'+__args.length] !== undefined){$this['constructor_'+__args.length].apply($this, __args);}else{throw new Error('Spike: No matching constructor found spike.core.Element with arguments count: '+__args.length);} return $this; };__compilant.constructor_0=function(){if(this['constructor_'+arguments.length] !== undefined){$this['constructor_'+arguments.length].apply(this, arguments);}else{throw new Error('Spike: No matching constructor found spike.core.Element with arguments count: '+arguments.length);}};__compilant.constructor_1=function(parentElement){
this.constructor_2(parentElement, null);
};__compilant.constructor_3=function(parentElement,params,elementSelector){
this.elementId = getSpikeId(elementSelector);
this.elementSelector = elementSelector;
this.constructor_2(parentElement, params);
};__compilant.constructor_2=function(parentElement,params){

this.constructor_0();

this.margeParams(params);
this.createTemplatePath();
this.createTemplate();

};__compilant.constructor_0=function(){};__compilant.rendered= false;__compilant.elementId= null;__compilant.elementSelector= null;__compilant.compiledHtml= null;__compilant.childElements= {
WAITING: {},
WORKING: {}
};__compilant.selector= {};__compilant.eventsSelectors= [];__compilant.linksSelectors= [];__compilant.templatePath= null;__compilant.watchers= {};__compilant.rootSelector=function(){

if(this.elementSelector === null){
this.elementSelector = getElementBySpikeId(document, this.elementId);
}

return this.elementSelector;
};__compilant.margeParams=function(params){

if(params){
for(var prop in params){
this[prop] = params[prop];
}
}

};__compilant.mountElement=function(element, childElementId){

this.childElements.WORKING[childElementId] = this.childElements.WAITING[childElementId];

var params = this.childElements.WORKING[childElementId].params;
var elementInstance = null;

elementInstance = new this.childElements.WORKING[childElementId].clazz(this, params, element);
this.childElements.WORKING[childElementId].instance = elementInstance;

element.innerHTML = this.childElements.WORKING[childElementId].instance.compiledHtml;


spike.core.Watchers.observe(this.childElements.WORKING[childElementId].instance);

};__compilant.mountElements=function(){

for(var childElementId in this.childElements.WAITING){

if(!this.childElements.WAITING[childElementId].working){

var element = getElementById(childElementId);

if(element !== null){
this.childElements.WAITING[childElementId].working = true;
this.mountElement(element, childElementId);
}

}

}

};__compilant.include=function(childElementClass, params){

var childElementId = this.createElementId();

this.childElements.WAITING[childElementId] = {
clazz: childElementClass,
params: params
};

return '<div element-element element-id="'+childElementId+'" sp-id="'+childElementId+'" ></div>';//childElement.compiledHtml;

};__compilant.createElementId=function(){
return 'element-'+spike.core.Util.hash();
};__compilant.createTemplatePath=function(){

this.templatePath = '';

var elementPath = this.getClass().split('.');

for(var i = 0; i < elementPath.length; i++){
this.templatePath += elementPath[i]+'_';
}

this.templatePath = this.templatePath.substring(0, this.templatePath.lastIndexOf('_'));
var templateFileName = this.templatePath.substring(this.templatePath.lastIndexOf('_')+1, this.templatePath.length);
templateFileName = templateFileName.substring(0,1).toLowerCase()+templateFileName.substring(1, templateFileName.length);

this.templatePath = this.templatePath.substring(0, this.templatePath.lastIndexOf('_'));
this.templatePath = this.templatePath+'_'+templateFileName+'_html';

return this.templatePath;

};__compilant.createTemplate=function(){

this.compiledHtml = spike.core.Templates.compileTemplate(this, this.templatePath);
spike.core.Selectors.createUniqueSelectors(this);

};__compilant.postConstructChildren=function(){


};__compilant.watch=function(field, watchFn){

if(this.watchers[field] === undefined){

this.watchers[field] = watchFn;

}else{
Log.warn('Watcher for field {0} exist', [field]);
}

};__compilant.destroy=function(){


};__compilant.render=function(){};__compilant.postConstruct=function(){
this.postConstructChildren();
};__compilant.getSuper=function(){ return 'null'; };__compilant.getClass=function(){ return 'spike.core.Element'; };spike.core.Assembler.extendDynamicClass(null,__compilant);if(firstArgument === 'EXT') {return __compilant;} else {return __compilant.constructor(arguments);}});spike.core.Assembler.defineNamespace('spike.core.GlobalElement',function(firstArgument){var __compilant = {};var $this = __compilant;__compilant.constructor=function(args){var __args = [];if (args.length == 1) {    if (args.length == 1 && args[0] instanceof Array) {        __args = args.length == 0 ? args : [args];    } else {        __args = args.length == 0 ? args : args;    }} else if (args === undefined) {    __args = [];} else {    __args = args;}if($this['constructor_'+__args.length] !== undefined){$this['constructor_'+__args.length].apply($this, __args);}else{throw new Error('Spike: No matching constructor found spike.core.GlobalElement with arguments count: '+__args.length);} return $this; };__compilant.constructor_0=function(){if(this['constructor_'+arguments.length] !== undefined){$this['constructor_'+arguments.length].apply(this, arguments);}else{throw new Error('Spike: No matching constructor found spike.core.GlobalElement with arguments count: '+arguments.length);}};__compilant.constructor_1=function(elementId){

this.constructor_0();
this.elementId = elementId;
this.createTemplatePath();
this.createTemplate();
this.render();

};__compilant.constructor_0=function(){};__compilant.render=function(){

this.replaceWith();

spike.core.Watchers.observe(this);

this.rendered = true;

this.postConstructChildren();
this.postConstruct();


};__compilant.replaceWith=function(){

var elementDiv = document.createElement("div");
elementDiv.innerHTML = this.compiledHtml;
elementDiv.setAttribute('element-name', this.getClass());
elementDiv.setAttribute('sp-id', this.elementId);

spike.core.System.getAppView().replaceChild(elementDiv, this.rootSelector());

this.elementSelector = getElementBySpikeId(document, this.elementId);

};__compilant.destroy=function(){
spike.core.Assembler.constructSuper($this); $this.super.destroy();
spike.core.Watchers.unobservable(this);
};__compilant.getSuper=function(){ return 'spike.core.Element'; };__compilant.getClass=function(){ return 'spike.core.GlobalElement'; };spike.core.Assembler.extendDynamicClass(spike.core.Element,__compilant);if(firstArgument === 'EXT') {return __compilant;} else {return __compilant.constructor(arguments);}});spike.core.Assembler.defineNamespace('spike.core.Controller',function(firstArgument){var __compilant = {};var $this = __compilant;__compilant.constructor=function(args){var __args = [];if (args.length == 1) {    if (args.length == 1 && args[0] instanceof Array) {        __args = args.length == 0 ? args : [args];    } else {        __args = args.length == 0 ? args : args;    }} else if (args === undefined) {    __args = [];} else {    __args = args;}if($this['constructor_'+__args.length] !== undefined){$this['constructor_'+__args.length].apply($this, __args);}else{throw new Error('Spike: No matching constructor found spike.core.Controller with arguments count: '+__args.length);} return $this; };__compilant.constructor_0=function(){if(this['constructor_'+arguments.length] !== undefined){$this['constructor_'+arguments.length].apply(this, arguments);}else{throw new Error('Spike: No matching constructor found spike.core.Controller with arguments count: '+arguments.length);}};__compilant.constructor_0=function(){
spike.core.System.currentRenderedController = this;
};__compilant.scrollTop= true;__compilant.checkNetwork= true;__compilant.rootSelector=function(){

if(this.elementSelector === null){
this.elementSelector = getElementBySpikeId(document, this.elementId);
}

return this.elementSelector;
};__compilant.render=function(){

spike.core.System.getView().innerHTML = this.compiledHtml;
this.elementSelector = spike.core.System.getView().firstChild;
this.elementId = this.elementSelector.getAttribute('sp-id');

spike.core.Watchers.observe(this);

this.rendered = true;

this.postConstructChildren();
this.postConstruct();

};__compilant.destroy=function(){
spike.core.Assembler.constructSuper($this); $this.super.destroy();
spike.core.Watchers.unobservable(this);
};__compilant.getSuper=function(){ return 'spike.core.Element'; };__compilant.getClass=function(){ return 'spike.core.Controller'; };spike.core.Assembler.extendDynamicClass(spike.core.Element,__compilant);if(firstArgument === 'EXT') {return __compilant;} else {return __compilant.constructor(arguments);}});spike.core.Assembler.defineNamespace('spike.core.Modal',function(firstArgument){var __compilant = {};var $this = __compilant;__compilant.constructor=function(args){var __args = [];if (args.length == 1) {    if (args.length == 1 && args[0] instanceof Array) {        __args = args.length == 0 ? args : [args];    } else {        __args = args.length == 0 ? args : args;    }} else if (args === undefined) {    __args = [];} else {    __args = args;}if($this['constructor_'+__args.length] !== undefined){$this['constructor_'+__args.length].apply($this, __args);}else{throw new Error('Spike: No matching constructor found spike.core.Modal with arguments count: '+__args.length);} return $this; };__compilant.constructor_0=function(){if(this['constructor_'+arguments.length] !== undefined){$this['constructor_'+arguments.length].apply(this, arguments);}else{throw new Error('Spike: No matching constructor found spike.core.Modal with arguments count: '+arguments.length);}};__compilant.constructor_0=function(){

this.createTemplatePath();
this.createTemplate();
this.render();

};__compilant.visible= false;__compilant.render=function(){

this.elementId = 'modal-'+spike.core.Util.hash();

var modalElement = document.createElement('div');
setSpikeId(modalElement, this.elementId);
modalElement = spike.core.System.modalInterface.onConstruct(modalElement);

spike.core.System.getModalsView().appendChild(modalElement);
this.rootSelector().innerHTML = this.compiledHtml;

spike.core.Watchers.observe(this);

spike.core.System.modalInterface.onRender(this);
this.rendered = true;

this.postConstructChildren();
this.postConstruct();

};__compilant.show=function(){
this.visible = true;
spike.core.System.modalInterface.onShow(this);
};__compilant.hide=function(){
this.visible = false;
spike.core.System.modalInterface.onHide(this);
};__compilant.destroy=function(){

if(this.rendered === true){
this.rootSelector().remove();
spike.core.System.modalInterface.onDestroy(this);
this.visible = false;
spike.core.Assembler.constructSuper($this); $this.super.destroy();
spike.core.Watchers.unobservable(this);
}

};__compilant.getSuper=function(){ return 'spike.core.Element'; };__compilant.getClass=function(){ return 'spike.core.Modal'; };spike.core.Assembler.extendDynamicClass(spike.core.Element,__compilant);if(firstArgument === 'EXT') {return __compilant;} else {return __compilant.constructor(arguments);}});spike.core.Assembler.createStaticClass('spike.core','Broadcaster', 'null',function(){var __compilant = {};var $this = __compilant;__compilant = {applicationEvents: {},register: function (eventName) {var $this=this;

if (!spike.core.Util.isNull(this.applicationEvents[eventName])) {
spike.core.Errors.throwError(spike.core.Errors.messages.APPLICATION_EVENT_ALREADY_EXIST, [eventName]);
}

this.applicationEvents[eventName] = [];

},unsecureRegister: function(eventName){var $this=this;

if (!spike.core.Util.isNull(this.applicationEvents[eventName])) {
spike.core.Errors.throwWarn(spike.core.Errors.messages.APPLICATION_EVENT_ALREADY_EXIST, [eventName]);
return;
}

this.applicationEvents[eventName] = [];
},broadcast: function (eventName, eventData) {var $this=this;

if (spike.core.Util.isNull(this.applicationEvents[eventName])) {
spike.core.Errors.throwError(spike.core.Errors.messages.APPLICATION_EVENT_NOT_EXIST, [eventName]);
}

for(var i = 0; i < this.applicationEvents[eventName].length; i++){
this.applicationEvents[eventName][i](eventData);
}

},listen: function (eventName, eventCallback) {var $this=this;

if (spike.core.Util.isNull(this.applicationEvents[eventName])) {
spike.core.Errors.throwError(spike.core.Errors.messages.APPLICATION_EVENT_NOT_EXIST, [eventName]);
}

if (spike.core.Util.isNull(eventCallback)) {
spike.core.Errors.throwError(spike.core.Errors.messages.APPLICATION_EVENT_CALLBACK_NULL, [eventName]);
}

var isAlreadyRegisteredListener = false;

for(var i = 0; i < this.applicationEvents[eventName].length; i++){

if(this.applicationEvents[eventName][i].toString() === eventCallback.toString()){
isAlreadyRegisteredListener = true;
}

}

if(isAlreadyRegisteredListener === false){
this.applicationEvents[eventName].push(eventCallback);
}

},destroy: function (eventName) {var $this=this;

if (spike.core.Util.isNull(this.applicationEvents[eventName])) {
spike.core.Errors.throwError(spike.core.Errors.messages.APPLICATION_EVENT_NOT_EXIST, [eventName]);
}

this.applicationEvents[eventName] = [];

},getSuper: function(){var $this=this; return 'null'; },getClass: function(){var $this=this; return 'spike.core.Broadcaster'; },}; return __compilant; });spike.core.Assembler.createStaticClass('spike.core','spike.core.Reconcile', 'null',function(){var __compilant = {};var $this = __compilant;__compilant = {restrictedAttributes: [],constructRestrictedAttributes: function(){var $this=this;

spike.core.Reconcile.restrictedAttributes = ['element-element', 'element-id'];

},escape: function (s) {var $this=this;
var n = s;
n = n.replace(/&/g, '&amp;');
n = n.replace(/</g, '&lt;');
n = n.replace(/>/g, '&gt;');
n = n.replace(/"/g, '&quot;');

return n;
},mapElements: function (nodes) {var $this=this;
var map = {};
var tags = {};
var node;

var indices = [];
for (var i = 0, len = nodes.length; i < len; i++) {
node = nodes[i];
var id = spike.core.Reconcile.generateId(node, tags);
map[id] = node;
node._i = i;
node._id = id;
indices.push(i);
}

return {'map': map, 'indices': indices};
},generateId: function (node, tags) {var $this=this;
var tag = (node.tagName) ? node.tagName : 'x' + node.nodeType;

if (!tags[tag]) {
tags[tag] = 0;
}

tags[tag]++;

return tag + tags[tag];
},generateMoves: function (map, nodes, indices, base, reverse, index) {var $this=this;
var moves = [];
var compare = [];
var operateMap = {};
var tags = {};

for (var i = 0, len = nodes.length; i < len; i++) {
var node = nodes[reverse ? (nodes.length - i - 1) : i],
bound = base.childNodes[reverse ? (base.childNodes.length - indices[i] - 1) : indices[i]],
id = spike.core.Reconcile.generateId(node, tags);

if (node.attributes && node.hasAttribute('assume-no-change')) {
continue;
}

if (operateMap[id]) {
continue;
}

var existing = map[id];
if (existing) {
if (existing !== bound) {
var relativeBaseIndex = (reverse ? base.childNodes.length - existing._i - 1 : existing._i);
moves.push({
'action': 'moveChildElement',
'element': existing,
'baseIndex': index + '>' + relativeBaseIndex,
'sourceIndex': index + '>' + i
});

indices.splice(i, 0, indices.splice(relativeBaseIndex, 1)[0]);
}
if (!node.isEqualNode(existing)) {
compare.push([node, existing]);
}
} else {
var inserted = node.cloneNode(true);
var relativeBaseIndex = (reverse ? nodes.length - i - 1 : i);
moves.push({
'action': 'insertChildElement',
'element': inserted,
'baseIndex': index + '>' + relativeBaseIndex,
'sourceIndex': index + '>' + relativeBaseIndex
});
}
operateMap[id] = true;
}

for (var i = 0, len = base.childNodes.length; i < len; i++) {
var remove = base.childNodes[i];
var removeId = remove._id;
if (base.childNodes[i].attributes && base.childNodes[i].hasAttribute('assume-no-change')) {
continue;
}
if (!operateMap[removeId]) {
moves.push({
'action': 'removeChildElement',
'element': remove,
'baseIndex': index + '>' + remove._i,
'sourceIndex': null
});
}
}

return {'compare': compare, 'diff': moves};
},diffString: function (source, base, index, baseElement) {var $this=this;

var o = base == "" ? [] : base.split(/\s+/);
var n = source == "" ? [] : source.split(/\s+/);
var ns = new Object();
var os = new Object();

for (var i = 0; i < n.length; i++) {
if (ns[n[i]] == null)
ns[n[i]] = {
rows: new Array(),
o: null
};
ns[n[i]].rows.push(i);
}

for (var i = 0; i < o.length; i++) {
if (os[o[i]] == null)
os[o[i]] = {
rows: new Array(),
n: null
};
os[o[i]].rows.push(i);
}

for (var i in ns) {
if (ns[i].rows.length == 1 && typeof(os[i]) != "undefined" && os[i].rows.length == 1) {
n[ns[i].rows[0]] = {
text: n[ns[i].rows[0]],
row: os[i].rows[0]
};
o[os[i].rows[0]] = {
text: o[os[i].rows[0]],
row: ns[i].rows[0]
};
}
}

for (var i = 0; i < n.length - 1; i++) {
if (n[i].text != null && n[i + 1].text == null && n[i].row + 1 < o.length && o[n[i].row + 1].text == null &&
n[i + 1] == o[n[i].row + 1]) {
n[i + 1] = {
text: n[i + 1],
row: n[i].row + 1
};
o[n[i].row + 1] = {
text: o[n[i].row + 1],
row: i + 1
};
}
}

for (var i = n.length - 1; i > 0; i--) {
if (n[i].text != null && n[i - 1].text == null && n[i].row > 0 && o[n[i].row - 1].text == null &&
n[i - 1] == o[n[i].row - 1]) {
n[i - 1] = {
text: n[i - 1],
row: n[i].row - 1
};
o[n[i].row - 1] = {
text: o[n[i].row - 1],
row: i - 1
};
}
}

var oSpace = base.match(/\s+/g);
if (oSpace == null) {
oSpace = [''];
} else {
oSpace.push('');
}
var nSpace = source.match(/\s+/g);
if (nSpace == null) {
nSpace = [''];
} else {
nSpace.push('');
}

var changes = [];
var baseIndex = 0;
if (n.length == 0) {
var deletedText = '';
for (var i = 0; i < o.length; i++) {
deletedText += o[i] + oSpace[i];
baseIndex += o[i].length + oSpace[i].length;
}
if (o.length > 0) {
changes.push({
'action': 'deleteText',
'element': baseElement,
'baseIndex': index,
'sourceIndex': index,
'_textStart': 0,
'_textEnd': baseIndex,
'_deleted': deletedText,
'_length': deletedText.length
});
}
} else {
var current = null;
if (n[0].text == null) {
for (var i = 0; i < o.length; i++) {
if (o[i].text != null) {
if (current != null) {
changes.push(current);
}
current = null;
continue;
}

if (current == null) {
current = {
'action': 'deleteText',
'element': baseElement,
'baseIndex': index,
'sourceIndex': index,
'_textStart': baseIndex,
'_textEnd': 0,
'_deleted': '',
'_length': 0
};
}

current['_deleted'] += o[i] + oSpace[i];
current['_length'] = current['_deleted'].length;
baseIndex += current['_length'];
current['_textEnd'] = baseIndex;
}

if (current != null) {
changes.push(current);
current = null;
}
}

var k = 0;
for (var i = 0; i < n.length; i++) {
if (n[i].text == null) {

if (current != null && current['action'] === 'deleteText') {
changes.push(current);
current = null;
}

if (current == null) {
current = {
'action': 'insertText',
'element': baseElement,
'baseIndex': index,
'sourceIndex': index,
'_textStart': baseIndex,
'_textEnd': 0,
'_inserted': '',
'_length': 0
};
}

current['_inserted'] += n[i] + nSpace[i];
current['_length'] = current['_inserted'].length;
baseIndex += current['_length'];
current['_textEnd'] = baseIndex;

} else {
baseIndex += n[i].text.length + nSpace[i].length;
if (n[k].text == null) {
continue;
}
for (k = n[k].row + 1; k < o.length && o[k].text == null; k++) {
if (current != null && current['action'] === 'insertText') {
changes.push(current);
current = null;
}

if (current == null) {
current = {
'action': 'deleteText',
'element': baseElement,
'baseIndex': index,
'sourceIndex': index,
'_textStart': baseIndex,
'_textEnd': 0,
'_deleted': '',
'_length': 0
};
}

current['_deleted'] += o[k] + oSpace[k];
current['_length'] = current['_deleted'].length;
baseIndex += current['_length'];
current['_textEnd'] = baseIndex;
}
}
}

if (current != null) {
changes.push(current);
current = null;
}
}

return changes;
},mapStyleValues: function (styleString) {var $this=this;
var attrs = styleString ? styleString.replace(/\/\*.*\*\//g, '')
.split(/;(?=(?:[^'"]*['"][^'"]*['"])*[^'"]*$)/)
: [];
var map = {};
for (var i = 0; i < attrs.length; i++) {
var item = attrs[i].trim();
if (!item) {
continue;
}
var index = item.indexOf(':');
var name = item.slice(0, index).trim();
var value = item.slice(index + 1).trim();
if (name.length === 0 || value.length === 0) {
continue;
}
map[name] = value;
}
return map;
},diffStyleString: function (source, base, index, baseElement) {var $this=this;
var diffActions = [];

var sourceMap = spike.core.Reconcile.mapStyleValues(source);
var baseMap = spike.core.Reconcile.mapStyleValues(base);
for (var k in sourceMap) {
var sourceVal = sourceMap[k];
var baseVal = baseMap[k];
if (sourceVal != baseVal) {
diffActions.push({
'action': 'setStyleValue',
'name': k,
'element': baseElement,
'baseIndex': index,
'sourceIndex': index,
'_deleted': baseVal,
'_inserted': sourceVal
});
}
}

for (var k in baseMap) {
if (sourceMap[k] == null) {
diffActions.push({
'action': 'removeStyleValue',
'name': k,
'element': baseElement,
'baseIndex': index,
'sourceIndex': index,
'_deleted': baseMap[k]
});
}
}

return diffActions;
},diff: function (source, base, index, processElement) {var $this=this;

var diffActions = [];
if (index == null) {
index = '0'; // 0 for root node
}
if (source.nodeType === base.nodeType && (source.nodeType === 3 || source.nodeType === 8)) {
if (base.nodeValue !== source.nodeValue) {
var textActions = spike.core.Reconcile.diffString(source.nodeValue, base.nodeValue, index, base);
if (textActions.length > 0) {
diffActions = diffActions.concat(textActions);
}
}

return diffActions;
}

if (source.attributes && base.attributes) {
var attributes = source.attributes,
value,
name;


for (var i = base.attributes.length; i--;) {

if(base.attributes[i].nodeName === 'element-id'){
source.setAttribute('sp-id', base.attributes[i].nodeValue);
}

}

for (var i = attributes.length; i--;) {
value = attributes[i].nodeValue;
name = attributes[i].nodeName;

if(spike.core.Reconcile.restrictedAttributes.indexOf(name) > -1){
continue;
}

var val = base.getAttribute(name);
if (val !== value) {
if (val == null) {

diffActions.push({
'action': 'setAttribute',
'name': name,
'element': base,
'baseIndex': index,
'sourceIndex': index,
'_inserted': value
});

} else {
if (name === 'style') {
var styleChanges = spike.core.Reconcile.diffStyleString(value, val, index, base);
if (styleChanges.length > 0) {
diffActions = diffActions.concat(styleChanges);
}
} else {

diffActions.push({
'action': 'setAttribute',
'name': name,
'element': base,
'baseIndex': index,
'sourceIndex': index,
'_deleted': val,
'_inserted': value
});

}
}
}
}

attributes = base.attributes;
for (var i = attributes.length; i--;) {
name = attributes[i].nodeName;

if(spike.core.Reconcile.restrictedAttributes.indexOf(name) > -1){
continue;
}

if (source.getAttribute(name) === null) {
diffActions.push({
'action': 'removeAttribute',
'name': name,
'baseIndex': index,
'sourceIndex': index,
'_deleted': attributes[i].nodeValue
});
}
}
}

var compare = [];
if (source.childNodes && base.childNodes) {
var mapResult = spike.core.Reconcile.mapElements(base.childNodes),
nodes = source.childNodes;

var map = mapResult['map'];
var indices = mapResult['indices'];

var moves = spike.core.Reconcile.generateMoves(map, nodes, indices.slice(0), base, false, index);
if (moves['diff'].length > 1) {
var backwardMoves = spike.core.Reconcile.generateMoves(map, nodes, indices.slice(0), base, true, index);
if (backwardMoves['diff'].length < moves['diff'].length) {
moves = backwardMoves;
}
}
diffActions = diffActions.concat(moves['diff']);
compare = moves['compare'];
}

if (compare.length > 0) {
for (var i = 0, len = compare.length; i < len; i++) {
var sourceChildNode = compare[i][0];
var baseChildNode = compare[i][1];


var childDiffs = [];


if (sourceChildNode.nodeType === 3 || sourceChildNode.nodeType === 8) {
childDiffs = spike.core.Reconcile.diff(
sourceChildNode,
baseChildNode, index + '>' +
baseChildNode._i,
processElement);
} else {

if (sourceChildNode.getAttribute('element-element') === null && baseChildNode.getAttribute('element-element') === null) {
childDiffs = spike.core.Reconcile.diff(
sourceChildNode,
baseChildNode, index + '>' +
baseChildNode._i,
processElement);
} else if (sourceChildNode.getAttribute('element-element') != null && baseChildNode.getAttribute('element-element') != null && processElement === true) {
} else if (sourceChildNode.getAttribute('element-element') != null && baseChildNode.getAttribute('element-element') === null) {
childDiffs = spike.core.Reconcile.diff(
sourceChildNode,
baseChildNode, index + '>' +
baseChildNode._i,
processElement);
} else if (sourceChildNode.getAttribute('element-element') === null && baseChildNode.getAttribute('element-element') != null) {
childDiffs = spike.core.Reconcile.diff(
sourceChildNode,
baseChildNode, index + '>' +
baseChildNode._i,
processElement);
}

}

if (childDiffs.length > 0) {
diffActions = diffActions.concat(childDiffs);
}

delete baseChildNode._i;
delete baseChildNode._id;
}
}

return diffActions;
},sortChange: function (a, b) {var $this=this;
if (a['sourceIndex'] === b['sourceIndex']) {
if (a['_textStart'] && b['_textStart']) {
return (a['_textStart'] > b['_textStart']) ? 1 : -1;
}
return 0;
} else if (!a['sourceIndex'] && b['sourceIndex']) {
return -1;
} else if (a['sourceIndex'] && !b['sourceIndex']) {
return 1;
}
var aIndices = a['sourceIndex'].split('>');
var bIndices = b['sourceIndex'].split('>');
var equal = true;
var i = 0;
while (equal && i < aIndices.length && i < bIndices.length) {
var aN = parseInt(aIndices[i], 10);
var bN = parseInt(bIndices[i], 10);
if (aN === bN) {
i++;
continue;
} else if (isNaN(aN) || isNaN(bN)) {
return isNaN(aN) ? 1 : -1;
} else {
return (aN > bN) ? 1 : -1;
}
}

return 0;
},findChildAtIndex: function (node, index) {var $this=this;
if (!index || !node.childNodes || node.childNodes.length === 0) {
return null;
}

var result = {};
var indices = index.split('>');
var found = true;
var lastParentIndex = '';
for (var i = 1, len = indices.length; i < len; i++) {
var nodeIndex = parseInt(indices[i], 10);
if (node.childNodes && node.childNodes.length > nodeIndex) {
node = node.childNodes[nodeIndex];
} else {
lastParentIndex = indices.slice(0, i - 1).join('>');
found = false;
break;
}
}

result['lastParent'] = found ? node.parentNode : node;
result['lastParentIndex'] = found ? index.slice(0, index.lastIndexOf('>')) : lastParentIndex;
result['node'] = found ? node : null;
result['found'] = found;
return result;
},apply: function (changes, base, force, showChanges) {var $this=this;
var unapplied = [];
var moves = [];
var removals = [];
var conflictChanges = [];
var textChanges = {};
var styleChanges = {};
for (var c = 0, cLen = changes.length; c < cLen; c++) {
var change = changes[c];
var action = change['action'];
var baseIndex = change['baseIndex'];
var sourceIndex = change['sourceIndex'];
var baseReference = change['_baseReference'];
var sourceReference = change['_sourceReference'];

if (change['_conflict'] && !force) {
change['_baseReference'] = spike.core.Reconcile.findChildAtIndex(base, baseIndex);
if (sourceIndex && baseIndex !== sourceIndex) {
change['_sourceReference'] = spike.core.Reconcile.findChildAtIndex(base, sourceIndex);
}
conflictChanges.push(change);
continue;
}

var node = null;
var findBaseChildResult = baseReference;
if (findBaseChildResult == null) {
findBaseChildResult = spike.core.Reconcile.findChildAtIndex(base, baseIndex);
if (findBaseChildResult == null) {
unapplied.push(change);
continue;
}
}

var node = findBaseChildResult['node'];
if (!findBaseChildResult['found']) {
if (action === 'insertChildElement') {
var lastParent = findBaseChildResult['lastParent'];
var insertion = change['element'];
if (showChanges) {
var insNode = document.createElement('ins');
ins.appendChild(insertion);
insertion = ins;
}
moves.push({
'parent': lastParent,
'insertion': insertion,
'source': null,
'change': change,
'appendOnly': false
});
} else {
unapplied.push(change);
}
continue;
}

if (node === null) {
continue;
}

if (action === 'moveChildElement' || action === 'insertChildElement') {
var sourceNode = node;
if (sourceIndex !== baseIndex) {
var findSourceChildResult = sourceReference;
if (findSourceChildResult == null) {
findSourceChildResult = spike.core.Reconcile.findChildAtIndex(base, sourceIndex);
}
sourceNode = findSourceChildResult !== null ? findSourceChildResult['node'] : null;
}

if (action === 'moveChildElement') {
moves.push({
'parent': node.parentNode,
'insertion': node,
'source': sourceNode,
'change': change,
'appendOnly': false
});
} else {
var insertion = change['element'];
if (showChanges) {
var insNode = document.createElement('ins');
insNode.appendChild(insertion);
insertion = insNode;
}
moves.push({
'parent': node.parentNode,
'insertion': insertion,
'source': sourceNode,
'change': change,
'appendOnly': false
});
}

} else if (action === 'removeChildElement') {
if (showChanges) {
var delNode = document.createElement('del');
delNode.appendChild(node.cloneNode(true));
moves.push({
'parent': node.parentNode,
'insertion': delNode,
'source': null,
'change': change,
'appendOnly': true
});
}

removals.push([node.parentNode, node]);

} else if (action === 'deleteText' || action === 'insertText' ||
action === 'setStyleValue' || action === 'removeStyleValue') {
var existingOp = textChanges[change['baseIndex']];
if (!existingOp) {
existingOp = {
'parent': node.parentNode,
'source': node,
'changes': []
};
}

existingOp['changes'].push(change);
if (action === 'insertText' || action === 'deleteText') {
textChanges[change['baseIndex']] = existingOp;
} else {
styleChanges[change['baseIndex']] = existingOp;
}
} else if (action === 'replaceText') {
if (!showChanges) {
node.nodeValue = change['_inserted'];
} else {
var deletionNode = document.createElement('del');
deletionNode.appendChild(document.createTextNode(change['_deleted']));
var insertionNode = document.createElement('ins');
insertionNode.appendChild(document.createTextNode(change['_inserted']));
moves.push({
'parent': node.parentNode,
'insertion': deletionNode,
'source': node,
'change': change,
'appendOnly': false
});
moves.push({
'parent': node.parentNode,
'insertion': insertionNode,
'source': node,
'change': change,
'appendOnly': false
});
node.nodeValue = '';
}
} else if (action === 'setAttribute') {
node.setAttribute(change['name'], change['_inserted']);
} else if (action === 'removeAttribute') {
node.removeAttribute(change['name']);
}
}

moves.sort(function (a, b) {
return spike.core.Reconcile.sortChange(a['change'], b['change']);
});
for (var i = 0, len = moves.length; i < len; i++) {
var move = moves[i];
var parent = move['parent'],
insertion = move['insertion'],
source = move['source'],
change = move['change'],
appendOnly = move['appendOnly'];

if (source === null && !appendOnly) {
var sourceIndex = change['sourceIndex'];
if (sourceIndex) {
var lastIndexStr = sourceIndex.substr(sourceIndex.lastIndexOf('>') + 1, sourceIndex.length);
var childIndex = parseInt(lastIndexStr, 10);
if (parent.childNodes && parent.childNodes.length > childIndex) {
source = parent.childNodes[childIndex];
}
}
}
parent.insertBefore(insertion, source);
}

for (var i = 0; i < removals.length; i++) {
var removal = removals[i];
removal[0].removeChild(removal[1]);
}

for (var b in textChanges) {
var nodeChanges = textChanges[b];
var node = nodeChanges['source'];
var value = node.nodeValue;
var nodeOps = nodeChanges['changes'];
nodeOps.sort(function (a, b) {
return a['_textStart'] > b['_textStart'] ? 1 : -1;
});
var newStr = '';
var valueIndex = 0;
for (var i = 0; i < nodeOps.length; i++) {
var op = nodeOps[i];
if (op['action'] === 'insertText') {
newStr += value.substr(valueIndex, op['_textStart']);
if (showChanges) {
newStr += '<ins>' + spike.core.Reconcile.escape(op['_inserted']) + '</ins>';
} else {
newStr += op['_inserted'];
}
if (valueIndex === op['_textStart']) {
newStr += value.substr(valueIndex, op['_textEnd']);
}
} else {
newStr += value.substr(valueIndex, op['_textStart']);
if (!!showChanges) {
newStr += ('<del>' + spike.core.Reconcile.escape(op['_deleted']) + '</del>');
}
}
valueIndex = op['_textEnd'];
}
newStr += value.substr(valueIndex);

if (!showChanges) {
node.nodeValue = newStr;
} else {
node.innerHTML = newStr;
}
}

for (var b in styleChanges) {
var nodeChanges = styleChanges[b];
var node = nodeChanges['source'];
var nodeOps = nodeChanges['changes'];

var styleMap = spike.core.Reconcile.mapStyleValues(node.getAttribute('style'));
for (var i = 0; i < nodeOps.length; i++) {
var op = nodeOps[i];
if (op['action'] === 'setStyleValue') {
styleMap[op['name']] = op['_inserted'];
} else {
delete styleMap[op['name']];
}
}

var str = [];
for (var k in styleMap) {
str.push(k + ': ' + styleMap[k]);
}

if (str.length > 0) {
node.setAttribute('style', str.join(';') + (str.length === 1 ? ';' : ''));
} else {
node.removeAttribute('style');
}
}

var conflicts = [];
while (conflictChanges.length > 0) {
var change = conflictChanges.pop();
var conflict = {
'mine': [],
'theirs': []
};
conflict[change['_owner']].push(change);
if (change['_conflictedWith']) {
var conflictedWithChange = change['_conflictedWith'];
if (conflictedWithChange) {
for (var k = 0; k < conflictedWithChange.length; k++) {
var conflictedWithItem = conflictedWithChange[k];
var i = conflictChanges.indexOf(conflictedWithItem);
if (i > -1) {
conflictChanges.splice(i, 1);
conflict[conflictedWithItem['_owner']].push(conflictedWithItem);
}
if (conflictedWithItem['_conflictedWith']) {
for (var s = 0; s < conflictedWithItem['_conflictedWith'].length; s++) {
var item = conflictedWithItem['_conflictedWith'][s];
var i = conflictChanges.indexOf(item);
if (i > -1) {
conflictChanges.splice(i, 1);
conflict[item['_owner']].push(item);
}

delete item['_conflictedWith'];
}
}

delete conflictedWithItem['_conflictedWith'];
}

delete change['_conflictedWith'];
}
}
conflicts.push(conflict);
}

return {'unapplied': unapplied, 'conflicts': conflicts};
},getSuper: function(){var $this=this; return 'null'; },getClass: function(){var $this=this; return 'spike.core.Reconcile'; },}; return __compilant; });spike.core.Assembler.createStaticClass('spike.core','Watchers', 'null',function(){var __compilant = {};var $this = __compilant;__compilant = {scopes: {},observables: {},observablesArr: [],observablesArrLength: 0,stopLoop: false,excludedProperties: {
'childElements' : 'childElements',
'eventsSelectors': 'eventsSelectors',
'linksSelectors': 'linksSelectors',
'compiledHtml': 'compiledHtml',
'elementSelector': 'elementSelector',
'templatePath': 'templatePath',
'selector': 'selector',
'__proto__': '__proto__',
'selector':'selector',
'exclusion':'exclusion'
},compileWatchers: function(scope){var $this=this;

var watcherHtml = spike.core.Templates.compileTemplate(scope, scope.templatePath);
var element = scope.rootSelector();

if(spike.core.Util.hashString(watcherHtml) !== spike.core.Util.hashString(element.outerHTML)){
$this.replaceChangedElements(scope, watcherHtml, element);
}

},replaceChangedElements: function(scope, watcherHtml, currentElement){var $this=this;


var watcherVirtual = document.createElement('div');
watcherVirtual.innerHTML = watcherHtml;

if(currentElement.outerHTML !== watcherHtml){


var allowProcessingElement = false;
if(currentElement.getAttribute('element-element') !== null){
allowProcessingElement = true;
}

var changes = spike.core.Reconcile.diff(watcherVirtual.firstChild, currentElement, '0', allowProcessingElement);

if(changes.length > 0){
spike.core.Reconcile.apply(changes, currentElement);
}

}

},observe: function(scope){var $this=this;
this.stopLoop = true;
this.observables[scope.elementId] = scope;
this.createObservablesList();
this.stopLoop = false;
},unobservable: function(scope){var $this=this;
this.stopLoop = true;
this.observables[scope.elementId] = null;
this.createObservablesList();
this.stopLoop = false;
},createObservablesList: function(){var $this=this;

var list = [];
for(var elementId in this.observables){

if(this.observables[elementId] !== undefined && this.observables[elementId] !== null){
list.push(this.observables[elementId]);
}

}

$this.observablesArr = list;
$this.observablesArrLength = list.length;

},getScopeCopy: function(scope){var $this=this;

var copy = {};
for(var key in scope) {
if(typeof scope[key] !== 'function'){

if($this.excludedProperties[key] === undefined){
copy[key] = scope[key];
}

}
}

scope.watchExclusion = scope.watchExclusion || [];
for(var i = 0; i < scope.watchExclusion.length; i++){
new Function("copy", "copy."+scope.watchExclusion[i]+" = '[Circular]';")(copy);
}

return copy;

},fireWatchers: function(scope){var $this=this;

var oldScope = {};

if($this.scopes[scope.elementId]){
oldScope = JSON.parse($this.scopes[scope.elementId]);
}

for(var propertyPath in scope.watchers){

var oldScopePropertyValue = spike.core.Assembler.getDotPathObject(oldScope, propertyPath);
var scopePropertyValue = spike.core.Assembler.getDotPathObject(scope, propertyPath);

if(JSON.stringify(oldScopePropertyValue) !== JSON.stringify(scopePropertyValue)){
scope.watchers[propertyPath](oldScopePropertyValue, scopePropertyValue);
}

}

},isCyclic: function (obj) {var $this=this;
var keys = [];
var stack = [];
var stackSet = new Set();
var detected = false;

function detect(obj, key) {
if (!(obj instanceof Object)) { return; } // Now works with other

if (stackSet.has(obj)) { // it's cyclic! Print the object and its locations.
var oldindex = stack.indexOf(obj);
var l1 = (keys.join('.') + '.' + key).replace('obj.','scope.');
var l2 = keys.slice(0, oldindex + 1).join('.').replace('obj.','scope.');
throw new Error('Spike Framework: Obervables circular structure field: '+l1+' = '+l2+'\nAdd to scope.exclusion given field');
detected = true;
return;
}

keys.push(key);
stack.push(obj);
stackSet.add(obj);
for (var k in obj) { //dive on the object's children
if (obj.hasOwnProperty(k)) { detect(obj[k], k); }
}

keys.pop();
stack.pop();
stackSet.delete(obj);
return;
}

detect(obj, 'obj');
return detected;
},detectScopeChange: function(scope){var $this=this;

var scopeCopy = $this.getScopeCopy(scope);
$this.isCyclic(scopeCopy);

var stringify = JSON.stringify(scopeCopy);

if(stringify !== $this.scopes[scope.elementId]){

spike.core.Log.log('scope changed during lifecycle '+scope.getClass());


$this.fireWatchers(scope);
$this.compileWatchers(scope);
scope.mountElements();

}

$this.scopes[scope.elementId] = stringify;

},createWatchLoop: function(scope){var $this=this;

setTimeout(function(){

if(!$this.stopLoop){

for(var i = 0; i < $this.observablesArrLength; i++){
$this.detectScopeChange($this.observablesArr[i]);
}

}

$this.createWatchLoop();

}, 20)

},getSuper: function(){var $this=this; return 'null'; },getClass: function(){var $this=this; return 'spike.core.Watchers'; },}; return __compilant; });spike.core.Assembler.checkIfCanBootstrap();(function (history) {

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