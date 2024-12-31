package game_test

import (
	"log"
	"testing"

	"passeriform.com/nukeship/internal/game"
)

// TODO: Rewrite using custom FS mock.

func TestTreeToJSON(t *testing.T) {
	t.Parallel()

	tree := game.PopulateTree("C:/Windows", game.PopulationOptions{
		Depth: 4,
		Width: 5,
		Ignore: []string{
			"$Recycle.Bin",
			"$RECYCLE.BIN",
			"System Volume Information",
			".git",
		},
	})

	jb := tree.ToJSON(true)

	log.Println(string(jb))
}
