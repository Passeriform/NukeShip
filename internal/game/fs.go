package game

import (
	"log"
	"os"
	"path/filepath"
	"slices"

	"passeriform.com/nukeship/internal/pb"
)

const (
	DefaultPower        = 20
	DefaultShield       = 20
	DefaultRechargeRate = 2
	InitialDepth        = 0
)

var DefaultTreeGenIgnores = []string{
	"$Recycle.Bin",
	"$RECYCLE.BIN",
	"System Volume Information",
	".git",
}

// TODO: Add power and shield modifier probabilities.
// TODO: Add power and shield modifier types.
type TreeGenOptions struct {
	Ignore          []string
	VisibilityDepth int
	Depth           int
	Width           int
}

//nolint:gocognit,revive // Alternative to resolving cognitive complexity creates needless clone methods
func generateTree(root string, opts TreeGenOptions, depth int) []*pb.FsTreeNode {
	// If error occurs while reading directory, return the node as leaf.
	entries, err := os.ReadDir(root)
	if err != nil {
		// TODO: Add OnError parameter to TreeGenOptions to change behavior on encountering error.
		log.Printf("Unable to read directory, using a default named node: %v", err)

		visibility := pb.Visibility_VisibleSentinel

		if depth > opts.VisibilityDepth {
			visibility = pb.Visibility_Obscured
		}

		return []*pb.FsTreeNode{NewFsTreeNode(filepath.Base(root), visibility)}
	}

	var nodes []*pb.FsTreeNode

	visibility := pb.Visibility_VisibleSentinel

	if depth+1 > opts.VisibilityDepth {
		visibility = pb.Visibility_Obscured
	}

	for _, entry := range entries[:min(len(entries), opts.Width)] {
		// Populate symlinks.
		if (entry.Type() & os.ModeSymlink) == os.ModeSymlink {
			// NOTE[Needs ideation]: Do something with symlinks.
			nodes = append(nodes, NewFsTreeNode(entry.Name(), visibility))
			continue
		}

		// Populate directories.
		if entry.IsDir() {
			// Ignore directories that match ignore option naming.
			if slices.Contains(opts.Ignore, entry.Name()) {
				continue
			}

			// Include the directory as a leaf node, if maximum depth reached.
			if depth == opts.Depth {
				nodes = append(nodes, NewFsTreeNode(entry.Name(), visibility))
				continue
			}

			// Recursively populate the directory.
			children := generateTree(filepath.Join(root, entry.Name()), opts, depth+1)

			nodes = append(nodes, NewFsTreeNode(entry.Name(), visibility).WithChildren(children))
		}

		// Populate regular files.
		if entry.Type().IsRegular() {
			nodes = append(nodes, NewFsTreeNode(entry.Name(), visibility))
			continue
		}
	}

	return nodes
}

func NewFsTreeNode(label string, visibility pb.Visibility) *pb.FsTreeNode {
	return &pb.FsTreeNode{
		Label:         label,
		Children:      []*pb.FsTreeNode{},
		ChildrenCount: 0,
		NestedCount:   0,
		Sentinel:      false,
		Power:         DefaultPower,
		Shield:        DefaultShield,
		RechargeRate:  DefaultRechargeRate,
		Visibility:    visibility,
	}
}

func NewFsTree(root string, opts TreeGenOptions) pb.FsTree {
	nodes := generateTree(root, opts, InitialDepth)

	return pb.FsTree{Top: NewFsTreeNode(filepath.Base(root), pb.Visibility_VisibleSentinel).WithChildren(nodes)}
}
