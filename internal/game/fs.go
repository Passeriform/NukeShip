package game

import (
	"encoding/json"
	"os"
	"path/filepath"
	"slices"
	"strings"
)

const DEFAULT_POWER = 20
const DEFAULT_SHIELD = 20
const DEFAULT_RECHARGE_RATE = 2

type PopulationOptions struct {
	// TODO: Add power and shield modifier probabilities
	// TODO: Add power and shield modifier types
	Depth  int
	Width  int
	Ignore []string
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

func populateTreeInternal(root string, opts PopulationOptions, depth int) ([]*FsTreeNode, error) {
	entries, err := os.ReadDir(root)

	// If error occurs while reading directory, return the node as leaf
	if err != nil {
		// TODO: Add OnError parameter to PopulateOptions to change behavior on encountering error.
		return []*FsTreeNode{NewFsTreeNode(filepath.Base(root))}, nil
	}

	var nodes []*FsTreeNode

	for _, entry := range entries[0:min(len(entries), opts.Width)] {
		// Populate symlinks
		if (entry.Type() & os.ModeSymlink) == os.ModeSymlink {
			// NOTE[Needs ideation]: Do something with symlinks
			nodes = append(nodes, NewFsTreeNode(entry.Name()))

			continue
		}

		// Populate directories
		if entry.IsDir() {
			// Ignore directories that match ignore option naming
			if slices.Contains(opts.Ignore, entry.Name()) {
				continue
			}

			// Include the directory as a leaf node, if maximum depth reached
			if depth == opts.Depth {
				nodes = append(nodes, NewFsTreeNode(entry.Name()))

				continue
			}

			// Recursively populate the directory
			children, err := populateTreeInternal(filepath.Join(root, entry.Name()), opts, depth+1)

			if err != nil {
				return nil, err
			}

			nodes = append(nodes, NewFsTreeNode(entry.Name()).WithChildren(children))
		}

		// Populate regular files
		if entry.Type().IsRegular() {
			nodes = append(nodes, NewFsTreeNode(entry.Name()))

			continue
		}
	}

	return nodes, nil
}

func NewFsTreeNode(label string) *FsTreeNode {
	return &FsTreeNode{
		Label:        label,
		Power:        DEFAULT_POWER,
		Shield:       DEFAULT_SHIELD,
		RechargeRate: DEFAULT_RECHARGE_RATE,
	}
}

func (node *FsTreeNode) WithChildren(children []*FsTreeNode) *FsTreeNode {
	node.Children = children

	sc, nc := node.countChildren()

	node.ChildrenCount = sc
	node.NestedCount = nc

	return node
}

func PopulateTree(root string, opts PopulationOptions) (FsTree, error) {
	nodes, err := populateTreeInternal(root, opts, 0)
	return FsTree{Top: NewFsTreeNode(filepath.Base(root)).WithChildren(nodes)}, err
}

func (tree *FsTree) Strength() int {
	return tree.Top.NestedCount
}

func (tree *FsTree) ToJson(prettyPrint bool) ([]byte, error) {
	if prettyPrint {
		return json.MarshalIndent(tree, "", strings.Repeat(" ", 4))
	}

	return json.Marshal(tree)
}
