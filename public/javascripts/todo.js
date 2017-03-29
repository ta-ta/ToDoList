// ページが表示されたときToDoリストを表示する
$(function(){
  //todoリスト名を表示する
  displayToDoListName();

  //todoを表示する
  getToDo();

  //応答メッセージを削除する
  deleteResponseMessage();

  setInterval('displayToDoListName()', 1000);

  //入力部にフォーカスを当てる
  $('#name').focus();

  //カレンダーの設定をする
  $('#calendar').datepicker();
  $("#calendar").datepicker("option", "dateFormat", 'yy/mm/dd' );
  $("#calendar").datepicker("setDate", (new Date()).toLocaleDateString());
});


// ToDoの追加 ボタンを押すと、入力値をチェックし, 追加, 再表示する。
$('#form').submit(function(){
  //todoリストのidをurlから取得
  var parameters = getParameter();
  var _id = parameters["_id"];

  // フォームに入力された値を取得
  var name = $('#name').val();
  var limitDate = $('#calendar').val();
  
  //入力値をチェックする
  check(_id, name, limitDate);

  return false;
});


// todo名を表示する
function displayToDoListName(){
  //todoリストのidをurlから取得
  var parameters = getParameter();
  var toDoList_id = parameters["_id"];

  //APIを用いてtodoリストの_idからtodoリストを取得する
  $.get("/todo?toDoList_id="+toDoList_id, function(todolist){
    if(todolist.name){
     var nearistLimitDate = nearistLimit(todolist);
     var html="<p><FONT size='6' color='#000000'>" + todolist.name + "  最も近い期限まであと, " + dateDifference(nearistLimitDate, new Date()) + "</FONT></p>";
     $(".toDoList").html(html);

    }else{
      //取得できなかった場合はトップ画面に遷移する
      window.location.href = '/';
    }
  });
}

//直近の期限の取得
function nearistLimit(todolist){
  //登録todoのあるもののみを対象とする
  if(todolist.incompleted == 0){
    return "";
  }else if(todolist.todos.length > 0){
    var nearistLimit = new Date(9007199254740991).toLocaleString();
    todolist.todos.forEach(function(todo) {
      //未完了, かつ, 期限の近いもの(期限を過ぎたものも含む)
      if(!todo.isCompleted && todo.limitDate && todo.limitDate < nearistLimit){
        nearistLimit = todo.limitDate;
      }
    });
    return nearistLimit;
  }else{
    return false;
  }
}

// ToDo一覧を取得して表示する
function getToDo(){
  //todoリストのidをurlから取得
  var parameters = getParameter();
  var toDoList_id = parameters["_id"];
  
  // すでに表示されている一覧を非表示にして削除する
  var $toDos = $('#toDos');
  $toDos.fadeOut(function(){
    $toDos.children().remove();
    // APIを用いて取得する
    $.get("/todo?toDoList_id="+toDoList_id, function(todolist){
      // 取得したToDoリストのToDoを追加する
      displayToDo(todolist, $toDos);

      // 一覧を表示する
      $toDos.fadeIn();

    });
  });
}


// todoを表示する
function displayToDo(todolist, $toDos){
  if(todolist.todos.length == 0){// todoがないとき
  	var errorMessage = "登録されたToDoはございません";
    var color = "red";
    var $selector = $("#toDoMessage");
    displayResponseMessage(errorMessage, color, $selector);
  }else if(todolist.todos.length > 0){// todoがあるとき
    //todo作成日が新しい順(DBへの登録が遅い順)
    for(var l=todolist.todos.length-1, i=l; i>=0; i--){
      var html="";

      html+="<div class='list'>";

      //todo名はエスケープ処理, 日付はフォーマットを行う
      html+="<div class='nameDatePart'><p>" + escapeText(todolist.todos[i].name) + "</p>";
      html+="<p>" + "期限：" + dateFormat(todolist.todos[i].limitDate) + "</p>";
      html+="<p>" + "作成日：" + dateFormat(todolist.todos[i].createdDate) + "</p></div>";
      
      //ボタンのidにはtodoの_id, その親要素のidにはtodoの_id+"Parent"を設定
      html+="<div class='buttonPart'><p id="+ todolist.todos[i]._id +"Parent>";
      html+="<input class='completeButton' type='button' id=" + todolist.todos[i]._id + " value='" + isCompleted(todolist.todos[i].isCompleted) + "' onclick='completeUpdate(this)'/>";
      html+="</p></div>";

      html+="</div>";

      $toDos.append(html);

      //ボタンの色の設定
      var $selector = $("#"+todolist.todos[i]._id);
      setCompleteButtonColor($selector, todolist.todos[i].isCompleted);
    }
  }
}


//完了状況の判定
function isCompleted(isCompleted){
  if(isCompleted){
  	return "完了"
  }else{
  	return "未完了";
  }
}

//ボタンの色の設定
function setCompleteButtonColor($selector, isCompleted){
  if(isCompleted == true || isCompleted == "完了"){
    $selector.css('background-color','#49a9d4');
  }else if(isCompleted == false || isCompleted == "未完了"){
    $selector.css('background-color','#f08080');
  }
}

// 完了/未完了の更新
function completeUpdate(obj){
  var todo_id = obj.id; // todoの_id
  var $button = $("#"+todo_id);

  //todoリストのidをurlから取得
  var parameters = getParameter();
  var todolist_id = parameters["_id"]; // todoリストの_id

  var $button_parent = $("#"+$button.parent().attr('id'));// 完了/未完了ボタンのid

  // APIを用いて完了状況を更新する
  $.post('/todo', {type: 'completeUpdate', toDoList_id: todolist_id, toDo_id: todo_id}, function(res){
    if(res){
      //ボタンの表示を変更する
      $button_parent.fadeOut(function(){
        $button_parent.children().remove();
        $button_parent.append("<input class='completeButton' type='button' id=" + todo_id + " value='" + res + "' onclick='completeUpdate(this)'/>");
        
        //ボタンの色の設定
        var $selector = $("#"+todo_id);
        setCompleteButtonColor($selector, res);

        $button_parent.fadeIn();
      });
    }
  });
}


// ToDoの入力チェック
function check(todolist_id, name, limitDate){
  if(name.length == 0) { //入力されていない時
  	//エラーメッセージの表示
    var errorMessage = "ToDoの名称は1文字以上にしてください";
    var color = "red";
    var $selector = $("#toDoMessage");
    displayResponseMessage(errorMessage, color, $selector);
  }else if(name.length > 30) {//入力文字数が30文字より多い時
  	//エラーメッセージの表示
    var errorMessage = "ToDoの名称は30文字以内にしてください";
    var color = "red";
    var $selector = $("#toDoMessage");
    displayResponseMessage(errorMessage, color, $selector);
  }else {
    // 重複チェックを行う
    $.post('/todo', {type: 'nameCheck', name: name, toDoList_id: todolist_id}, function(res){
      console.log(res);
      if(res == false){//同じ名称が既に追加されている時
      	//エラーメッセージの表示
        var errorMessage = "作成するToDo名は既に追加されています";
        var color = "red";
        var $selector = $("#toDoMessage");
        displayResponseMessage(errorMessage, color, $selector);
      }else if(res == true) {
        //応答メッセージを削除
        deleteResponseMessage();

        //重複していないなら追加する
        AddToDo(todolist_id, name, limitDate);
      }else {//その他のエラー
      	//エラーメッセージの表示
        var errorMessage = "ERRORが発生しました "+res;
        var color = "red";
        var $selector = $("#toDoMessage");
        displayResponseMessage(errorMessage, color, $selector);
      }
    });
  }
};


// /todo にPOSTアクセスし、追加する
function AddToDo(todolist_id, name, limitDate){
  //追加する
  $.post('/todo', {type: 'add', toDoList_id: todolist_id, name: name, limitDate: limitDate}, function(res){
    if(res == true) {
      //入力項目を空にする
      $('#name').val('');
      $('#limitDate').val('');

      //再度表示する
      getToDo();
    }
  });
}
