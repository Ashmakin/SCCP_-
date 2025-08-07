use crate::{
    errors::AppError,
    models::{order::UpdateOrderStatusDto, user::Claims},
    services::order_service,
};
use actix_web::{web, HttpMessage, HttpRequest, HttpResponse, Responder};
use sqlx::MySqlPool;use crate::models::rating::RateOrderDto; // <-- 导入


pub async fn get_orders(
    pool: web::Data<MySqlPool>,
    req: HttpRequest,
) -> Result<impl Responder, AppError> {
    let claims = req.extensions().get::<Claims>().cloned().ok_or(AppError::AuthError)?;
    let orders = order_service::get_orders_for_user(pool.get_ref(), &claims).await?;
    Ok(HttpResponse::Ok().json(orders))
}

pub async fn patch_order_status(
    pool: web::Data<MySqlPool>,
    order_id: web::Path<i32>,
    dto: web::Json<UpdateOrderStatusDto>,
    req: HttpRequest,
) -> Result<impl Responder, AppError> {
    let claims = req.extensions().get::<Claims>().cloned().ok_or(AppError::AuthError)?;
    order_service::update_order_status(pool.get_ref(), order_id.into_inner(), dto.into_inner(), &claims).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({ "message": "Order status updated successfully" })))
}

pub async fn post_order_rating(
    pool: web::Data<MySqlPool>,
    order_id: web::Path<i32>,
    dto: web::Json<RateOrderDto>,
    req: HttpRequest,
) -> Result<impl Responder, AppError> {
    let claims = req.extensions().get::<Claims>().cloned().ok_or(AppError::AuthError)?;
    order_service::rate_order(pool.get_ref(), order_id.into_inner(), dto.into_inner(), &claims).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({ "message": "Order rated successfully" })))
}