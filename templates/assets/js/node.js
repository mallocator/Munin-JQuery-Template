var storeprefix = document.location.pathname;
var imgSizeBig = '497px';
var imgSizeSmall = '250px';
var imgHeightSmall = '115px';

var reload = $.jStorage.get('reload.' + storeprefix, 5);
var initTime = Date.now();
function smartNode() {
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
    $('#nodeview').accordion({
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
}

var quickviewstore = 'quickview';
var quickview = {};
function addQuickview(e, option) {
    if (!quickview[option.value]) {
        quickview[option.value] = true;
        $.jStorage.set(storeprefix + quickviewstore, quickview);
        $('#' + option.value).clone().appendTo('#quickview');
        $('<button style="margin-top:0" id="' + option.value + 'Button">Remove</button>').appendTo('#quickview #' + option.value);
        $('#quickview').sortable();
        $('#' + option.value + 'Button').button({ icons: { primary: 'ui-icon-closethick' }, text: false }).click(function() {
            delete quickview[option.value];
            $.jStorage.set(storeprefix + quickviewstore, quickview);
            $('#quickview #' + option.value).remove();
        });
        if ($.jStorage.get('zoom.' + storeprefix + '.' + option.value, false))
            toggleGraph($('#quickview div[id="' + option.value + '"] img').first());
    }
}

function toggleGraph(img) {
    $(img).parents('.graphrow').find('img').each(function(index, item) {
        item = $(item);
        if (item.css('width')==imgSizeSmall) {
            $.jStorage.set('zoom.' + storeprefix + '.' + item.parent().parent().attr('id'), true);
            item.css('width', imgSizeBig);
            item.css('z-index', 1);
            item.parent().css('height','auto');
            item.parent().css('border-bottom','inherit');
        } else {
            $.jStorage.set('zoom.' + storeprefix + '.' + item.parent().parent().attr('id'), false);
            item.css('width', imgSizeSmall);
            item.css('z-index', 0);
            item.parent().css('height',imgHeightSmall);
            item.parent().css('border-bottom','1px solid #CCC');
        }
    });
}
