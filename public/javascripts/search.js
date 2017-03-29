// ページが表示されたときToDoリストを表示する
$(function(){
  //応答メッセージを削除する
  deleteResponseMessage();
  
  //入力部にフォーカスを当てる
  $('#searchWord').focus();
});

// 検索 ボタンを押すと、検索結果を再表示する。
$('#form').submit(function(){
  //検索する
  var searchWord = $('#searchWord').val();
  search(searchWord);
  return false;
});


//検索する
function search(searchWord){
  //todoリストのidをurlから取得
  var parameters = getParameter();
  var _id = parameters["_id"];

  check(searchWord);
}


// 検索ワードの入力チェック
function check(searchWord){
  if(searchWord.length == 0) { //入力されていない時
    //応答メッセージを削除する
    deleteResponseMessage();

    //検索結果を消去する
    var $toDos = $('#toDos');
      $toDos.fadeOut(function(){
      $toDos.children().remove();

      // 一覧を表示する
      $toDos.fadeIn();
    });
  }else if(searchWord.length > 30) {//入力文字数が30文字より多い時
    //応答メッセージを削除する
    deleteResponseMessage();
  }else {
    //検索する
    //APIを用いてtodo名を検索
    $.post("/todo", {type: "search", searchWord: searchWord}, function(res){
      var $toDos = $('#toDos');
      $toDos.fadeOut(function(){
        $toDos.children().remove();

        //検索結果を表示する
        displayToDo(res, $toDos);

        // 一覧を表示する
        $toDos.fadeIn();
      });
    });

    //todoリスト名を検索
    $.post("/todolist", {type: "search", searchWord: searchWord}, function(res){
      var $toDoLists = $('#toDoLists');
      $toDoLists.fadeOut(function(){
  	    $toDoLists.children().remove();

        //検索結果を表示する
        displayToDoList(res, $toDoLists);

        // 一覧を表示する
        $toDoLists.fadeIn();
      });
    });
  }
};


// todoを表示する
function displayToDo(todos, $toDos){
  //取得件数により表示内容を選択
  if(todos.length == 0){
    //エラーメッセージの表示
  	var errorMessage = "対象のToDoは見つかりません";
    var color = "red";
    var $selector = $("#toDoMessage");
    displayResponseMessage(errorMessage, color, $selector);
  }else{
    //応答メッセージの表示
  	var okMessage = "ToDoが" + todos.length + "件見つかりました";
    var color = "black";
    var $selector = $("#toDoMessage");
    displayResponseMessage(okMessage, color, $selector);

    //検索結果を作成日の新しい順にソート
    todos.sort(function(a, b) {
      var aKey = a.createdDate;
      var bKey = b.createdDate;
      if( aKey < bKey ){
        return 1;
      }else if( aKey > bKey ){
        return -1;
      }
      return 0;
    });

    //htmlを作成する
    $.each(todos, function(index, todo){
      var html="";
      html+="<div class='list'>";

      html+="<div class='namePart'>";
      html+="<p><a href='/detail?_id=" + todo.list_id + "'>" + escapeText(todo.name) + "</a></p>";
      html+="<p>リスト：" + todo.listName + "</p>";
      html+="</div>";

      html+="<div class='datePart'>";
      html+="<p>期限：" + dateFormat(todo.limitDate) + "</p>";
      html+="<p>作成日：" + dateFormat(todo.createdDate) + "</p>";
      html+="</div>";

      html+="</div>";

      $toDos.append(html);
    });
  }
}


// todoリストを表示する
function displayToDoList(todolists, $toDoLists){
  //取得件数により表示内容を選択
  if(todolists.length == 0){
    //エラーメッセージの表示
  	var errorMessage = "対象のToDoリストは見つかりません";
    var color = "red";
    var $selector = $("#toDoListMessage");
    displayResponseMessage(errorMessage, color, $selector);
  }else{
    //応答メッセージの表示
    var okMessage = "ToDoリストが" + todolists.length + "件見つかりました";
    var color = "black";
    var $selector = $("#toDoListMessage");
    displayResponseMessage(okMessage, color, $selector);

    //検索結果から作成日の新しい順にhtmlを作成する
    //作成日はDBへの追加順と同じ
    for(var l=todolists.length-1, i=l; i>=0; i--){
      var html="";

      html+="<div class='list'>";

      html+="<div class='namePart'>";
      html+="<p><a href='/detail?_id=" + todolists[i]._id + "'>" + escapeText(todolists[i].name) + "</a></p>";
      html+="</div>";

      html+="<div class='datePart'>";
      html+="<p>作成日：" + dateFormat(todolists[i].createdDate) + "</p>"
      html+="</div>";

      html+="</div>";
      $toDoLists.append(html);
    }
  }
}
