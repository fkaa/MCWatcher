var MCWatcher = MCWatcher || {};
var storage = chrome.storage.sync;

MCWatcher._rinterval = "mcw-refresh";
MCWatcher._skey = 'mcw-server-arr';
MCWatcher.servers = [];

storage.get('mcw-freq', function(data) {
  var interval = 0.1;
  if (data['mcw-freq']) {
    interval = parseFloat(data['mcw-freq']);
  }
  chrome.alarms.clear('mcw-refresh');
  chrome.alarms.create('mcw-refresh', {
    periodInMinutes: interval
  });
});

chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name === MCWatcher._rinterval) {
    MCWatcher.fetch();
  }
});

MCWatcher.fetch = function() {
  storage.get('mcw-server-arr', function(obj) {
    MCWatcher.servers = obj['mcw-server-arr'];

    for (var i = 0; i < MCWatcher.servers.length; i++) {
      var server = MCWatcher.servers[i];
      server.status = 'loading';
    }
    MCWatcher.refresh();
    storage.set({'mcw-server-arr': MCWatcher.servers}, function() {
      for (var i = 0; i < MCWatcher.servers.length; i++) {
        var server = MCWatcher.servers[i];
        $.ajax({
          url: "http://json.mcs.syfaro.net/" + server.name + "/" + server.port,
          dataType: "json",
          async: false,
          success: function(response) {
            if (response.status === 'up') {
              if (server.notif) {
                if (server.prev_status !== 'success') {
                  MCWatcher.notify("Server online", server.name + ":" + server.port, 1.0);
                }
              }
              server.prev_status = 'success';
              server.status = 'success';
            } else {
              if (server.notif) {
                if (server.prev_status !== 'fail') {
                  MCWatcher.notify("Server offline", server.name + ":" + server.port, 1.0);
                }
              }
              server.prev_status = 'fail';
              server.status = 'fail';
            }
          },
          error: function() {
            server.status = 'fail';
          }
        });
        storage.set({'mcw-server-arr': MCWatcher.servers}, function() {
          MCWatcher.redo();
          MCWatcher.refresh();
        });
      }
    });
  });
};