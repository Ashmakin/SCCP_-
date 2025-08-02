use lettre::{
    transport::smtp::{
        authentication::Credentials,
        client::{Tls, TlsParameters},
    },
    Message, SmtpTransport, Transport,
};
use std::env;
use crate::{
    errors::AppError,
    models::{notification::Notification, user::Claims},
    services::chat_server::{ChatServer, DirectMessage},
};
use actix::Addr;
use sqlx::MySqlPool;
pub async fn send_email(to: String, subject: String, body: String) -> Result<(), AppError> {
    let from = env::var("SMTP_FROM").expect("SMTP_FROM must be set");
    let smtp_user = env::var("SMTP_USER").expect("SMTP_USER must be set");
    let smtp_pass = env::var("SMTP_PASS").expect("SMTP_PASS must be set");
    let smtp_host = env::var("SMTP_HOST").expect("SMTP_HOST must be set");
    let smtp_port_str = env::var("SMTP_PORT").expect("SMTP_PORT must be set");
    let smtp_port = smtp_port_str.parse::<u16>().expect("SMTP_PORT must be a valid number");


    let email = Message::builder()
        .from(from.parse().unwrap())
        .to(to.parse().map_err(|_| AppError::InternalServerError("Invalid 'to' email address".to_string()))?)
        .subject(subject)
        .body(body)
        .map_err(|_| AppError::InternalServerError("Failed to build email".to_string()))?;

    let creds = Credentials::new(smtp_user, smtp_pass);

    let tls_parameters = TlsParameters::new(smtp_host.clone())
        .map_err(|_| AppError::InternalServerError("Failed to create TLS parameters".to_string()))?;

    let mailer = SmtpTransport::builder_dangerous(&smtp_host)
        .port(smtp_port)
        .credentials(creds)
        .tls(Tls::Opportunistic(tls_parameters))
        .build();

    tokio::spawn(async move {
        match mailer.send(&email) {
            Ok(_) => log::info!("Email sent successfully!"),
            Err(e) => log::error!("Could not send email: {:?}", e),
        }
    });

    Ok(())
}

// 这个结构体将作为创建通知的统一入口
pub struct NotificationBuilder {
    recipient_user_id: i32,
    message: String,
    link_url: Option<String>,
}

impl NotificationBuilder {
    pub fn new(recipient_user_id: i32, message: String) -> Self {
        Self {
            recipient_user_id,
            message,
            link_url: None,
        }
    }

    pub fn with_link(mut self, link_url: String) -> Self {
        self.link_url = Some(link_url);
        self
    }

    // 保存到数据库并尝试实时推送，重点
    pub async fn send(
        self,
        pool: &MySqlPool,
        chat_server: &Addr<ChatServer>,
    ) -> Result<Notification, AppError> {
        let mut tx = pool.begin().await?;

        let result = sqlx::query(
            "INSERT INTO notifications (recipient_user_id, message, link_url) VALUES (?, ?, ?)"
        )
            .bind(self.recipient_user_id)
            .bind(&self.message)
            .bind(&self.link_url)
            .execute(&mut *tx)
            .await?;

        let new_id = result.last_insert_id();
        let notification: Notification = sqlx::query_as(
            "SELECT * FROM notifications WHERE id = ?"
        )
            .bind(new_id)
            .fetch_one(&mut *tx)
            .await?;

        tx.commit().await?;
        let notification_json = serde_json::to_string(&notification).unwrap_or_default();
        chat_server.do_send(DirectMessage {
            recipient_user_id: self.recipient_user_id,
            content: notification_json,
        });

        Ok(notification)
    }
}

// 获取用户的所有通知
pub async fn get_notifications_for_user(pool: &MySqlPool, claims: &Claims) -> Result<Vec<Notification>, AppError> {
    let notifications = sqlx::query_as("SELECT * FROM notifications WHERE recipient_user_id = ? ORDER BY created_at DESC")
        .bind(claims.sub)
        .fetch_all(pool)
        .await?;
    Ok(notifications)
}

// 将通知标记为已读（重复）
pub async fn mark_notification_as_read(pool: &MySqlPool, claims: &Claims, notification_id: i32) -> Result<u64, AppError> {
    // 还是加一个额外的安全检查，确保用户只能标记自己的通知
    let result = sqlx::query(
        "UPDATE notifications SET is_read = TRUE WHERE id = ? AND recipient_user_id = ?"
    )
        .bind(notification_id)
        .bind(claims.sub) // claims.sub is the user_id
        .execute(pool)
        .await?;

    if result.rows_affected() == 0 {//调试

        // 如果没有行被更新，记录一条警告。这可能是因为通知ID错误，或者该通知不属于当前用户。
        log::warn!(
            "User #{} attempted to mark notification #{} as read, but no rows were affected. (Not found or permission denied)",
            claims.sub,
            notification_id
        );
    } else {
        log::info!("Successfully marked notification #{} as read for user #{}.", notification_id, claims.sub);
    }

    Ok(result.rows_affected())
}

//将用户所有未读通知标记为已读
pub async fn mark_all_as_read(pool: &MySqlPool, claims: &Claims) -> Result<u64, AppError> {
    let result = sqlx::query(
        "UPDATE notifications SET is_read = TRUE WHERE recipient_user_id = ? AND is_read = FALSE"
    )
        .bind(claims.sub) // claims.sub is the user_id
        .execute(pool)
        .await?;

    Ok(result.rows_affected())
}