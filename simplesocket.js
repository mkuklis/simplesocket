(function () {

  var SimpleSocket = window.SimpleSocket = function (url, options) {
    options || (options = {});
    
    this.url = url;
    this.protocols = options.protocols;
    this.reconnectDelay = options.reconnectDelay || 1000;
    this.timeoutInterval = options.timeoutInterval || 2000;

    this.readyState = WebSocket.CONNECTING;
    this.forcedClose = false;
    this.timedOut = false;

    this.connect();
  }

  SimpleSocket.prototype.connect = function (reconnect) {
    var self = this;

    this.socket = new WebSocket(this.url, this.protocols);
    this.onconnecting && this.onconnecting();

    var timeoutIntervalId = setTimeout(function () {
      self.timedOut = true;
      self.socket.close();
      self.timedOut = false;
    }, this.timeoutInterval);
  
    this.socket.onopen = function (event) {
      clearTimeout(timeoutIntervalId);

      self.readyState = WebSocket.OPEN;
      reconnect = false;
      self.onopen && self.onopen(event);
    };
    
    this.socket.onclose = function (event) {
      clearTimeout(timeoutIntervalId);
      self.socket = null;

      if (self.forcedClose) {
        self.readyState = WebSocket.CLOSED;
        self.onclose && self.onclose(event);
      } 
      else {
        self.readyState = WebSocket.CONNECTING;
        self.onconnecting && self.onconnecting();
        
        if (!reconnect && !self.timedOut) {
          self.onclose && self.onclose(event);
        }

        setTimeout(function () {
          self.connect(true);
        }, self.reconnectDelay);
      }
    };

    this.socket.onmessage = function (event) {
      self.onmessage && self.onmessage(event);
    };

    this.socket.onerror = function (event) {
      self.onerror && self.onerror(event);
    };
  }

  SimpleSocket.prototype.send = function (data) {
    if (this.socket) {
      return this.socket.send(data);
    }
  }

  SimpleSocket.prototype.close = function () {
    this.forcedClose = true;
    
    if (this.socket) {
      this.socket.close();
    }
  }

  SimpleSocket.prototype.refresh = function () {
    if (this.socket) {
      this.socket.close();
    }
  }

})();