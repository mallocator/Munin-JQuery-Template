var storeprefix = document.location.pathname;
var imgSizeBig = '497px';
var imgSizeSmall = '250px';
var imgHeightSmall = '130px';

function getUrlVars() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

var params = getUrlVars();
if (params['scope'])  {
    var scope = params['scope']
} else {
    var scope = $.jStorage.get(storeprefix + 'scope', "day");
}

var reload = $.jStorage.get('reload.' + storeprefix, 5);
var initTime = Date.now()
function smartCompare() {
    $('#' + scope).attr('checked','checked');
    $('#scope').buttonset();

    if (scope != 'day') {
        $('#graphview').find('img').each(function(index, img) {
            if (!img.src.match(scope + ".png$")) {
                img.src = img.src.substr(0, img.src.lastIndexOf('-') + 1) + scope + '.png';
            }
        });
    }

    function setButton(i, scopeType) {
        $('#'+scopeType).button().change(function() {
            if (scope != scopeType) {
                scope = scopeType;
                $.jStorage.set(storeprefix + 'scope', scope);
                $('#graphview').find('img').each(function(index, img) {
                    if (!img.src.match(scope + ".png$")) {
                        img.src = img.src.substr(0, img.src.lastIndexOf('-') + 1) + scope + '.png';
                    }
                });
                $('#quickview').find('img').each(function(index, img) {
                    if (!img.src.match(scope + ".png$")) {
                        img.src = img.src.substr(0, img.src.lastIndexOf('-') + 1) + scope + '.png';
                    }
                });
            }
        });
    }
    $.each(['day','week','month','year'], setButton);
 

    var stop = false;
    $('#category h1').click(function(event) {
        if (stop) {
            event.stopImmediatePropagation();
            event.preventDefault();
            stop = false;
        }
    });
    var anchor = $(document.location.hash);
    if (!anchor.is('h1'))
        anchor = $(document.location.hash).parents('.category').find('h1');
    //if (!anchor.is('h1'))
    //    anchor = 0;
    $('#graphview').accordion({
        header: "> div > h1",
        collapsible: true,
        autoHeight: false,
        animated: false,
        active: anchor
    }).sortable({
        axis: "y",
        handle: "h1",
        stop: function() {
            stop = true;
        }
    });

    var lookup = {}
    $.each($('#graphs option'), function(i, option) {
        if (lookup[$(option).val()]) {
            $(option).remove();
        } else {
            lookup[$(option).val()] = true;
        }
    });
    $('#graphs').selectmenu({
        width: 300,
        menuWidth: 300,
        select: addQuickview
    });
    $.each($.jStorage.get(storeprefix + quickviewstore, {}), function(index, item) {
        if (item)
            addQuickview(null, { value: index });
    });

    $('#reloadInterval').selectmenu({
        width: 85,
        menuWidth: 85,
        select: function(e, option) {
            reload = option.value
            $.jStorage.set('reload.' + storeprefix, reload);
        }
    });
    $('#reloadInterval option[value="' + reload + '"]').attr('selected','selected');
    setInterval(function(){
        if (reload != "0" && Date.now() - initTime > reload * 60000) {
            location.reload();
        }
    }, 1000);

    $('#hostGroups').selectmenu({
        width: 175,
        menuWidth: 200,
        select: function(e, option) {
            goIfExists('/munin/' + option.value + '/comparison-day.html', function() {
                for(var i = 1; i <= 100; i++)
                    goIfExists('/munin/' + option.value + '/' + option.value + '-' + i  +'/index.html');
            });
            goIfExists('/smunin/' + option.value + '/comparison-day.html', function() {
                for(var i = 1; i <= 100; i++)
                    goIfExists('/smunin/' + option.value + '/' + option.value + '-' + i  +'/index.html');
            });
        }
    });
}

function goIfExists(loc, callback) {
    if (loc && loc.length)
        $.ajax({url:loc,type:'HEAD',success: function() { document.location = loc; }, error: callback});
}

var quickviewstore = 'quickview';
var quickview = {};
function addQuickview(e, option) {
    if (!quickview[option.value]) {
        quickview[option.value] = true;
        $.jStorage.set(storeprefix + quickviewstore, quickview);
        $('#' + option.value).parent().clone().appendTo('#quickview');
        $('<button id="' + option.value + 'Button">Remove</button>').appendTo($('#quickview #' + option.value).parent());
        $('#quickview').sortable();
        $('#' + option.value + 'Button').button({ icons: { primary: 'ui-icon-closethick' }, text: false }).click(function() {
            delete quickview[option.value];
            $.jStorage.set(storeprefix + quickviewstore, quickview);
            $('#quickview #' + option.value).parent().remove();
        });
        if ($.jStorage.get('zoom.' + storeprefix + '.' + option.value, false))
            toggleGraph($('#quickview div[id="' + option.value + '"] img').first()); 
    }
}

function toggleGraph(img) {
    $(img).parents('.graphrow').find('img').each(function(index, item) {
        item = $(item);
        if (item.css('width')==imgSizeSmall) {
            $.jStorage.set('zoom.' + storeprefix + '.' + item.parent().attr('id'), true);
            item.css('width', imgSizeBig);
            item.css('z-index', 1);
            item.parent().css('height', 'auto');
            item.parent().css('border-bottom', 'inherit');
            item.parent().find('.nodename').css('display', 'inline-block');
        } else {
            $.jStorage.set('zoom.' + storeprefix + '.' + item.parent().attr('id'), false);
            item.css('width', imgSizeSmall);
            item.css('z-index', 0);
            item.parent().css('height', imgHeightSmall);
            item.parent().css('border-bottom', '1px solid #CCC');
            item.parent().find('.nodename').css('display', 'none');
        }
    });
}
