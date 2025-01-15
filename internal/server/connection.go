package server

import (
	"passeriform.com/nukeship/internal/pb"
)

//nolint:gochecknoglobals // Holding a global map for connections against wrapping struct.
var connectionMap = map[string]*Connection{}

type Connection struct {
	Room    *Room
	MsgChan chan *pb.MessageStreamResponse
	ID      string
	Ready   bool
}

func NewConnection(connID string) (*Connection, bool) {
	conn, ok := connectionMap[connID]

	if ok {
		return conn, false
	}

	conn = &Connection{
		Room:    nil,
		MsgChan: make(chan *pb.MessageStreamResponse),
		ID:      connID,
		Ready:   false,
	}

	connectionMap[connID] = conn

	return conn, true
}

func GetConnection(connID string) *Connection {
	conn := connectionMap[connID]
	return conn
}

func (conn *Connection) Remove() {
	if connectionMap[conn.ID].Room != nil {
		connectionMap[conn.ID].Room.RemoveConnection(conn.ID)
	}

	delete(connectionMap, conn.ID)
}
