var mongodb = require('./db');

function User(user) {
  this.name = user.name;
  this.password = user.password;
  this.email = user.email;
};

module.exports = User;

//存储用户信息
User.prototype.save = function(callback) {
  //要存入数据库的用户文档
  var user = {
      name: this.name,
      password: this.password,
      email: this.email
  };
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);//错误，返回 err 信息
    }
    //读取 users 集合
    db.collection('users', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);//错误，返回 err 信息
      }
      //将用户数据插入 users 集合
      collection.insert(user, {safe: true}, function (err, user) {
        mongodb.close();//关闭数据库
        callback(null);//成功！err 为 null
      });
    });
  });
};
/**
  这个是自己仿照例子中get方法写的， 用于登陆时候使用，例子登陆的思路是
  先用根据邮箱名 读取出 User实例 ，然后再匹配密码是否正确。我觉得这样很节省代码。。
  我还是老思路，直接用 邮箱和密码去数据库中匹配
**/
User.login = function(email,password,callback){
    mongodb.open(function(err,db){
        if(err){
          return callback(err);
        }
        db.collection('users',function(err,collection){
          if(err){
              mongodb.close();
              return callback(err);
          }
          collection.findOne({
            email :email,
            password : password
          },function(err,user){
            mongodb.close();
            if(err){
              callback(err);
            }
            else{
              return callback(null,user);
            }
          })
        });
    });
}
//读取用户信息
User.get = function(email, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);//错误，返回 err 信息
    }
    //读取 users 集合
    db.collection('users', function (err, collection) {
      if (err) {
        mongodb.close();//关闭数据库
        return callback(err);//错误，返回 err 信息
      }
      //查找用户名（name键）值为 name 一个文档
      collection.findOne({
        email: email
      }, function(err, user){
        mongodb.close();//关闭数据库
        if (user) {
          return callback(null, user);//成功！返回查询的用户信息
        }
        callback(err);//失败！返回 err 信息
      });
    });
  });
};