
/*
 * GET home page.
 */
var crypto = require('crypto'),
    User = require('../models/user.js'),
    socketio = require('socket.io');

var UserMap = new Object();//存放在线的用户
var clients = new Object();//用户socket的集合 用于单向发送
var sessionMap = new Object();
exports.websocket = function(server){


	var io = socketio.listen(server);

	//私人频道
	var personalChat = io.of('/personal').on('connection',function(socket){
		console.log("私人频道连接成功");
		clients[socket.id] = socket; //
		socket.on('pchat',function(data){
			console.log('私人频道接受到消息')

			if(typeof clients[data.toId] !== 'undefined'){
				clients[data.toId].emit('pchat',{
					formId :socket.id,
					formName : data.formName,
					message:data.message
				}); //单向发送
			}
			else{
				socket.emit('errorLeave',{
					errorId:data.toId
				});
			}
		});
		socket.on("offer",function(data){
			data.formId = socket.id;
			if(typeof clients[data.toId] !== 'undefined'){
				clients[data.toId].emit("offer",data);
			}
		});
		socket.on("agree",function(data){
			console.log(data);
			data.formId = socket.id;
			if(typeof clients[data.toId] !== 'undefined'){
				clients[data.toId].emit("agree",data);
			}
		});
		socket.on("rtc",function(data){
			data = JSON.parse(data);
			data.formId = socket.id;
			if(typeof clients[data.toId] !== 'undefined'){
				clients[data.toId].emit("rtc",JSON.stringify(data));
				clients[data.toId].emit("aaa",data.event);
				console.log("已发送");
			}else{
				socket.emit("errorLeave",{
					errorId:data.toId
				});
			}
		});

		socket.on('disconnect',function(message){
			delete clients[socket.id];
		});

	});
	//公共频道
	var publicChat = io.of('/public').on('connection',function(socket){
		
 		socket.on('message', function(message){  //接受message频道
 			message = JSON.parse(message);  //转换json格式
 			
 			if(message.type == "userMessage"){  
 				socket.broadcast.send(JSON.stringify(message)); 
				message.type = "myMessage" ;
			}
		});
		socket.on('userenterroom',function(message){

			console.log(message.name + "进入了房间");

			message.sid = socket.id ;
			UserMap[socket.id] = new Object();
			UserMap[socket.id].name = message.name;
			UserMap[socket.id].sid = message.sid;
			
			socket.broadcast.emit("userenterroom",message); //向其他用户发送有用户进入的消息
			socket.emit("firstin",UserMap); //向当前用户发送当前房间所有用户的列表

		});
		socket.on('disconnect',function(){
			console.log(socket.id + "失去连接");
			delete UserMap[socket.id]; //从映射从去除
			
			socket.broadcast.emit("userleaveroom",{
				sid:socket.id
			});
		});

	});

	/*-------


	-----*/
}
exports.router = function(app) {


  app.get('/test',function(req,res){
  	res.render('test');
  });


  app.get('/', function (req, res) {
  	req.session.user = null;
    res.render('index',{
    	error:req.flash("error").toString()
    });
  });
  //主题聊天页面
  app.get('/main',function(req,res){
  	if(!req.session.user){ //检测是否已经登陆
		req.flash('error', '请先登陆');
	    return res.redirect('/');//
  	}else{

  		 res.render('main',{
  		 	success: req.flash('success').toString(),
  		 	user: req.session.user
  		 });
  	}
  })
  //登陆
  app.post('/login',function(req,res){
  	var md5 = crypto.createHash('md5'),
	    password = md5.update(req.body.pwd).digest('hex');

	User.login(req.body.email,password,function(err,user){
		if(err){
			req.flash('error', err);
	        return res.redirect('/');
		}
		if(user){
			req.session.user = user;
			res.redirect('/main');
		}else{
			req.flash('error','账号或密码错误');
			return res.redirect('/');
		}

	});
  });
  //注册
  app.get('/reg',function(req,res){
  		res.render('reg',{
  			error: req.flash('error').toString()
  		});
  });
  app.post('/reg', function (req, res) {

	  //生成密码的 md5 值
	  var md5 = crypto.createHash('md5'),
	      password = md5.update(req.body.pwd).digest('hex');
	  //实例化一个user类
	  var newUser = new User({
	      name: req.body.nickname,
	      password: password,
	      email: req.body.email
	  });
	  //检查邮箱是否被注册过
	  User.get(newUser.email, function (err, user) {
	    if (user) {
	      req.flash('error', '邮箱已被注册!');
	      return res.redirect('/reg');//用户名存在则返回注册页
	    }
	    //如果不存在则新增用户
	    newUser.save(function (err) {
	      if (err) {
	        req.flash('error', err);
	        return res.redirect('/reg');
	      }
	      req.session.user = newUser;//用户信息存入 session
	      req.flash('success', '注册成功!');
	      res.redirect('/main');//注册成功后返回主页
	    });
	  });
	});

	/*
	//退出登录
	app.post('/test',function(req,res){
		console.log("在执行onbeforeunload");
	})
	app.post('/logout',function(req,res){	
		console.log('在执行onunload');
		console.log('用户退出浏览器');

	   req.session = null; //清空session信息
	   res.writeHead(200, {"Content-Type": "text/plain"});
	   res.write("success");
	   res.end();
	});
	*/

};