package game

import (
	"passeriform.com/nukeship/internal/pb"
)

type Game struct {
	state   map[string]*pb.FsTree
	running bool
}

func NewGame() Game {
	// TODO: Make directory selection randomized.
	return Game{
		state:   make(map[string]*pb.FsTree),
		running: true,
	}
}

func (g *Game) AddPlayerState(id string, ot *pb.FsTree) {
	g.state[id] = ot
}
