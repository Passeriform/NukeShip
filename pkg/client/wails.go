//go:build gui

package main

import (
	"context"
	"embed"
	"errors"
	"io"
	"log"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/keepalive"
	"passeriform.com/nukeship/internal/client"
	"passeriform.com/nukeship/internal/pb"
)

//go:embed frontend/dist
var assets embed.FS

//go:embed frontend/src/assets/radioactive.svg
var icon []byte

func newClient(ctx context.Context) (pb.RoomServiceClient, error) {
	conn, err := grpc.NewClient(
		client.GetServerHost(ctx)+":"+client.GetServerPort(ctx),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithKeepaliveParams(keepalive.ClientParameters{}),
	)
	if err != nil {
		log.Printf("Could not connect: %v", err)
		return nil, err
	}

	c := pb.NewRoomServiceClient(conn)

	return c, nil
}

func connect(ctx context.Context, c pb.RoomServiceClient, handler func(pb.ServerMessage)) {
	streamCtx, cancel := client.NewStreamContext(ctx)
	defer cancel()

	streamClient, err := c.SubscribeMessages(streamCtx, &pb.SubscribeMessagesRequest{})
	if err != nil {
		log.Printf("Subscription to server messages failed: %v", err)
		return
	}

	for {
		update, err := streamClient.Recv()
		if errors.Is(err, io.EOF) {
			log.Println("Stopped receiving updates from server.")
			return
		}

		if err != nil {
			log.Printf("Received error frame: %v", err)
			return
		}

		handler(update.GetType())
	}
}

func RunApp(ctx context.Context, handler func(pb.ServerMessage)) {
	app := client.NewWailsApp(ctx)

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

			go connect(ctx, c, handler)
		},
		WindowStartState:                 options.Fullscreen,
		Bind:                             []interface{}{app},
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
