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

	"passeriform.com/nukeship/internal/pb"
)

var (
	//go:embed frontend/dist
	assets embed.FS

	//go:embed frontend/src/assets/radioactive.svg
	icon []byte

	//nolint:gochecknoglobals // These mappings are required for wails bindings and thus need to be global.
	roomTypeMapping = []struct {
		Value  pb.RoomType
		TSName string
	}{
		{pb.RoomType_Regular, "REGULAR"},
		{pb.RoomType_Siege, "SIEGE"},
	}

	//nolint:gochecknoglobals // These mappings are required for wails bindings and thus need to be global.
	roomStateMapping = []struct {
		Value  pb.RoomState
		TSName string
	}{
		{pb.RoomState_RoomFilled, "ROOM_FILLED"},
		{pb.RoomState_AwaitingReady, "AWAITING_READY"},
		{pb.RoomState_GameStarted, "GAME_STARTED"},
	}

	//nolint:gochecknoglobals // These mappings are required for wails bindings and thus need to be global.
	eventMapping = []struct {
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
			go app.connect(wCtx, configCtx)
		},
		WindowStartState:                 options.Fullscreen,
		Bind:                             []any{app},
		EnumBind:                         []any{roomTypeMapping, roomStateMapping, eventMapping},
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
