//go:build !cli

package main

import (
	"context"
	"embed"
	"log"

	"github.com/wailsapp/wails/v3/pkg/application"

	"github.com/leaanthony/u"
)

var (
	//go:embed all:frontend/dist
	assets embed.FS

	//go:embed frontend/src/assets/radioactive.svg
	icon []byte
)

func RunApp(ctx context.Context) {
	roomService := NewWailsRoomService(ctx)

	app := application.New(application.Options{
		Name:        "NukeShip",
		Description: "A cyberpunk twist on battleships.",
		Icon:        icon,
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
		Services: []application.Service{
			application.NewService(roomService),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		// Flags: ,
		// PanicHandler: ,
		// OnShutdown: ,
		// ShouldQuit: ,
		// FileAssociations: [".skin"],
		// SingleInstance: &application.SingleInstanceOptions{
		// 	UniqueID: "com.passeriform.nukeship",
		// 	ExitCode: 0,
		// },
	})

	app.NewWebviewWindowWithOptions(application.WebviewWindowOptions{
		Name:             "NukeShip",
		Title:            "NukeShip",
		URL:              "/",
		BackgroundColour: application.NewRGB(27, 38, 54),
		DisableResize:    true,
		Frameless:        true,
		StartState:       application.WindowStateFullscreen,
		BackgroundType:   application.BackgroundTypeTranslucent,
		Mac: application.MacWindow{
			Backdrop:                        application.MacBackdropTranslucent,
			TitleBar:                        application.MacTitleBarHiddenInset,
			InvisibleTitleBarHeight:         0,
			EnableFraudulentWebsiteWarnings: true,
			WebviewPreferences: application.MacWebviewPreferences{
				TabFocusesLinks:        u.True,
				TextInteractionEnabled: application.Enabled,
				FullscreenEnabled:      application.Enabled,
			},
		},
		Windows: application.WindowsWindow{
			BackdropType: application.Acrylic,
		},
		Linux: application.LinuxWindow{
			Icon: icon,
		},
		DefaultContextMenuDisabled: true,
		// DevToolsEnabled: ,
		// OpenInspectorOnStartup: ,
	})

	roomService.setEmitter(app.EmitEvent)

	err := app.Run()
	if err != nil {
		log.Panicf("Error occurred while running the app: %v", err)
	}
}
