package utility

import (
	"strings"

	"github.com/google/uuid"
)

func NewRandomString(length int) string {
	return strings.ReplaceAll(uuid.New().String(), "-", "")[:length]
}
