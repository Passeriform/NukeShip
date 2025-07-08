package client

import (
	"context"
	"log"
	"time"

	"google.golang.org/grpc/metadata"

	"github.com/necmettindev/randomstring"
)

const (
	RoomIDLength int = 5
)

type contextPropertyKey struct{}

type Context struct {
	ClientID string
}

func NewContext() context.Context {
	clientID, err := randomstring.GenerateString(randomstring.GenerationOptions{
		Length:           RoomIDLength,
		DisableNumeric:   true,
		DisableLowercase: true,
	})
	if err != nil {
		log.Panicf("Error occurred while creating client id: %v", err)
	}

	return context.WithValue(context.Background(), contextPropertyKey{}, Context{
		ClientID: clientID,
	})
}

func UnwrapContext(ctx context.Context) Context {
	c, ok := ctx.Value(contextPropertyKey{}).(Context)
	if !ok {
		log.Panicf("Error occurred while fetching context from wrapper")
	}

	return c
}

func withClientMetaData(ctx context.Context) context.Context {
	clientID := UnwrapContext(ctx).ClientID

	meta := metadata.New(map[string]string{"client-id": clientID})

	return metadata.NewOutgoingContext(ctx, meta)
}

func NewUnaryContext(ctx context.Context) (context.Context, context.CancelFunc) {
	unaryCtx, unaryCancel := context.WithTimeout(ctx, time.Second)

	return withClientMetaData(unaryCtx), unaryCancel
}

func NewStreamContext(ctx context.Context) (context.Context, context.CancelFunc) {
	streamCtx, streamCancel := context.WithCancel(ctx)

	return withClientMetaData(streamCtx), streamCancel
}
