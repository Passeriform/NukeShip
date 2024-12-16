package utility

// TODO: Migrate to use iter.Seq

func Map[T, U any](slice []T, predicate func(T) U) []U {
	result := make([]U, len(slice))

	for i := range slice {
		result[i] = predicate(slice[i])
	}
	return result
}

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
