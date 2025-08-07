// src/models/rating.rs
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct RateOrderDto {
    pub quality_rating: u8,
    pub communication_rating: u8,
}