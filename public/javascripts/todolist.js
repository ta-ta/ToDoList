// ページが表示されたときToDoリストを表示する
$(function(){
  //todoリストを表示する
  getToDoList();

  //応答メッセージを削除する
  deleteResponseMessage();

  //入力部にフォーカスを当てる
  $('#name').focus();

  
});


// リストの作成 ボタンを押すと、入力値をチェックし, 追加, 再表示する。
$('#form').submit(function(){
  // フォームに入力された値を取得
  var name = $('#name').val();

  //入力をチェック
  check(name);

  return false;
});


// ToDoリスト一覧を取得して表示する
function getToDoList(){
  // すでに表示されている一覧を非表示にして削除する
  var $toDoLists = $('#toDoLists');
  $toDoLists.fadeOut(function(){
    $toDoLists.children().remove();
    // APIを用いて取得する
    $.get("/todolist", function(todolists){
      // 取得したToDoを追加していく
      displayToDoList(todolists, $toDoLists);

      // 一覧を表示する
      $toDoLists.fadeIn();
    });
  });
}


// todoリストを表示する
function displayToDoList(todolists, $toDoLists){
  $.each(todolists, function(index, todolist){
    var html="";
    html+="<div class='list'>";
    html+="<p><a href='/detail?_id=" + todolist._id + "'>" + escapeText(todolist.name) + "</a></p>";

    //todoの有無で表示内容切り替え
    if(todolist.todos.length == 0){
      html+="<p>" + "ToDoがありません" + "</p>";
    }else if(todolist.todos.length > 0){
      html+="<p>" + progress(todolist) + "</p>";
      html+="<p>" + nearistLimit(todolist) + "</p>";
    }

    html+="</div>";

    $toDoLists.append(html);
  });
}

//進捗状況の取得
function progress(todolist){
  var progressState = (todolist.completed+todolist.incompleted)+"個中"+todolist.completed+"個がチェック済み";
  return progressState;
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
    return "~" + dateFormat(nearistLimit);
  }else{
    return false;
  }
}


// ToDoリストの入力チェック
function check(name){
  if(name.length == 0) { //入力されていない時
    //エラーメッセージの表示
    var errorMessage = "ToDoリストの名称は1文字以上にしてください";
    var color = "red";
    var $selector = $("#toDoListMessage");
    displayResponseMessage(errorMessage, color, $selector);
  }else if(name.length > 30) {//入力文字数が30文字より多い時
    //エラーメッセージの表示
    var errorMessage = "ToDoリストの名称は30文字以内にしてください";
    var color = "red";
    var $selector = $("#toDoListMessage");
    displayResponseMessage(errorMessage, color, $selector);
  }else {
    // APIを用いて重複チェックを行う
    $.post("/todolist", {type: "nameCheck", name: name}, function(res){
      if(res == false){//同じ名称が既に追加されている時
        //エラーメッセージの表示
        var errorMessage = "作成するToDoリスト名は既に追加されています";
        var color = "red";
        var $selector = $("#toDoListMessage");
        displayResponseMessage(errorMessage, color, $selector);
      }else if(res == true) {//新しく追加できる時
        AddToDoList(name); 

        //追加完了メッセージの表示
        var okMessage = "新しいToDoリストが作成されました";
        var color = "black";
        var $selector = $("#toDoListMessage");
        displayResponseMessage(okMessage, color, $selector);
      }else {//その他のエラー
        //エラーメッセージの表示
        var errorMessage = "ERRORが発生しました "+res;
        var color = "red";
        var $selector = $("#toDoListMessage");
        displayResponseMessage(errorMessage, color, $selector);
      }
    });
  }
};


// /todolist にPOSTアクセスし、追加する
function AddToDoList(name){
  //APIを用いて追加する
  $.post('/todolist', {type: 'add', name: name}, function(res){
    if(res == true) {
      //入力項目を空にする
      $('#name').val('');

      //再度表示する
      getToDoList();
    }
  });
}
