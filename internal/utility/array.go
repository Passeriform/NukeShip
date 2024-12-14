package utility

func Filter[T any](slice []T, matchFunc func(T) bool) []T {
	result := []T{}

	for _, element := range slice {
		if matchFunc(element) {
			result = append(result, element)
		}
	}

	slice = result

	return slice
}

func Partition[T any](slice []T, matchFunc func(T) bool) ([]T, []T) {
	matchedPartition := []T{}
	unmatchedPartition := []T{}

	for _, element := range slice {
		if matchFunc(element) {
			matchedPartition = append(matchedPartition, element)
		} else {
			unmatchedPartition = append(unmatchedPartition, element)
		}
	}

	return matchedPartition, unmatchedPartition
}

func PartitionMany[K comparable, T any](slice []T, identityFunc func(T) K) map[K][]T {
	partitions := make(map[K][]T)

	for _, element := range slice {
		key := identityFunc(element)
		partitions[key] = append(partitions[key], element)
	}

	return partitions
}
