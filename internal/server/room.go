package server

import (
	"context"
	"log"

	"github.com/looplab/fsm"
	"github.com/necmettindev/randomstring"

	"passeriform.com/nukeship/internal/game"
	"passeriform.com/nukeship/internal/pb"
)

const (
	ConnectionIDLength = 5
)

var (
	//nolint:gochecknoglobals // Holding a global map for rooms against wrapping struct.
	roomMap = map[string]*Room{}

	roomTypeRequiredPlayers = map[pb.RoomType]int{
		pb.RoomType_Regular: 2,
		pb.RoomType_Siege:   5,
		pb.RoomType_Debug:   1,
	}
)

type (
	Room struct {
		Clients         map[string]*Connection
		Game            *game.Game
		ID              string
		RequiredPlayers int
		machine         RoomFSM
	}
)

// TODO: Parameterize require players for siege mode.
func NewRoom(roomType pb.RoomType, cb func(*Room, string)) (*Room, bool) {
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
		ID:              roomID,
		Game:            nil,
		Clients:         map[string]*Connection{},
		RequiredPlayers: roomTypeRequiredPlayers[roomType],
	}

	room.machine = NewRoomFSM(fsm.Callbacks{
		"before_" + RoomEventAttemptReadyPhase.String(): func(ctx context.Context, e *fsm.Event) {
			if len(room.Clients) != room.RequiredPlayers {
				e.Cancel()
			}
		},
		"before_" + RoomEventAttemptGameStart.String(): func(ctx context.Context, e *fsm.Event) {
			if len(room.Clients) != room.RequiredPlayers {
				e.Cancel()
				return
			}

			for _, partConn := range room.Clients {
				if !partConn.Ready {
					e.Cancel()
					return
				}
			}
		},
		"before_" + RoomEventResetToLobby.String(): func(ctx context.Context, e *fsm.Event) {
			if len(room.Clients) != room.RequiredPlayers {
				e.Cancel()
			}
		},
		"enter_" + RoomStateInGame.String(): func(ctx context.Context, e *fsm.Event) {
			g := game.NewGame()
			room.Game = &g
		},
		"enter_state": func(ctx context.Context, e *fsm.Event) {
			cb(room, e.Dst)
		},
	})

	roomMap[roomID] = room

	return room, true
}

func GetRoom(roomID string) *Room {
	room := roomMap[roomID]
	return room
}

func (room *Room) AddConnection(conn *Connection) {
	room.Clients[conn.ID] = conn
	room.machine.Event(context.Background(), RoomEventAttemptReadyPhase.String())
}

func (room *Room) SetReady(connID string, ready bool) {
	conn := room.Clients[connID]
	if conn == nil {
		return
	}

	conn.Ready = ready
	room.machine.Event(context.Background(), RoomEventAttemptGameStart.String())
}

func (room *Room) RemoveConnection(connID string) {
	delete(room.Clients, connID)
	room.machine.Event(context.Background(), RoomEventResetToLobby.String())
}
