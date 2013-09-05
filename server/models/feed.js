// Generated by CoffeeScript 1.3.3
var Feed, americano, getAbsoluteLocation, getFeed, http, https, isHttp, saveFeedBuffer, zlib;

http = require('http');

https = require('https');

zlib = require('zlib');

americano = require('americano-cozy');

module.exports = Feed = americano.getModel('Feed', {
  'title': {
    type: String
  },
  'url': {
    type: String
  },
  'last': {
    type: String
  },
  'tags': {
    type: String
  },
  'description': {
    type: String
  },
  'content': {
    type: String
  },
  'created': {
    type: Date,
    "default": Date
  },
  'updated': {
    type: Date,
    "default": Date
  }
});

Feed.all = function(params, callback) {
  return Feed.request("all", params, callback);
};

saveFeedBuffer = function(feed, buffer) {
  feed.content = buffer.toString("UTF-8");
  feed.updated = new Date;
  return feed.save();
};

isHttp = function(url) {
  return url.slice(0, 4) === "http";
};

getAbsoluteLocation = function(url, location) {
  var loc;
  loc = location;
  if (loc.charAt(0) === '/') {
    loc = url.split('/').slice(0, 3).join('/') + loc;
  }
  if (!isHttp(loc)) {
    loc = "http://" + loc;
  }
  return loc;
};

getFeed = function(feed, url, callback) {
  var protocol;
  if (url.slice(0, 5) === "https") {
    protocol = https;
  } else {
    protocol = http;
    if (!isHttp(url)) {
      url = "http://" + url;
    }
  }
  return protocol.get(url, function(res) {
    var chunks, data, length;
    data = '';
    chunks = [];
    length = 0;
    res.on('data', function(chunk) {
      chunks.push(chunk);
      return length += chunk.length;
    });
    return res.on('end', function() {
      data = Buffer.concat(chunks, length);
      if ((res["headers"] != null) && (res["headers"]["content-encoding"] != null)) {
        if (res["headers"]["content-encoding"] === "x-gzip") {
          zlib.unzip(data, function(err, buffer) {
            return saveFeedBuffer(feed, buffer);
          });
        }
      } else if ((res["headers"] != null) && (res["headers"]["location"] != null)) {
        feed.url = getAbsoluteLocation(url, res["headers"]["location"]);
        feed.save();
        getFeed(feed, feed.url, function() {});
      } else {
        saveFeedBuffer(feed, data);
      }
      return callback.call(feed);
    });
  }).on('error', function() {
    return callback.call("Error: can't join url");
  });
};

Feed.prototype.update = function(params, callback) {
  var feed;
  feed = this;
  return getFeed(feed, feed.url, callback);
};
