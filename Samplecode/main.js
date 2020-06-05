// Initialize variables
var $window = $(window);
// Input for username
var $usernameInput = $('.usernameInput'); 
// Messages area
var $messages = $('.messages');
// Input message input box
var $inputMessage = $('.inputMessage');
// The login page
var $loginPage = $('.login.page');
// The chatroom page
var $chatPage = $('.chat.page');
// is registetred listeners
var isRegisteredListeners = false;


// Adds a message element to the messages and scrolls to the bottom
// el - The element to add as a message
// options.fade - If the element should fade-in (default = true)
// options.prepend - If the element should prepend
//   all other messages (default = false)
function addMessageElement (el, options) {
  var $el = $(el);
  // Setup default options
  if (!options) {
    options = {};
  }
  if (typeof options.fade === 'undefined') {
    options.fade = true;
  }
  if (typeof options.prepend === 'undefined') {
    options.prepend = false;
  }
  // Apply options
  if (options.fade) {
    $el.hide().fadeIn(FADE_TIME);
  }
  if (options.prepend) {
    $messages.prepend($el);
  } else {
    $messages.append($el);
  }
  $messages[0].scrollTop = $messages[0].scrollHeight;
}

function printDataNewstate(data) {
  console.log(data);
  var $el = '';
  $el += `caller: ${data.caller}<br/>`;
  $el += `called: ${data.called}<br/>`;
  $el += `state: ${data.state}<br/>`;
  $el += `statedesc: ${data.statedesc}<br/>`;
  $el += `<hr><br/><br/>`;
  $messages.append($el);
}

function printDataHangup(data) {
  console.log(data);
  var $el = '';
  $el += `caller: ${data.caller}<br/>`;
  $el += `called: ${data.called}<br/>`;
  $el += `statedesc: Hangup<br/>`;
  $el += `cause: ${data.cause}<br/>`;
  $el += `causedesc: ${data.causedesc}<br/>`;
  $el += `<hr><br/><br/>`;
  $messages.append($el);
}

function printDataCallLog(data) {
  console.log(data);
  var output = data;
  $messages.html('');
  
  output.rows.forEach(function(element){
    var $el = '';
    $el += `callid: ${element.callid}<br/>`;
    $el += `caller: ${element.caller}<br/>`;
    $el += `called: ${element.called}<br/>`;
    $el += `begin: ${element.begin}<br/>`;
    $el += `duration: ${element.duration}<br/>`;
    $el += `billsec: ${element.billsec}<br/>`;
    $el += `stato: ${element.stato}<br/>`;
    $el += `callflow:<ul>`;
    
    element.callflow.forEach(function(el){
      $el += `<li>${el.dst} (${el.stato})</li>`;
    });
    
    $el += `</ul><hr><br/>`;
    $messages.append($el);
  });
}

function registerListeners(socket) {
  socket.on('pbx Newstate', function (data) {
    printDataNewstate(data);
  });

  socket.on('pbx Hangup', function (data) {
    printDataHangup(data);
  });

  socket.on('pbx CallLog', function (data) {
    printDataCallLog(data);
  });
  
  isRegisteredListeners = true;
}

$(function() {
  var FADE_TIME = 150; // ms
  var token = false;
  var username = null;
  var password = null;

  var socket = io.connect(PROT + '://' + DNS + ':' + PORT);

  socket.on('disconnect', function() {
    console.log(`Disconnected`, socket);
  });

  socket.on('connect', function() {
    console.log(`Connected`, socket);
    console.log(PROT + '://' + DNS + ':' + PORT);
    if(username !== null) {
      socket.emit('user login', {
        username: username,
        password: password
      });
    }
  });
 
  socket.on('user token', function (data) {
    if(data.result) {
      token = data.token;
      console.log(token);
      $loginPage.fadeOut();
      $chatPage.show();
      $loginPage.off('click');
      $currentInput = $inputMessage.focus();
      
      if(!isRegisteredListeners)
        registerListeners(socket);
    }
  });

  // Focus input when clicking anywhere on login page
  $(".submitInput").click(function () {
	console.log("Login clicked");
    username = $(".usernameInput").val();
    password = $(".passwordInput").val();

    socket.emit('user login', {
      username: $(".usernameInput").val(),
      password: $(".passwordInput").val()
    });
  });

  $(".submitMessage").click(function () {
    var action = JSON.parse($inputMessage.val())
    socket.emit('pbx action', action);
  });

});

