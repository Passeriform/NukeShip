package game

import (
	"github.com/passeriform/internal/pb"
)

type Game struct {
	state map[string]*pb.FsTree
}

func NewGame() Game {
	// TODO: Make directory selection randomized.
	return Game{state: make(map[string]*pb.FsTree)}
}

func (g *Game) AddPlayerState(id string, ot *pb.FsTree) {
	g.state[id] = ot
}
