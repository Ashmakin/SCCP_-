// src/services/annotation_service.rs
use crate::{errors::AppError, models::{annotation::*, user::Claims}};
use sqlx::MySqlPool;

pub async fn get_annotations_for_attachment(pool: &MySqlPool, attachment_id: i32) -> Result<Vec<Annotation>, AppError> {
    sqlx::query_as("SELECT id, user_full_name, position, normal, text, created_at FROM model_annotations WHERE rfq_attachment_id = ? ORDER BY created_at ASC")
        .bind(attachment_id).fetch_all(pool).await.map_err(Into::into)
}

pub async fn create_annotation(pool: &MySqlPool, attachment_id: i32, claims: &Claims, dto: CreateAnnotationDto) -> Result<Annotation, AppError> {
    let user_full_name: (String,) = sqlx::query_as("SELECT full_name FROM users WHERE id = ?").bind(claims.sub).fetch_one(pool).await?;

    let result = sqlx::query(
        "INSERT INTO model_annotations (rfq_attachment_id, user_id, user_full_name, position, normal, text) VALUES (?, ?, ?, ?, ?, ?)"
    )
        .bind(attachment_id).bind(claims.sub).bind(&user_full_name.0).bind(dto.position).bind(dto.normal).bind(dto.text)
        .execute(pool).await?;

    let new_id = result.last_insert_id();
    let new_annotation = sqlx::query_as("SELECT id, user_full_name, position, normal, text, created_at FROM model_annotations WHERE id = ?")
        .bind(new_id).fetch_one(pool).await?;

    Ok(new_annotation)
}