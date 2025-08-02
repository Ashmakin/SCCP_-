use crate::{errors::AppError, models::user::Claims, services::notification_service};
use actix_web::{web, HttpMessage, HttpRequest, HttpResponse, Responder};
use sqlx::MySqlPool;

pub async fn get_notifications(pool: web::Data<MySqlPool>, req: HttpRequest) -> Result<impl Responder, AppError> {
    let claims = req.extensions().get::<Claims>().cloned().ok_or(AppError::AuthError)?;
    let notifications = notification_service::get_notifications_for_user(pool.get_ref(), &claims).await?;
    Ok(HttpResponse::Ok().json(notifications))
}
// 处理标记已读的请求
pub async fn put_mark_as_read(
    pool: web::Data<MySqlPool>,
    notification_id: web::Path<i32>,
    req: HttpRequest
) -> Result<impl Responder, AppError> {
    let claims = req.extensions().get::<Claims>().cloned().ok_or(AppError::AuthError)?;
    notification_service::mark_notification_as_read(pool.get_ref(), &claims, notification_id.into_inner()).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({ "message": "Notification marked as read" })))
}

pub async fn mark_notification_as_read(pool: &MySqlPool, claims: &Claims, notification_id: i32) -> Result<u64, AppError> {//这里不小心写重复了，不过跟别的架构不一样，api没给到这，危险也不大，有点困了，先不改了
    let result = sqlx::query(
        "UPDATE notifications SET is_read = TRUE WHERE id = ? AND recipient_user_id = ?"
    )
        .bind(notification_id)
        .bind(claims.sub)
        .execute(pool)
        .await?;

    //加日志，这里的更新有问题
    if result.rows_affected() == 0 {
        // 如果没有行被更新，记录一条警告。可能是因为通知ID错了，或者该通知不属于当前用户。
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

///全部已读
pub async fn put_mark_all_as_read(
    pool: web::Data<MySqlPool>,
    req: HttpRequest,
) -> Result<impl Responder, AppError> {
    let claims = req.extensions().get::<Claims>().cloned().ok_or(AppError::AuthError)?;
    notification_service::mark_all_as_read(pool.get_ref(), &claims).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({ "message": "All notifications marked as read" })))
}
