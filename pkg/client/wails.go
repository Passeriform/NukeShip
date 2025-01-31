//go:build !cli

package main

import (
	"context"
	"embed"
	"log"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/runtime"

	"github.com/Gurpartap/statemachine-go"

	"passeriform.com/nukeship/internal/client"
)

var (
	//go:embed frontend/dist
	assets embed.FS

	//go:embed frontend/src/assets/radioactive.svg
	icon []byte
)

var (
	appStatesMapping = []struct {
		Value  client.RoomState
		TSName string
	}{
		{client.RoomStateINIT, "INIT"},
		{client.RoomStateAWAITINGOPPONENT, "AWAITING_OPPONENT"},
		{client.RoomStateROOMFILLED, "ROOM_FILLED"},
		{client.RoomStateAWAITINGREADY, "AWAITING_READY"},
		{client.RoomStateAWAITINGGAMESTART, "AWAITING_GAME_START"},
		{client.RoomStateINGAME, "IN_GAME"},
		{client.RoomStateRECOVERY, "RECOVERY"},
	}

	eventsMapping = []struct {
		Value  Event
		TSName string
	}{
		{StateChangeEvent, "STATE_CHANGE"},
		{ServerConnectionChangeEvent, "SERVER_CONNECTION_CHANGE"},
	}
)

func RunApp(ctx context.Context) {
	app := newWailsApp(ctx)

	err := wails.Run(&options.App{
		Title:         "NukeShip",
		DisableResize: true,
		Fullscreen:    true,
		Frameless:     true,
		Assets:        assets,
		OnStartup: func(wCtx context.Context) {
			c, err := newClient(ctx)
			if err != nil {
				log.Panicf("Cannot create new grpc client: %v", err)
			}

			app.Client = c

			app.stateMachine = client.NewRoomStateFSM(func(t statemachine.Transition) {
				runtime.EventsEmit(wCtx, string(StateChangeEvent), client.MustParseRoomState(t.To()))
			})

			app.connMachine = client.NewConnectionFSM(func(t statemachine.Transition) {
				runtime.EventsEmit(wCtx, string(ServerConnectionChangeEvent), t.To() == client.ConnectionStateCONNECTED.String())
			})

			go app.connect(ctx)
		},
		WindowStartState:                 options.Fullscreen,
		Bind:                             []any{app},
		EnumBind:                         []any{appStatesMapping, eventsMapping},
		EnableDefaultContextMenu:         false,
		EnableFraudulentWebsiteDetection: false,
		Mac: &mac.Options{
			About: &mac.AboutInfo{
				Title:   "NukeShip",
				Message: "© 2024 Passeriform",
				Icon:    icon,
			},
		},
		Linux: &linux.Options{
			Icon:        icon,
			ProgramName: "NukeShip",
		},
	})
	if err != nil {
		log.Panicf("Error occurred while running GUI app: %v", err)
	}
}
