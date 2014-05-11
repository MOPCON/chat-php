$(function(){
  chatClient.$msg = $('#'+chatClient.msgPannel);
  chatClient.$input = $('#'+chatClient.input);
  chatClient.addMsg('聊天室小精靈啟動！', 'notice');
  chatClient.presetIdentity();
  chatClient.connect();

  $('#actForm').on('submit', function(e){
      chatClient.speak();
      e.stopPropagation();
      e.preventDefault();
  });
});


chatClient = {
  url: 'ws:localhost:8080',
  msgPannel: 'msgPannel',
  input: 'msgInput',
  maxMsgNum: 1000,
  retryDelayMs: 5*60*1000, // wait 5min

  uidCookieName: 'a',
  nickCookieName: 'b',

  uid: false,
  nick: false,

  connected: false,

  checkSupport: function() {
    var isSupported = (("WebSocket" in window && window.WebSocket != undefined) ||
                       ("MozWebSocket" in window));
    if (!isSupported) {
      return false;
    }
    return true;
/*
    try{
      var ws = new WebSocket("ws:websocket.org");
      ws.close('');
    }catch(e){ //throws code 15 if has socket to me babies
      return true;
    }
    return false;
*/
  },

  connect: function() {
    if (!this.checkSupport()) {
      this.addMsg('很抱歉，你用的瀏覽器不支援 WebSocket，我沒有辦法工作 T__T','error');
      return;
    }
    if (this.ws && this.ws.readyState==1) {
      return;
    }
    try{
      this.ws = new WebSocket(this.url);
      this.ws.onmessage = function(obj){chatClient.onmessage(obj)};
      this.ws.onerror = function(obj){chatClient.onerror(obj)};
      this.ws.onclose = function(obj){chatClient.onclose(obj)};
      this.ws.onopen = function(obj){chatClient.onopen(obj)};
      this.connected = true;
    } catch (e) {
      if(console&&console.log){
        console.log(e);
      }
    }
  },


  onmessage: function(obj){
    var data = {cmd:'nop'};
    try{
      data = JSON.parse(obj.data);
    } catch(e) {
      if (console && console.log) {
        console.log(e);
      }
    }

    // 不同指令做不同動作
    switch (data.cmd) {
      case 'say':
        var sender = '['+data.uid+']'+data.nick+": ";
        var msg = data.payload;
        this.addMsg(msg, 'say', sender);
        break;
      case 'join':
        var msg = '['+data.uid+']'+data.nick+" 加入了聊天室 ";
        this.addMsg(msg, 'roomNotice', sender);
        break;
      case 'nop':
        break;
      default:
        if (console && console.log) {
            console.log("無法識別的訊息物件:");
            console.log(data);
        }
        break;
    }
  },

  onclose: function(){
    this.addMsg("跟伺服器的連線斷了 T_T", 'warn');
    this.connected = false;
  },

  onerror: function(){
    this.addMsg("跟伺服器的連線怪怪的 @__@", 'error');
  },

  onopen: function(){
    this.addMsg('我連上伺服器了～', 'notice');
    this.send('join');
  },

  speak: function(){
    var msg = this.$input.val();
    var success = this.send('say', msg);
    if (success) {
        this.$input.val('');
    }
  },

  send: function(cmd, payload){
    if (!this.connected) {
        this.addMsg('很抱歉，無法送出訊息。我現在沒有連上伺服器 T_T', 'warn');
        return false;
    }

    var data = {cmd:cmd, payload: payload, uid: this.uid, nick: this.nick};
    var json = JSON.stringify(data);
    this.ws.send(json);
    this.onmessage({data: json});
    return true;
  },

  addMsg: function(msg, type, sender){
    // 時間
    var now = new Date();
    var hour = now.get
    var nowStr = "["+now.toLocaleTimeString()+"] ";

    // 顯示訊息
    $('<div>')
      .append($('<span>').text(nowStr))
      .append($('<span>').text(sender).addClass('sender'))
      .append(document.createTextNode(msg)) //escape
      .addClass(type)
      .addClass('msg')
      .prependTo(this.$msg)
      .hide()
      .slideDown();

    //太多的訊息就砍掉
    var $msgs = this.$msg.children();
    if ($msgs.length>this.maxMsgNum) {
        for (var idx=this.maxMsgNum; idx<$msgs.length; idx++) {
            $msgs.eq(idx).slideUp('', function(){$(this).remove()});
        }
    }
  },

  presetIdentity: function(){
    // the UID is not meant to be secure, and IT IS NOT!
    this.uid = cookie.get(this.uidCookieName);
    if (!this.uid) {
      this.setUID(this.makeID(6));
    }

    this.nick = cookie.get(this.nickCookieName);
    if (!this.nick) {
      this.setNick(this.makeNick());
    }

    this.addMsg("您的ID是 "+this.uid+"，暱稱是「"+this.nick+"」", 'notice');
  },

  setNick: function(nick){
    this.nick = nick;
    cookie.set(this.nickCookieName, nick);
  },

  setUID: function(uid){
    this.uid = uid;
    cookie.set(this.uidCookieName, uid);
  },

  makeID: function(idLen){
    var text = "";
    var pool = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i=0; i<idLen; i++ ) {
        text += pool.charAt(Math.floor(Math.random() * pool.length));
    }

    return text;
  },

  makeNick: function(){
    var adj = ['水裡','火裡','山上','海邊','被窩','紅色','可愛','天真','浪漫','滾動','扭動','愛睡','糟糕','奇怪','正直','呆呆'];
    var n = ['手機','浮雲','香蕉','蘋果','麵包','網頁','程式','客戶','平板','筆電','路人','山寨','贊助商'];
    return adj[Math.floor(Math.random() * adj.length)]+'的'+n[Math.floor(Math.random() * n.length)];
  }

};

// cookie helper
// window.cookie, 不是 document.cookie
cookie = {
  set: function (name, value){
    var Days = 30;
    var exp  = new Date();
    exp.setTime(exp.getTime() + Days*24*60*60*1000);
    document.cookie = name + "="+ escape (value) + ";expires=" + exp.toGMTString();
  },
  get: function (name){
    var arr = document.cookie.match(new RegExp("(^| )"+name+"=([^;]*)(;|$)"));
    return (arr == null) ? null : unescape(arr[2]);
  },
  del: function (name){
    var exp = new Date();
    exp.setTime(exp.getTime() - 1);
    var cval=this.get(name);
    if(cval!=null){
      document.cookie= name + "="+cval+";expires="+exp.toGMTString();
    }
  }
};