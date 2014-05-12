<?php
namespace MOPCON\ChatRoom;
use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;

class Chat implements MessageComponentInterface {
    protected $clients;
    protected $session = [];

    public function __construct() {
        $this->clients = new \SplObjectStorage;
    }

    public function onOpen(ConnectionInterface $conn) {
        // Store the new connection to send messages to later
        $this->clients->attach($conn);

        $this->session[$conn->resourceId] = [];
        echo "新連線({$conn->resourceId})，目前共有 ".count($this->clients)." 個連線\n";

        $recentMsgs = $this->readRecentMsg();
        foreach($recentMsgs as $msg){
            $conn->send($msg);
        }
    }

    public function onMessage(ConnectionInterface $from, $msg) {
        $id = $from->resourceId;
        echo sprintf("[{$id}]表示： {$msg}\n");

        $data = @json_decode($msg, $as_array = true);
        if (!is_array($data) || !isset($data['cmd'])) {
            return;
        }

        switch ($data['cmd']) {
            case 'join':
                $this->session[$id]['uid'] = $data['uid'];
                $this->session[$id]['nick'] = $data['nick'];
                break;
        }

        $data['uid'] = $this->session[$id]['uid'];
        $data['nick'] = $this->session[$id]['nick'];
        $data['time'] = microtime($as_float = true);

        $this->broadCast($data);
    }

    public function onClose(ConnectionInterface $conn) {
        $id = $conn->resourceId;
        $data = [
            'cmd' => 'leave',
            'uid' => $this->session[$id]['uid'],
            'nick' => $this->session[$id]['nick'],
            'time' => microtime($as_float = true),
            'serverMsg' => true
        ];
        $this->broadCast($data);

        // The connection is closed, remove it, as we can no longer send it messages
        $this->clients->detach($conn);

        unset($this->session[$conn->resourceId]);
        echo "連線({$conn->resourceId})已中斷，目前還有 ".count($this->clients)." 個連線\n";
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "連線($conn->resourceId)發生問題！{$e->getMessage()}\n";

        unset($this->session[$conn->resourceId]);
        $conn->close();
    }

    public function broadCast($data) {
        if (is_array($data)) {
            $msg = json_encode($data, JSON_UNESCAPED_UNICODE);
        } else {
            $msg = (string) $data;
        }

        foreach ($this->clients as $client) {
            $client->send($msg);
        }

        $this->logMsg($msg);
    }

    public function logMsg($msg) {
        // TODO 先暫時寫檔案，以後再想應該怎麼有效地讀寫
        $fh = @fopen('chatRoom.log', 'a');
        if (!$fh) {
            return;
        }
        @fputs($fh, $msg);
        @fputs($fh, "\n");
        @fclose($fh);
    }

    public function readRecentMsg($cnt = 50) {
        // TODO 先暫時寫檔案，以後再想應該怎麼有效地讀寫
        $lines = @file('chatRoom.log');
        if (!is_array($lines)) {
            return [];
        }

        $length = count($lines);
        if ($length > $cnt) {
            $idx = $length - $cnt;
            return array_slice($lines, $idx);
        } else {
            return $lines;
        }
    }
}
