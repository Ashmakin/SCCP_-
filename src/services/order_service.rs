// src/services/order_service.rs

use crate::{
    errors::AppError,
    models::{order::{PurchaseOrder, UpdateOrderStatusDto}, user::Claims},
};
use sqlx::MySqlPool;use crate::models::rating::RateOrderDto; // <-- 导入
pub async fn get_orders_for_user(pool: &MySqlPool, claims: &Claims) -> Result<Vec<PurchaseOrder>, AppError> {
    let sql_query = if claims.company_type == "BUYER" {
        "SELECT po.*, r.title as rfq_title, b.name as buyer_name, s.name as supplier_name
         FROM purchase_orders po
         JOIN rfqs r ON po.rfq_id = r.id
         JOIN companies b ON po.buyer_company_id = b.id
         JOIN companies s ON po.supplier_company_id = s.id
         WHERE po.buyer_company_id = ? ORDER BY po.created_at DESC"
    } else {
        "SELECT po.*, r.title as rfq_title, b.name as buyer_name, s.name as supplier_name
         FROM purchase_orders po
         JOIN rfqs r ON po.rfq_id = r.id
         JOIN companies b ON po.buyer_company_id = b.id
         JOIN companies s ON po.supplier_company_id = s.id
         WHERE po.supplier_company_id = ? ORDER BY po.created_at DESC"
    };

    let orders = sqlx::query_as(sql_query)
        .bind(claims.company_id)
        .fetch_all(pool)
        .await?;

    Ok(orders)
}

pub async fn update_order_status(
    pool: &MySqlPool,
    order_id: i32,
    dto: UpdateOrderStatusDto,
    claims: &Claims,
) -> Result<u64, AppError> {
    // 权限检查：只有供应商才能更新订单状态
    if claims.company_type != "SUPPLIER" {
        return Err(AppError::BadRequest("Only suppliers can update order status.".to_string()));
    }

    // 验证新状态是否合法
    let new_status = dto.status.as_str();
    if !matches!(new_status, "IN_PRODUCTION" | "SHIPPED" | "COMPLETED") {
        return Err(AppError::BadRequest("Invalid status provided.".to_string()));
    }

    // 执行更新，并确保该供应商确实是此订单的供应商
    let result = sqlx::query(
        "UPDATE purchase_orders SET status = ? WHERE id = ? AND supplier_company_id = ?"
    )
        .bind(new_status)
        .bind(order_id)
        .bind(claims.company_id)
        .execute(pool)
        .await?;

    // 【新增】如果状态是COMPLETED，我们同时更新 completed_at 时间戳
    let sql_query = if dto.status == "COMPLETED" {
        "UPDATE purchase_orders SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ? AND supplier_company_id = ?"
    } else {
        "UPDATE purchase_orders SET status = ? WHERE id = ? AND supplier_company_id = ?"
    };

    let result = sqlx::query(sql_query)
        .bind(dto.status)
        .bind(order_id)
        .bind(claims.company_id)
        .execute(pool)
        .await?;

    // 如果没有行被影响，说明订单不存在或该供应商无权修改
    if result.rows_affected() == 0 {
        return Err(AppError::BadRequest("Order not found or you are not authorized to update it.".to_string()));
    }

    Ok(result.rows_affected())
}

// --- 【新增】rate_order 函数 ---
pub async fn rate_order(
    pool: &MySqlPool,
    order_id: i32,
    dto: RateOrderDto,
    claims: &Claims,
) -> Result<u64, AppError> {
    // 权限检查：只有采购方才能评价
    if claims.company_type != "BUYER" {
        return Err(AppError::BadRequest("Only buyers can rate orders.".to_string()));
    }
    // 验证评分在1-5之间
    if !(1..=5).contains(&dto.quality_rating) || !(1..=5).contains(&dto.communication_rating) {
        return Err(AppError::BadRequest("Rating must be between 1 and 5.".to_string()));
    }

    // 执行更新，并确保该采购方是此订单的所有者，且订单状态为COMPLETED，且尚未评分
    let result = sqlx::query(
        "UPDATE purchase_orders
         SET quality_rating = ?, communication_rating = ?
         WHERE id = ? AND buyer_company_id = ? AND status = 'COMPLETED' AND quality_rating IS NULL"
    )
        .bind(dto.quality_rating)
        .bind(dto.communication_rating)
        .bind(order_id)
        .bind(claims.company_id)
        .execute(pool)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::BadRequest("Order cannot be rated. It might not be completed, already rated, or you are not the owner.".to_string()));
    }

    Ok(result.rows_affected())
}