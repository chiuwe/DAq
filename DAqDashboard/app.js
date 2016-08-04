// Module dependencies
var express = require('express');
var morgan = require('morgan');
var routes = require('./routes');
//var user = require('./routes/user');
var http = require('http');
var path = require('path');
var fs = require('fs');

var app = express();

// all environments
app.set('port', 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
//app.use(express.favicon());
//app.use(express.logger('dev'));
//app.use(express.json());
//app.use(express.urlencoded());
//app.use(express.methodOverride());
//app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan('dev'));

// development only
//if ('development' == app.get('env')) {
//  app.use(express.errorHandler());
//}

//app.get('/', routes.index);
// app.get('/', function(req, res) {
// 	var options = {
// 		root: __dirname,
// 		dotfiles: 'deny',
// 	};
// 	res.sendFile("index.html", options);
// });
app.get('/', function(req, res) {
	var files = fs.readdirSync(path.join(__dirname,'/public/csv'));
	res.render('index', {title: 'DAq Dashboard', csvFiles: files});
});

app.get('/test', function(req, res) {
	var files = fs.readdirSync(path.join(__dirname, '/public/csv'));
	res.render('test', {title: "Test", csvFiles: files});
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
