package main

import (
	"log"

	"github.com/caarlos0/env/v11"

	"passeriform.com/nukeship/internal/client"
	"passeriform.com/nukeship/internal/pb"
)

const (
	RoomComplete ClientState = iota
	GameReady
)

type ClientState int

type clientConfig struct {
	ServerHost string `env:"SERVER_HOST" envDefault:"localhost"`
	ServerPort string `env:"SERVER_PORT" envDefault:"50051"`
}

func handleServerUpdate(mt pb.ServerMessage) {
	switch mt {
	case pb.ServerMessage_OPPONENT_JOINED:
	case pb.ServerMessage_GAME_STARTED:
	case pb.ServerMessage_OPPONENT_LEFT:
		// TODO: Propagate UI changes.
	}
}

func main() {
	cfg, err := env.ParseAs[clientConfig]()
	if err != nil {
		log.Panicf("Could not parse environment variables: %v", err)
	}

	clientContext := client.NewContext(cfg.ServerHost, cfg.ServerPort)

	RunApp(clientContext, handleServerUpdate)
}
