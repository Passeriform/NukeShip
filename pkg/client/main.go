package main

import (
	"log"

	"github.com/caarlos0/env/v11"

	"passeriform.com/nukeship/internal/client"
)

type clientConfig struct {
	ServerHost string `env:"SERVER_HOST" envDefault:"localhost"`
	ServerPort string `env:"SERVER_PORT" envDefault:"50051"`
}

func main() {
	cfg, err := env.ParseAs[clientConfig]()
	if err != nil {
		log.Panicf("Could not parse environment variables: %v", err)
	}

	clientContext := client.NewContext(cfg.ServerHost, cfg.ServerPort)

	RunApp(clientContext)
}
