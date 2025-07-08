//go:build production

package main

//nolint:gochecknoglobals,mnd // Client config to be used only via build-time tag toggling.
var Config = ClientConfig{
	ServerHost: "nukeship.passeriform.com",
	ServerPort: 443,
	EnableTLS:  true,
}
