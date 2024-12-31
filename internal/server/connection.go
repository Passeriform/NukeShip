package server

//nolint:gochecknoglobals // Holding a global map for connections against wrapping struct.
var ConnectionMap = map[string]*Connection{}

type Connection struct {
	ID     string
	Ready  bool
	Joined bool
	Room   *string
}

func NewConnection(connectionID string) (*Connection, bool) {
	connection, ok := ConnectionMap[connectionID]

	if ok {
		return connection, false
	}

	connection = &Connection{
		ID:     connectionID,
		Ready:  false,
		Joined: false,
		Room:   nil,
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
