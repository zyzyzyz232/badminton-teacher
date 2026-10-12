# 阶段 0：教学平台 API 清单（Agent / LangGraph 接入用）

> 来源：教师端 `services/*.js` + `pages/**/*.vue` 直连请求 + `docs/考试模式*.md` + `relay-server`。  
> 决策：Agent 服务用 **Python**；助手入口 **教师小程序 + Web 管理页**；LLM 提供方待定。  
> 更新日期：2026-08-24

---

## 0. 约定

| 项 | 说明 |
|----|------|
| 响应体 | `{ code: 0, data, msg }`，`code !== 0` 为业务失败 |
| 鉴权头 | `Authorization: Bearer <accessToken>` + `Tenant-Id: 1` |
| 登录后 token | 存 `uni.setStorageSync('token')`；profile 写入 `userInfo` |
| 教师 ID | `userInfo.id` / `userInfo.userId`（与 `teacherId` 同义） |
| 现网网关 | `http://10.112.149.184:48080/admin-api`（**LIVE**） |
| 考试旁路 | `http://10.29.108.157:48081/admin-api`（**BYPASS**，IP 可能变） |
| 风险分级 | **R** 只读 / **W** 写入 / **H** 高风险（删/考场控制/大屏） |

**Agent 封装原则：** 前端把教师 token 传给 Agent；Agent 代调 admin-api。双网关按路径分流，不要混打。

---

## 1. 网关分流矩阵

| 路径前缀 | 网关 | 说明 |
|----------|------|------|
| `/system/auth/*`、`/system/user/*` | LIVE 48080 | 登录、资料 |
| `/teaching/course/*`、`/teaching/lesson/*`、`/teaching/class-student/*` | LIVE 48080 | 课程 / 课堂 / 名册 |
| `/teaching/plan*`、`/teaching/plan-project*`、`/teaching/plan-material*` | LIVE 48080 | 训练计划与资料 |
| `/teaching/exam*`、`/teaching/exam-item*`、`/teaching/exam-item-material*`、`/teaching/exam-score*` | BYPASS 48081 | 考试闭环（阶段一～三旁路） |
| 例外：考核资料文件优先 | LIVE `plan-material/upload`，失败再 BYPASS `exam-item-material/upload` | 见考试联调文档 |
| relay WebSocket | 独立端口（默认 3456） | **非** admin-api；v1 Agent 暂不封装 |

---

## 2. 账号与会话

| Method | Path | 网关 | 风险 | 封装位置 | 主要参数 | 备注 |
|--------|------|------|------|----------|----------|------|
| POST | `/system/auth/login` | LIVE | W | `pages/index/index.vue` | `username`, `password` | 返回 `accessToken` |
| POST | `/system/auth/teacher-register` | LIVE | W | 同上 | `username`, `nickname`, `mobile`, `password` | 注册 |
| GET | `/system/user/profile/get` | LIVE | R | `services/userProfile.js`、`pages/me` | Header Bearer | Agent 可用于确认身份 |

**建议 Tool：** `get_my_profile`（R）。登录/注册由前端完成，Agent 不代登。

---

## 3. 课程与班级

| Method | Path | 网关 | 风险 | 封装位置 | 主要参数 | 备注 |
|--------|------|------|------|----------|----------|------|
| GET | `/teaching/course/list-by-teacher` | LIVE | R | `examApi` / `home` / `my-courses` | `teacherId` | 我的课程列表 |
| GET | `/teaching/course/get` | LIVE | R | `course-detail` | `id` | 课程详情 |
| POST | `/teaching/course/create` | LIVE | W | `my-courses` | `name`, `courseClass`, `semester`, `startTime`, `endTime`, `teacherId` | |
| DELETE | `/teaching/course/delete` | LIVE | H | `course-detail` | `id` | |
| GET | `/teaching/course/list-classes` | LIVE | R | 多页 | `courseId` | 班级列表 |
| GET | `/teaching/class-student/list-by-class` | LIVE | R | `examApi` / `exam-session` | `classId` | 学员名册 |

**建议 Tool（v1）：** `list_my_courses`、`get_course`、`list_classes`、`list_class_students`。  
**后补：** `create_course`、`delete_course`（需确认）。

---

## 4. 课堂（课次）

| Method | Path | 网关 | 风险 | 封装位置 | 主要参数 | 备注 |
|--------|------|------|------|----------|----------|------|
| GET | `/teaching/course/list-lessons` | LIVE | R | `examApi` / `lesson-list` / `course-detail` | `courseId`；前端可滤 `type` | 设计文档另有 `/teaching/lesson/list-by-course`，**当前未直连** |
| POST | `/teaching/lesson/create` | LIVE | W | `lesson-create` | `courseId`, `weekIndex`, `startTime`, `endTime`；考试课堂 `type: 2` | |
| DELETE | `/teaching/lesson/delete` | LIVE | H | `lesson-list` | `id` | |

**建议 Tool（v1）：** `list_lessons`。  
**后补：** `create_lesson`、`delete_lesson`。

---

## 5. 训练计划

| Method | Path | 网关 | 风险 | 封装位置 | 主要参数 | 备注 |
|--------|------|------|------|----------|----------|------|
| GET | `/teaching/plan/list-by-teacher` | LIVE | R | `trainingPlanApi` | `teacherId` | 计划列表 |
| GET | `/teaching/plan/list-by-lesson` | LIVE | R | 同上 | `lessonId` | 课次已绑计划 |
| GET | `/teaching/plan/get` | LIVE | R | 同上 | `id` | 计划详情 |
| POST | `/teaching/plan/create` | LIVE | W | 同上 | 计划字段；成功 `data` 常为 Long id | |
| PUT | `/teaching/plan/update` | LIVE | W | 同上 | 含 `lessonId` 可绑课堂 | `bindPlanToCurrentLesson` |
| DELETE | `/teaching/plan/delete` | LIVE | H | 同上 | `id` | |

**建议 Tool（v1）：** `list_training_plans`、`get_training_plan`。  
**后补：** `create/update/delete_training_plan`、`bind_plan_to_lesson`。

---

## 6. 训练项目（plan-project）

| Method | Path | 网关 | 风险 | 封装位置 | 主要参数 | 备注 |
|--------|------|------|------|----------|----------|------|
| GET | `/teaching/plan-project/list-by-teacher` | LIVE | R | `trainingPlanApi` | `teacherId` | 教师项目库 |
| GET | `/teaching/plan-project/list-by-plan` | LIVE | R | 同上 / `screen-control` | `planId` | 计划下项目 |
| GET | `/teaching/plan-project/get` | LIVE | R | 同上 | `id` | |
| POST | `/teaching/plan-project/create` | LIVE | W | 同上 | `teacherId` + 业务字段；新建弹窗可不传 `planId` | `data` 常为 Long |
| PUT | `/teaching/plan-project/update` | LIVE | W | 同上 | 含 `sortOrder` 编排 | |
| POST | `/teaching/plan-project/associate-plan` | LIVE | W | 同上 | `id`, `planId` | 关联到计划 |
| DELETE | `/teaching/plan-project/delete` | LIVE | H | 同上 | `id` | 删除项目；前端 `disassociate` 也走此删 |

**建议 Tool（v1）：** `list_plan_projects`、`get_plan_project`。  
**后补：** create/update/associate/delete（编排类需多步 + 确认）。

---

## 7. 计划资料（plan-material）

| Method | Path | 网关 | 风险 | 封装位置 | 主要参数 | 备注 |
|--------|------|------|------|----------|----------|------|
| GET | `/teaching/plan-material/list-by-item` | LIVE | R | `material-manage` / `examApi` / `screen-control` | `itemId`（plan-project id） | |
| GET | `/teaching/plan-material/get` | LIVE | R | `examApi`（上传后取 URL） | `id` | |
| POST | `/teaching/plan-material/create` | LIVE | W | `trainingPlanApi` | 元数据 | |
| PUT | `/teaching/plan-material/update` | LIVE | W | `material-manage` | | |
| POST | `/teaching/plan-material/upload` | LIVE | W | `trainingPlanApi` / `material-manage` / 考试上传兜底 | multipart | 文件落 pic-video |
| DELETE | `/teaching/plan-material/delete` | LIVE | H | `material-manage` **已注释未用** | `id` | 后端可能有，前端未启用 |

**建议 Tool：** 列表/详情可 R；上传类 Agent 后期再做（二进制不好对话化）。

---

## 8. 考试头表 / 考核项 / 资料（旁路）

### 8.1 Exam

| Method | Path | 网关 | 风险 | 封装位置 | 主要参数 |
|--------|------|------|------|----------|----------|
| GET | `/teaching/exam/list-by-course` | BYPASS | R | `examApi` | `courseId` |
| GET | `/teaching/exam/get` | BYPASS | R | 同上 | `id` |
| POST | `/teaching/exam/create` | BYPASS | W | 同上 | `courseId`, `lessonId`, `title`, `scoreRatio` |
| PUT | `/teaching/exam/update` | BYPASS | W | 同上 | `id` + 字段 |
| DELETE | `/teaching/exam/delete` | BYPASS | H | 同上 | `id` |

### 8.2 Exam Item

| Method | Path | 网关 | 风险 | 封装位置 | 主要参数 |
|--------|------|------|------|----------|----------|
| GET | `/teaching/exam-item/list-by-exam` | BYPASS | R | `examApi` | `examId` |
| GET | `/teaching/exam-item/get` | BYPASS | R | 同上 | `id` |
| POST | `/teaching/exam-item/create` | BYPASS | W | 同上 | `examId`, `itemName`, `maxScore`, `weight`, `algoType`, `sortOrder` |
| PUT | `/teaching/exam-item/update` | BYPASS | W | 同上 | |
| DELETE | `/teaching/exam-item/delete` | BYPASS | H | 同上 | `id` |

### 8.3 Exam Item Material

| Method | Path | 网关 | 风险 | 封装位置 | 主要参数 | 备注 |
|--------|------|------|------|----------|----------|------|
| GET | `/teaching/exam-item-material/list-by-item` | BYPASS | R | `examApi` | **`examItemId`** | 参数名注意 |
| POST | `/teaching/exam-item-material/create` | BYPASS | W | 同上 | 元数据 | |
| PUT | `/teaching/exam-item-material/update` | BYPASS | W | 同上 | | |
| DELETE | `/teaching/exam-item-material/delete` | BYPASS | H | 同上 | `id` | |
| POST | `/teaching/exam-item-material/upload` | BYPASS | W | 同上 | multipart | 现网 upload 失败时的旁路落盘 |

**建议 Tool（v1）：** `list_exams`、`get_exam`、`list_exam_items`。  
**后补：** 创建/改占比/删（占比校验 `exam_ratio_exceeded`）；资料上传后期。

---

## 9. 考试成绩（旁路）

| Method | Path | 网关 | 风险 | 封装位置 | 主要参数 | 备注 |
|--------|------|------|------|----------|----------|------|
| GET | `/teaching/exam-score/list-by-exam` | BYPASS | R | `examApi` | `examId` | |
| GET | `/teaching/exam-score/get` | BYPASS | R | 同上 | `id` | |
| POST | `/teaching/exam-score/submit-video` | BYPASS | W | 同上 | multipart：`file` + `examId`, `examItemId`, `studentId`, … | 禁止小程序直连算法 IP |
| PUT | `/teaching/exam-score/review` | BYPASS | W | 同上 | `id`, `finalScore`, `comment` | 人工改分 |
| POST | `/teaching/exam-score/retry` | BYPASS | W | 同上 | `id` | 失败重提 |
| POST | `/teaching/exam-score/mark-absent` | BYPASS | W | 同上 | `examId`, `studentId`, `classId?` | |
| POST | `/teaching/exam-score/restart-student` | BYPASS | W | 同上 | `examId`, `studentId` | |
| POST | `/teaching/exam-score/algo-callback` | BYPASS | — | 后端内部 | Header `X-Algo-Callback-Token` | **不对 Agent 开放** |

**建议 Tool（v1）：** `list_exam_scores`、`get_exam_score`。  
**后补：** review / mark-absent（需确认）；submit-video 后期。

---

## 10. 非 HTTP：relay-server（二期）

默认 `ws://<host>:3456`。鉴权为房间 `roomId` + 4 位 `token`（**不是** admin-api JWT）。

### 训练命令（节选）

| name | 风险 | 说明 |
|------|------|------|
| `setPlan` | H | 下发计划到大屏 |
| `pause` / `resume` | H | |
| `setCurrentItem` / `setItemDuration` / `resetBlockTimer` | H | |
| `toggleVideo` / `setVideoPlaying` / `setMediaAuth` | H | |

### 考试命令

| name | 风险 | 说明 |
|------|------|------|
| `setExamBriefing` | H | 进入考试 briefing |
| `setExamItem` / `setExamVideoPlaying` | H | |
| `startExam` | H | |
| `setCurrentExaminee` / `advanceExaminee` | H | |
| `markExamineeAbsent` / `restartExaminee` | H | |
| `finishExam` / `exitExamMode` | H | |

`services/examRecognition.js` 仅为占位，算法走 `exam-score/submit-video`，**无独立 REST tool**。

---

## 11. 统计与 Agent 分批建议

### 11.1 已盘点 REST 数量（去重后约）

| 领域 | 约条数 | 默认网关 |
|------|--------|----------|
| 账号 | 3 | LIVE |
| 课程/班级/名册 | 6 | LIVE |
| 课堂 | 3 | LIVE |
| 训练计划 | 6 | LIVE |
| 训练项目 | 7 | LIVE |
| 计划资料 | 5（+1 未启用 delete） | LIVE |
| 考试头/项/资料 | 14 | BYPASS |
| 成绩 | 7（含内部 callback） | BYPASS |
| **合计 REST** | **~51** | — |
| Relay 命令 | ~20 | WS |

### 11.2 v1 Tool 白名单（只读优先，约 12 个）

| Tool 名 | 对应 API | 网关 |
|---------|----------|------|
| `get_my_profile` | GET `/system/user/profile/get` | LIVE |
| `list_my_courses` | GET `/teaching/course/list-by-teacher` | LIVE |
| `get_course` | GET `/teaching/course/get` | LIVE |
| `list_classes` | GET `/teaching/course/list-classes` | LIVE |
| `list_lessons` | GET `/teaching/course/list-lessons` | LIVE |
| `list_class_students` | GET `/teaching/class-student/list-by-class` | LIVE |
| `list_training_plans` | GET `/teaching/plan/list-by-teacher` | LIVE |
| `get_training_plan` | GET `/teaching/plan/get` | LIVE |
| `list_plan_projects` | GET `/teaching/plan-project/list-by-plan` | LIVE |
| `list_exams` | GET `/teaching/exam/list-by-course` | BYPASS |
| `get_exam` | GET `/teaching/exam/get` | BYPASS |
| `list_exam_scores` | GET `/teaching/exam-score/list-by-exam` | BYPASS |

### 11.3 v2 写入（需自然语言确认节点）

- 创建课程 / 课堂 / 训练计划 / 考试  
- 更新计划、绑课堂、编排项目  
- 改分、缺考标记  

### 11.4 v3 高风险 / 现场

- 各类 DELETE  
- `submit-video`、上传 multipart  
- 全部 relay 大屏命令  

---

## 12. 已知缺口与注意点

1. **双网关**：考试相关必须打 48081；课程/课堂必须打 48080（联调文档明确）。  
2. **路径不一致**：文档写 `/teaching/lesson/list-by-course`，代码实际用 `/teaching/course/list-lessons`。  
3. **页面直连未进 services**：`course/create|get|delete`、`lesson/create|delete` 等散落在 `pages/*`，Agent 封装时要一并覆盖。  
4. **`plan-material/delete`**：前端注释掉，是否启用需对 Swagger 确认。  
5. **创建接口返回值**：多处 `data` 为 Long id，不是完整对象。  
6. **签到 / face**：后端有 `yudao-module-signin`，教师端当前主流程未在上述 services 中作为一等公民调用，本清单未列入；若 Web 管理页要用再补。  
7. **Swagger 校准**：上线前用 LIVE/BYPASS 的 `/v3/api-docs` 或 Knife4j 对一下字段名。

---

## 13. 源文件索引

| 文件 | 覆盖 |
|------|------|
| `services/userProfile.js` | profile |
| `services/trainingPlanApi.js` | plan / plan-project / plan-material |
| `services/examApi.js` | exam* + 部分 course/名册 + score |
| `services/examRecognition.js` | 占位，无 REST |
| `pages/index/index.vue` | login / register |
| `pages/home|my-courses|course-detail|class-*|lesson-*` | course / lesson 直连 |
| `pages/material-manage` | plan-material 列表/更新/上传 |
| `relay-server/README.md` | WS 命令契约 |
| `docs/考试模式阶段一|二|三对接说明.md` | 考试 API 契约 |

---

## 14. 阶段 0 完成标准

- [x] REST 按领域列表 + 网关 + 风险分级  
- [x] v1 / v2 / v3 Tool 分批建议  
- [x] 双网关与页面直连缺口标注  
- [ ] （可选）对照 Knife4j 补全请求/响应字段表  

## 15. 阶段 1 完成标准

- [x] `agent-service/`：FastAPI + LangGraph ReAct + 统一 `AdminApiClient`  
- [x] 12 个 v1 只读 tools（路径对齐教师端实际调用）  
- [x] 默认 mock LLM，配置 `LLM_API_KEY` 后切 OpenAI 兼容接口  

## 16. 阶段 2 完成标准

- [x] 8 个写入 tools（创建课程/课堂/计划/考试、更新计划、绑课堂、改分、缺考）  
- [x] LangGraph `interrupt` 确认：未确认不打 admin-api  
- [x] Web 聊天页：`GET /`（账号登录与小程序相同 + 确认卡）  

下一步见 [阶段 3–5 计划](./agent-phase3-miniprogram.md)：

| 阶段 | 文档 | 摘要 |
|------|------|------|
| 3 | [agent-phase3-miniprogram.md](./agent-phase3-miniprogram.md) | 教师小程序助手页，复用已有登录 token |
| 4 | [agent-phase4-remaining-tools.md](./agent-phase4-remaining-tools.md) | 编排 / 考核项 / DELETE 等剩余 JSON REST |
| 5 | [agent-phase5-relay-polish.md](./agent-phase5-relay-polish.md) | relay 大屏、上传、checkpointer 与审计 |

## 17. 阶段 3 完成标准

- [ ] `pages/assistant/assistant.vue` + `services/agentChat.js`
- [ ] 个人中心（及可选首页）入口；未登录跳转登录页
- [ ] `POST /chat` 查询与写入确认与 Web 行为一致（不用 SSE）

## 18. 阶段 4 完成标准

- [ ] 计划项目 create / associate / 编排；考核项 CRUD；成绩 retry / restart
- [ ] DELETE tools + 加粗确认；取消不打 admin-api
- [ ] 考试路径仍只走 BYPASS

## 19. 阶段 5 完成标准

- [ ] Agent 代发 relay 训练/考试命令（未确认不发 WS）
- [ ] multipart：计划资料上传、`exam-score/submit-video`（不直连算法 IP）
- [ ] 持久化 checkpointer + 确认操作审计
