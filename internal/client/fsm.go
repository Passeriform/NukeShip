package client

import (
	"github.com/Gurpartap/statemachine-go"

	"passeriform.com/nukeship/internal/pb"
)

//go:generate go run github.com/abice/go-enum -f=$GOFILE --mustparse --values --output-suffix _generated
type (
	// ENUM(SelfJoined, SelfLeft, SelfReady, SelfRevertedReady, Connected, Disconnected)
	LocalEvent string
	// ENUM(Init, AwaitingOpponent, RoomFilled, AwaitingReady, AwaitingGameStart, InGame, Recovery)
	RoomState string
	// ENUM(Connected, Disconnected)
	ConnectionState string
)

type (
	machine statemachine.Machine

	RoomStateFSM struct {
		machine
		opponentReady bool
	}

	ConnectionFSM struct {
		machine
	}
)

func (fsm RoomStateFSM) FireWithRollback(event string) (func() error, error) {
	prevState := fsm.GetState()

	if err := fsm.Fire(event); err != nil {
		return nil, err
	}

	return func() error {
		return fsm.SetCurrentState(prevState)
	}, nil
}

//nolint:funlen,revive // Allowing longer function as this contains only state machine definition.
func NewRoomStateFSM(notify func(t statemachine.Transition)) RoomStateFSM {
	roomStateFSM := RoomStateFSM{
		machine: nil,
		// TODO: Convert to explicit separation state instead of invisible sub-state.
		opponentReady: false,
	}

	roomStateFSM.machine = statemachine.BuildNewMachine(func(machine statemachine.MachineBuilder) {
		machine.States(
			RoomStateInit.String(),
			RoomStateAwaitingOpponent.String(),
			RoomStateRoomFilled.String(),
			RoomStateAwaitingReady.String(),
			RoomStateAwaitingGameStart.String(),
			RoomStateInGame.String(),
			RoomStateRecovery.String(),
		)

		machine.InitialState(RoomStateInit.String())

		machine.AfterTransition().Any().Do(notify)

		// Server authoritative state transitions.
		machine.Event(pb.RoomServiceEvent_OpponentJoined.String()).
			Transition().
			From(RoomStateAwaitingOpponent.String()).
			To(RoomStateRoomFilled.String())
		machine.Event(pb.RoomServiceEvent_OpponentReady.String()).
			Choice(&roomStateFSM.opponentReady).
			OnTrue(func(e statemachine.EventBuilder) {
				e.Transition().
					From(RoomStateAwaitingReady.String()).
					To(RoomStateAwaitingGameStart.String())
			}).
			OnFalse(func(_ statemachine.EventBuilder) {
				roomStateFSM.opponentReady = true
			})
		machine.Event(pb.RoomServiceEvent_GameStarted.String()).
			Transition().
			FromAny().
			To(RoomStateInGame.String())
		machine.Event(pb.RoomServiceEvent_OpponentRevertedReady.String()).
			Transition().
			From(RoomStateAwaitingGameStart.String()).
			To(RoomStateAwaitingReady.String())
		machine.Event(pb.RoomServiceEvent_OpponentLeft.String()).
			Transition().
			From(RoomStateRoomFilled.String(), RoomStateAwaitingReady.String(), RoomStateAwaitingGameStart.String()).
			To(RoomStateAwaitingOpponent.String())
		machine.Event(pb.RoomServiceEvent_OpponentLeft.String()).
			Transition().
			From(RoomStateInGame.String()).
			To(RoomStateRecovery.String())

		// Local event state transition (only for UI usage).
		machine.Event(LocalEventSelfJoined.String()).
			Transition().
			From(RoomStateInit.String()).
			To(RoomStateAwaitingOpponent.String())
		machine.Event(LocalEventSelfReady.String()).
			Choice(&roomStateFSM.opponentReady).
			OnTrue(func(e statemachine.EventBuilder) {
				e.Transition().
					From(RoomStateAwaitingReady.String()).
					To(RoomStateAwaitingGameStart.String())
			}).
			OnFalse(func(e statemachine.EventBuilder) {
				e.Transition().
					From(RoomStateRoomFilled.String()).
					To(RoomStateAwaitingReady.String())
			})
		machine.Event(LocalEventSelfLeft.String()).
			Transition().
			From(
				RoomStateAwaitingOpponent.String(),
				RoomStateRoomFilled.String(),
				RoomStateAwaitingReady.String(),
				RoomStateAwaitingGameStart.String(),
				RoomStateInGame.String(),
			).
			To(RoomStateInit.String())
		machine.Event(LocalEventSelfRevertedReady.String()).
			Transition().
			From(RoomStateAwaitingReady.String(), RoomStateAwaitingGameStart.String()).
			To(RoomStateRoomFilled.String())
	})

	return roomStateFSM
}

func NewConnectionFSM(notify func(t statemachine.Transition)) ConnectionFSM {
	return ConnectionFSM{
		statemachine.BuildNewMachine(func(machine statemachine.MachineBuilder) {
			machine.States(ConnectionStateConnected.String(), LocalEventDisconnected.String())

			machine.InitialState(ConnectionStateConnected.String())

			machine.AfterTransition().Any().Do(notify)

			machine.Event(LocalEventConnected.String()).
				Transition().
				From(ConnectionStateDisconnected.String()).
				To(ConnectionStateConnected.String())
			machine.Event(LocalEventDisconnected.String()).
				Transition().
				From(ConnectionStateConnected.String()).
				To(LocalEventDisconnected.String())
		}),
	}
}
