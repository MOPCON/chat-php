<?php
namespace MOPCON\ChatRoom;
use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;

class Chat implements MessageComponentInterface {
    protected $clients;

    public function __construct() {
        $this->clients = new \SplObjectStorage;
    }

    public function onOpen(ConnectionInterface $conn) {
        // Store the new connection to send messages to later
        $this->clients->attach($conn);

        echo "新連線({$conn->resourceId})，目前共有 ".count($this->clients)." 個連線\n";
    }

    public function onMessage(ConnectionInterface $from, $msg) {
        $numRecv = count($this->clients) - 1;
        echo sprintf(
                '[%d]表示： %s'."\n"
                ,$from->resourceId
                ,$msg
            );

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

        echo "連線({$conn->resourceId})已中斷，目前還有 ".count($this->clients)." 個連線\n";
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "連線($conn->resourceId)發生問題！{$e->getMessage()}\n";
        $conn->close();
    }
}
