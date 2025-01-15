package client

import (
	"context"
	"log"
	"time"

	"google.golang.org/grpc/metadata"

	"github.com/necmettindev/randomstring"
)

const (
	UniqueIDLength = 5
)

type contextPropertyKey struct{}

type Context struct {
	ClientID   string
	ServerHost string
	ServerPort string
}

func NewContext(sHost, sPort string) context.Context {
	clientID, err := randomstring.GenerateString(randomstring.GenerationOptions{
		Length:           UniqueIDLength,
		DisableNumeric:   true,
		DisableLowercase: true,
	})
	if err != nil {
		log.Panicf("Error occurred while creating client id: %v", err)
	}

	return context.WithValue(context.Background(), contextPropertyKey{}, Context{
		ClientID:   clientID,
		ServerHost: sHost,
		ServerPort: sPort,
	})
}

func GetClientID(ctx context.Context) string {
	return ctx.Value(contextPropertyKey{}).(Context).ClientID
}

func GetServerHost(ctx context.Context) string {
	return ctx.Value(contextPropertyKey{}).(Context).ServerHost
}

func GetServerPort(ctx context.Context) string {
	return ctx.Value(contextPropertyKey{}).(Context).ServerPort
}

func withClientMetaData(ctx context.Context) context.Context {
	clientID := GetClientID(ctx)

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
