package game

import (
	"log"
	"testing"
)

// TODO: Rewrite using custom FS mock

func TestPopulateTree(t *testing.T) {
	_, err := PopulateTree("C:/Windows", PopulationOptions{
		Depth:  4,
		Width:  5,
		Ignore: []string{"$Recycle.Bin", "$RECYCLE.BIN", "System Volume Information", ".git"},
	})

	if err != nil {
		log.Panicf("error occurred while creating fs tree: %v", err)
	}
}

func TestTreeToJson(t *testing.T) {
	tree, err := PopulateTree("C:/Windows", PopulationOptions{
		Depth:  4,
		Width:  5,
		Ignore: []string{"$Recycle.Bin", "$RECYCLE.BIN", "System Volume Information", ".git"},
	})

	if err != nil {
		log.Panicf("error occurred while creating fs tree: %v", err)
	}

	j, err := tree.ToJson(true)

	if err != nil {
		log.Panicf("error occurred while marshalling fs tree: %v", err)
	}

	log.Println(string(j))
}
