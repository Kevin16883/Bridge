# Bridge - 智能需求匹配平台

<div align="center">

**将需求转化为机遇，将潜力转化为价值**

一个基于AI的智能需求-潜力实时匹配平台

[English](#english) | [中文](#chinese)

</div>

---

## 中文 {#chinese}

### 📖 项目简介

Bridge 不是一个招聘网站，而是一个动态、智能的需求-潜力实时匹配协议。通过自然语言描述需求，AI自动拆解任务，精准匹配最合适的人才。

### ✨ 核心特性

#### 🎯 双角色系统
- **需求提供者（Demand Provider）**
  - 自然语言需求描述
  - AI智能任务拆解
  - 精准人才匹配
  - 任务发布与管理
  
- **任务执行者（Task Performer）**
  - 完成能力挑战
  - 构建潜力档案
  - 接收精准匹配的任务机会
  - 获得徽章认证

#### 🚀 主要功能

**用户系统**
- 用户注册与登录（基于Session的认证）
- 个人资料管理（头像、简介、技能标签）
- 隐私控制（公开/私密档案）
- 用户关注/取关系统
- 用户评分系统（支持任务关联）

**任务管理**
- 项目创建与任务发布
- AI辅助任务分解（DeepSeek API）
- 任务浏览与搜索
- 任务申请系统
- 任务提交与审核

**社区互动**
- Q&A社区论坛
- 问题发布、投票、评论
- 问题收藏/书签功能
- 活动追踪日历
- AI生成的每周报告

**消息通知**
- 实时私信系统（WebSocket）
- 系统通知中心
- 未读消息提醒

**徽章系统**
- 任务完成徽章
- 能力认证系统
- 持续构建能力证明

### 🛠 技术栈

#### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **路由**: Wouter
- **状态管理**: TanStack Query (React Query)
- **UI组件**: Shadcn/ui (基于Radix UI)
- **样式**: Tailwind CSS
- **表单**: React Hook Form + Zod验证
- **图标**: Lucide React

#### 后端
- **运行时**: Node.js 20
- **框架**: Express.js
- **语言**: TypeScript
- **认证**: Passport.js (本地策略)
- **会话**: express-session + PostgreSQL存储
- **实时通信**: WebSocket (ws)

#### 数据库
- **数据库**: PostgreSQL (Neon Serverless)
- **ORM**: Drizzle ORM
- **验证**: Drizzle-Zod
- **迁移**: Drizzle Kit

#### AI集成
- **API**: DeepSeek API
- 用于任务智能分解和分析

### 📁 项目结构

```
bridge/
├── client/                    # 前端代码
│   ├── src/
│   │   ├── components/       # React组件
│   │   │   ├── ui/          # Shadcn UI组件
│   │   │   ├── header.tsx
│   │   │   ├── hero-section.tsx
│   │   │   └── ...
│   │   ├── pages/           # 页面组件
│   │   │   ├── home.tsx
│   │   │   ├── profile.tsx
│   │   │   ├── tasks.tsx
│   │   │   └── ...
│   │   ├── hooks/           # 自定义Hooks
│   │   ├── lib/             # 工具库
│   │   ├── App.tsx          # 应用主入口
│   │   └── index.css        # 全局样式
│   └── index.html
├── server/                   # 后端代码
│   ├── auth.ts              # 认证逻辑
│   ├── routes.ts            # API路由
│   ├── storage.ts           # 数据访问层
│   ├── websocket.ts         # WebSocket服务
│   └── index.ts             # 服务器入口
├── shared/                   # 共享代码
│   └── schema.ts            # 数据模型定义
├── db/                      # 数据库
│   └── index.ts             # 数据库连接
└── attached_assets/         # 静态资源
```

### 🚀 快速开始

#### 环境要求
- Node.js 20+
- PostgreSQL 14+
- npm 或 yarn

#### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd bridge
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**

创建 `.env` 文件：
```env
# 数据库配置
DATABASE_URL=postgresql://user:password@host:port/database
PGHOST=your-host
PGPORT=5432
PGUSER=your-user
PGPASSWORD=your-password
PGDATABASE=your-database

# Session密钥
SESSION_SECRET=your-secret-key-here

# DeepSeek API (可选)
DEEPSEEK_API_KEY=your-deepseek-api-key
```

4. **初始化数据库**
```bash
npm run db:push
```

5. **启动开发服务器**
```bash
npm run dev
```

应用将在 `http://localhost:5000` 启动

### 📚 核心功能使用

#### 作为需求提供者
1. 注册/登录账户
2. 点击"Post Demand"发布需求
3. 用自然语言描述您的需求
4. AI自动拆解为微任务
5. 查看和管理申请者
6. 审核任务提交

#### 作为任务执行者
1. 注册/登录账户
2. 浏览可用任务
3. 申请感兴趣的任务
4. 完成任务并提交
5. 获得徽章和评分
6. 构建您的能力档案

### 🎨 设计系统

**Soft UI设计风格**
- 米黄/奶油色调的柔和配色方案
- 药丸形状按钮（`rounded-full`）
- 超圆角卡片（`rounded-2xl`）
- 交互控件统一高度（`h-11`）
- 渐变和柔和阴影效果

**主题支持**
- 明暗主题切换
- 系统主题自动适配

### 🔐 安全特性

- 密码哈希存储（scrypt）
- 基于Session的身份验证
- CSRF保护
- XSS防护
- SQL注入防护（参数化查询）

### 📊 数据模型

核心实体：
- `users` - 用户账户
- `projects` - 项目/需求
- `tasks` - 任务
- `task_applications` - 任务申请
- `task_submissions` - 任务提交
- `badges` - 徽章
- `user_badges` - 用户徽章
- `questions` - 问题
- `answers` - 回答
- `user_ratings` - 用户评分
- `messages` - 私信
- `notifications` - 通知
- `activities` - 活动记录

### 🧪 开发指南

#### 代码规范
- TypeScript严格模式
- ESLint代码检查
- Prettier代码格式化

#### 数据库迁移
```bash
# 推送schema更改
npm run db:push

# 查看当前schema
npm run db:studio
```

#### 添加新页面
1. 在 `client/src/pages/` 创建页面组件
2. 在 `client/src/App.tsx` 注册路由
3. 在导航中添加链接

#### 添加新API
1. 在 `shared/schema.ts` 定义数据模型
2. 在 `server/storage.ts` 添加数据访问方法
3. 在 `server/routes.ts` 创建API端点
4. 使用TanStack Query在前端调用

### 🤝 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

### 📝 许可证

本项目采用 MIT 许可证

### 📧 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 Issue
- 发送 Pull Request

---

## English {#english}

### 📖 Project Overview

Bridge is not a recruitment website, but a dynamic, intelligent demand-potential real-time matching protocol. Describe demands in natural language, and AI automatically breaks down tasks to precisely match the most suitable talent.

### ✨ Key Features

#### 🎯 Dual Role System
- **Demand Provider**
  - Natural language demand description
  - AI-powered task breakdown
  - Precise talent matching
  - Task publishing and management
  
- **Task Performer**
  - Complete capability challenges
  - Build potential profile
  - Receive precisely matched task opportunities
  - Earn badge certifications

#### 🚀 Main Features

**User System**
- User registration and login (Session-based authentication)
- Profile management (avatar, bio, skill tags)
- Privacy controls (public/private profiles)
- User follow/unfollow system
- User rating system (with optional task context)

**Task Management**
- Project creation and task publishing
- AI-assisted task decomposition (DeepSeek API)
- Task browsing and search
- Task application system
- Task submission and review

**Community Interaction**
- Q&A community forum
- Question posting, voting, and commenting
- Question bookmarking feature
- Activity tracking calendar
- AI-generated weekly reports

**Messaging & Notifications**
- Real-time private messaging (WebSocket)
- Notification center
- Unread message indicators

**Badge System**
- Task completion badges
- Capability certification
- Continuous capability proof building

### 🛠 Tech Stack

#### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter
- **State Management**: TanStack Query (React Query)
- **UI Components**: Shadcn/ui (based on Radix UI)
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React

#### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Language**: TypeScript
- **Authentication**: Passport.js (Local Strategy)
- **Sessions**: express-session + PostgreSQL store
- **Real-time**: WebSocket (ws)

#### Database
- **Database**: PostgreSQL (Neon Serverless)
- **ORM**: Drizzle ORM
- **Validation**: Drizzle-Zod
- **Migrations**: Drizzle Kit

#### AI Integration
- **API**: DeepSeek API
- For intelligent task decomposition and analysis

### 🚀 Quick Start

#### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- npm or yarn

#### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd bridge
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file:
```env
# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database
PGHOST=your-host
PGPORT=5432
PGUSER=your-user
PGPASSWORD=your-password
PGDATABASE=your-database

# Session Secret
SESSION_SECRET=your-secret-key-here

# DeepSeek API (Optional)
DEEPSEEK_API_KEY=your-deepseek-api-key
```

4. **Initialize database**
```bash
npm run db:push
```

5. **Start development server**
```bash
npm run dev
```

The application will start at `http://localhost:5000`

### 📚 How to Use

#### As a Demand Provider
1. Register/Login
2. Click "Post Demand"
3. Describe your demand in natural language
4. AI automatically breaks it down into micro-tasks
5. Review and manage applications
6. Review task submissions

#### As a Task Performer
1. Register/Login
2. Browse available tasks
3. Apply for tasks of interest
4. Complete and submit tasks
5. Earn badges and ratings
6. Build your capability profile

### 🎨 Design System

**Soft UI Design Style**
- Beige/cream color palette for a relaxing feel
- Pill-shaped buttons (`rounded-full`)
- Extra-rounded cards (`rounded-2xl`)
- Consistent control height (`h-11`)
- Gradients and soft shadows

**Theme Support**
- Light/Dark theme toggle
- System theme auto-detection

### 🔐 Security Features

- Password hashing (scrypt)
- Session-based authentication
- CSRF protection
- XSS prevention
- SQL injection protection (parameterized queries)

### 📊 Data Models

Core entities:
- `users` - User accounts
- `projects` - Projects/demands
- `tasks` - Tasks
- `task_applications` - Task applications
- `task_submissions` - Task submissions
- `badges` - Badges
- `user_badges` - User badges
- `questions` - Questions
- `answers` - Answers
- `user_ratings` - User ratings
- `messages` - Private messages
- `notifications` - Notifications
- `activities` - Activity records

### 🧪 Development Guide

#### Code Standards
- TypeScript strict mode
- ESLint linting
- Prettier formatting

#### Database Migrations
```bash
# Push schema changes
npm run db:push

# View current schema
npm run db:studio
```

#### Adding New Pages
1. Create page component in `client/src/pages/`
2. Register route in `client/src/App.tsx`
3. Add navigation link

#### Adding New APIs
1. Define data model in `shared/schema.ts`
2. Add data access method in `server/storage.ts`
3. Create API endpoint in `server/routes.ts`
4. Use TanStack Query in frontend

### 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 📝 License

This project is licensed under the MIT License

### 📧 Contact

For questions or suggestions:
- Submit an Issue
- Send a Pull Request

---

<div align="center">

**Built with ❤️ using React, TypeScript, and AI**

Transform demands into opportunities, transform potential into value

</div>
