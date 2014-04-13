var MCWatcher = MCWatcher || {};
var arr = [];
var storage = chrome.storage.sync;

MCWatcher._rinterval = "mcw-refresh";
MCWatcher._freq = 2.0;

var save = function() {
  storage.set({'mcw-server-arr': arr}, function() {
    puts();
  });
};

var puts = function() {
  $('.entry').remove();
  var vals = [];
  for (var i = 0; i < arr.length; i++) {
    var server = arr[i];
    var notif = $('<input type="checkbox">');
    if (server.notif == true) {
      notif.attr('checked', true);
    }
    notif.change(function() {
      server.notif = !server.notif;
    });
    var remove = $('<a class="left" href="#"><i class="fa fa-trash-o fa-fw"></i></a>');
    remove.click(function() {
      arr.splice(arr.indexOf(server), 1);
      save();
    });
    var s_dom = $('<tr class="entry">')
      .append($('<td></td>').append(remove))
      .append($('<td>' + server.name + '<span class="suffix">:' + server.port + '</span></td>'))
      .append($('<td></td>').append($('<span class="suffix">Notification</span>')).append(notif));
    vals.push(s_dom);
  }
  $('#options').find('tbody tr:last').before(vals);
};

var load = function() {
  storage.get('mcw-server-arr', function(data) {
    arr = data['mcw-server-arr'] || [];
    puts();
  });
};

$(document).ready(function() {
  load();
  storage.get('mcw-freq', function(data) {
    if (data['mcw-freq']) {
      MCWatcher._freq = data['mcw-freq'];
    }
    $('#freq').val(MCWatcher._freq);
  });

  $('#save').click(function() {
    var val = $('#freq').val();
    MCWatcher._freq = val;
    if (val > 0) {
      storage.set({'mcw-freq': MCWatcher._freq}, function() {
        chrome.alarms.get('mcw-refresh', function(alarm) {
          alarm.periodInMinutes = MCWatcher._freq;
          alert('Saved.');
        });
      });
    } else {
      alert("Invalid frequency. Minimum value is 1.");
    }
  });
  $('#add').click(function() {
    var foo = window.prompt("Enter a server address with the format <adress>:<port>.", "foo.bar:25565");
    if (foo) {
      var parts = foo.split(/:/);
      var name = parts[0];
      var port = parts[1];
      var s = {name: name, port: port, status: 'loading', prev_status: 'loading', notif: true};
      arr.push(s);
      save();
    }
  });
});