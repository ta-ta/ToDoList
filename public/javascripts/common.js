// 文字をエスケープする
function escapeText(text) {
  var TABLE_FOR_ESCAPE_HTML = {
    "&": "&amp;",
    "\"": "&quot;",
    "<": "&lt;",
    ">": "&gt;",
    "'": '&#x27;',
    '`': '&#x60;',
    '"': '&quot;'
  };
  return text.replace(/[&"<>]/g, function(match) {
    return TABLE_FOR_ESCAPE_HTML[match];
  });
}


//表示されているページのURL引数を取得
function getParameter(){
  var query = window.location.search.substring(1);
  var parameterParts = query.split("&");
  var parameters = new Object();

  parameterParts.forEach(function(part) {
    var element = part.split('=');
    var paramName = decodeURIComponent(element[0]);
    var paramValue = decodeURIComponent(element[1]);
    parameters[paramName] = decodeURIComponent(paramValue);
  });

  return parameters;
}


//引数をもとにDateを作成し, フォーマットされた日付を返す
function dateFormat(dateString){
  var date = new Date(dateString);
  if(date != "Invalid Date"){
    var formattedDate = date.getFullYear() + "年" + (date.getMonth()+1) + "月" + date.getDate() + "日";
    return formattedDate;
  }else{
    var err = "Invalid Date";
    return err;
  }
}

//2つの Date の差を, フォーマットされた日数で返す
function dateDifference(dateString1, dateString2){
  //dateString1 - dateString2を計算する
  var date1 = new Date(dateString1);
  var date2 = new Date(dateString2);
  if(date1 != "Invalid Date" && date2 != "Invalid Date"){
    var diff = date1 - date2;
    
    var days = Math.floor( diff / 1000 / 60 / 60 / 24);
    var hours = Math.floor( (diff - days * 1000 * 60 * 60 * 24) / 1000 / 60 / 60);
    var minutes = Math.floor( (diff - days * 1000 * 60 * 60 * 24 - hours * 1000 * 60 * 60) / 1000 / 60);
    var seconds = Math.floor( (diff - days * 1000 * 60 * 60 * 24 - hours * 1000 * 60 * 60 - minutes * 1000 * 60) / 1000);
    
    hours = ( '0' + hours ).slice( -2 );
    minutes = ( '0' + minutes ).slice( -2 );
    seconds = ( '0' + seconds ).slice( -2 );

    var formattedDate = days + "日 " + hours + ":" + minutes + ":" + seconds;
    return formattedDate;
  }else{
    var formattedDate = "0日 00:00:00";
    return formattedDate;
  }
}

// 応答メッセージの設定
function displayResponseMessage(message, color, $selector){
  $selector.children().remove();

  $selector.css({
    "color": color,
  });

  $selector.append('<p>' + escapeText(message) + '</p>');
  $selector.fadeIn();
};


// 応答メッセージの削除
function deleteResponseMessage(){
  console.log('deleteResponseMessage');
  var $Message = $('.responseMessage');
  $Message.fadeOut();
}
