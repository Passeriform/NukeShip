package server

var ConnectionMap map[string]*Connection = map[string]*Connection{}

type Connection struct {
	Id     string
	Ready  bool
	Joined bool
	Room   *string
}

func NewConnection(id string) (*Connection, bool) {
	connection, ok := ConnectionMap[id]

	if ok {
		return connection, false
	}

	connection = &Connection{
		Id:     id,
		Ready:  false,
		Joined: false,
		Room:   nil,
	}

	ConnectionMap[id] = connection

	return connection, true
}

func RemoveConnection(id string) {
	if ConnectionMap[id].Room != nil {
		delete(RoomMap[*ConnectionMap[id].Room].Clients, id)
	}

	delete(ConnectionMap, id)
}
