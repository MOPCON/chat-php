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
    }

    public function onMessage(ConnectionInterface $from, $msg) {
        $id = $from->resourceId;
        echo sprintf("[{$id}]表示： {$msg}\n");

        $data = @json_decode($msg, $as_array = true);
        if (!is_array($data) || !isset($data['cmd'])) {
            return;
        }

        $send_to_others = true;
        switch ($data['cmd']) {
            case 'join':
                $this->session[$id]['uid'] = $data['uid'];
                $this->session[$id]['nick'] = $data['nick'];
                break;
        }

        if (!$send_to_others) {
            return;
        }

        $msg = json_encode($data);
        foreach ($this->clients as $client) {
            if ($from !== $client) {
                // The sender is not the receiver, send to each client connected
                $client->send($msg);
            }
        }
    }

    public function onClose(ConnectionInterface $conn) {
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
}
