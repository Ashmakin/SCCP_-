use actix_web::web;
use crate::handlers::{auth_handler, rfq_handler, quote_handler, order_handler, auth_middleware::Auth, company_handler, user_handler, analytics_handler, payment_handler, admin_handler, capability_handler, notification_handler, ws_handler, annotation_handler};

pub fn config(cfg: &mut web::ServiceConfig) {
    // 公开路由，不需要登录
    cfg.service(
        web::scope("/api/auth")
            .route("/register", web::post().to(auth_handler::register))
            .route("/login", web::post().to(auth_handler::login)),
    );

    // 受保护的RFQ路由
    cfg.service(
        web::scope("/api/rfqs")
            .wrap(Auth)
            .route("", web::post().to(rfq_handler::post_rfq))
            .route("", web::get().to(rfq_handler::get_rfqs))
            .route("/{rfq_id}", web::get().to(rfq_handler::get_rfq_detail))
            .route("/{rfq_id}/attachments", web::get().to(rfq_handler::get_attachments))
            .route("/{rfq_id}/quotes", web::post().to(quote_handler::post_quote))
            .route("/{rfq_id}/quotes", web::get().to(quote_handler::get_quotes))
            .route("/{rfq_id}/messages", web::get().to(rfq_handler::get_messages)),

    );

    // 受保护的Quote路由
    cfg.service(
        web::scope("/api/quotes")
            .wrap(Auth)
            .route("/{quote_id}/accept", web::post().to(quote_handler::post_accept_quote)),
    );

    // 受保护的Order路由
    cfg.service(
        web::scope("/api/orders")
            .wrap(Auth)
            .route("", web::get().to(order_handler::get_orders))
            .route("/{order_id}/status", web::patch().to(order_handler::patch_order_status))
        // --- 新增 ---
            .route("/{order_id}/create-checkout-session", web::post().to(payment_handler::create_session)),

    );

    // --- 新增受保护的User路由 ---
    cfg.service(
        web::scope("/api/users")
            .wrap(Auth)
            .route("/me", web::get().to(user_handler::get_me)) // GET /api/users/me
            .route("/me/password", web::put().to(user_handler::update_password)), // PUT /api/users/me/password
    );

    // --- 受保护的Company路由 ---
    cfg.service(
        web::scope("/api/companies")
            .wrap(Auth) // 查看和修改都需要登录
            .route("/{company_id}", web::get().to(company_handler::get_profile))
            .route("/{company_id}", web::put().to(company_handler::update_profile)),
    );

    // --- 受保护的Analytics路由 ---
    cfg.service(
        web::scope("/api/analytics")
            .wrap(Auth)
            .route("/buyer-stats", web::get().to(analytics_handler::get_stats))
            .route("/spending-by-supplier", web::get().to(analytics_handler::get_spending_breakdown))
            .route("/supplier-stats", web::get().to(analytics_handler::get_supplier_stats)),
    );

    // --- 更新WebSocket路由 ---
    cfg.service(
        web::scope("/ws")
            // Auth中间件被我删了，太难用了，handler内部直接手动验证token
            .route("", web::get().to(ws_handler::start_global_session)) // 只保留这个通用入口
    );


    //Webhook路由保护，这个很重要不然被偷钱
    cfg.service(
        web::scope("/api/stripe")
            .route("/webhook", web::post().to(payment_handler::handle_webhook)),
    );
    //admin
    cfg.service(
        web::scope("/api/admin")
            .wrap(Auth) // 使用普通Auth中间件确保用户已登录
            .route("/companies", web::get().to(admin_handler::get_all_companies))
            .route("/companies/{id}/verify", web::put().to(admin_handler::put_verify_company))
            .route("/users", web::get().to(admin_handler::get_all_users))
            .route("/users/{id}/status", web::put().to(admin_handler::put_update_user_status)),
    );

    // Capabilities
    cfg.service(
        web::scope("/api/capabilities")
            .wrap(Auth)
            .route("", web::get().to(capability_handler::get_capabilities)) // 获取所有可用标签
            .route("/company/{company_id}", web::get().to(capability_handler::get_company_caps)) // 获取某公司的标签
            .route("/my-company", web::post().to(capability_handler::post_company_cap)) // 给自己公司加标签
            .service(capability_handler::delete_company_cap), // 给自己公司删除标签
    );
    // Notifications
    cfg.service(
        web::scope("/api/notifications")
            .wrap(Auth)
            .route("", web::get().to(notification_handler::get_notifications))
            .route("/{id}/read", web::put().to(notification_handler::put_mark_as_read))
            .route("/read-all", web::put().to(notification_handler::put_mark_all_as_read)),
    );
    // annotation
    cfg.service(
        web::scope("/api/attachments")
            .wrap(Auth)
            .route("/{id}/annotations", web::get().to(annotation_handler::get_annotations))
            .route("/{id}/annotations", web::post().to(annotation_handler::post_annotation)),
    );
}

