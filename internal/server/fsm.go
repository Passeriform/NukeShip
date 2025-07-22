package server

import (
	"github.com/looplab/fsm"
)

//go:generate go run github.com/abice/go-enum -f=$GOFILE --mustparse --values --output-suffix _generated
type (
	// ENUM(AttemptReadyPhase, AttemptGameStart, ResetToLobby)
	RoomEvent string
	// ENUM(AwaitingPlayers, AwaitingReady, InGame)
	RoomState string
)

type (
	RoomFSM struct {
		*fsm.FSM
	}
)

//nolint:funlen,revive // Allowing longer function as this contains only state machine definition.
func NewRoomFSM(callbacks fsm.Callbacks) RoomFSM {
	return RoomFSM{fsm.NewFSM(
		RoomStateAwaitingPlayers.String(),
		fsm.Events{
			{
				Name: RoomEventAttemptReadyPhase.String(),
				Src:  []string{RoomStateAwaitingPlayers.String()},
				Dst:  RoomStateAwaitingReady.String(),
			},
			{
				Name: RoomEventAttemptGameStart.String(),
				Src:  []string{RoomStateAwaitingReady.String()},
				Dst:  RoomStateInGame.String(),
			},
			{
				Name: RoomEventResetToLobby.String(),
				Src:  []string{RoomStateAwaitingReady.String(), RoomStateInGame.String()},
				Dst:  RoomStateAwaitingPlayers.String(),
			},
		},
		callbacks,
	)}
}
