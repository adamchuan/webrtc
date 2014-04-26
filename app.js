
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var MongoStore = require('connect-mongo')(express);
var settings = require('./settings');
var flash = require('connect-flash');


var app = express();

// all environments
app.set('port', process.env.PORT || 3000);   // 设置端口
app.set('views', path.join(__dirname, 'views')); // 设置模板所在目录
app.set('view engine', 'ejs');  //设置模板引擎为ejs
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(flash());
app.use(express.cookieParser());
app.use(express.session({
  secret: settings.cookieSecret,
  key: settings.db,
  cookie: {maxAge: 1000 * 60 * 60 * 24 * 30},//30 days
  store: new MongoStore({
    db: settings.db
  })
}));

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));  //设置静态资源位public 文件夹

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

routes.router(app);  //传入路由

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
routes.websocket(server);
