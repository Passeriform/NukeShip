package server

var RoomMap map[string]*Room = map[string]*Room{}

type Room struct {
	Id      string
	Clients map[string]*Connection
}

func NewRoom(id string) (*Room, bool) {
	room, ok := RoomMap[id]

	if ok {
		return room, false
	}

	room = &Room{
		Id:      id,
		Clients: map[string]*Connection{},
	}

	RoomMap[id] = room

	return room, true
}

func GetRoom(id string) *Room {
	room, _ := RoomMap[id]
	return room
}

func (room *Room) AddConnection(conn *Connection) {
	room.Clients[conn.Id] = conn
	conn.Room = &room.Id
}
