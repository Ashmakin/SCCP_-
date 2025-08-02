// src/handlers/annotation_handler.rs
use crate::{errors::AppError, models::{annotation::*, user::Claims}, services::annotation_service};
use actix_web::{web, HttpMessage, HttpRequest, HttpResponse, Responder};
use sqlx::MySqlPool;

pub async fn get_annotations(pool: web::Data<MySqlPool>, attachment_id: web::Path<i32>) -> Result<impl Responder, AppError> {
    let annotations = annotation_service::get_annotations_for_attachment(pool.get_ref(), attachment_id.into_inner()).await?;
    Ok(HttpResponse::Ok().json(annotations))
}

pub async fn post_annotation(pool: web::Data<MySqlPool>, attachment_id: web::Path<i32>, dto: web::Json<CreateAnnotationDto>, req: HttpRequest) -> Result<impl Responder, AppError> {
    let claims = req.extensions().get::<Claims>().cloned().ok_or(AppError::AuthError)?;
    let new_annotation = annotation_service::create_annotation(pool.get_ref(), attachment_id.into_inner(), &claims, dto.into_inner()).await?;
    Ok(HttpResponse::Created().json(new_annotation))
}