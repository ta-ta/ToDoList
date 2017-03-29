var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var detail = require('./routes/detail');
var search = require('./routes/search');;

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/detail', detail);
app.use('/search', search);


// mongooseを用いてMongoDBに接続する
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/ToDoList');

// スキーマを定義する
var Schema = mongoose.Schema;
//todoに関するスキーマ
var toDoSchema = new Schema({
  name        : String,
  createdDate : {type: Date, default: Date.now},
  limitDate   : Date,
  isCompleted : {type: Boolean, default: false}
});
var ToDo = mongoose.model('Todo', toDoSchema);

//todoリストに関するスキーマ
var toDoListSchema = new Schema({
  name       : String,
  incompleted: {type: Number, default: 0},
  completed  : {type: Number, default: 0},
  createdDate : {type: Date, default: Date.now},
  nearistToDoCreatedDate : Date,
  todos       : {type: [toDoSchema]}
});
var ToDoList = mongoose.model('Todolist', toDoListSchema);


// ----- todoリストに関するAPI ----- //
// /todolistにGETアクセスしたとき、
// ToDoリストの一覧を最も新しく登録したToDoの作成日が近い順に取得するAPI
app.get('/todolist', function(req, res) {
  // すべてのToDoを取得する
  ToDoList.find({}, {}, {sort:{nearistToDoCreatedDate: -1}}, function(err, todolists) {
    if(err){
      throw err;
      var result = false;
      res.send(result);
    }else{
	  res.send(todolists);
    }
  });
});

// /todolistにPOSTアクセスしたとき、
// type: nameCheck; todoリスト名の重複チェックをするAPI
// type: add; todoリスト名を追加するAPI
// type: search; 検索ワード含むtodoリストを取得するAPI
app.post('/todolist', function(req, res) {
  var type = req.body.type;
  var name = req.body.name;
  var toDoList_id = req.body.toDoList_id;
  var searchWord = req.body.searchWord;

  //tyoeにより処理内容を選択
  if(type == "nameCheck" && name) {
    toDoListNameCheck(name, function(result){
      res.send(result);
    });
  }else if(type == "add" && name){
  	toDoListAdd(name, function(result){
      res.send(result);
    });
  }else if(type == "search" && searchWord){
    toDoListSearch(searchWord, function(results){
      res.send(results);
    });
  }else {
    res.send("ERROR");
  }

});

//type: nameCheck; の処理
function toDoListNameCheck(name, callback){
  // todoリスト名が nameであるtodoリストドキュメントの数を調べる
  ToDoList.count( {name : name}, function(err, count) {
    var result;
  	if(err){
      throw err;
      result = false;
      callback(result);
  	}else{
      var nameCount = count;// ToDoの名前がなければ(count==0) true
      if(nameCount == 0){
        result = true;
        callback(result);
      }else {
        result = false;
        callback(result);
      }
    }
  });
}

//type: add; の処理
function toDoListAdd(name, callback){
  //ドキュメントを作成し, 保存する
  var todolist = new ToDoList();
  todolist.name = name;
  todolist.save();

  var result = true;
  callback(result);
}

//type: search; の処理
function toDoListSearch(searchWord, callback){
  //全todoリストドキュメントを取得
  ToDoList.find( {}, function(err, todolists) {
    var results;
    if(err){
      throw err;
      results = false;
      callback(result);
    }else{
      results=[];
      todolists.forEach(function(todolist) {
      	//todoリスト名に, searchWord を含むものを取得
        if(todolist.name.match(searchWord)){
          results.push(todolist);
        }
      });
      callback(results);
    }
  });
}
// ----- todoリストに関するAPI 終了 ----- //


// ----- todoに関するAPI ----- //
// /todoにGETアクセスしたとき、
// ToDoリストの_idに対応するtodoの一覧を取得するAPI
app.get('/todo', function(req, res) {
  var toDoList_id = req.query.toDoList_id;

  // toDoList_idを持つすべてのToDoを取得して送る
  ToDoList.findById(toDoList_id, function(err, todolist) {
    if(err){
      throw err;
      result = false;
      res.send(result);
    }else{
      res.send(todolist);
    }
  });
});


// /todoにPOSTアクセスしたとき、
// type: nameCheck; name の重複チェックをする
// type: add; todoを追加する
// type: completeUpdate 完了/未完了を更新
// type: search; todo名を検索する
app.post('/todo', function(req, res) {
  var type = req.body.type;
  var name = req.body.name;
  var limitDate = req.body.limitDate;
  var toDoList_id = req.body.toDoList_id;
  var toDo_id = req.body.toDo_id;
  var searchWord = req.body.searchWord;

  //tyoeにより処理内容を選択
  if(type == "nameCheck" && toDoList_id && name) {
    toDoNameCheck(toDoList_id, name, function(result){
      res.send(result);
    });
  }else if(type == "add" && toDoList_id && name && limitDate){
    toDoAdd(toDoList_id, name, limitDate, function(result){
      res.send(result);
    });
  }else if(type == "completeUpdate" && toDoList_id && toDo_id){
    toDoCompleteUpdate(toDoList_id, toDo_id, function(result){
     console.log(result);
      res.send(result);
    });
  }else if(type == "search" && searchWord){
    toDoSearch(searchWord, function(results){
      res.send(results);
    });
  }else {
    res.send("ERROR");
  }
});

//type: nameCheck; の処理
function toDoNameCheck(toDoList_id, name, callback){
  // _id が toDoList_id, todo名が name であるtodoリストドキュメントの数を取得
  ToDoList.find( {_id: toDoList_id, "todos.name": name}, function(err, todolists) {
    var result;
  	if(err){
      throw err;
      result = false;
      callback(result);
  	}else{
  	  //見つからなければ, true を返す
      if(todolists.length == 0){
        result = true;
        callback(result);
      }else {
        result = false;
        callback(result);
      }
    }
  });
}

//type: add; の処理
function toDoAdd(toDoList_id, name, limitDate, callback){
  var result;
  var todo={};
  todo.name = name;
  todo.limitDate = limitDate;

  //todoドキュメントを作成し, _id が toDoList_id のtodoリストドキュメントに保存する
  ToDoList.update({ _id: toDoList_id }, { $push: { todos: todo } }, { upsert: false, multi: false }, function(err) {
    if(err){
      throw err;
      result = false;
      callback(result);
    }
  });

  //未完了数を1増やす
  ToDoList.update( {_id: toDoList_id}, {$inc: {incompleted: 1}}, function(err) {
    if(err){
      throw err;
      result = false;
      callback(result);
    }
  });

  //最も新しく登録したToDoの作成日を現在時刻に更新する
  ToDoList.update( {_id: toDoList_id}, {nearistToDoCreatedDate: new Date()}, function(err) {
    if(err){
      throw err;
      result = false;
      callback(result);
    }
  });

  result = true;
  callback(result);
}

//type: completeUpdate; の処理
function toDoCompleteUpdate(toDoList_id, toDo_id, callback){
  // _id が toDoList_id, todoの_id が toDo_id であるtodoリストドキュメントを取得
  ToDoList.find( {_id: toDoList_id, "todos._id": toDo_id}, function(err, todolists) {
    var result;
    if(err){
      throw err;
      result = false;
      callback(result);
    }else{
      //正しく見つかれば(検索結果が1件のみ), 完了状況を更新する
      if(todolists.length == 1){
      	//登録されているtodoを順に調べる
        for (var i=0, l=todolists[0].todos.length; i<l; i++){
          //対象todoの_idが見つかれば更新する
          if(todolists[0].todos[i]._id == toDo_id){
            var updatedIsCompleted = !todolists[0].todos[i].isCompleted;
            //完了状況を更新する
            ToDoList.update( {_id: toDoList_id, "todos._id": toDo_id}, {"todos.$.isCompleted": updatedIsCompleted}, function(err) {
              if(err){
                throw err;
                result = false;
                callback(result);
              }
              console.log(updatedIsCompleted);
            });
            //更新後の完了状況により, 完了数, 未完了数を増減させる
            if(updatedIsCompleted){
              ToDoList.update( {_id: toDoList_id}, {$inc: {completed: 1}}, function(err) {
                if(err){
                  throw err;
                  result = false;
                  callback(result);
                }
              });
              ToDoList.update( {_id: toDoList_id}, {$inc: {incompleted: -1}}, function(err) {
                if(err){
                  throw err;
                  result = false;
                  callback(result);
                }
              });
              result = "完了";
              callback(result);
            }else {
              ToDoList.update( {_id: toDoList_id}, {$inc: {completed: -1}}, function(err) {
                if(err){
                  throw err;
                  result = false;
                  callback(result);
                }
              });
              ToDoList.update( {_id: toDoList_id}, {$inc: {incompleted: 1}}, function(err) {
                if(err){
                  throw err;
                  result = false;
                  callback(result);
                }
              });
              result = "未完了";
              callback(result);
            }
          }
        }
      }else{
        console.log(todolists.length);
        result = false;
        callback(result);
      }
    }
  });
}

//type: search; の処理
function toDoSearch(searchWord, callback){
  //全todoリストドキュメントを取得
  ToDoList.find( {}, function(err, todolists) {
    var results;
    if(err){
      throw err;
      results = false;
      callback(result);
    }else{
      results=[];
      //各todoリストドキュメントに対して
      todolists.forEach(function(todolist) {
      	//各todoドキュメントに対して
        todolist.todos.forEach(function(todo) {
          //todo名に, searchWord を含むものを取得
          if(todo.name.match(searchWord)){
          	var res = new Object();
          	res.createdDate = todo.createdDate;
          	res.limitDate = todo.limitDate;
          	res.name = todo.name;
          	//todoリストの情報も付加する
          	res.listName = todolist.name;
          	res.list_id = todolist._id;
            results.push(res);
          }
        });
      });
      callback(results);
    }
  });
}
// ----- todoに関するAPI 終了 ----- //


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;