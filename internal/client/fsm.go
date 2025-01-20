package client

import (
	"github.com/Gurpartap/statemachine-go"

	"passeriform.com/nukeship/internal/pb"
)

const (
	Init              string = "INIT"
	AwaitingOpponent  string = "AWAITING_OPPONENT"
	RoomFilled        string = "ROOM_FILLED"
	AwaitingReady     string = "AWAITING_READY"
	AwaitingGameStart string = "AWAITING_GAME_START"
	InGame            string = "IN_GAME"
	Recovery          string = "RECOVERY"

	Connected    string = "CONNECTED"
	Disconnected string = "DISCONNECTED"

	ClientMessage_SELF_JOINED  string = "SELF_JOINED"
	ClientMessage_SELF_READY   string = "SELF_READY"
	ClientMessage_CONNECTED    string = "CONNECTED"
	ClientMessage_DISCONNECTED string = "DISCONNECTED"
)

type (
	StateFSM struct {
		statemachine.Machine
		opponentReady bool
	}

	ConnectionFSM struct {
		statemachine.Machine
	}
)

func NewStateFSM(notify func(t statemachine.Transition)) *StateFSM {
	fsm := &StateFSM{
		opponentReady: false,
		Machine:       nil,
	}

	fsm.Machine = statemachine.BuildNewMachine(func(machine statemachine.MachineBuilder) {
		machine.States(
			Init,
			AwaitingOpponent,
			RoomFilled,
			AwaitingReady,
			AwaitingGameStart,
			InGame,
			Recovery,
		)

		machine.InitialState(Init)

		machine.AfterTransition().Any().Do(notify).Label("Notification")

		machine.Event(ClientMessage_SELF_JOINED).Transition().From(Init).To(AwaitingOpponent)
		machine.Event(pb.ServerMessage_OPPONENT_JOINED.String()).Transition().From(AwaitingOpponent).To(RoomFilled)
		machine.Event(ClientMessage_SELF_READY).Choice(&fsm.opponentReady).Label("selfReady").OnTrue(func(e statemachine.EventBuilder) {
			e.Transition().From(AwaitingReady).To(AwaitingGameStart)
		}).OnFalse(func(e statemachine.EventBuilder) {
			e.Transition().From(RoomFilled).To(AwaitingReady)
		})
		machine.Event(pb.ServerMessage_OPPONENT_READY.String()).Choice(&fsm.opponentReady).Label("opponentReady").OnTrue(func(e statemachine.EventBuilder) {
			e.Transition().From(AwaitingReady).To(AwaitingGameStart)
		}).OnFalse(func(_ statemachine.EventBuilder) {
			fsm.opponentReady = true
		})
		machine.Event(pb.ServerMessage_GAME_STARTED.String()).Transition().FromAny().To(InGame)
		machine.Event(pb.ServerMessage_OPPONENT_REVERTED_READY.String()).Transition().From(AwaitingGameStart).To(AwaitingReady)
		machine.Event(pb.ServerMessage_OPPONENT_LEFT.String()).Transition().From(RoomFilled, AwaitingReady, AwaitingGameStart).To(AwaitingOpponent)
		machine.Event(pb.ServerMessage_OPPONENT_LEFT.String()).Transition().From(InGame).To(Recovery)
	})

	return fsm
}

func NewConnectionFSM(notify func(t statemachine.Transition)) *ConnectionFSM {
	return &ConnectionFSM{
		Machine: statemachine.BuildNewMachine(func(machine statemachine.MachineBuilder) {
			machine.States(Connected, Disconnected)

			machine.InitialState(Connected)

			machine.AfterTransition().Any().Do(notify).Label("Notification")

			machine.Event(ClientMessage_CONNECTED).Transition().From(Disconnected).To(Connected)
			machine.Event(ClientMessage_DISCONNECTED).Transition().From(Connected).To(Disconnected)
		}),
	}
}
