use async_trait::async_trait;
use axum::Router as AxumRouter;
use loco_rs::{
    app::{AppContext, Hooks, Initializer},
    bgworker::Queue,
    boot::{create_app, BootResult, StartMode},
    config::Config,
    controller::AppRoutes,
    db::truncate_table,
    environment::Environment,
    task::Tasks,
    Result,
};
use migration::Migrator;
use std::path::Path;

use crate::{
    controllers, initializers,
    models::_entities::{org_invites, org_members, organizations, users},
};

pub struct App;
#[async_trait]
impl Hooks for App {
    fn app_name() -> &'static str {
        env!("CARGO_CRATE_NAME")
    }

    fn app_version() -> String {
        format!(
            "{} ({})",
            env!("CARGO_PKG_VERSION"),
            option_env!("BUILD_SHA")
                .or(option_env!("GITHUB_SHA"))
                .unwrap_or("dev")
        )
    }

    async fn boot(
        mode: StartMode,
        environment: &Environment,
        config: Config,
    ) -> Result<BootResult> {
        create_app::<Self, Migrator>(mode, environment, config).await
    }

    async fn initializers(_ctx: &AppContext) -> Result<Vec<Box<dyn Initializer>>> {
        Ok(vec![
            Box::new(initializers::view_engine::TemplateInitializer),
            Box::new(initializers::oidc::OidcInitializer),
            Box::new(initializers::security_headers::SecurityHeadersInitializer),
        ])
    }

    fn routes(_ctx: &AppContext) -> AppRoutes {
        AppRoutes::with_default_routes()
            .add_route(controllers::home::routes())
            .add_route(controllers::org::routes())
            .add_route(controllers::org::invite_routes())
            .add_route(controllers::oidc::routes())
    }

    async fn after_routes(router: AxumRouter, _ctx: &AppContext) -> Result<AxumRouter> {
        Ok(router.fallback(controllers::fallback::not_found))
    }

    fn register_tasks(_tasks: &mut Tasks) {}

    async fn connect_workers(_ctx: &AppContext, _queue: &Queue) -> Result<()> {
        Ok(())
    }

    async fn truncate(ctx: &AppContext) -> Result<()> {
        truncate_table(&ctx.db, org_invites::Entity).await?;
        truncate_table(&ctx.db, org_members::Entity).await?;
        truncate_table(&ctx.db, organizations::Entity).await?;
        truncate_table(&ctx.db, users::Entity).await?;
        Ok(())
    }

    async fn seed(_ctx: &AppContext, _base: &Path) -> Result<()> {
        Ok(())
    }
}
