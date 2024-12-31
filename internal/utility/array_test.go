package utility_test

import (
	"testing"

	"passeriform.com/nukeship/internal/utility"
)

func TestFilter(t *testing.T) {
	t.Parallel()

	array := []int{1, 4, 2, 4, 9, 2, 7, 3, 9, 2, 5}

	testCases := []struct {
		name string
		what func(int) bool
		want []int
	}{
		{
			"Should filter out single element",
			func(x int) bool { return x != 7 },
			[]int{1, 4, 2, 4, 9, 2, 3, 9, 2, 5},
		},
		{
			"Should filter out multiple element",
			func(x int) bool { return x != 4 },
			[]int{1, 2, 9, 2, 7, 3, 9, 2, 5},
		},
		{
			"Should filter out no element if not found",
			func(x int) bool { return x != 11 },
			[]int{1, 4, 2, 4, 9, 2, 7, 3, 9, 2, 5},
		},
		{
			"Should keep even elements only",
			func(x int) bool { return x%2 == 0 },
			[]int{4, 2, 4, 2, 2},
		},
		{
			"Should remove elements less than 5",
			func(x int) bool { return x >= 5 },
			[]int{9, 7, 9, 5},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			t.Parallel()

			testArray := array

			result := utility.Filter[int](testArray, testCase.what)
			for index, resultElement := range result {
				if resultElement != testCase.want[index] {
					t.Errorf("Got %v, want %v", result, testCase.want)
				}
			}
		})
	}
}

func TestPartition(t *testing.T) {
	t.Parallel()

	array := []int{1, 4, 2, 4, 9, 2, 7, 3, 9, 2, 5}

	testCases := []struct {
		name            string
		what            func(int) bool
		wantPartitioned []int
		wantLeftover    []int
	}{
		{
			"Should partition when no element matches",
			func(x int) bool { return x == 10 },
			[]int{},
			[]int{1, 4, 2, 4, 9, 2, 7, 3, 9, 2, 5},
		},
		{
			"Should partition when all elements match",
			func(x int) bool { return x < 10 },
			[]int{1, 4, 2, 4, 9, 2, 7, 3, 9, 2, 5},
			[]int{},
		},
		{
			"Should partition even elements",
			func(x int) bool { return x%2 == 0 },
			[]int{4, 2, 4, 2, 2},
			[]int{1, 9, 7, 3, 9, 5},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			t.Parallel()

			testArray := array

			partitioned, leftover := utility.Partition[int](testArray, testCase.what)
			for index, element := range partitioned {
				if element != testCase.wantPartitioned[index] {
					t.Errorf("Got %v, want %v", partitioned, testCase.wantPartitioned)
				}
			}

			for index, element := range leftover {
				if element != testCase.wantLeftover[index] {
					t.Errorf("Got %v, want %v", partitioned, testCase.wantLeftover)
				}
			}
		})
	}
}

func TestPartitionMany(t *testing.T) {
	t.Parallel()

	array := []int{1, 4, 2, 4, 9, 2, 7, 3, 9, 2, 5}

	testCases := []struct {
		name string
		what func(int) int
		want map[int][]int
	}{
		{
			"Should partition into map of many elements",
			func(x int) int { return x / 3 },
			map[int][]int{
				0: {1, 2, 2, 2},
				1: {4, 4, 3, 5},
				3: {9, 9},
				2: {7},
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			t.Parallel()

			testArray := array

			pMap := utility.PartitionMany[int, int](testArray, testCase.what)
			for key, elements := range pMap {
				if _, ok := testCase.want[key]; !ok {
					t.Errorf("Got %v, want %v", pMap, testCase.want)
				}

				for index, element := range elements {
					if element != testCase.want[key][index] {
						t.Errorf("Got %v, want %v", elements, testCase.want[key][index])
					}
				}
			}
		})
	}
}
