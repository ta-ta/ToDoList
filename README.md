ToDoリスト
===========
ToDoの管理ができるWebサイト

トップ画面から, ToDoリスト名を入力することによりToDoリストを作成し, 各ToDoリスト画面にてToDoを作成し管理する.  
検索画面では, 作成したToDoリスト, ToDoに対して検索することができる.  

##1. 使用した技術要素
フロントエンド:

- HTML5
- CSS
- JavaScript (jQuery, jQuery ui Datepicker)

サーバサイド:

- Node.js
	+ Webアプリケーションフレームワーク: Express
	+ パッケージ: mongoose, supervisor

データベース:

- MongoDB

##2. 全体の設計・構成についての説明

###ルーティングについて

#####`localhost:3000/` へアクセスした時

表示するデータ: `views/index.ejs`, `views/header.ejs`  
呼び出すファイル: 
`public/javascripts/todolist.js`, `public/javascripts/common.js`, 
`public/stylesheets/todolist.css`, `public/stylesheets/style.css`

#####`localhost:3000/detail` へアクセスした時
表示するデータ: `views/detail.ejs`, `views/header.ejs`  
呼び出すファイル: 
`public/javascripts/todo.js`, `public/javascripts/common.js`, 
`public/stylesheets/todo.css`, `public/stylesheets/style.css`

#####`localhost:3000/search` へアクセスした時
表示するデータ: `views/search.ejs`, `views/header.ejs`  
呼び出すファイル: 
`public/javascripts/search.js`, `public/javascripts/common.js`, 
`public/stylesheets/search.css`, `public/stylesheets/style.css`

###データベースの設計について
####ToDoを表すのスキーマの設計
ToDoの表示に必要なToDo名, 作成日, 期限, 完了状況を格納する.  
スキーマは以下のように設計する. 

| 内容       | フィールド名  | データ型  |
|:---------:|:-----------:|:--------:|
| ID        | _id         | ObjectId |
| ToDo名    | name        | String   |
| 作成日     | createdDate | Date     |
| 期限       | limitDate   | Date     |
| 完了/未完了 | isCompleted | Boolean  |

####ToDoリストを表すのスキーマの設計
ToDoリストの表示にはToDoリスト名, 作成日, 登録されているToDo, 完了/未完了のToDoの個数が必要となる.  
またトップ画面での表示順のために最も最近ToDoを作成した日付も必要となる.  
スキーマは以下のように設計する. 

| 内容                       | フィールド名             | データ型      |
|:-------------------------:|:----------------------:|:------------:|
| ID                        | _id                    | ObjectId     |
| ToDoリスト名                | name                   | String      |
| 未完了のToDo数              | incompleted            | Number       |
| 完了のToDo数                | completed              | Number      |
| 作成日                     | createdDate            | Date         |
| ToDoを格納する配列           | toDos                  | ToDoスキーマ  |
| 最も新しく登録したToDoの作成日 | nearistToDoCreatedDate | Date        |

###APIについて
####ToDoリストに関するAPI
#####`/todolist`へGETアクセス
- ToDoリストの一覧を取得する
	- 入力: なし
	- 出力: 最も新しく登録したToDoの作成日が近い順に取得する

<br/>
#####`/todolist`へPOSTアクセス
`type値`により以下の処理内容を選択する

- ToDoリスト名の重複を確認する
	- 入力: `type: "nameCheck", name: ToDoリスト名`
	- 出力: 登録したいToDoリスト名と登録されているToDoリスト名が重複しているなら false, 重複していないなら true
	- 仕様: 完全一致でない限り重複していないとみなす
- ToDoリストの追加する
	- 入力: `type: "add", name: ToDoリスト名`
	- 出力: なし
- ToDoリスト名を検索する
	- 入力: `type: "search, searchWord: 検索文字列`
	- 出力: 検索文字列を含むToDoリスト

####ToDoに関するAPI
#####`/todo`へGETアクセス
- ToDoの一覧を取得する
	- 入力: `_id: ToDoリストのID`
	- 出力: 入力されたToDoリストのIDを持つToDoリスト

<br/>
#####`/todo`へPOSTアクセス
`type値`により以下の処理内容を選択する

- ToDo名の重複を確認する
	- 入力: `type: "nameCheck", _id: ToDoリストのID, name: ToDo名`
	- 出力: 登録したいToDo名と, 入力されたToDoリストのIDを持つToDoリストに登録されているToDo名が重複しているなら false, 重複していないなら true
	- 仕様: 完全一致でない限り重複していないとみなす
- ToDoを追加する
	- 入力: `type: "add", _id: ToDoリストのID, name: ToDo名, limitDate: ToDoの期限`
	- 出力: なし
	- 仕様: 入力されたToDoリストのIDを持つToDoリストに, 入力されたToDo名, 期限を持つToDoを追加する  
	入力されたToDoリストのIDを持つToDoリストの未完了数を1増やす  
	入力されたToDoリストのIDを持つToDoリストの最も新しく登録したToDoの作成日を現在日時に更新する
- ToDoの完了状況を反転する
	- 入力: `type: "completeUpdate", _id: 登録されているToDoリストのID, ToDoリストのID_id, ToDo_id:登録されているToDoのID`
	- 出力: 更新後の完了状況を表す文字列
	- 仕様: 入力されたToDoリストID, ToDoのIDを持つToDoの完了状況を反転する  
	入力されたToDoリストのIDを持つToDoリストの完了数, 未完了数を増減させる
- ToDo名を検索する
	- 入力: `type: "search, searchWord: 検索文字列`
	- 出力: 検索文字列を含むToDoの名前, 作成日, 期限, またこれらを含むToDoリストのID, 名前からなる連想配列の配列


###各ファイルでの処理について
### ejs
#####`views/index.ejs`
ToDoリスト画面(トップ画面)の表示を行う

- ToDoリスト名の入力を行う
	- 入力は最大30文字とする
	- 受理する文字コードは"UTF-8"とする
- 入力を処理するボタンを作成する
- 応答メッセージを表示する
- ToDoリスト一覧を表示する
	- ToDoへのリンク, 完了状況, 期限を表示する

<br/>
#####`views/detail.ejs`
ToDo画面(詳細画面)の表示を行う

- ToDoリスト名と期限までのタイムカウントを表示する
- ToDo名と期限の入力を行う
	- ToDo名は最大30文字とする
	- 期限の入力にはカレンダーを用いる
	- 受理する文字コードは"UTF-8"とする
- 入力を処理するボタンを作成する
- 応答メッセージを表示する
- ToDo一覧を表示する
	- ToDo名, 期限, 作成日を表示する

<br/>
#####`views/search.ejs`
検索画面の表示を行う

- 検索文字列の入力を行う
	- 検索文字列は最大30文字とする
	- 受理する文字コードは"UTF-8"とする
- ToDo検索の応答メッセージを表示する
- ToDo一覧を表示する
	- ToDoリストへのリンク, ToDoリスト名, 期限, 作成日を表示する
- ToDoリスト検索の応答メッセージを表示する
- ToDoリスト一覧を表示する
	- ToDoリストへのリンク, 作成日を表示する

<br/>
#####`views/header.ejs`
ヘッダーの表示を行う

- ヘッダーを表示する
	- トップ画面, 検索画面へのリンクを表示する

<br/>
### css
#####`public/stylesheets/todolist.css`
ToDoリスト(トップ画面)を装飾する

- ToDoリスト名の入力部を左, 作成ボタン部を右に寄せる
	- 入力部分はフォントサイズを調整する
- ToDoリスト部はスクロール処理を行う

<br/>
#####`public/stylesheets/todo.css`
ToDo画面(詳細画面)を装飾する

- toDo名の入力部を左, 追加ボタン部を右に寄せる
	- 入力部分はフォントサイズを調整する
- ToDo部はスクロール処理を行う
- ToDo名などの項目を左に, 完了ボタン部を右に寄せる

<br/>
#####`public/stylesheets/search.css`
検索画面を装飾する

- 検索ワードの入力部を左, 検索ボタン部を右に寄せる
	- 入力部分はフォントサイズを調整する
- ToDo名などの項目を左に, 期限などの項目を右に寄せる
- ToDoリスト名などの項目を左に, 作成日を右に寄せる

<br/>
#####`public/stylesheets/style.css`
他のcssファイルに共通の処理を行う

- トップへのリンクを左, 検索へのリンクを右に寄せる
- 背景などの色を設定する

<br/>
### js
#####`public/javascripts/todolist.js`
ToDoリスト(トップ画面)のためのデータを作成する

- ページが表示されたとき
	- ToDoリストを表示する
	- 応答メッセージを削除する
	- 入力部にフォーカスを当てる
- 作成ボタンが押されたとき
	- 入力チェックを行い, データベースに登録する
	- 再表示する

<br/>

- ToDoリストを取得する
	- 入力: なし
	- 出力: なし
	- 仕様: APIを用いる

- ToDoリストを表示する
	- 入力: ToDoリストの配列
	- 出力: なし
	- 仕様: エスケープ処理を行う  
	完了状況, 直近の期限を表示する

- 進捗状況の取得
	- 入力: ToDoリスト
	- 出力: 進捗状況を表す文字列
	- 仕様: フォーマットの指定あり

- 直近の期限の取得
	- 入力: ToDoリスト
	- 出力: 期限を表す文字列
	- 仕様: 未完了, かつ, 期限の近いもの(期限を過ぎた未完了のToDoも含む)

- 入力されたToDoリスト名をチェックする
	- 入力: ToDoリスト名
	- 出力: なし
	- 仕様: 長さのチェック, APIを用いて重複のチェック  
	重複しない場合, データベースに追加する  
	応答メッセージを表示する

- ToDoリストを追加する
	- 入力: ToDoリスト名
	- 出力: なし
	- 仕様: APIを用いる

<br/>
#####`public/javascripts/todo.js`
ToDo(詳細画面)のためのデータを作成する

- ページが表示されたとき
	- ToDoリスト名を表示する
	- ToDoを表示する
	- 応答メッセージを削除する
	- 入力部にフォーカスを当てる
	- カレンダーの設定をする
- 作成ボタンが押されたとき
	- 入力チェックを行い, DBに登録する
	- 再表示する

<br/>

- ToDoリスト名を表示する
	- 入力: なし
	- 出力: なし
	- 仕様: 現在の表示ページのurl引数を用いる  
	直近の期限までのタイムカウントを表示する  
	APIを用いる  
	url引数のエラーによりToDoリスト名を取得できなかった場合, トップ画面に遷移する

- 直近の期限の取得
	- 入力: ToDoリスト
	- 出力: 期限を表す文字列
	- 仕様: 未完了, かつ, 期限の近いもの(期限を過ぎた未完了のToDoも含む)

- ToDoを取得する
	- 入力: なし
	- 出力: なし
	- 仕様: APIを用いる

- ToDoを表示する
	- 入力: ToDoリスト, 表示位置
	- 出力: なし
	- 仕様: todo作成日が新しい順に表示する  
	完了状況を更新するボタンを追加する

- 完了状況の判定
	- 入力: 完了状況を表す真偽値
	- 出力: 完了状況を表す文字列

- 完了状況を更新するボタンの色を設定する
	- 入力: ボタンの位置
	- 出力: なし

- 完了状況を更新する
	- 入力: 表示位置
	- 出力: なし

- 入力されたToDo名をチェックする
	- 入力: ToDoリストのid, ToDo名, 期限
	- 出力: なし
	- 仕様: 長さのチェック, APIを用いて重複のチェック  
	重複しない場合, データベースに追加する  
	応答メッセージを表示する

- ToDoを追加する
	- 入力: ToDoリストのid, ToDo名, 期限
	- 出力: なし
	- 仕様: APIを用いる

<br/>
#####`public/javascripts/search.js`
検索画面のためのデータを作成する

- ページが表示されたとき
	- 応答メッセージを削除する
	- 入力部にフォーカスを当てる
- 作成ボタンが押されたとき
	- 入力チェックを行い, DBに登録する
	- 再表示する

<br/>

- 検索する
	- 入力: 検索文字列
	- 出力: なし
	- 仕様: 入力チェックを行い検索する

- 入力されたToDoリスト名をチェックする
	- 入力: ToDoリスト名
	- 出力: なし
	- 仕様: 長さのチェック  
	応答メッセージを表示する  
	検索結果を表示する  
	APIを用いる

- ToDoを表示する
	- 入力: ToDoの配列, 表示位置
	- 出力: なし
	- 仕様: 検索結果を作成日の新しい順にソートする  
	応答メッセージを表示する

- ToDoリストを表示する
	- 入力: ToDoリストの配列, 表示位置
	- 出力: なし
	- 仕様: 作成日の新しい順に表示する  
	応答メッセージを表示する

<br/>
#####`public/javascripts/common.js`
他のjsファイルに共通の処理を行う

- エスケープ処理
	- 入力: 文字列
	- 出力: エスケープ処理後の文字列
	- 仕様: &\<>'`"に対応
- URL引数の取得
	- 入力: なし
	- 出力: URL引数の連想配列
	- 仕様: URLの"?"以降を"&"で分割し, "="の前後を連想配列に登録する
- 整形された日付に変換する
	- 入力: 日付を表す文字列
	- 出力: 整形後の文字列
	- 仕様: 入力が変換できない場合, エラー出力
- 2つの日付の差を計算する
	- 入力: 日付を表す文字列1, 日付を表す文字列1
	- 出力: (文字列1 - 文字列2) の結果を整形したもの
	- 仕様: 入力が変換できない場合, エラー出力
- 応答メッセージを設定する
	- 入力: 表示する文字列, 色, 表示場所
	- 出力: なし
- 応答メッセージを削除する
	- 入力: なし
	- 出力: なし

##3. 開発環境のセットアップ手順
####Node.jsのインストール(使用したバージョン)
    > node -v
    v7.4.0

####express, supervisorのインストール
    > npm install -g express-generator
    > npm install -g supervisor

####expressの実行
    > express -e プロジェクト名 #プロジェクト名: ToDoList
    > cd ToDoList
    ToDoList> npm install

####MongoDBのインストール(使用したバージョン)
    > mongo -version
    MongoDB shell version v3.4.2
    ...省略

####mongooseのインストールとディレクトリ作成
    ToDoList> npm install mongoose
    ToDoList> mkdir db
    ToDoList> mkdir db/mongo

####MongoDBの起動
    ToDoList> mongod --dbpath db/mongo

####supervisorの起動
    ToDoList> supervisor -i node_modules ./bin/www

###動作確認済みのブラウザ
Chrome, Firefox, Safariでの動作を確認
