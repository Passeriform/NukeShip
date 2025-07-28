package server

import (
	"github.com/looplab/fsm"

	"passeriform.com/nukeship/internal/pb"
)

type (
	// ENUM(AttemptReadyPhase, AttemptGameStart, ResetToLobby)
	RoomEvent string
)

type (
	RoomFSM struct {
		*fsm.FSM
	}
)

func NewRoomFSM(callbacks fsm.Callbacks) RoomFSM {
	return RoomFSM{fsm.NewFSM(
		pb.RoomState_AwaitingPlayers.String(),
		fsm.Events{
			{
				Name: RoomEventAttemptReadyPhase.String(),
				Src:  []string{pb.RoomState_AwaitingPlayers.String()},
				Dst:  pb.RoomState_AwaitingReady.String(),
			},
			{
				Name: RoomEventAttemptGameStart.String(),
				Src:  []string{pb.RoomState_AwaitingReady.String()},
				Dst:  pb.RoomState_InGame.String(),
			},
			{
				Name: RoomEventResetToLobby.String(),
				Src:  []string{pb.RoomState_AwaitingReady.String(), pb.RoomState_InGame.String()},
				Dst:  pb.RoomState_AwaitingPlayers.String(),
			},
		},
		callbacks,
	)}
}

//go:generate go run github.com/abice/go-enum -f=$GOFILE --mustparse --values --output-suffix _generated
