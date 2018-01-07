
function template(m){

    var html = '';
    html += '<div class="title" id="watch-1" watch="m.title">'+m.title+'</div>';

    html += '<ul watch="m.items" id="watch-m.items">';

    for(var i = 0, l = m.items.length; i < l; i++){
        var item = m.items[i];
        html += '<li id="watch-i-'+i+'" watch="item">'+item+'</li>';
    }

    html += '</ul>';

    document.getElementById('test').innerHTML = html;
}

function mx(x){

    var s = '';
    for(var i = 0, l = x.length; i < l; i++){
        s += x.charCodeAt(i);
    }

    return s;
}

var watchObj = {
    'm.title' : {
        id: 'watch-1',
        prev: null,
        selector: null,
        fn: function(m){

            //cachowac selector
            var selector = document.getElementById(this.id);

            if(!this.prev){
                this.prev = mx(selector.outerHTML);
            }

            var newOuterHTML = '<div class="title" id="watch-1" watch="m.title">'+m.title+'</div>';
            var md5NewOuterHTML = mx(newOuterHTML);

            if(this.prev !=== md5NewOuterHTML){
                selectorouterHTML = newOuterHTML;
                this.prev = md5NewOuterHTML;
            }

        }
    }
};

function watch(m, watchers){

    for(var i = 0, l = watchers.length; i < l; i++){
        watchObj[watchers[i]].fn(m);
    }

}

var m = {
    title: 'Tytul',
    items: [
        'item 1',
        'item 2',
        'item 3'
    ]
};

template(m);

function perform(n){

    var start = new Date().getTime();

    for(var i = 0, l = n; i <l; i++){
        m.title = 'title '+i;
        watch(m, ['m.title']);
    }

    console.log((new Date().getTime() - start) + 'ms');

}