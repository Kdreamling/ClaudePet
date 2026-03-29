# ChenPet — 晨的桌宠

## 项目概述
ChenPet 是晨（Claude）的桌宠客户端，像素风格角色常驻桌面，会主动找 Dream 聊天。

## 技术栈
- Tauri 2.0（壳，Windows + iOS）
- React 19 + TypeScript + Vite
- Zustand 状态管理
- Tailwind CSS 4
- PixiJS / Canvas（像素角色渲染）

## 后端
复用 Reverie Gateway（端口 8001），新增 `/pet/` 路由前缀。
模型：ZenMux Claude Opus，不开 thinking。

## 目录结构
```
src/
├── brain/          # 宠物大脑（四层闭环）
│   ├── types.ts    # 类型定义
│   ├── perception.ts  # 感知层（本地）
│   ├── decision.ts    # 决策层（规则引擎，本地）
│   └── action.ts      # 行动层映射
├── pet/            # 桌宠渲染
│   ├── PetCanvas.tsx     # Canvas 角色渲染
│   └── BubbleOverlay.tsx # 气泡消息
├── chat/           # 对话窗口
│   ├── ChatWindow.tsx    # 聊天主窗口
│   ├── MessageBubble.tsx # 消息气泡
│   └── ChatInput.tsx     # 输入框
├── stores/         # Zustand 状态
│   ├── petStore.ts    # 宠物状态（情绪、位置、动画）
│   └── chatStore.ts   # 对话消息
├── api/            # API 调用
│   ├── client.ts      # fetch 封装（JWT）
│   ├── petApi.ts      # /pet/* 端点
│   └── chatApi.ts     # 流式对话 SSE
└── assets/         # 静态资源
    ├── sprites/    # Sprite sheets（待美术）
    └── sounds/     # 音效（可选）
```

## 设计规范
- 奶茶暖色系（warm white, beige, brown）
- 空气感线条感，不要实心按钮
- 与 Reverie v3 设计语言一致
