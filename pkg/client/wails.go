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

	"passeriform.com/nukeship/internal/client"
)

var (
	//go:embed frontend/dist
	assets embed.FS

	//go:embed frontend/src/assets/radioactive.svg
	icon []byte

	//nolint:gochecknoglobals // These mappings are required for wails bindings and thus need to be global.
	appStatesMapping = []struct {
		Value  client.RoomState
		TSName string
	}{
		{client.RoomStateInit, "INIT"},
		{client.RoomStateAwaitingOpponent, "AWAITING_OPPONENT"},
		{client.RoomStateRoomFilled, "ROOM_FILLED"},
		{client.RoomStateAwaitingReady, "AWAITING_READY"},
		{client.RoomStateAwaitingGameStart, "AWAITING_GAME_START"},
		{client.RoomStateInGame, "IN_GAME"},
		{client.RoomStateRecovery, "RECOVERY"},
	}

	//nolint:gochecknoglobals // These mappings are required for wails bindings and thus need to be global.
	eventsMapping = []struct {
		Value  Event
		TSName string
	}{
		{StateChangeEvent, "STATE_CHANGE"},
		{ServerConnectionChangeEvent, "SERVER_CONNECTION_CHANGE"},
	}
)

func RunApp(configCtx context.Context) {
	app := newWailsApp()

	err := wails.Run(&options.App{
		Title:         "NukeShip",
		DisableResize: true,
		Fullscreen:    true,
		Frameless:     true,
		Assets:        assets,
		OnStartup: func(wCtx context.Context) {
			app.setAppContext(wCtx, configCtx)
			app.initGrpcClients()
			app.initStateMachines(wCtx, configCtx)
			go app.connect(wCtx, configCtx)
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
