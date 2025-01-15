// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.35.2
// 	protoc        v5.29.1
// source: room.proto

package pb

import (
	protoreflect "google.golang.org/protobuf/reflect/protoreflect"
	protoimpl "google.golang.org/protobuf/runtime/protoimpl"
	reflect "reflect"
	sync "sync"
)

const (
	// Verify that this generated code is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(20 - protoimpl.MinVersion)
	// Verify that runtime/protoimpl is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(protoimpl.MaxVersion - 20)
)

type ResponseStatus int32

const (
	ResponseStatus_OK                 ResponseStatus = 0
	ResponseStatus_ROOM_NOT_FOUND     ResponseStatus = 1
	ResponseStatus_NO_ROOM_JOINED_YET ResponseStatus = 2
)

// Enum value maps for ResponseStatus.
var (
	ResponseStatus_name = map[int32]string{
		0: "OK",
		1: "ROOM_NOT_FOUND",
		2: "NO_ROOM_JOINED_YET",
	}
	ResponseStatus_value = map[string]int32{
		"OK":                 0,
		"ROOM_NOT_FOUND":     1,
		"NO_ROOM_JOINED_YET": 2,
	}
)

func (x ResponseStatus) Enum() *ResponseStatus {
	p := new(ResponseStatus)
	*p = x
	return p
}

func (x ResponseStatus) String() string {
	return protoimpl.X.EnumStringOf(x.Descriptor(), protoreflect.EnumNumber(x))
}

func (ResponseStatus) Descriptor() protoreflect.EnumDescriptor {
	return file_room_proto_enumTypes[0].Descriptor()
}

func (ResponseStatus) Type() protoreflect.EnumType {
	return &file_room_proto_enumTypes[0]
}

func (x ResponseStatus) Number() protoreflect.EnumNumber {
	return protoreflect.EnumNumber(x)
}

// Deprecated: Use ResponseStatus.Descriptor instead.
func (ResponseStatus) EnumDescriptor() ([]byte, []int) {
	return file_room_proto_rawDescGZIP(), []int{0}
}

type ServerMessage int32

const (
	ServerMessage_OPPONENT_JOINED         ServerMessage = 0
	ServerMessage_OPPONENT_READY          ServerMessage = 1
	ServerMessage_GAME_STARTED            ServerMessage = 2
	ServerMessage_OPPONENT_LEFT           ServerMessage = 3
	ServerMessage_OPPONENT_REVERTED_READY ServerMessage = 4
)

// Enum value maps for ServerMessage.
var (
	ServerMessage_name = map[int32]string{
		0: "OPPONENT_JOINED",
		1: "OPPONENT_READY",
		2: "GAME_STARTED",
		3: "OPPONENT_LEFT",
		4: "OPPONENT_REVERTED_READY",
	}
	ServerMessage_value = map[string]int32{
		"OPPONENT_JOINED":         0,
		"OPPONENT_READY":          1,
		"GAME_STARTED":            2,
		"OPPONENT_LEFT":           3,
		"OPPONENT_REVERTED_READY": 4,
	}
)

func (x ServerMessage) Enum() *ServerMessage {
	p := new(ServerMessage)
	*p = x
	return p
}

func (x ServerMessage) String() string {
	return protoimpl.X.EnumStringOf(x.Descriptor(), protoreflect.EnumNumber(x))
}

func (ServerMessage) Descriptor() protoreflect.EnumDescriptor {
	return file_room_proto_enumTypes[1].Descriptor()
}

func (ServerMessage) Type() protoreflect.EnumType {
	return &file_room_proto_enumTypes[1]
}

func (x ServerMessage) Number() protoreflect.EnumNumber {
	return protoreflect.EnumNumber(x)
}

// Deprecated: Use ServerMessage.Descriptor instead.
func (ServerMessage) EnumDescriptor() ([]byte, []int) {
	return file_room_proto_rawDescGZIP(), []int{1}
}

type SubscribeMessagesRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
}

func (x *SubscribeMessagesRequest) Reset() {
	*x = SubscribeMessagesRequest{}
	mi := &file_room_proto_msgTypes[0]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *SubscribeMessagesRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*SubscribeMessagesRequest) ProtoMessage() {}

func (x *SubscribeMessagesRequest) ProtoReflect() protoreflect.Message {
	mi := &file_room_proto_msgTypes[0]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use SubscribeMessagesRequest.ProtoReflect.Descriptor instead.
func (*SubscribeMessagesRequest) Descriptor() ([]byte, []int) {
	return file_room_proto_rawDescGZIP(), []int{0}
}

type MessageStreamResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Type ServerMessage `protobuf:"varint,1,opt,name=type,proto3,enum=ServerMessage" json:"type,omitempty"`
}

func (x *MessageStreamResponse) Reset() {
	*x = MessageStreamResponse{}
	mi := &file_room_proto_msgTypes[1]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *MessageStreamResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*MessageStreamResponse) ProtoMessage() {}

func (x *MessageStreamResponse) ProtoReflect() protoreflect.Message {
	mi := &file_room_proto_msgTypes[1]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use MessageStreamResponse.ProtoReflect.Descriptor instead.
func (*MessageStreamResponse) Descriptor() ([]byte, []int) {
	return file_room_proto_rawDescGZIP(), []int{1}
}

func (x *MessageStreamResponse) GetType() ServerMessage {
	if x != nil {
		return x.Type
	}
	return ServerMessage_OPPONENT_JOINED
}

type CreateRoomRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
}

func (x *CreateRoomRequest) Reset() {
	*x = CreateRoomRequest{}
	mi := &file_room_proto_msgTypes[2]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *CreateRoomRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*CreateRoomRequest) ProtoMessage() {}

func (x *CreateRoomRequest) ProtoReflect() protoreflect.Message {
	mi := &file_room_proto_msgTypes[2]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use CreateRoomRequest.ProtoReflect.Descriptor instead.
func (*CreateRoomRequest) Descriptor() ([]byte, []int) {
	return file_room_proto_rawDescGZIP(), []int{2}
}

type CreateRoomResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Status ResponseStatus `protobuf:"varint,1,opt,name=status,proto3,enum=ResponseStatus" json:"status,omitempty"`
	RoomId string         `protobuf:"bytes,2,opt,name=room_id,json=roomId,proto3" json:"room_id,omitempty"`
}

func (x *CreateRoomResponse) Reset() {
	*x = CreateRoomResponse{}
	mi := &file_room_proto_msgTypes[3]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *CreateRoomResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*CreateRoomResponse) ProtoMessage() {}

func (x *CreateRoomResponse) ProtoReflect() protoreflect.Message {
	mi := &file_room_proto_msgTypes[3]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use CreateRoomResponse.ProtoReflect.Descriptor instead.
func (*CreateRoomResponse) Descriptor() ([]byte, []int) {
	return file_room_proto_rawDescGZIP(), []int{3}
}

func (x *CreateRoomResponse) GetStatus() ResponseStatus {
	if x != nil {
		return x.Status
	}
	return ResponseStatus_OK
}

func (x *CreateRoomResponse) GetRoomId() string {
	if x != nil {
		return x.RoomId
	}
	return ""
}

type JoinRoomRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	RoomId string `protobuf:"bytes,1,opt,name=room_id,json=roomId,proto3" json:"room_id,omitempty"`
}

func (x *JoinRoomRequest) Reset() {
	*x = JoinRoomRequest{}
	mi := &file_room_proto_msgTypes[4]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *JoinRoomRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*JoinRoomRequest) ProtoMessage() {}

func (x *JoinRoomRequest) ProtoReflect() protoreflect.Message {
	mi := &file_room_proto_msgTypes[4]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use JoinRoomRequest.ProtoReflect.Descriptor instead.
func (*JoinRoomRequest) Descriptor() ([]byte, []int) {
	return file_room_proto_rawDescGZIP(), []int{4}
}

func (x *JoinRoomRequest) GetRoomId() string {
	if x != nil {
		return x.RoomId
	}
	return ""
}

type JoinRoomResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Status ResponseStatus `protobuf:"varint,1,opt,name=status,proto3,enum=ResponseStatus" json:"status,omitempty"`
}

func (x *JoinRoomResponse) Reset() {
	*x = JoinRoomResponse{}
	mi := &file_room_proto_msgTypes[5]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *JoinRoomResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*JoinRoomResponse) ProtoMessage() {}

func (x *JoinRoomResponse) ProtoReflect() protoreflect.Message {
	mi := &file_room_proto_msgTypes[5]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use JoinRoomResponse.ProtoReflect.Descriptor instead.
func (*JoinRoomResponse) Descriptor() ([]byte, []int) {
	return file_room_proto_rawDescGZIP(), []int{5}
}

func (x *JoinRoomResponse) GetStatus() ResponseStatus {
	if x != nil {
		return x.Status
	}
	return ResponseStatus_OK
}

type UpdateReadyRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Ready bool `protobuf:"varint,1,opt,name=ready,proto3" json:"ready,omitempty"`
}

func (x *UpdateReadyRequest) Reset() {
	*x = UpdateReadyRequest{}
	mi := &file_room_proto_msgTypes[6]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *UpdateReadyRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*UpdateReadyRequest) ProtoMessage() {}

func (x *UpdateReadyRequest) ProtoReflect() protoreflect.Message {
	mi := &file_room_proto_msgTypes[6]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use UpdateReadyRequest.ProtoReflect.Descriptor instead.
func (*UpdateReadyRequest) Descriptor() ([]byte, []int) {
	return file_room_proto_rawDescGZIP(), []int{6}
}

func (x *UpdateReadyRequest) GetReady() bool {
	if x != nil {
		return x.Ready
	}
	return false
}

type UpdateReadyResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Status ResponseStatus `protobuf:"varint,1,opt,name=status,proto3,enum=ResponseStatus" json:"status,omitempty"`
}

func (x *UpdateReadyResponse) Reset() {
	*x = UpdateReadyResponse{}
	mi := &file_room_proto_msgTypes[7]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *UpdateReadyResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*UpdateReadyResponse) ProtoMessage() {}

func (x *UpdateReadyResponse) ProtoReflect() protoreflect.Message {
	mi := &file_room_proto_msgTypes[7]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use UpdateReadyResponse.ProtoReflect.Descriptor instead.
func (*UpdateReadyResponse) Descriptor() ([]byte, []int) {
	return file_room_proto_rawDescGZIP(), []int{7}
}

func (x *UpdateReadyResponse) GetStatus() ResponseStatus {
	if x != nil {
		return x.Status
	}
	return ResponseStatus_OK
}

var File_room_proto protoreflect.FileDescriptor

var file_room_proto_rawDesc = []byte{
	0x0a, 0x0a, 0x72, 0x6f, 0x6f, 0x6d, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x22, 0x1a, 0x0a, 0x18,
	0x53, 0x75, 0x62, 0x73, 0x63, 0x72, 0x69, 0x62, 0x65, 0x4d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65,
	0x73, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x22, 0x3b, 0x0a, 0x15, 0x4d, 0x65, 0x73, 0x73,
	0x61, 0x67, 0x65, 0x53, 0x74, 0x72, 0x65, 0x61, 0x6d, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73,
	0x65, 0x12, 0x22, 0x0a, 0x04, 0x74, 0x79, 0x70, 0x65, 0x18, 0x01, 0x20, 0x01, 0x28, 0x0e, 0x32,
	0x0e, 0x2e, 0x53, 0x65, 0x72, 0x76, 0x65, 0x72, 0x4d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x52,
	0x04, 0x74, 0x79, 0x70, 0x65, 0x22, 0x13, 0x0a, 0x11, 0x43, 0x72, 0x65, 0x61, 0x74, 0x65, 0x52,
	0x6f, 0x6f, 0x6d, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x22, 0x56, 0x0a, 0x12, 0x43, 0x72,
	0x65, 0x61, 0x74, 0x65, 0x52, 0x6f, 0x6f, 0x6d, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65,
	0x12, 0x27, 0x0a, 0x06, 0x73, 0x74, 0x61, 0x74, 0x75, 0x73, 0x18, 0x01, 0x20, 0x01, 0x28, 0x0e,
	0x32, 0x0f, 0x2e, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x53, 0x74, 0x61, 0x74, 0x75,
	0x73, 0x52, 0x06, 0x73, 0x74, 0x61, 0x74, 0x75, 0x73, 0x12, 0x17, 0x0a, 0x07, 0x72, 0x6f, 0x6f,
	0x6d, 0x5f, 0x69, 0x64, 0x18, 0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x06, 0x72, 0x6f, 0x6f, 0x6d,
	0x49, 0x64, 0x22, 0x2a, 0x0a, 0x0f, 0x4a, 0x6f, 0x69, 0x6e, 0x52, 0x6f, 0x6f, 0x6d, 0x52, 0x65,
	0x71, 0x75, 0x65, 0x73, 0x74, 0x12, 0x17, 0x0a, 0x07, 0x72, 0x6f, 0x6f, 0x6d, 0x5f, 0x69, 0x64,
	0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x06, 0x72, 0x6f, 0x6f, 0x6d, 0x49, 0x64, 0x22, 0x3b,
	0x0a, 0x10, 0x4a, 0x6f, 0x69, 0x6e, 0x52, 0x6f, 0x6f, 0x6d, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e,
	0x73, 0x65, 0x12, 0x27, 0x0a, 0x06, 0x73, 0x74, 0x61, 0x74, 0x75, 0x73, 0x18, 0x01, 0x20, 0x01,
	0x28, 0x0e, 0x32, 0x0f, 0x2e, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x53, 0x74, 0x61,
	0x74, 0x75, 0x73, 0x52, 0x06, 0x73, 0x74, 0x61, 0x74, 0x75, 0x73, 0x22, 0x2a, 0x0a, 0x12, 0x55,
	0x70, 0x64, 0x61, 0x74, 0x65, 0x52, 0x65, 0x61, 0x64, 0x79, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73,
	0x74, 0x12, 0x14, 0x0a, 0x05, 0x72, 0x65, 0x61, 0x64, 0x79, 0x18, 0x01, 0x20, 0x01, 0x28, 0x08,
	0x52, 0x05, 0x72, 0x65, 0x61, 0x64, 0x79, 0x22, 0x3e, 0x0a, 0x13, 0x55, 0x70, 0x64, 0x61, 0x74,
	0x65, 0x52, 0x65, 0x61, 0x64, 0x79, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x27,
	0x0a, 0x06, 0x73, 0x74, 0x61, 0x74, 0x75, 0x73, 0x18, 0x01, 0x20, 0x01, 0x28, 0x0e, 0x32, 0x0f,
	0x2e, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x53, 0x74, 0x61, 0x74, 0x75, 0x73, 0x52,
	0x06, 0x73, 0x74, 0x61, 0x74, 0x75, 0x73, 0x2a, 0x44, 0x0a, 0x0e, 0x52, 0x65, 0x73, 0x70, 0x6f,
	0x6e, 0x73, 0x65, 0x53, 0x74, 0x61, 0x74, 0x75, 0x73, 0x12, 0x06, 0x0a, 0x02, 0x4f, 0x4b, 0x10,
	0x00, 0x12, 0x12, 0x0a, 0x0e, 0x52, 0x4f, 0x4f, 0x4d, 0x5f, 0x4e, 0x4f, 0x54, 0x5f, 0x46, 0x4f,
	0x55, 0x4e, 0x44, 0x10, 0x01, 0x12, 0x16, 0x0a, 0x12, 0x4e, 0x4f, 0x5f, 0x52, 0x4f, 0x4f, 0x4d,
	0x5f, 0x4a, 0x4f, 0x49, 0x4e, 0x45, 0x44, 0x5f, 0x59, 0x45, 0x54, 0x10, 0x02, 0x2a, 0x7a, 0x0a,
	0x0d, 0x53, 0x65, 0x72, 0x76, 0x65, 0x72, 0x4d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x12, 0x13,
	0x0a, 0x0f, 0x4f, 0x50, 0x50, 0x4f, 0x4e, 0x45, 0x4e, 0x54, 0x5f, 0x4a, 0x4f, 0x49, 0x4e, 0x45,
	0x44, 0x10, 0x00, 0x12, 0x12, 0x0a, 0x0e, 0x4f, 0x50, 0x50, 0x4f, 0x4e, 0x45, 0x4e, 0x54, 0x5f,
	0x52, 0x45, 0x41, 0x44, 0x59, 0x10, 0x01, 0x12, 0x10, 0x0a, 0x0c, 0x47, 0x41, 0x4d, 0x45, 0x5f,
	0x53, 0x54, 0x41, 0x52, 0x54, 0x45, 0x44, 0x10, 0x02, 0x12, 0x11, 0x0a, 0x0d, 0x4f, 0x50, 0x50,
	0x4f, 0x4e, 0x45, 0x4e, 0x54, 0x5f, 0x4c, 0x45, 0x46, 0x54, 0x10, 0x03, 0x12, 0x1b, 0x0a, 0x17,
	0x4f, 0x50, 0x50, 0x4f, 0x4e, 0x45, 0x4e, 0x54, 0x5f, 0x52, 0x45, 0x56, 0x45, 0x52, 0x54, 0x45,
	0x44, 0x5f, 0x52, 0x45, 0x41, 0x44, 0x59, 0x10, 0x04, 0x32, 0xf9, 0x01, 0x0a, 0x0b, 0x52, 0x6f,
	0x6f, 0x6d, 0x53, 0x65, 0x72, 0x76, 0x69, 0x63, 0x65, 0x12, 0x35, 0x0a, 0x0a, 0x43, 0x72, 0x65,
	0x61, 0x74, 0x65, 0x52, 0x6f, 0x6f, 0x6d, 0x12, 0x12, 0x2e, 0x43, 0x72, 0x65, 0x61, 0x74, 0x65,
	0x52, 0x6f, 0x6f, 0x6d, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x1a, 0x13, 0x2e, 0x43, 0x72,
	0x65, 0x61, 0x74, 0x65, 0x52, 0x6f, 0x6f, 0x6d, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65,
	0x12, 0x2f, 0x0a, 0x08, 0x4a, 0x6f, 0x69, 0x6e, 0x52, 0x6f, 0x6f, 0x6d, 0x12, 0x10, 0x2e, 0x4a,
	0x6f, 0x69, 0x6e, 0x52, 0x6f, 0x6f, 0x6d, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x1a, 0x11,
	0x2e, 0x4a, 0x6f, 0x69, 0x6e, 0x52, 0x6f, 0x6f, 0x6d, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73,
	0x65, 0x12, 0x38, 0x0a, 0x0b, 0x55, 0x70, 0x64, 0x61, 0x74, 0x65, 0x52, 0x65, 0x61, 0x64, 0x79,
	0x12, 0x13, 0x2e, 0x55, 0x70, 0x64, 0x61, 0x74, 0x65, 0x52, 0x65, 0x61, 0x64, 0x79, 0x52, 0x65,
	0x71, 0x75, 0x65, 0x73, 0x74, 0x1a, 0x14, 0x2e, 0x55, 0x70, 0x64, 0x61, 0x74, 0x65, 0x52, 0x65,
	0x61, 0x64, 0x79, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x48, 0x0a, 0x11, 0x53,
	0x75, 0x62, 0x73, 0x63, 0x72, 0x69, 0x62, 0x65, 0x4d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x73,
	0x12, 0x19, 0x2e, 0x53, 0x75, 0x62, 0x73, 0x63, 0x72, 0x69, 0x62, 0x65, 0x4d, 0x65, 0x73, 0x73,
	0x61, 0x67, 0x65, 0x73, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x1a, 0x16, 0x2e, 0x4d, 0x65,
	0x73, 0x73, 0x61, 0x67, 0x65, 0x53, 0x74, 0x72, 0x65, 0x61, 0x6d, 0x52, 0x65, 0x73, 0x70, 0x6f,
	0x6e, 0x73, 0x65, 0x30, 0x01, 0x42, 0x1d, 0x5a, 0x1b, 0x70, 0x61, 0x73, 0x73, 0x65, 0x72, 0x69,
	0x66, 0x6f, 0x72, 0x6d, 0x2e, 0x63, 0x6f, 0x6d, 0x2f, 0x6e, 0x75, 0x6b, 0x65, 0x73, 0x68, 0x69,
	0x70, 0x2f, 0x70, 0x62, 0x62, 0x06, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x33,
}

var (
	file_room_proto_rawDescOnce sync.Once
	file_room_proto_rawDescData = file_room_proto_rawDesc
)

func file_room_proto_rawDescGZIP() []byte {
	file_room_proto_rawDescOnce.Do(func() {
		file_room_proto_rawDescData = protoimpl.X.CompressGZIP(file_room_proto_rawDescData)
	})
	return file_room_proto_rawDescData
}

var file_room_proto_enumTypes = make([]protoimpl.EnumInfo, 2)
var file_room_proto_msgTypes = make([]protoimpl.MessageInfo, 8)
var file_room_proto_goTypes = []any{
	(ResponseStatus)(0),              // 0: ResponseStatus
	(ServerMessage)(0),               // 1: ServerMessage
	(*SubscribeMessagesRequest)(nil), // 2: SubscribeMessagesRequest
	(*MessageStreamResponse)(nil),    // 3: MessageStreamResponse
	(*CreateRoomRequest)(nil),        // 4: CreateRoomRequest
	(*CreateRoomResponse)(nil),       // 5: CreateRoomResponse
	(*JoinRoomRequest)(nil),          // 6: JoinRoomRequest
	(*JoinRoomResponse)(nil),         // 7: JoinRoomResponse
	(*UpdateReadyRequest)(nil),       // 8: UpdateReadyRequest
	(*UpdateReadyResponse)(nil),      // 9: UpdateReadyResponse
}
var file_room_proto_depIdxs = []int32{
	1, // 0: MessageStreamResponse.type:type_name -> ServerMessage
	0, // 1: CreateRoomResponse.status:type_name -> ResponseStatus
	0, // 2: JoinRoomResponse.status:type_name -> ResponseStatus
	0, // 3: UpdateReadyResponse.status:type_name -> ResponseStatus
	4, // 4: RoomService.CreateRoom:input_type -> CreateRoomRequest
	6, // 5: RoomService.JoinRoom:input_type -> JoinRoomRequest
	8, // 6: RoomService.UpdateReady:input_type -> UpdateReadyRequest
	2, // 7: RoomService.SubscribeMessages:input_type -> SubscribeMessagesRequest
	5, // 8: RoomService.CreateRoom:output_type -> CreateRoomResponse
	7, // 9: RoomService.JoinRoom:output_type -> JoinRoomResponse
	9, // 10: RoomService.UpdateReady:output_type -> UpdateReadyResponse
	3, // 11: RoomService.SubscribeMessages:output_type -> MessageStreamResponse
	8, // [8:12] is the sub-list for method output_type
	4, // [4:8] is the sub-list for method input_type
	4, // [4:4] is the sub-list for extension type_name
	4, // [4:4] is the sub-list for extension extendee
	0, // [0:4] is the sub-list for field type_name
}

func init() { file_room_proto_init() }
func file_room_proto_init() {
	if File_room_proto != nil {
		return
	}
	type x struct{}
	out := protoimpl.TypeBuilder{
		File: protoimpl.DescBuilder{
			GoPackagePath: reflect.TypeOf(x{}).PkgPath(),
			RawDescriptor: file_room_proto_rawDesc,
			NumEnums:      2,
			NumMessages:   8,
			NumExtensions: 0,
			NumServices:   1,
		},
		GoTypes:           file_room_proto_goTypes,
		DependencyIndexes: file_room_proto_depIdxs,
		EnumInfos:         file_room_proto_enumTypes,
		MessageInfos:      file_room_proto_msgTypes,
	}.Build()
	File_room_proto = out.File
	file_room_proto_rawDesc = nil
	file_room_proto_goTypes = nil
	file_room_proto_depIdxs = nil
}
