var BG = chrome.extension.getBackgroundPage();
var MCWatcher = BG.MCWatcher || {};
var storage = chrome.storage.sync;

MCWatcher._skey = 'mcw-server-arr';

MCWatcher.add = function(server) {
  var parts = server.split(/:/);
  var name = parts[0];
  var port = parts[1];
  var s = {name: name, port: port, status: 'loading', prev_status: 'loading', notif: true};
  MCWatcher.servers.push(s);
  storage.set({'mcw-server-arr': MCWatcher.servers}, function() {
    MCWatcher.put(s);
  });
};

MCWatcher.put = function(server) {
  var clipboard = $('<a href="#"><i class="fa fa-clipboard"></i></a>');
  clipboard.click(function() {
    MCWatcher.store_clipboard(server.name + ":" + server.port);
  });
  $('#servers').find('tbody tr:first')
    .after($('<tr>').attr('class', 'entry')
      .append($('<td>')
        .append(clipboard))
      .append($('<td>' + server.name + '<span class="suffix">:' + server.port + '</span></td>'))
      .append($('<td>'))
      .append($('<td><i id="' + server.name.replace(/\./g, '-') + '-' + server.port + '" class="fa fa-refresh fa-spin right loading"></i></td>')));
};

MCWatcher.store_clipboard = function(value) {
  var _cliparea = document.createElement("textarea");
  _cliparea.style.position = "absolute";
  _cliparea.style.left = "-100%";
  _cliparea.value = value;
  document.body.appendChild(_cliparea);
  _cliparea.select();
  document.execCommand("Copy");
  document.body.removeChild(_cliparea);
  MCWatcher.notify("Copied to clipboard.", value, 1.0);
};

MCWatcher.notify = function(title, message, time) {
  return chrome.notifications.create('', {
    type: 'basic',
    iconUrl: 'favicon.png',
    title: title,
    message: message,
    eventTime: time
  }, function() {});
};

MCWatcher.redo = function() {
  $('.entry').remove();
  for (var i = 0; i < MCWatcher.servers.length; i++) {
    var s = MCWatcher.servers[i];
    MCWatcher.put(s);
  }
};

MCWatcher.refresh = function() {
  for (var i = 0; i < MCWatcher.servers.length; i++) {
    var server = MCWatcher.servers[i];
    var server_dom = $('#' + server.name.replace(/\./g, '-') + '-' + server.port);
    if (server.status === 'loading') {
      server_dom.attr("class", "fa fa-refresh fa-spin right loading");
    } else if (server.status === 'success') {
      server_dom.attr("class", "fa fa-check-circle right success");
    } else if (server.status === 'fail') {
      server_dom.attr("class", "fa fa-exclamation-circle right fail");
    }
  }
};

$(document).ready(function() {
  $('#refresh').click(function() {
    MCWatcher.fetch();
  });
  $('#options').click(function() {
    chrome.windows.create({
      url: chrome.extension.getURL('options.html'),
      width: 336,
      height: 280,
      type: "popup"
    }, function() {

    });
  });
  storage.get('mcw-server-arr', function(obj) {
    MCWatcher.servers = obj[MCWatcher._skey];
    MCWatcher.redo();
    MCWatcher.refresh();
  });
  MCWatcher.fetch();

  chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (key in changes) {
      if (key === 'mcw-server-arr') {
        MCWatcher.redo();
        MCWatcher.refresh();
      }
    }
  });
});
