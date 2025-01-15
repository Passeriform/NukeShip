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
)

var (
	//go:embed frontend/dist
	assets embed.FS

	//go:embed frontend/src/assets/radioactive.svg
	icon []byte
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
			app.setAppCtx(wCtx)

			go connect(ctx, app)
		},
		WindowStartState:                 options.Fullscreen,
		Bind:                             []any{app},
		EnumBind:                         []any{appStates, events},
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
