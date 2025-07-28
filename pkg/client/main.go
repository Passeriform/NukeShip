package main

import (
	"context"
	"embed"
	"log"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
	"github.com/wailsapp/wails/v2/pkg/options/mac"

	"github.com/passeriform/internal/client"
	"github.com/passeriform/internal/pb"
)

var (
	//go:embed frontend/dist
	assets embed.FS

	//go:embed frontend/src/assets/radioactive.svg
	icon []byte

	//nolint:gochecknoglobals,govet // These mappings are required for wails bindings and thus need to be global.
	roomTypeMapping = []struct {
		Value  pb.RoomType
		TSName string
	}{
		{pb.RoomType_Regular, "REGULAR"},
		{pb.RoomType_Siege, "SIEGE"},
	}

	//nolint:gochecknoglobals,govet // These mappings are required for wails bindings and thus need to be global.
	roomStateMapping = []struct {
		Value  pb.RoomState
		TSName string
	}{
		{pb.RoomState_AwaitingPlayers, "AWAITING_PLAYERS"},
		{pb.RoomState_AwaitingReady, "AWAITING_READY"},
		{pb.RoomState_InGame, "IN_GAME"},
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

func main() {
	configContext := client.NewContext()

	app := newWailsApp()

	err := wails.Run(&options.App{
		Title:         "NukeShip",
		DisableResize: true,
		Fullscreen:    true,
		Frameless:     true,
		Assets:        assets,
		OnStartup: func(wCtx context.Context) {
			app.setAppContext(wCtx, configContext)
			app.initGrpcClients()
			go app.connect(wCtx, configContext)
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
