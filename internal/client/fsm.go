package client

import (
	"github.com/Gurpartap/statemachine-go"

	"passeriform.com/nukeship/internal/pb"
)

//go:generate go run github.com/abice/go-enum -f=$GOFILE --mustparse --values --output-suffix _generated
type (
	// ENUM(SELF_JOINED, SELF_LEFT, SELF_READY, SELF_REVERTED_READY, CONNECTED, DISCONNECTED)
	ClientMessage string
	// ENUM(INIT, AWAITING_OPPONENT, ROOM_FILLED, AWAITING_READY, AWAITING_GAME_START, IN_GAME, RECOVERY)
	RoomState string
	// ENUM(CONNECTED, DISCONNECTED)
	ConnectionState string
)

type (
	RoomStateFSM struct {
		statemachine.Machine
		opponentReady bool
	}

	ConnectionFSM struct {
		statemachine.Machine
	}
)

func NewRoomStateFSM(notify func(t statemachine.Transition)) *RoomStateFSM {
	fsm := &RoomStateFSM{
		opponentReady: false,
		Machine:       nil,
	}

	fsm.Machine = statemachine.BuildNewMachine(func(machine statemachine.MachineBuilder) {
		machine.States(
			RoomStateINIT.String(),
			RoomStateAWAITINGOPPONENT.String(),
			RoomStateROOMFILLED.String(),
			RoomStateAWAITINGREADY.String(),
			RoomStateAWAITINGGAMESTART.String(),
			RoomStateINGAME.String(),
			RoomStateRECOVERY.String(),
		)

		machine.InitialState(RoomStateINIT.String())

		machine.AfterTransition().Any().Do(notify)

		machine.Event(ClientMessageSELFJOINED.String()).Transition().From(RoomStateINIT.String()).To(RoomStateAWAITINGOPPONENT.String())
		machine.Event(pb.ServerMessage_OPPONENT_JOINED.String()).Transition().From(RoomStateAWAITINGOPPONENT.String()).To(RoomStateROOMFILLED.String())
		machine.Event(ClientMessageSELFREADY.String()).Choice(&fsm.opponentReady).OnTrue(func(e statemachine.EventBuilder) {
			e.Transition().From(RoomStateAWAITINGREADY.String()).To(RoomStateAWAITINGGAMESTART.String())
		}).OnFalse(func(e statemachine.EventBuilder) {
			e.Transition().From(RoomStateROOMFILLED.String()).To(RoomStateAWAITINGREADY.String())
		})
		machine.Event(pb.ServerMessage_OPPONENT_READY.String()).Choice(&fsm.opponentReady).OnTrue(func(e statemachine.EventBuilder) {
			e.Transition().From(RoomStateAWAITINGREADY.String()).To(RoomStateAWAITINGGAMESTART.String())
		}).OnFalse(func(_ statemachine.EventBuilder) {
			fsm.opponentReady = true
		})
		machine.Event(pb.ServerMessage_GAME_STARTED.String()).Transition().FromAny().To(RoomStateINGAME.String())
		machine.Event(ClientMessageSELFLEFT.String()).Transition().From(RoomStateAWAITINGOPPONENT.String(), RoomStateROOMFILLED.String(), RoomStateAWAITINGREADY.String(), RoomStateAWAITINGGAMESTART.String(), RoomStateINGAME.String()).To(RoomStateINIT.String())
		machine.Event(ClientMessageSELFREVERTEDREADY.String()).Transition().From(RoomStateAWAITINGREADY.String(), RoomStateAWAITINGGAMESTART.String()).To(RoomStateROOMFILLED.String())
		machine.Event(pb.ServerMessage_OPPONENT_REVERTED_READY.String()).Transition().From(RoomStateAWAITINGGAMESTART.String()).To(RoomStateAWAITINGREADY.String())
		machine.Event(pb.ServerMessage_OPPONENT_LEFT.String()).Transition().From(RoomStateROOMFILLED.String(), RoomStateAWAITINGREADY.String(), RoomStateAWAITINGGAMESTART.String()).To(RoomStateAWAITINGOPPONENT.String())
		machine.Event(pb.ServerMessage_OPPONENT_LEFT.String()).Transition().From(RoomStateINGAME.String()).To(RoomStateRECOVERY.String())
	})

	return fsm
}

func NewConnectionFSM(notify func(t statemachine.Transition)) *ConnectionFSM {
	return &ConnectionFSM{
		Machine: statemachine.BuildNewMachine(func(machine statemachine.MachineBuilder) {
			machine.States(ConnectionStateCONNECTED.String(), ClientMessageDISCONNECTED.String())

			machine.InitialState(ConnectionStateCONNECTED.String())

			machine.AfterTransition().Any().Do(notify)

			machine.Event(ClientMessageCONNECTED.String()).Transition().From(ConnectionStateDISCONNECTED.String()).To(ConnectionStateCONNECTED.String())
			machine.Event(ClientMessageDISCONNECTED.String()).Transition().From(ConnectionStateCONNECTED.String()).To(ClientMessageDISCONNECTED.String())
		}),
	}
}
