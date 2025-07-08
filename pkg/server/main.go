package main

import (
	"context"
	"log"
	"net"
	"os"
	"os/signal"
	"strconv"
	"syscall"

	"google.golang.org/grpc"
	"google.golang.org/grpc/keepalive"
	"google.golang.org/grpc/reflection"

	"passeriform.com/nukeship/internal/pb"
	"passeriform.com/nukeship/internal/server"
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
		grpc.KeepaliveEnforcementPolicy(keepalive.EnforcementPolicy{}),
		grpc.KeepaliveParams(keepalive.ServerParameters{}),
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
		&RoomService{ShutdownCtx: shutdownCtx, DebugSkipRoom: Config.DebugSkipRoom},
	)
	pb.RegisterGameServiceServer(srv, &GameService{ShutdownCtx: shutdownCtx})

	if err := srv.Serve(lis); err != nil {
		log.Panicf("Failed to serve: %v", err)
	}
}
