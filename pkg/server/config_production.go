//go:build !local_server
// +build !local_server

package main

//nolint:gochecknoglobals,mnd // Client config to be used only via build-time tag toggling.
var Config = ServerConfig{
	Port: 80,
}
