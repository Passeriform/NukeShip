package server

//nolint:gochecknoglobals // Holding a global map for rooms against wrapping struct.
var RoomMap = map[string]*Room{}

type Room struct {
	Clients map[string]*Connection
	ID      string
}

func NewRoom(roomID string) (*Room, bool) {
	room, ok := RoomMap[roomID]

	if ok {
		return room, false
	}

	room = &Room{
		ID:      roomID,
		Clients: map[string]*Connection{},
	}

	RoomMap[roomID] = room

	return room, true
}

func GetRoom(id string) *Room {
	room := RoomMap[id]
	return room
}

func (room *Room) AddConnection(conn *Connection) {
	room.Clients[conn.ID] = conn
	conn.Room = &room.ID
}
