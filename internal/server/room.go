package server

import (
	"context"
	"log"

	"github.com/looplab/fsm"
	"github.com/necmettindev/randomstring"
	"github.com/passeriform/internal/game"
	"github.com/passeriform/internal/pb"
)

const (
	ConnectionIDLength = 5
)

var (
	//nolint:gochecknoglobals // Holding a global map for rooms against wrapping struct.
	roomMap = map[string]*Room{}

	//nolint:gochecknoglobals,mnd // Mapping room types to required players.
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
		machine         *RoomFSM
		ID              string
		RequiredPlayers int
	}
)

//nolint:funlen,gocognit,revive // Room initialization also requires setting callbacks for state machine.
func NewRoom(roomType pb.RoomType, stateChangeCallback func(*Room, pb.RoomState)) (*Room, bool) {
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
		Clients:         map[string]*Connection{},
		Game:            nil,
		machine:         nil,
		ID:              roomID,
		RequiredPlayers: roomTypeRequiredPlayers[roomType],
	}

	machine := NewRoomFSM(fsm.Callbacks{
		"before_" + RoomEventAttemptReadyPhase.String(): func(_ context.Context, e *fsm.Event) {
			if len(room.Clients) != room.RequiredPlayers {
				e.Cancel()
			}
		},
		"before_" + RoomEventAttemptGameStart.String(): func(_ context.Context, event *fsm.Event) {
			if len(room.Clients) != room.RequiredPlayers {
				event.Cancel()
				return
			}

			for _, partConn := range room.Clients {
				if !partConn.Ready {
					event.Cancel()
					return
				}
			}
		},
		"before_" + RoomEventResetToLobby.String(): func(_ context.Context, e *fsm.Event) {
			if len(room.Clients) != room.RequiredPlayers {
				e.Cancel()
			}
		},
		"enter_" + pb.RoomState_InGame.String(): func(_ context.Context, _ *fsm.Event) {
			g := game.NewGame()
			room.Game = &g
		},
		"enter_state": func(_ context.Context, e *fsm.Event) {
			stateChangeCallback(room, pb.RoomState(pb.RoomState_value[e.Dst]))
		},
	})

	room.machine = &machine

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

	if len(room.Clients) == 0 {
		// Destroy game and room.
		delete(roomMap, room.ID)
	}
}
