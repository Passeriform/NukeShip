package pb

const TabIndentSize = 4

func (node *FsTreeNode) getChildrenCount() (int, int) {
	surfaceCount := len(node.GetChildren())
	nestedCount := len(node.GetChildren())

	for _, child := range node.GetChildren() {
		_, nc := child.getChildrenCount()
		nestedCount += nc
	}

	return surfaceCount, nestedCount
}

func (node *FsTreeNode) WithChildren(children []*FsTreeNode) *FsTreeNode {
	node.Children = children

	childrenCount, nestedCount := node.getChildrenCount()

	node.ChildrenCount, node.NestedCount = int32(childrenCount), int32(nestedCount)

	return node
}
