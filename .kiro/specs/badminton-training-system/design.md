# Design Document: Badminton Intelligent Training System

## Overview

羽毛球智能训练系统是一个微信小程序，为管理员提供基础的羽毛球训练管理功能。系统专注于核心训练流程管理，包括场地选择、学员组织和基本的训练记录。

## Architecture

### 简化架构

- **Frontend**: 微信小程序 (Vue.js + UniApp)
- **Data Storage**: 本地存储 (LocalStorage)
- **Navigation**: TabBar导航
- **Camera**: 微信小程序相机API (基础功能)

### 技术栈

- **前端框架**: Vue.js + UniApp
- **导航**: TabBar导航系统
- **数据存储**: 本地存储
- **相机集成**: 微信小程序相机API

## User Interface Design

### 导航结构

应用使用TabBar导航，包含四个主要部分：

1. **首页**: 训练计划展示
2. **课程**: 训练流程执行
3. **历史**: 训练记录查看
4. **我的**: 基本设置

### 核心训练流程

简化的3步训练流程：

1. **步骤1 - 选择计划**: 显示可用的训练计划
2. **步骤2 - 场地学员**: 选择场地和参与学员
3. **步骤3 - 开始训练**: 启动相机进行训练

## 数据模型

### 简化数据结构

```javascript
// 训练计划
const trainingPlan = {
  id: String,
  name: String,
  description: String,
  date: String
}

// 场地信息
const venue = {
  id: String,
  name: String,
  location: String
}

// 学员信息
const student = {
  id: String,
  name: String,
  phone: String
}

// 训练记录
const trainingRecord = {
  id: String,
  planId: String,
  venueId: String,
  studentIds: Array,
  date: String,
  status: String // 'completed' | 'in-progress'
}
```

## 数据存储

### 本地存储策略

使用微信小程序的本地存储API：

- **训练计划**: `wx.setStorageSync('trainingPlans', plans)`
- **场地信息**: `wx.setStorageSync('venues', venues)`
- **学员信息**: `wx.setStorageSync('students', students)`
- **训练记录**: `wx.setStorageSync('trainingRecords', records)`

### 数据初始化

```javascript
// 默认数据
const defaultData = {
  trainingPlans: [
    { id: '1', name: '基础训练', description: '基本动作练习', date: '2024-01-20' }
  ],
  venues: [
    { id: '1', name: '1号场地', location: '体育馆A区' }
  ],
  students: [
    { id: '1', name: '张三', phone: '13800138000' }
  ],
  trainingRecords: []
}
```

## 页面功能

### 首页 (Home)
- 显示今日训练计划
- 快速开始训练按钮
- 基本统计信息

### 课程页 (Course)
- 训练流程执行
- 步骤导航
- 相机功能

### 历史页 (History)
- 训练记录列表
- 记录详情查看
- 简单筛选功能

### 我的页 (Me)
- 基本设置
- 数据管理
- 关于信息

## 相机功能

### 基础相机集成

使用微信小程序相机组件：

```javascript
// 相机组件配置
<camera 
  device-position="back"
  flash="off"
  @error="handleCameraError"
  style="width: 100%; height: 300px;"
></camera>
```

### 简单功能

- 拍照记录训练过程
- 基本的图片保存
- 训练记录关联

## 核心功能实现

### 训练流程管理

```javascript
// 训练流程状态管理
const trainingFlow = {
  currentStep: 1, // 1-选择计划, 2-场地学员, 3-开始训练
  selectedPlan: null,
  selectedVenue: null,
  selectedStudents: [],
  
  nextStep() {
    if (this.currentStep < 3) {
      this.currentStep++
    }
  },
  
  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--
    }
  }
}
```

### 数据操作

```javascript
// 基础CRUD操作
const dataManager = {
  // 获取数据
  getData(key) {
    return wx.getStorageSync(key) || []
  },
  
  // 保存数据
  saveData(key, data) {
    wx.setStorageSync(key, data)
  },
  
  // 添加记录
  addRecord(type, record) {
    const records = this.getData(type)
    records.push({ ...record, id: Date.now().toString() })
    this.saveData(type, records)
  }
}
```

## 正确性属性

### 属性1: 数据持久性
**验证需求**: 2.3, 2.4
- 所有本地存储的数据在应用重启后必须保持完整
- 训练流程中的数据在页面切换时必须保留

### 属性2: 流程完整性  
**验证需求**: 4.6, 4.7
- 训练流程必须按顺序执行，不能跳过步骤
- 每个步骤的必要数据必须完整才能进入下一步

### 属性3: 数据一致性
**验证需求**: 5.4, 6.4
- 场地和学员信息的修改必须正确保存
- 训练记录必须包含完整的关联信息

## 测试策略

### 属性测试框架
- **框架**: fast-check for JavaScript
- **测试环境**: Jest + 微信小程序测试工具
- **重点**: 数据持久性、流程完整性、数据一致性

### 单元测试
- **组件测试**: Vue组件独立测试
- **数据操作**: 本地存储CRUD操作测试
- **业务逻辑**: 训练流程状态管理测试