package main

import (
	"context"
	"log"
	"net"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/keepalive"
	"google.golang.org/grpc/reflection"

	"passeriform.com/nukeship/internal/pb"
	"passeriform.com/nukeship/internal/server"
)

var (
	//nolint:gochecknoglobals,mnd // Configuration only kept at the time of first initialization.
	KeepAliveEnforcementPolicy = keepalive.EnforcementPolicy{
		MinTime: 15 * time.Second,
	}
	//nolint:gochecknoglobals,mnd // Configuration only kept at the time of first initialization.
	KeepAliveServerParameters = keepalive.ServerParameters{
		Time:    30 * time.Second,
		Timeout: 10 * time.Second,
	}
)

func handleQuit(cancel context.CancelFunc, srv *grpc.Server) {
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM, syscall.SIGINT)

	<-c

	log.Println("Received shutdown signal. Relaying stop to server context.")

	cancel()
	srv.GracefulStop()
}

func main() {
	lis, err := net.Listen("tcp", ":"+strconv.Itoa(Config.Port))
	if err != nil {
		log.Panicf("Failed to listen: %v", err)
	}
	defer lis.Close()

	shutdownCtx, stop := context.WithCancel(context.Background())

	srv := grpc.NewServer(
		grpc.KeepaliveEnforcementPolicy(KeepAliveEnforcementPolicy),
		grpc.KeepaliveParams(KeepAliveServerParameters),
		grpc.ChainUnaryInterceptor(
			grpc.UnaryServerInterceptor(server.HeaderUnaryInterceptor),
		),
		grpc.ChainStreamInterceptor(
			grpc.StreamServerInterceptor(server.HeaderStreamInterceptor),
		),
	)

	go handleQuit(stop, srv)

	log.Println("Enabling reflection for gRPC server.")
	reflection.Register(srv)

	log.Printf("Started server on port: %v", Config.Port)

	pb.RegisterRoomServiceServer(
		srv,
		&RoomService{ShutdownCtx: shutdownCtx},
	)
	pb.RegisterGameServiceServer(srv, &GameService{ShutdownCtx: shutdownCtx})

	if err := srv.Serve(lis); err != nil {
		log.Panicf("Failed to serve: %v", err)
	}
}
