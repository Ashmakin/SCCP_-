use actix::{Actor, Context, Handler, Message, Recipient};
use std::collections::{HashMap, HashSet};

/// 加入聊天室
#[derive(Message)]
#[rtype(result = "()")]
pub struct JoinRoom {
    pub rfq_id: i32,
    pub addr: Recipient<ServerMessage>,
}

/// 离开聊天室
#[derive(Message)]
#[rtype(result = "()")]
pub struct LeaveRoom {
    pub rfq_id: i32,
    pub addr: Recipient<ServerMessage>,
}



/// 客户端发送给服务器的聊天消息
#[derive(Message)]
#[rtype(result = "()")]
pub struct ClientMessage {
    pub rfq_id: i32,
    pub user_id: i32,
    pub user_full_name: String,
    pub company_name: String,
    pub msg: String,
}

///服务器内部发送给特定用户的通知消息
#[derive(Message)]
#[rtype(result = "()")]
pub struct DirectMessage {
    pub recipient_user_id: i32,
    pub content: String, // JSON格式的通知内容
}

/// 新用户连接 (新增 user_id)
// Connect 和 Disconnect 现在变简单多了
#[derive(Message)]
#[rtype(result = "()")]
pub struct Connect {
    pub user_id: i32,
    pub addr: Recipient<ServerMessage>,
}

#[derive(Message)]
#[rtype(result = "()")]
pub struct Disconnect {
    pub user_id: i32,
}


/// 服务器发送给客户端的消息
#[derive(Message, Clone)]
#[rtype(result = "()")]
pub struct ServerMessage(pub String);


// --- ChatServer Actor 定义 ---

#[derive(Default)]
pub struct ChatServer {
    rooms: HashMap<i32, HashSet<Recipient<ServerMessage>>>,
    sessions: HashMap<i32, Recipient<ServerMessage>>,
}

// 【新增】WebRTC信令消息
#[derive(Message)]
#[rtype(result = "()")]
pub struct RtcSignal {
    pub sender_user_id: i32,
    pub recipient_user_id: i32,
    pub signal_data: String, // 包含SDP offer/answer 或 ICE candidate的JSON字符串
}

// 【新增】WebRTC呼叫请求信令
#[derive(Message)]
#[rtype(result = "()")]
pub struct RtcCallRequest {
    pub sender_user_id: i32,
    pub sender_full_name: String, // 附带呼叫者姓名
    pub recipient_user_id: i32,
    pub rfq_id: i32,
}

// 【新增】WebRTC呼叫应答信令
#[derive(Message)]
#[rtype(result = "()")]
pub struct RtcCallAccepted {
    pub original_sender_id: i32, // 原始呼叫者
    pub recipient_id: i32,       // 接听者
}

impl Actor for ChatServer {
    type Context = Context<Self>;
}

impl Handler<Connect> for ChatServer {
    type Result = ();
    fn handle(&mut self, msg: Connect, _: &mut Self::Context) {
        self.sessions.insert(msg.user_id, msg.addr);
        log::info!("User #{} connected.", msg.user_id);
    }
}

impl Handler<Disconnect> for ChatServer {
    type Result = ();
    fn handle(&mut self, msg: Disconnect, _: &mut Self::Context) {
        // 当用户断开连接时，必须将他们从所有可能加入的房间中移除，不然炸
        if let Some(addr) = self.sessions.remove(&msg.user_id) {
            for room in self.rooms.values_mut() {
                room.remove(&addr);
            }
        }
        log::info!("User #{} disconnected.", msg.user_id);
    }
}

// 处理 JoinRoom
impl Handler<JoinRoom> for ChatServer {
    type Result = ();
    fn handle(&mut self, msg: JoinRoom, _: &mut Self::Context) {
        self.rooms.entry(msg.rfq_id).or_default().insert(msg.addr);
        log::info!("A user joined RFQ room #{}.", msg.rfq_id);
    }
}

// 处理 LeaveRoom
impl Handler<LeaveRoom> for ChatServer {
    type Result = ();
    fn handle(&mut self, msg: LeaveRoom, _: &mut Self::Context) {
        if let Some(room) = self.rooms.get_mut(&msg.rfq_id) {
            room.remove(&msg.addr);
            log::info!("A user left RFQ room #{}.", msg.rfq_id);
        }
    }
}


// 处理 ClientMessage (聊天消息)
impl Handler<ClientMessage> for ChatServer {
    type Result = ();

    fn handle(&mut self, msg: ClientMessage, _: &mut Self::Context) {
        let server_msg = format!("chat|{} ({}): {}", msg.user_full_name, msg.company_name, msg.msg);

        if let Some(room) = self.rooms.get(&msg.rfq_id) {
            for addr in room.iter() {
                addr.do_send(ServerMessage(server_msg.clone()));
            }
        }
    }
}

// 处理 DirectMessage (直接通知)
impl Handler<DirectMessage> for ChatServer {
    type Result = ();

    fn handle(&mut self, msg: DirectMessage, _: &mut Self::Context) {
        // 查找在线用户并发送消息
        if let Some(recipient_addr) = self.sessions.get(&msg.recipient_user_id) {
            // 在消息前加上一个前缀，方便前端区分
            let full_msg = format!("notification|{}", msg.content);
            recipient_addr.do_send(ServerMessage(full_msg));
            log::info!("Sent direct notification to online user #{}.", msg.recipient_user_id);
        } else {
            log::info!("User #{} is offline. Notification was saved to DB but not pushed.", msg.recipient_user_id);
        }
    }
}
// 【新增】处理 RtcSignal 消息
impl Handler<RtcSignal> for ChatServer {
    type Result = ();

    fn handle(&mut self, msg: RtcSignal, _: &mut Self::Context) {
        // 查找接收方的WebSocket连接
        if let Some(recipient_addr) = self.sessions.get(&msg.recipient_user_id) {
            // 将信令数据封装后，原封不动地转发给接收方
            // 我们添加一个前缀，方便前端识别
            let forward_msg = format!("rtc-signal|{}|{}", msg.sender_user_id, msg.signal_data);
            recipient_addr.do_send(ServerMessage(forward_msg));
            log::info!("Forwarded RTC signal from user #{} to user #{}.", msg.sender_user_id, msg.recipient_user_id);
        } else {
            log::warn!("Could not forward RTC signal. Recipient user #{} is offline.", msg.recipient_user_id);
        }
    }
}

// 【新增】处理 RtcCallRequest
impl Handler<RtcCallRequest> for ChatServer {
    type Result = ();
    fn handle(&mut self, msg: RtcCallRequest, _: &mut Self::Context) {
        if let Some(recipient_addr) = self.sessions.get(&msg.recipient_user_id) {
            // 向接收方发送一个带有呼叫者信息的通知
            let forward_msg = format!("rtc-call-request|{}|{}|{}", msg.sender_user_id, msg.sender_full_name, msg.rfq_id);
            recipient_addr.do_send(ServerMessage(forward_msg));
        }
    }
}

// 【新增】处理 RtcCallAccepted
impl Handler<RtcCallAccepted> for ChatServer {
    type Result = ();
    fn handle(&mut self, msg: RtcCallAccepted, _: &mut Self::Context) {
        // 通知原始呼叫者，对方已接听，可以开始WebRTC握手
        if let Some(original_sender_addr) = self.sessions.get(&msg.original_sender_id) {
            let forward_msg = format!("rtc-call-accepted|{}", msg.recipient_id);
            original_sender_addr.do_send(ServerMessage(forward_msg));
        }
    }
}