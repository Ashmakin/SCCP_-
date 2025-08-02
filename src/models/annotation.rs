// src/models/annotation.rs
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, FromRow)]
pub struct Annotation {
    pub id: i32,
    pub user_full_name: String,
    pub position: String,
    pub normal: String,
    pub text: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateAnnotationDto {
    pub position: String,
    pub normal: String,
    pub text: String,
}