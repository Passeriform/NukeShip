package main

import (
	"passeriform.com/nukeship/internal/client"
)

func main() {
	configContext := client.NewContext()

	RunApp(configContext)
}
