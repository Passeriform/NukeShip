// Code generated by protoc-gen-go-grpc. DO NOT EDIT.
// versions:
// - protoc-gen-go-grpc v1.5.1
// - protoc             v5.29.1
// source: room.proto

package pb

import (
	context "context"
	grpc "google.golang.org/grpc"
	codes "google.golang.org/grpc/codes"
	status "google.golang.org/grpc/status"
)

// This is a compile-time assertion to ensure that this generated file
// is compatible with the grpc package it is being compiled against.
// Requires gRPC-Go v1.64.0 or later.
const _ = grpc.SupportPackageIsVersion9

const (
	RoomService_CreateRoom_FullMethodName        = "/RoomService/CreateRoom"
	RoomService_JoinRoom_FullMethodName          = "/RoomService/JoinRoom"
	RoomService_UpdateReady_FullMethodName       = "/RoomService/UpdateReady"
	RoomService_SubscribeMessages_FullMethodName = "/RoomService/SubscribeMessages"
)

// RoomServiceClient is the client API for RoomService service.
//
// For semantics around ctx use and closing/ending streaming RPCs, please refer to https://pkg.go.dev/google.golang.org/grpc/?tab=doc#ClientConn.NewStream.
type RoomServiceClient interface {
	CreateRoom(ctx context.Context, in *CreateRoomRequest, opts ...grpc.CallOption) (*CreateRoomResponse, error)
	JoinRoom(ctx context.Context, in *JoinRoomRequest, opts ...grpc.CallOption) (*JoinRoomResponse, error)
	UpdateReady(ctx context.Context, in *UpdateReadyRequest, opts ...grpc.CallOption) (*UpdateReadyResponse, error)
	SubscribeMessages(ctx context.Context, in *SubscribeMessagesRequest, opts ...grpc.CallOption) (grpc.ServerStreamingClient[MessageStreamResponse], error)
}

type roomServiceClient struct {
	cc grpc.ClientConnInterface
}

func NewRoomServiceClient(cc grpc.ClientConnInterface) RoomServiceClient {
	return &roomServiceClient{cc}
}

func (c *roomServiceClient) CreateRoom(ctx context.Context, in *CreateRoomRequest, opts ...grpc.CallOption) (*CreateRoomResponse, error) {
	cOpts := append([]grpc.CallOption{grpc.StaticMethod()}, opts...)
	out := new(CreateRoomResponse)
	err := c.cc.Invoke(ctx, RoomService_CreateRoom_FullMethodName, in, out, cOpts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *roomServiceClient) JoinRoom(ctx context.Context, in *JoinRoomRequest, opts ...grpc.CallOption) (*JoinRoomResponse, error) {
	cOpts := append([]grpc.CallOption{grpc.StaticMethod()}, opts...)
	out := new(JoinRoomResponse)
	err := c.cc.Invoke(ctx, RoomService_JoinRoom_FullMethodName, in, out, cOpts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *roomServiceClient) UpdateReady(ctx context.Context, in *UpdateReadyRequest, opts ...grpc.CallOption) (*UpdateReadyResponse, error) {
	cOpts := append([]grpc.CallOption{grpc.StaticMethod()}, opts...)
	out := new(UpdateReadyResponse)
	err := c.cc.Invoke(ctx, RoomService_UpdateReady_FullMethodName, in, out, cOpts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *roomServiceClient) SubscribeMessages(ctx context.Context, in *SubscribeMessagesRequest, opts ...grpc.CallOption) (grpc.ServerStreamingClient[MessageStreamResponse], error) {
	cOpts := append([]grpc.CallOption{grpc.StaticMethod()}, opts...)
	stream, err := c.cc.NewStream(ctx, &RoomService_ServiceDesc.Streams[0], RoomService_SubscribeMessages_FullMethodName, cOpts...)
	if err != nil {
		return nil, err
	}
	x := &grpc.GenericClientStream[SubscribeMessagesRequest, MessageStreamResponse]{ClientStream: stream}
	if err := x.ClientStream.SendMsg(in); err != nil {
		return nil, err
	}
	if err := x.ClientStream.CloseSend(); err != nil {
		return nil, err
	}
	return x, nil
}

// This type alias is provided for backwards compatibility with existing code that references the prior non-generic stream type by name.
type RoomService_SubscribeMessagesClient = grpc.ServerStreamingClient[MessageStreamResponse]

// RoomServiceServer is the server API for RoomService service.
// All implementations must embed UnimplementedRoomServiceServer
// for forward compatibility.
type RoomServiceServer interface {
	CreateRoom(context.Context, *CreateRoomRequest) (*CreateRoomResponse, error)
	JoinRoom(context.Context, *JoinRoomRequest) (*JoinRoomResponse, error)
	UpdateReady(context.Context, *UpdateReadyRequest) (*UpdateReadyResponse, error)
	SubscribeMessages(*SubscribeMessagesRequest, grpc.ServerStreamingServer[MessageStreamResponse]) error
	mustEmbedUnimplementedRoomServiceServer()
}

// UnimplementedRoomServiceServer must be embedded to have
// forward compatible implementations.
//
// NOTE: this should be embedded by value instead of pointer to avoid a nil
// pointer dereference when methods are called.
type UnimplementedRoomServiceServer struct{}

func (UnimplementedRoomServiceServer) CreateRoom(context.Context, *CreateRoomRequest) (*CreateRoomResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method CreateRoom not implemented")
}
func (UnimplementedRoomServiceServer) JoinRoom(context.Context, *JoinRoomRequest) (*JoinRoomResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method JoinRoom not implemented")
}
func (UnimplementedRoomServiceServer) UpdateReady(context.Context, *UpdateReadyRequest) (*UpdateReadyResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method UpdateReady not implemented")
}
func (UnimplementedRoomServiceServer) SubscribeMessages(*SubscribeMessagesRequest, grpc.ServerStreamingServer[MessageStreamResponse]) error {
	return status.Errorf(codes.Unimplemented, "method SubscribeMessages not implemented")
}
func (UnimplementedRoomServiceServer) mustEmbedUnimplementedRoomServiceServer() {}
func (UnimplementedRoomServiceServer) testEmbeddedByValue()                     {}

// UnsafeRoomServiceServer may be embedded to opt out of forward compatibility for this service.
// Use of this interface is not recommended, as added methods to RoomServiceServer will
// result in compilation errors.
type UnsafeRoomServiceServer interface {
	mustEmbedUnimplementedRoomServiceServer()
}

func RegisterRoomServiceServer(s grpc.ServiceRegistrar, srv RoomServiceServer) {
	// If the following call pancis, it indicates UnimplementedRoomServiceServer was
	// embedded by pointer and is nil.  This will cause panics if an
	// unimplemented method is ever invoked, so we test this at initialization
	// time to prevent it from happening at runtime later due to I/O.
	if t, ok := srv.(interface{ testEmbeddedByValue() }); ok {
		t.testEmbeddedByValue()
	}
	s.RegisterService(&RoomService_ServiceDesc, srv)
}

func _RoomService_CreateRoom_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(CreateRoomRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(RoomServiceServer).CreateRoom(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: RoomService_CreateRoom_FullMethodName,
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(RoomServiceServer).CreateRoom(ctx, req.(*CreateRoomRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _RoomService_JoinRoom_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(JoinRoomRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(RoomServiceServer).JoinRoom(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: RoomService_JoinRoom_FullMethodName,
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(RoomServiceServer).JoinRoom(ctx, req.(*JoinRoomRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _RoomService_UpdateReady_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(UpdateReadyRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(RoomServiceServer).UpdateReady(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: RoomService_UpdateReady_FullMethodName,
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(RoomServiceServer).UpdateReady(ctx, req.(*UpdateReadyRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _RoomService_SubscribeMessages_Handler(srv interface{}, stream grpc.ServerStream) error {
	m := new(SubscribeMessagesRequest)
	if err := stream.RecvMsg(m); err != nil {
		return err
	}
	return srv.(RoomServiceServer).SubscribeMessages(m, &grpc.GenericServerStream[SubscribeMessagesRequest, MessageStreamResponse]{ServerStream: stream})
}

// This type alias is provided for backwards compatibility with existing code that references the prior non-generic stream type by name.
type RoomService_SubscribeMessagesServer = grpc.ServerStreamingServer[MessageStreamResponse]

// RoomService_ServiceDesc is the grpc.ServiceDesc for RoomService service.
// It's only intended for direct use with grpc.RegisterService,
// and not to be introspected or modified (even as a copy)
var RoomService_ServiceDesc = grpc.ServiceDesc{
	ServiceName: "RoomService",
	HandlerType: (*RoomServiceServer)(nil),
	Methods: []grpc.MethodDesc{
		{
			MethodName: "CreateRoom",
			Handler:    _RoomService_CreateRoom_Handler,
		},
		{
			MethodName: "JoinRoom",
			Handler:    _RoomService_JoinRoom_Handler,
		},
		{
			MethodName: "UpdateReady",
			Handler:    _RoomService_UpdateReady_Handler,
		},
	},
	Streams: []grpc.StreamDesc{
		{
			StreamName:    "SubscribeMessages",
			Handler:       _RoomService_SubscribeMessages_Handler,
			ServerStreams: true,
		},
	},
	Metadata: "room.proto",
}
