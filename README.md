## 簡介

這是個 PHP 的簡單聊天室，背後透過 web socket 溝通。

- Server 是 PHP，架構在 [Ratchet](http://socketo.me/) 上面，唯一的功能是連上的人送出的訊息 broadcast 給其他所有人
  - 未來有計劃要做 logging
- Client 的 Javascript 負責處理送訊息，發訊息，訊息顯示
  - Client now WIP

## 安裝

clone 之後
````
$ composer install
````
會自動安裝需要的 Library

## 執行

啟動聊天室 server

````
php bin/chat-server.php
````

修改 Client 中的 server 設定，然後執行 chatClient.connect();
chatClient.speak('xxxx') 可以送出訊息。

