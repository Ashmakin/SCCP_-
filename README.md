现代化供应链协作平台 (SCCP)
<p align="center">（在此处替换为您的应用截图）</p>

<p align="center">
<img src="https://img.shields.io/badge/Rust-1.80-orange?style=for-the-badge&logo=rust" alt="Rust Version">
<img src="https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react" alt="React Version">
<img src="https://img.shields.io/badge/MySQL-8.0-blue?style=for-the-badge&logo=mysql" alt="MySQL Version">
<img src="https://img.shields.io/badge/Docker-20.10-blue?style=for-the-badge&logo=docker" alt="Docker Version">
<img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</p>

SCCP 是一个功能完备、技术现代的全栈B2B SaaS平台，旨在通过数字化和智能化的手段，彻底变革传统制造业中的供应商与零件管理流程。平台为需要采购零件的采购方 (Buyer) 和能够生产零件的供应方 (Supplier) 提供了一个透明、高效、可靠的在线协作环境。

从发布带有3D模型的询价单，到基于WebSocket的实时聊天，再到Stripe驱动的在线支付和数据驱动的分析仪表盘，SCCP项目展示了如何利用前沿技术栈（Rust, React）来解决真实的行业痛点。

✨ 核心功能
多角色生态系统:

清晰的采购方、供应方和平台管理员角色划分。

基于JWT的安全认证与授权体系。

独立的后台管理系统，用于公司认证和用户管理。

端到端的业务流程:

询价 (RFQ): 支持上传技术附件，包括交互式3D模型 (.glb, .gltf)。

报价 (Quote): 供应商可以为公开的RFQ提交报价。

订单 (PO): 采购方接受报价后，系统自动生成采购订单。

在线支付: 集成Stripe Checkout，实现安全、便捷的订单支付。

实时协作与通知:

应用内通知: 基于WebSocket的实时通知系统（右上角小红点）。

上下文聊天: 每个RFQ都拥有专属的实时聊天室。

邮件通知: 关键事件（如收到新报价）会触发邮件提醒。

数据与洞察:

双边仪表盘: 为采购方和供应方提供专属的数据分析仪表盘。

可视化图表: 清晰展示采购支出、报价成功率、总收入等KPIs。

供应商能力标签: 供应商可以为自己公司添加技能标签，为未来的智能匹配打下基础。

专业的用户体验:

使用Mantine UI构建的美观、统一且完全响应式的界面。

支持**AR（增强现实）**预览3D模型（在兼容的移动设备上）。

🚀 系统架构
本系统采用主流的前后端分离架构，并通过容器化技术进行部署。

![系统架构图]

graph TD
    subgraph "用户端 (Client)"
        U["**用户浏览器**<br>桌面 / 移动设备"]
    end

    subgraph "前端平台 (Vercel)"
        F["**React 单页面应用 (SPA)**<br>Vite构建 / Mantine UI<br>静态文件托管 & 全球CDN"]
    end

    subgraph "后端平台 (Render)"
        subgraph "Docker 容器"
            B["**Rust 后端服务**<br>Actix Web 框架"]
            B_API["RESTful API 端点<br>(/api/*)"]
            B_WS["WebSocket 服务器<br>(/ws)"]
            B --- B_API & B_WS
        end
    end

    subgraph "数据库 (Render)"
        DB["**托管式 MySQL 数据库**<br>sccp_db"]
    end

    subgraph "第三方服务"
        Stripe["**Stripe API**"]
        SMTP["**SMTP 服务**"]
    end

    U -- "HTTPS" --> F
    F -- "HTTPS / API 调用" --> B_API
    F -. "WebSocket" .-> B_WS
    B == "SQL 查询 (sqlx)" ==> DB
    B_API -- "支付/Webhook" --> Stripe
    B -- "邮件" --> SMTP

🛠️ 技术栈
领域

技术/工具

后端

Rust, Actix Web, SQLx, Tokio, Serde, jsonwebtoken, bcrypt, lettre

前端

React, Vite, Mantine UI, Axios, react-router-dom, react-use-websocket

3D/AR

Google <model-viewer>, WebXR

数据库

MySQL

测试

cargo test, Actix Web Test Utilities, k6 (负载测试)

部署

Docker, Render (后端 & DB), Vercel (前端)

第三方服务

Stripe (支付), Mailtrap (邮件开发)

🏁 本地开发指南
先决条件
Rust (推荐 1.75+)

Node.js (推荐 v18+)

MySQL

Docker (用于部署)

sqlx-cli (cargo install sqlx-cli --no-default-features --features rustls,mysql)

一个 Stripe 开发者账户

一个 Mailtrap 账户

1. 后端设置
克隆仓库

git clone https://github.com/your-username/sccp-project.git
cd sccp-project/backend # 进入后端目录

创建数据库
在MySQL中创建一个名为 sccp_db 和 sccp_db_test 的数据库。

CREATE DATABASE sccp_db;
CREATE DATABASE sccp_db_test;

配置环境变量
复制 .env.example 文件为 .env，并填入您的本地配置：

DATABASE_URL="mysql://user:password@localhost:3306/sccp_db"
SERVER_ADDR="127.0.0.1:8080"
JWT_SECRET="a_very_long_and_random_secret_string"
# ... 填入您的 Stripe 和 Mailtrap 凭证

运行数据库迁移

sqlx migrate run

运行后端服务

cargo run

您的后端API现在应该运行在 http://127.0.0.1:8080。

2. 前端设置
进入前端目录

cd ../frontend # 从后端目录返回并进入前端

配置环境变量
复制 .env.example 文件为 .env，并填入配置：

VITE_API_BASE_URL="http://127.0.0.1:8080"
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_..." # 您的Stripe可发布密钥

安装依赖并启动

npm install
npm run dev

您的前端应用现在应该运行在 http://localhost:5173。

🧪 运行测试
在后端项目根目录下运行所有单元和集成测试：

cargo test

📜 License
本项目采用 MIT License。
