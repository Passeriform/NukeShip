package server

//nolint:gochecknoglobals // Holding a global map for rooms against wrapping struct.
var roomMap = map[string]*Room{}

type Room struct {
	Clients     map[string]*Connection
	ID          string
	GameRunning bool
}

func NewRoom(roomID string) (*Room, bool) {
	room, ok := roomMap[roomID]

	if ok {
		return room, false
	}

	room = &Room{
		GameRunning: false,
		ID:          roomID,
		Clients:     map[string]*Connection{},
	}

	roomMap[roomID] = room

	return room, true
}

func GetRoom(roomID string) *Room {
	room := roomMap[roomID]
	return room
}

func (room *Room) AddConnection(conn *Connection) {
	room.Clients[conn.ID] = conn
}

func (room *Room) RemoveConnection(connID string) {
	delete(room.Clients, connID)
}
