function toggleInstances(group) {
	$('#' + group).fadeToggle();
}

var storeprefix = document.location.pathname.replace('index.html','') + 'Overview';
var graphstore = "_graphs_";
var graphs = {};
var scope = "day";
var imgSizeBig = '497px';
var imgSizeSmall= '250px';
var imgHeightSmall= '130px';

function highlightProblems() {
    $('#grouplist').find('.warn').parent('group').addClass('.warn');
    $('#grouplist').find('.crit').parent('group').addClass('.crit');
}

function lzw_encode(s) {
    var dict = {};
    var data = (s + "").split("");
    var out = [];
    var currChar;
    var phrase = data[0];
    var code = 256;
    for (var i=1; i<data.length; i++) {
        currChar=data[i];
        if (dict[phrase + currChar] != null) {
            phrase += currChar;
        }
        else {
            out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
            dict[phrase + currChar] = code;
            code++;
            phrase=currChar;
        }
    }
    out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
    for (var i=0; i<out.length; i++) {
        out[i] = String.fromCharCode(out[i]);
    }
    return out.join("");
}

function lzw_decode(s) {
    var dict = {};
    var data = (s + "").split("");
    var currChar = data[0];
    var oldPhrase = currChar;
    var out = [currChar];
    var code = 256;
    var phrase;
    for (var i=1; i<data.length; i++) {
        var currCode = data[i].charCodeAt(0);
        if (currCode < 256) {
            phrase = data[i];
        }
        else {
           phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
        }
        out.push(phrase);
        currChar = phrase.charAt(0);
        dict[code] = oldPhrase + currChar;
        code++;
        oldPhrase = phrase;
    }
    return out.join("");
}


function nodeControls() {
    var selectedgroup;
    $.each(groups, function(index, group) {
        if (group)
            $('<option value="' + index + '">' + index + '</option>').appendTo('#groups');
        if (!selectedgroup)
            selectedgroup = group;
    });
    var selectednode;
    $.each(selectedgroup.nodes, function(index, node) {
        if (node)
            $('<option value="' + index + '">' + index + '</option>').appendTo('#nodes');
        if (!selectednode) {
            selectednode = node;
            $.each(node.categories, function(index, category) {
                if (category) {
                    var optgroup = '<optgroup label="' + index + '">';
                    $.each(category.graphs, function(index, graph) {
                        if (graph)
                            optgroup += '<option value="' + graph + '">' + graph + '</option>';
                    });
                    $(optgroup + '</optgroup>').appendTo('#categories');
                }
            });
        }
    });

    $('#groups').selectmenu({
        width: 200,
        menuWidth: 200,
        select: function(e, object) {
            $('#nodes').empty();
            $('<option value="*">All</option>').appendTo('#nodes');
            var node;

            $.each(groups[object.value].nodes, function(index, elem) {
                if (elem) {
                    $('<option value="' + index + '">' + index + '</option>').appendTo('#nodes');
                    if (!node) {
                        node = elem;
                        var selectedCategory = $('#categories').selectmenu('value');
                        $('#categories').empty();
                        $.each(node.categories, function(index, category) {
                            if (category) {
                                var optgroup = '<optgroup label="' + index + '">';
                                $.each(category.graphs, function(index, graph) {
                                    if (graph)
                                        if (graph == selectedCategory)  {
                                            optgroup += '<option value="' + graph + '" selected="selected">' + graph + '</option>';
                                        }
                                        else {
                                            optgroup += '<option value="' + graph + '">' + graph + '</option>';
                                        }
                                });
                                $(optgroup + '</optgroup>').appendTo('#categories');
                            }
                        });
                    }
                }
            });
            $('#nodes').selectmenu();
            $('#categories').selectmenu();
            $("#addGraph").button( "option", "disabled", false );
        }
    });
    $('#nodes').selectmenu({ width: 200, menuWidth: 200 });
    $('#categories').selectmenu({ 
        width: 200, 
        menuWidth: 200,
        select: function(e, object) {
            var group = $('#groups').selectmenu('value');
            var node =  $('#nodes').selectmenu('value');
            var category = $('#categories').selectmenu('value');
            addGraph(group, category, node);
        }
    });
    $('#clearGraphs').button({ icons: { primary: 'ui-icon-alert', secondary: 'ui-icon-alert'}}).click(function() {
        graphs = {};
        $.jStorage.deleteKey(storeprefix + graphstore);
        $('#graphArea').empty();
    });
    $('#graphArea').sortable({
        beforeStop: function(e, ui) {
            toggleGraph(ui.item.find('img'));
        }
    });
}

function scopeControls() {
    $('#day').attr('checked','checked');
    $('#scope').buttonset();

    function setButton(i, scopeType) {
        $('#'+scopeType).button().change(function() {
            if (scope != scopeType) {
                graphs = {};
                $('#graphArea').empty();
                scope = scopeType;
                $.each($.jStorage.get(storeprefix + graphstore, {}), function(index, item) {
                    createGraph(index, item.group, item.category, item.node);
                });
            }
        });
    }
    $.each(['day','week','month','year'], setButton);
}

function zoomControls() {
    $('#zoomIn').button({ icons: { primary: 'ui-icon-zoomin' }, text: false }).click(function() {
        $.each($('#graphArea img'), function(i, img) {
            img = $(img);
            if (img.css('width')==imgSizeSmall)
                toggleGraph(img);
        });
    });
    $('#zoomOut').button({ icons: { primary: 'ui-icon-zoomout'}, text: false }).click(function() {
        $.each($('#graphArea img'), function(i, img) {
        img = $(img);
        if (img.css('width')==imgSizeBig)
            toggleGraph(img);
        });
    });
}

var reload = $.jStorage.get('reload.overview', 5);
var initTime = Date.now();
function reloadControls() {
    $('#reloadInterval').selectmenu({
        width: 85,
        menuWidth: 85,
        select: function(e, option) {
            reload = option.value
            $.jStorage.set('reload.overview', reload);
        }
    });
    $('#reloadInterval option[value="' + reload + '"]').attr('selected','selected');
    setInterval(function(){
        if (reload != "0" && Date.now() - initTime > reload * 60000) {
            location.reload();
        }
    }, 1000);
}

function presetControls() {
    $('#loadPreset').button({ icons: { primary: 'ui-icon-arrowreturnthick-1-s' }, text: false }).click(function() {
        var preset = $('#presets').selectmenu('value');
        if (preset && preset.length) {
            graphs = {};
            $('#graphArea').empty()
            $.each($.jStorage.get(storeprefix + preset, {}), function(index, item) {
                createGraph(index, item.group, item.category, item.node);
            });
        }
    });
    $('#savePreset').button({ icons: { primary: 'ui-icon-disk' }, text: false }).click(function() {
        $('#createPresetDialog').dialog('open');
    });
    $('#deletePreset').button({ icons: { primary: 'ui-icon-trash' }, text: false }).click(function() {
        $('#deletePresetDialog').dialog('open');
    });
    $('#importPreset').button({ icons: { primary: 'ui-icon-circle-arrow-s' }, text: false }).click(function() {
        $('#importPresetDialog').dialog('open');
    });
    $('#exportPreset').button({ icons: { primary: 'ui-icon-circle-arrow-n' }, text: false }).click(function() {
        $('#exportData').val(lzw_encode($.toJSON(graphs)));
        $('#exportPresetDialog').dialog('open');
    });

    $.each($.jStorage.index(), function(index, preset) {
        if (preset != storeprefix + graphstore && preset.indexOf(storeprefix) != -1)
            $('<option value="' + preset + '">' + preset.substr(storeprefix.length) + '</option>').appendTo('#presets');
    });
    $('#presets').selectmenu({
        width: 150,
        menuWidth: 150
    });
}

function presetDialogs() {
    $('#createPresetDialog').dialog({
        title: 'Save Preset', autoOpen: false, modal: true, resizable: false,
        buttons: {
            Cancel: function() {
                $(this).dialog('close');
            },
            Save: function() {
                var name = $.trim($('#presetName').val());
                $('#presetName').removeClass("ui-state-error");
                if ($.trim(name).length) {
                    $.jStorage.set(storeprefix + name, graphs);
                    if (!$('#presets').find('option:contains("' + name + '")').length) {
                        $('<option selected="selected" value="' + name + '">' + name + '</option>').appendTo('#presets');
                        $('#presets').selectmenu();
                    }
                    $(this).dialog('close');
                }
                else {
                    $('#presetName').fadeIn('fast').addClass("ui-state-error").fadeOut('fast');
                }
            }
        }
    });
    $('#deletePresetDialog').dialog({
        title: 'Delete Preset', autoOpen: false, modal: true, resizeable: false,
        buttons: {
            Cancel: function() {
                $(this).dialog('close');
            },
            Confirm: function() {
                var preset = $('#presets').selectmenu('value');
                if (preset && preset.length) {
                    $.jStorage.deleteKey(storeprefix + preset);
                    $('#presets option:selected').remove();
                    $('#presets').selectmenu();
                }
                $(this).dialog('close');
            }
        }
    });
    $('#importPresetDialog').dialog({
        title: 'Import Preset', autoOpen: false, modal: true, resizeable: false, width: 330,
        buttons: {
            Cancel: function() { 
                $(this).dialog('close');
            },
            Import: function() {
                $('#importName').removeClass('ui-state-error');
                $('#importData').removeClass('ui-state-error');
                var name = $.trim($('#importName').val());
                if (!$.trim(name).length) {
                    $('#importName').fadeOut('fast').addClass('ui-state-error').fadeIn('fast');
                    return;
                }
                try {
                    var data = $.evalJSON(lzw_decode($.trim($('#importData').val())));
                } catch (e) {
                    $('#importData').fadeOut('fast').addClass('ui-state-error').fadeIn('fast');
                    return;
                }
                $('#importName').val('');
                $('#importData').val('');
                $.jStorage.set(storeprefix + name, data);
                if (!$('#presets').find('option:contains("' + name + '")').length) {
                    $('<option selected="selected" value="' + name + '">' + name + '</option>').appendTo('#presets');
                    $('#presets').selectmenu();
                }
                $(this).dialog('close');
            }
        }
    });
    $('#exportPresetDialog').dialog({
        title: 'Export Preset', autoOpen: false, modal: true, resizeable: false, width: 330,
        buttons: {
            Close: function() {
                $('#exportData').val('');
                $(this).dialog('close');
            }
        }
    });
    $('.ui-dialog-buttonpane').find('button:contains("Cancel")').button({ icons: { primary: 'ui-icon-closethick' }});
    $('.ui-dialog-buttonpane').find('button:contains("Close")').button({ icons: { primary: 'ui-icon-closethick' }});
    $('.ui-dialog-buttonpane').find('button:contains("Save")').button({ icons: { primary: 'ui-icon-check' }});
    $('.ui-dialog-buttonpane').find('button:contains("Confirm")').button({ icons: { primary: 'ui-icon-alert' }});
    $('.ui-dialog-buttonpane').find('button:contains("Import")').button({ icons: { primary: 'ui-icon-circle-arrow-s' }});
    $('#exportData').focus(function() {
        $this = $(this);
        $this.select();
        // Work around Chrome's little problem
        $this.mouseup(function() {
            $this.unbind("mouseup");
            return false;
        });
    });
}

function configDialog() {
    $('#config').dialog({
        title: 'Current Configuration', autoOpen: false, modal: true, width: 1000, height: 600,
        buttons: {
            Close: function() {
                $('#config').html('');
                $(this).dialog('close');
            }
        },
        open: function() {
            $.get('datafile', function(data) {
                var data = data.split('\n');
                data.sort();
                var tree = {}
                for (var row in data) {
                    var line = data[row].split(';');
                    if (line.length > 1) {
                        var group = line.shift();
                        line = line[0].split(':')
                        var host = line.shift();
                        var setting = line[0].split(' ')[0];
                        var settingGroup = setting.split('.')[0];
                        var settingType = setting.substr(setting.indexOf('.') + 1);
                        var value = line[0].substr(line[0].indexOf(' ') + 1);
                        if (!tree[group]) tree[group] = {};
                        if (!tree[group][host]) tree[group][host] = {};
                        if (!tree[group][host][settingGroup]) tree[group][host][settingGroup] = {}
                        tree[group][host][settingGroup][settingType] = value;
                    }
                }
                $.get('overrides.js?seed=' + Date.now(), function(overrides) {
                    var exports = {}
                    eval(overrides);
                    overrides = exports.overrides;
                    var html = '<ul class="config">';
                    for (var group in tree) {
                        html += '<li class="cgroup"><h1 onclick="toggleConfig($(this))">' + group + '</h1><ul>';
                        for (var host in tree[group]) {
                            for (var prop in overrides.all) {
                                var overrideGroup = prop.substr(0, prop.indexOf('.'));
                                var overrideType = prop.substr(prop.indexOf('.') + 1);
                                if (!tree[group][host][overrideGroup])
                                    tree[group][host][overrideGroup] = {};
                                tree[group][host][overrideGroup][overrideType] = overrides.all[prop];
                            }   
                            var tierlessGroup = group.substr(group.indexOf('-') + 1); 
                            if (overrides.groups[tierlessGroup])
                                for (var prop in overrides.groups[tierlessGroup]) {
                                    var overrideGroup = prop.substr(0, prop.indexOf('.'));
                                    var overrideType = prop.substr(prop.indexOf('.') + 1); 
                                    if (!tree[group][host][overrideGroup])
                                        tree[group][host][overrideGroup] = {};
                                    tree[group][host][overrideGroup][overrideType] = overrides.groups[tierlessGroup][prop];
                                }   
                            html += '<li class="chost"><h2 onclick="toggleConfig($(this))">' + host + '</h2><ul>';
                            for (var settingGroup in tree[group][host]) {
                                html += '<li class="csettingGroup"><h3 onclick="toggleConfig($(this))">' + settingGroup + '</h3><table class="csettingType">'
                                for (var settingType in tree[group][host][settingGroup]) {
                                    if (settingType.indexOf('warning') != -1)
                                        html += '<tr class="warn"><td>' + settingType;
                                    else if (settingType.indexOf('critical') != -1)
                                        html += '<tr class="crit"><td>' + settingType;
                                    else
                                        html += '<tr><td>' + settingType;
                                    html += ':</td><td>' + tree[group][host][settingGroup][settingType] + '</td></tr>'
                                }
                                html += '</table></li>'
                            }
                            html += '</ul></li>'
                        }
                        html += '</ul></li>';
                    }
                    $('#config').html(html + '</ul>');
                    $('#config').dialog('open');
                },'text');
            });
        }
    });
}

function grouplistControls() {
    if ($.jStorage.get('toggles.grouplist', false)) {
        toggleGrouplist(true);
    }
    $('#toggleGrouplist').button().click(toggleGrouplist);

    var time = $('#foot')[0].childNodes[2].textContent;
    time = time.substr(time.indexOf('20'), 19);
    var date = new Date();
    date.setUTCFullYear(time.substr(0,4));
    date.setUTCMonth(time.substr(5,2) - 1);
    date.setUTCDate(time.substr(8,2));
    date.setUTCHours(time.substr(11,2));
    date.setUTCMinutes(time.substr(14,2));
    date.setUTCSeconds(time.substr(17,2));
    setInterval(function() {
        var elapsed = parseInt((new Date() - date) / 1000);
        var seconds = elapsed % 60;
        var minutes = parseInt(elapsed/60);
        $('#age').html('Generated ' + minutes + ':' + (seconds<10?'0':'') + seconds + ' minutes ago');
    }, 1000);
}

function smartgrid() {
    $.each($.jStorage.get(storeprefix + graphstore, {}), function(index, item) {
        createGraph(index, item.group, item.category, item.node);
    });

    highlightProblems();
    nodeControls();
    scopeControls();
    zoomControls();
    reloadControls();
    presetControls();
    presetDialogs();
    configDialog();
    grouplistControls();
}

function createGraph(url, group, category, node) {
    if (graphs[url])
        return;
    graphs[url] = { group: group, node: node, category: category };
    $.jStorage.set(storeprefix + graphstore, graphs);
    var content  = '<li class="graphbox">';
    content     += '<span onclick="removeGraph(this)" class="close">X</span>';
    content     += '<a href="' + group + '/' + node + '#' + category + '" class="title">' + (node?node:group) + ' :: ' + category + '</a>';
    content     += '<img onclick="toggleGraph(this)" class="graph" src="' + url + '-' + scope + '.png" />';
    content     += '<li>'; 
    $(content).appendTo('#graphArea');
    if ($.jStorage.get('zoom.overview.' + url  + '-' + scope + '.png', false))
        toggleGraph($('#graphArea img[src="' + url  + '-' + scope + '.png' + '"]'));
    $('#graphArea').sortable();
}

function addGraph(group, category, node) {
    if (node.length && node != "*") {
        var imgPath = group + "/" + node + "/" + category;
        createGraph(imgPath, group, category, node);
    }
    else {
        $.each(groups[group].nodes, function(index, node) {
            if (node) {
                var imgPath = group + "/" + index + "/" + category;
                createGraph(imgPath, group, category, index);
            }
        });
    }
}

function toggleGraph(img) {
    img = $(img);
    if (img.css('width')==imgSizeSmall) {
        $.jStorage.set('zoom.overview.' + img.attr('src'), true);
        img.css('width', imgSizeBig);
        img.css('z-index', 1);
        img.parent().css('height', 'auto');
        img.parent().css('border-bottom', 'inherit');
    } else {
        $.jStorage.set('zoom.overview.' + img.attr('src'), false);
        img.css('width', imgSizeSmall);
        img.css('z-index', 0);
        img.parent().css('height', imgHeightSmall);
        img.parent().css('border-bottom', '1px solid #CCC');
    }
}

function removeGraph(closeButton) {
    var imgUrl = $(closeButton).next().next().attr('src');
    imgUrl = imgUrl.substr(0, imgUrl.length - 5 - scope.length);
    delete graphs[imgUrl];
    $.jStorage.set(storeprefix + graphstore, graphs);
    $(closeButton).parent().remove();
}

function showConfig() {
    $('#config').dialog('open');
}

function toggleConfig(item) {
    var sclass = item.parent().hasClass('cgroup')?'chost':item.parent().hasClass('chost')?'csettingGroup':'csettingType';
    $.each(item.parent().find('.' + sclass), function(i, config) {
        config = $(config);
        if (config.css('display')=='none') {
            config.css('display', 'list-item');
        } else {
            config.css('display', 'none');
        }
    });
}

function toggleGrouplist(noAnim) {
    if ( $('#smartgrid').css('margin-left') == '20px') {
        $('#smartgrid').css('margin-left','300px');
        $('#grouplist').show('slide');
        $.jStorage.set('toggles.grouplist', false);
    }
    else {
        if (noAnim == true) {
            $('#grouplist').css('display','none');
            $('#smartgrid').css('margin-left','20px');
        }
        else {
            $('#grouplist').hide('slide', function() { $('#smartgrid').css('margin-left','20px'); });
        }
        $.jStorage.set('toggles.grouplist', true);
    };
}
