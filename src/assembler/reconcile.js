function escape(s) {
  var n = s;
  n = n.replace(/&/g, '&amp;');
  n = n.replace(/</g, '&lt;');
  n = n.replace(/>/g, '&gt;');
  n = n.replace(/"/g, '&quot;');

  return n;
}

function diff(source, base) {

  var actions = [];

  if (compareTextNodes(actions, source, base)) {
    return actions;
  }

  compareAttributes(actions, source, base);

  if (source.childNodes && base.childNodes) {

    var notDeleted = compareChildren(actions, source, base);
    console.log('notDeleted');
    console.log(notDeleted);

    for (var i = 0; i < notDeleted.length; i++) {

      var childDiffs = diff(notDeleted[i].source, notDeleted[i].base);

      if (childDiffs.length > 0) {
        actions = actions.concat(childDiffs);
      }

    }

  }

  return actions;

}

function compareChildren(actions, source, base) {

  var childrenMap = mapChildren(source.childNodes, base.childNodes);

  console.log('childrenMap');
  console.log(childrenMap);

  for(var i = 0; i < childrenMap.deleted.length; i++){

    actions.push({
      action: 'remove',
      element: childrenMap.deleted[i]
    });

  }

  for(var i = 0; i < childrenMap.added.length; i++){

    actions.push({
      action: 'add',
      element: childrenMap.added[i]
    });

  }

  return childrenMap.none;

}

function getId(node){
  return node.id ? node.id : 'node-'+spike.core.Util.hash();
}

function mapChildren(sourceChildren, baseChildren) {

  var sourceMap = {};
  var baseMap = {};
  var merged = {};
  var deleted = [];
  var added = [];
  var none = {};

  for (var i = 0; i < sourceChildren.length; i++) {

    //sourceChildren[i].id = getId(sourceChildren[i]);

    sourceMap[sourceChildren[i].id] = sourceChildren[i];
    merged[sourceChildren[i].id] = 'none';

    if(!none[sourceChildren[i].id]){
      none[sourceChildren[i].id] = {
        source: null,
        base: null
      }
    }

    none[sourceChildren[i].id].source = sourceChildren[i];

  }

  for (var i = 0; i < baseChildren.length; i++) {

    //baseChildren[i].id = getId(baseChildren[i]);

    baseMap[baseChildren[i].id] = baseChildren[i];
    merged[baseChildren[i].id] = 'none';

    if(!none[baseChildren[i].id]){
      none[baseChildren[i].id] = {
        source: null,
        base: null
      }
    }

    none[baseChildren[i].id].base = baseChildren[i];

  }

  console.log(sourceMap);
  console.log(baseMap);

  for (var id in sourceMap) {

    if (!baseMap[id]) {
      merged[id] = 'delete';
      delete none[id];
      deleted.push(sourceMap[id]);
    }

  }

  for (var id in baseMap) {

    if (!sourceMap[id]) {
      merged[id] = 'add';
      delete none[id];
      added.push(baseMap[id]);
    }

  }

  var noneArr = [];
  for(var id in none){
    noneArr.push(none[id]);
  }


  return {
    deleted: deleted,
    none: noneArr,
    added: added
  }

}

function compareTextNodes(actions, source, base) {

  if (source.nodeType === base.nodeType && (source.nodeType === 3 || source.nodeType === 8)) {
    if (base.nodeValue !== source.nodeValue) {
      actions.push({
        action: 'changeText'
      });
      return true;
    }
  }

  return false;
}
function compareAttributes(actions, source, base) {

  // look for differences between the nodes by their attributes
  if (source.attributes && base.attributes) {
    var attributes = source.attributes,
      value,
      name;

    // iterate over the source attributes that we want to copy over to the new base node
    for (var i = attributes.length; i--;) {
      value = attributes[i].nodeValue;
      name = attributes[i].nodeName;

      var val = base.getAttribute(name);
      if (val !== value) {
        if (val == null) {
          actions.push({
            'action': 'setAttribute',
            'name': name,
            'element': base,
            'baseIndex': index,
            'sourceIndex': index,
            '_inserted': value
          });
        } else {
          // if the attribute happens to be a style
          // only generate style Updates
          if (name === 'style') {
            actions.push({
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

    // iterate over attributes to remove that the source no longer has
    attributes = base.attributes;
    for (var i = attributes.length; i--;) {
      name = attributes[i].nodeName;
      if (source.getAttribute(name) === null) {
        actions.push({
          'action': 'removeAttribute',
          'name': name,
          'baseIndex': index,
          'sourceIndex': index,
          '_deleted': attributes[i].nodeValue
        });
      }
    }
  }

}

function apply(actions, target) {

  for (var i = 0; i < actions.length; i++) {

    switch (actions[i].action) {
      case 'changeText' :
        break;
    }

  }

}
