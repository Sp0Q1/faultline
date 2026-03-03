// sea_orm_migration's MigrationTrait uses elided lifetimes in &SchemaManager,
// and the prelude wildcard re-export is required for child modules to use super::*.
#![allow(elided_lifetimes_in_paths)]
#![allow(clippy::wildcard_imports)]
pub use sea_orm_migration::prelude::*;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        // Chain core migrations; no app-specific migrations yet
        fracture_core_migration::Migrator::migrations()
    }
}
