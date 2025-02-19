package server

import (
	"log"

	"github.com/necmettindev/randomstring"

	"passeriform.com/nukeship/internal/game"
)

const (
	ConnectionIDLength = 5
)

//nolint:gochecknoglobals // Holding a global map for rooms against wrapping struct.
var roomMap = map[string]*Room{}

type Room struct {
	Clients map[string]*Connection
	Game    game.Game
	ID      string
}

func NewRoom() (*Room, bool) {
	roomID, err := randomstring.GenerateString(randomstring.GenerationOptions{
		Length:           ConnectionIDLength,
		DisableNumeric:   true,
		DisableLowercase: true,
	})
	if err != nil {
		log.Panicf("Error occurred while creating client id: %v", err)
	}

	room, ok := roomMap[roomID]

	if ok {
		return room, false
	}

	room = &Room{
		ID:      roomID,
		Clients: map[string]*Connection{},
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
