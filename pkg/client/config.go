package main

type ClientConfig struct {
	ServerHost string
	ServerPort int
	EnableTLS  bool
	DebugRoom  bool
}
