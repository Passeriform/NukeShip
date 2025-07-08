//go:build production

package main

//nolint:gochecknoglobals,mnd // Client config to be used only via build-time tag toggling.
var Config = ServerConfig{
	Port:          443,
	DebugSkipRoom: false,
}
