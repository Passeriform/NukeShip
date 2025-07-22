//go:build local_server
// +build local_server

package main

//nolint:gochecknoglobals,mnd // Client config to be used only via build-time tag toggling.
var Config = ClientConfig{
	ServerHost: "localhost",
	ServerPort: 50051,
	EnableTLS:  false,
	DebugRoom:  true,
}
