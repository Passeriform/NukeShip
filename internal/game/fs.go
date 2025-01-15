package game

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"
	"slices"
	"strings"
)

const (
	DefaultPower        = 20
	DefaultShield       = 20
	DefaultRechargeRate = 2
	TabIndentSize       = 4
	InitialDepth        = 0
)

// TODO: Add power and shield modifier probabilities.
// TODO: Add power and shield modifier types.
type PopulationOptions struct {
	Ignore []string
	Depth  int
	Width  int
}

type FsTreeNode struct {
	Label         string        `json:"label"`
	Children      []*FsTreeNode `json:"children"`
	ChildrenCount int           `json:"childrenCount"`
	NestedCount   int           `json:"nestedCount"`
	Sentinel      bool          `json:"sentinel"`
	Power         int           `json:"power"`
	Shield        int           `json:"shield"`
	RechargeRate  int           `json:"rechargeRate"`
}

type FsTree struct {
	Top *FsTreeNode `json:"top"`
}

func (node *FsTreeNode) countChildren() (int, int) {
	surfaceCount := len(node.Children)
	nestedCount := len(node.Children)

	for _, child := range node.Children {
		_, nc := child.countChildren()
		nestedCount += nc
	}

	return surfaceCount, nestedCount
}

//nolint:gocognit,revive // Alternative to resolving cognitive complexity creates needless clone methods
func populateTreeInternal(root string, opts PopulationOptions, depth int) []*FsTreeNode {
	// If error occurs while reading directory, return the node as leaf.
	entries, err := os.ReadDir(root)
	if err != nil {
		// TODO: Add OnError parameter to PopulateOptions to change behavior on encountering error.
		log.Printf("Unable to read directory, using a default named node: %v", err)
		return []*FsTreeNode{NewFsTreeNode(filepath.Base(root))}
	}

	var nodes []*FsTreeNode

	for _, entry := range entries[:min(len(entries), opts.Width)] {
		// Populate symlinks.
		if (entry.Type() & os.ModeSymlink) == os.ModeSymlink {
			// NOTE[Needs ideation]: Do something with symlinks.
			nodes = append(nodes, NewFsTreeNode(entry.Name()))
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
				nodes = append(nodes, NewFsTreeNode(entry.Name()))
				continue
			}

			// Recursively populate the directory.
			children := populateTreeInternal(filepath.Join(root, entry.Name()), opts, depth+1)

			nodes = append(nodes, NewFsTreeNode(entry.Name()).WithChildren(children))
		}

		// Populate regular files.
		if entry.Type().IsRegular() {
			nodes = append(nodes, NewFsTreeNode(entry.Name()))
			continue
		}
	}

	return nodes
}

func NewFsTreeNode(label string) *FsTreeNode {
	return &FsTreeNode{
		Label:        label,
		Power:        DefaultPower,
		Shield:       DefaultShield,
		RechargeRate: DefaultRechargeRate,
	}
}

func (node *FsTreeNode) WithChildren(children []*FsTreeNode) *FsTreeNode {
	node.Children = children

	node.ChildrenCount, node.NestedCount = node.countChildren()

	return node
}

func PopulateTree(root string, opts PopulationOptions) FsTree {
	nodes := populateTreeInternal(root, opts, InitialDepth)

	return FsTree{Top: NewFsTreeNode(filepath.Base(root)).WithChildren(nodes)}
}

func (tree *FsTree) Strength() int {
	return tree.Top.NestedCount
}

func (tree *FsTree) ToJSON(prettyPrint bool) []byte {
	if prettyPrint {
		jb, _ := json.MarshalIndent(tree, "", strings.Repeat(" ", TabIndentSize))
		return jb
	}

	jb, _ := json.Marshal(tree)

	return jb
}
