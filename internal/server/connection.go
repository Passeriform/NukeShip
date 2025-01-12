package server

import (
	"passeriform.com/nukeship/internal/pb"
)

//nolint:gochecknoglobals // Holding a global map for connections against wrapping struct.
var ConnectionMap = map[string]*Connection{}

type Connection struct {
	Room    *string
	MsgChan chan *pb.MessageStreamResponse
	ID      string
	Ready   bool
	Joined  bool
}

func NewConnection(connectionID string) (*Connection, bool) {
	connection, ok := ConnectionMap[connectionID]

	if ok {
		return connection, false
	}

	connection = &Connection{
		Room:    nil,
		MsgChan: make(chan *pb.MessageStreamResponse),
		ID:      connectionID,
		Ready:   false,
		Joined:  false,
	}

	ConnectionMap[connectionID] = connection

	return connection, true
}

func RemoveConnection(connectionID string) {
	if ConnectionMap[connectionID].Room != nil {
		delete(RoomMap[*ConnectionMap[connectionID].Room].Clients, connectionID)
	}

	delete(ConnectionMap, connectionID)
}
