---
title: 默认模块
language_tabs:
  - shell: Shell
  - http: HTTP
  - javascript: JavaScript
  - ruby: Ruby
  - python: Python
  - php: PHP
  - java: Java
  - go: Go
toc_footers: []
includes: []
search: true
code_clipboard: true
highlight_theme: darkula
headingLevel: 2
generator: "@tarslib/widdershins v4.0.30"

---

# 默认模块

Base URLs:

* <a href="10.112.189.54:48080/admin-api">本地后台端请求: 10.112.189.54:48080/admin-api</a>

* <a href="10.101.166.129:8000">动作分析: 10.101.166.129:8000</a>

# Authentication

- HTTP Authentication, scheme: bearer

# 管理后台 - 班级学生管理

## GET 根据班级/名册 ID 获取学生列表（teaching_class_student.class_id，通常等于课程 id）

GET /teaching/class-student/list-by-class

根据班级/名册 ID 获取学生列表（teaching_class_student.class_id，通常等于课程 id）

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|classId|query|integer| 是 |名册班级 ID|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "id": 0,
      "userId": 0,
      "classId": 0,
      "courseName": "",
      "teacherName": "",
      "studentNo": "",
      "studentName": "",
      "gender": "",
      "mobile": "",
      "enrollTime": "",
      "createTime": ""
    }
  ]
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "id": 0,
      "userId": 0,
      "classId": 0,
      "courseName": "",
      "teacherName": "",
      "studentNo": "",
      "studentName": "",
      "gender": "",
      "mobile": "",
      "enrollTime": "",
      "createTime": ""
    }
  ]
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[CommonResultListClassStudentRespVO](#schemacommonresultlistclassstudentrespvo)|

# 管理后台 - 课程管理

## GET 获得教师下的全部课程

GET /teaching/course/list-by-teacher

获得教师下的全部课程

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|teacherId|query|integer| 是 |教师用户编号（system_users.id）|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "id": 0,
      "name": "",
      "teacherId": 0,
      "teacherName": "",
      "semester": "",
      "courseTime": "",
      "courseClass": "",
      "description": "",
      "attendanceWeight": 0,
      "examWeight": 0,
      "createTime": ""
    }
  ]
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "id": 0,
      "name": "",
      "teacherId": 0,
      "teacherName": "",
      "semester": "",
      "courseTime": "",
      "courseClass": "",
      "description": "",
      "attendanceWeight": 0,
      "examWeight": 0,
      "createTime": ""
    }
  ]
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[CommonResultListCourseRespVO](#schemacommonresultlistcourserespvo)|

## GET 获得课程下的班级/名册列表（classId 与 /teaching/class-student/list-by-class 参数一致）

GET /teaching/course/list-classes

获得课程下的班级/名册列表（classId 与 /teaching/class-student/list-by-class 参数一致）

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|courseId|query|integer| 是 |课程编号|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "courseId": 0,
      "classId": 0,
      "className": "",
      "studentCount": 0
    }
  ]
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "courseId": 0,
      "classId": 0,
      "className": "",
      "studentCount": 0
    }
  ]
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[CommonResultListCourseClassRespVO](#schemacommonresultlistcourseclassrespvo)|

## GET 获得课程下的全部课堂（与 /teaching/lesson/list-by-course 等价）

GET /teaching/course/list-lessons

获得课程下的全部课堂（与 /teaching/lesson/list-by-course 等价）

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|courseId|query|integer| 是 |课程编号|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "id": 0,
      "courseId": 0,
      "courseName": "",
      "teacherName": "",
      "weekIndex": 0,
      "startTime": "",
      "endTime": "",
      "type": 0,
      "typeText": "",
      "status": 0,
      "statusText": "",
      "createTime": ""
    }
  ]
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "id": 0,
      "courseId": 0,
      "courseName": "",
      "teacherName": "",
      "weekIndex": 0,
      "startTime": "",
      "endTime": "",
      "type": 0,
      "typeText": "",
      "status": 0,
      "statusText": "",
      "createTime": ""
    }
  ]
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[CommonResultListLessonRespVO](#schemacommonresultlistlessonrespvo)|

# 管理后台 - 认证

## POST 使用账号密码登录

POST /system/auth/login

使用账号密码登录

> Body 请求参数

```json
{
    "username": "teach",
    "password": "123456"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|Tenant-Id|header|string| 是 |none|
|body|body|[AuthLoginReqVO](#schemaauthloginreqvo)| 否 |none|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "userId": 0,
    "accessToken": "",
    "refreshToken": "",
    "expiresTime": ""
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[CommonResultAuthLoginRespVO](#schemacommonresultauthloginrespvo)|

## POST 教师注册

POST /system/auth/teacher-register

教师注册
教师直接注册，自动分配教师角色并登录

> Body 请求参数

```json
{
  "username": "teacher001",
  "nickname": "张老师",
  "mobile": "13800138000",
  "password": "123456"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|Tenant-Id|header|string| 是 |none|
|body|body|[AuthTeacherRegisterReqVO](#schemaauthteacherregisterreqvo)| 否 |none|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "userId": 0,
    "accessToken": "",
    "refreshToken": "",
    "expiresTime": ""
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[CommonResultAuthLoginRespVO](#schemacommonresultauthloginrespvo)|

# 管理后台 - 教学计划管理

> **与移动端对齐的约定（教师维度 / 复用）**  
> - 列表：`GET /teaching/plan/list-by-teacher?teacherId=` 拉取教师名下全部计划；进入课堂选计划时用此列表（不再仅用 `list-by-lesson` 作为候选源）。  
> - 新建：`POST /teaching/plan/create` 允许 **不传或置空 `courseId`、`lessonId`**；`teacherId` 与小程序登录用户 `userInfo.id` 一致。  
> - **课堂与计划绑定**：在课堂中选定计划后调用 **`PUT /teaching/plan/update`**，在 body 中带计划 `id` 与当前 **`lessonId`**（及需要的 **`courseId`**）；后端以**关联表**支持一计划多课堂。  
> - **`POST /teaching/plan/create` 与 `POST /teaching/plan-project/create` 成功时 `data` 均为 Long（新 id）**，不返回完整 VO。  
> - 项目：`GET /teaching/plan-project/list-by-teacher` 为教师项目库；计划内顺序通过多次 **`PUT /teaching/plan-project/update`** 更新各项目的 **`sortOrder`**。  
> - 资料：业务上资料随 **训练项目 item** 全局一致；接口仍要求 `planId` 与 `itemId` 同时传入时，移动端可传当前教学上下文的 `planId` 以兼容校验。

## POST 创建教学计划

POST /teaching/plan/create

创建教学计划

> Body 请求参数

```json
{
    "courseId": 1,
    "lessonId": 1,
    "planTitle": "第3周正手高远球训练",
    "planContent": "tempor",
    "startTime": "2004-01-06 13:57:37",
    "endTime": "1979-11-11 04:30:32",
    "duration": 90,
    "planType": 1,
    "difficulty": 2,
    "status": 0,
    "teacherId": 1024,
    "teacherName": "张老师"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|[PlanSaveReqVO](#schemaplansavereqvo)| 否 |none|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": 0
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": 0
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[CommonResultLong](#schemacommonresultlong)|

## PUT 修改教学计划

PUT /teaching/plan/update

修改教学计划

> Body 请求参数

```json
{
  "id": 1,
  "courseId": 1,
  "lessonId": 1,
  "planTitle": "第3周正手高远球训练",
  "planContent": "string",
  "startTime": "string",
  "endTime": "string",
  "duration": 90,
  "planType": 1,
  "difficulty": 2,
  "status": 0,
  "teacherId": 1024,
  "teacherName": "张老师"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|[PlanSaveReqVO](#schemaplansavereqvo)| 否 |none|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": false
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": false
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": false
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": false
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": false
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[CommonResultBoolean](#schemacommonresultboolean)|

## DELETE 删除教学计划

DELETE /teaching/plan/delete

删除教学计划

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|query|integer| 是 |教学计划编号|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": false
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": false
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": false
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": false
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": false
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[CommonResultBoolean](#schemacommonresultboolean)|

## GET 获得教学计划详情

GET /teaching/plan/get

获得教学计划详情

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|query|integer| 是 |教学计划编号|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "id": 0,
    "courseId": 0,
    "lessonId": 0,
    "planTitle": "",
    "planContent": "",
    "startTime": "",
    "endTime": "",
    "duration": 0,
    "planType": 0,
    "planTypeText": "",
    "difficulty": 0,
    "difficultyText": "",
    "status": 0,
    "statusText": "",
    "teacherId": 0,
    "teacherName": "",
    "createTime": "",
    "updateTime": ""
  }
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "id": 0,
    "courseId": 0,
    "lessonId": 0,
    "planTitle": "",
    "planContent": "",
    "startTime": "",
    "endTime": "",
    "duration": 0,
    "planType": 0,
    "planTypeText": "",
    "difficulty": 0,
    "difficultyText": "",
    "status": 0,
    "statusText": "",
    "teacherId": 0,
    "teacherName": "",
    "createTime": "",
    "updateTime": ""
  }
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "id": 0,
    "courseId": 0,
    "lessonId": 0,
    "planTitle": "",
    "planContent": "",
    "startTime": "",
    "endTime": "",
    "duration": 0,
    "planType": 0,
    "planTypeText": "",
    "difficulty": 0,
    "difficultyText": "",
    "status": 0,
    "statusText": "",
    "teacherId": 0,
    "teacherName": "",
    "createTime": "",
    "updateTime": ""
  }
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "id": 0,
    "courseId": 0,
    "lessonId": 0,
    "planTitle": "",
    "planContent": "",
    "startTime": "",
    "endTime": "",
    "duration": 0,
    "planType": 0,
    "planTypeText": "",
    "difficulty": 0,
    "difficultyText": "",
    "status": 0,
    "statusText": "",
    "teacherId": 0,
    "teacherName": "",
    "createTime": "",
    "updateTime": ""
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[CommonResultPlanRespVO](#schemacommonresultplanrespvo)|

## GET 获得指定课堂下的教学计划列表

GET /teaching/plan/list-by-lesson

获得指定课堂下的教学计划列表

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|lessonId|query|integer| 是 |课堂编号|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "id": 0,
      "courseId": 0,
      "lessonId": 0,
      "planTitle": "",
      "planContent": "",
      "startTime": "",
      "endTime": "",
      "duration": 0,
      "planType": 0,
      "planTypeText": "",
      "difficulty": 0,
      "difficultyText": "",
      "status": 0,
      "statusText": "",
      "teacherId": 0,
      "teacherName": "",
      "createTime": "",
      "updateTime": ""
    }
  ]
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "id": 0,
      "courseId": 0,
      "lessonId": 0,
      "planTitle": "",
      "planContent": "",
      "startTime": "",
      "endTime": "",
      "duration": 0,
      "planType": 0,
      "planTypeText": "",
      "difficulty": 0,
      "difficultyText": "",
      "status": 0,
      "statusText": "",
      "teacherId": 0,
      "teacherName": "",
      "createTime": "",
      "updateTime": ""
    }
  ]
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "id": 0,
      "courseId": 0,
      "lessonId": 0,
      "planTitle": "",
      "planContent": "",
      "startTime": "",
      "endTime": "",
      "duration": 0,
      "planType": 0,
      "planTypeText": "",
      "difficulty": 0,
      "difficultyText": "",
      "status": 0,
      "statusText": "",
      "teacherId": 0,
      "teacherName": "",
      "createTime": "",
      "updateTime": ""
    }
  ]
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "id": 0,
      "courseId": 0,
      "lessonId": 0,
      "planTitle": "",
      "planContent": "",
      "startTime": "",
      "endTime": "",
      "duration": 0,
      "planType": 0,
      "planTypeText": "",
      "difficulty": 0,
      "difficultyText": "",
      "status": 0,
      "statusText": "",
      "teacherId": 0,
      "teacherName": "",
      "createTime": "",
      "updateTime": ""
    }
  ]
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[CommonResultListPlanRespVO](#schemacommonresultlistplanrespvo)|

## GET 获得指定教师下的教学计划列表

GET /teaching/plan/list-by-teacher

获得指定教师下的教学计划列表

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|teacherId|query|integer| 是 |教师编号|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "id": 0,
      "courseId": 0,
      "lessonId": 0,
      "planTitle": "",
      "planContent": "",
      "startTime": "",
      "endTime": "",
      "duration": 0,
      "planType": 0,
      "planTypeText": "",
      "difficulty": 0,
      "difficultyText": "",
      "status": 0,
      "statusText": "",
      "teacherId": 0,
      "teacherName": "",
      "createTime": "",
      "updateTime": ""
    }
  ]
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[CommonResultListPlanRespVO](#schemacommonresultlistplanrespvo)|

# 管理后台 - 教学计划项目

## POST 创建项目

POST /teaching/plan-project/create

创建项目

> Body 请求参数

```json
{
    "planId": 1,
    "itemName": "正手高远球",
    "itemContent": "laborum adipisicing pariatur ut",
    "itemType": 1,
    "difficulty": 2,
    "duration": 20,
    "score": 100,
    "sortOrder": 1
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|[PlanProjectSaveReqVO](#schemaplanprojectsavereqvo)| 否 |none|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": 0
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": 0
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": 0
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[CommonResultLong](#schemacommonresultlong)|

## PUT 修改项目

PUT /teaching/plan-project/update

修改项目

> Body 请求参数

```json
{
  "id": 1,
  "planId": 1,
  "teacherId": 1024,
  "itemName": "正手高远球",
  "itemContent": "string",
  "itemType": 1,
  "difficulty": 2,
  "duration": 20,
  "score": 100,
  "sortOrder": 1
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|[PlanProjectSaveReqVO](#schemaplanprojectsavereqvo)| 否 |none|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": false
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": false
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": false
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[CommonResultBoolean](#schemacommonresultboolean)|

## DELETE 删除项目

DELETE /teaching/plan-project/delete

删除项目

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|query|integer| 是 |项目ID|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": false
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": false
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": false
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[CommonResultBoolean](#schemacommonresultboolean)|

## GET 获得项目详情

GET /teaching/plan-project/get

获得项目详情

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|query|integer| 是 |项目ID|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "id": 0,
    "projectName": "",
    "planId": 0,
    "durationMinutes": 0,
    "classId": 0,
    "venueId": 0,
    "trainState": 0,
    "trainProjectOrder": 0,
    "createTime": "",
    "updateTime": ""
  }
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "id": 0,
    "planId": 0,
    "itemName": "",
    "itemContent": "",
    "itemType": 0,
    "difficulty": 0,
    "duration": 0,
    "score": 0,
    "sortOrder": 0,
    "createTime": "",
    "updateTime": ""
  }
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "id": 0,
    "planId": 0,
    "teacherId": 0,
    "itemName": "",
    "itemContent": "",
    "itemType": 0,
    "difficulty": 0,
    "duration": 0,
    "score": 0,
    "sortOrder": 0,
    "createTime": "",
    "updateTime": ""
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[CommonResultPlanProjectRespVO](#schemacommonresultplanprojectrespvo)|

## GET 获得指定教学计划下的项目列表

GET /teaching/plan-project/list-by-plan

获得指定教学计划下的项目列表

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|planId|query|integer| 是 |教学计划ID|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "id": 0,
      "projectName": "",
      "planId": 0,
      "durationMinutes": 0,
      "classId": 0,
      "venueId": 0,
      "trainState": 0,
      "trainProjectOrder": 0,
      "createTime": "",
      "updateTime": ""
    }
  ]
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "id": 0,
      "planId": 0,
      "itemName": "",
      "itemContent": "",
      "itemType": 0,
      "difficulty": 0,
      "duration": 0,
      "score": 0,
      "sortOrder": 0,
      "createTime": "",
      "updateTime": ""
    }
  ]
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "id": 0,
      "planId": 0,
      "teacherId": 0,
      "itemName": "",
      "itemContent": "",
      "itemType": 0,
      "difficulty": 0,
      "duration": 0,
      "score": 0,
      "sortOrder": 0,
      "createTime": "",
      "updateTime": ""
    }
  ]
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[CommonResultListPlanProjectRespVO](#schemacommonresultlistplanprojectrespvo)|

## GET 获得指定教师下的项目列表

GET /teaching/plan-project/list-by-teacher

获得指定教师下的项目列表

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|teacherId|query|integer| 是 |教师编号|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "id": 0,
      "planId": 0,
      "teacherId": 0,
      "itemName": "",
      "itemContent": "",
      "itemType": 0,
      "difficulty": 0,
      "duration": 0,
      "score": 0,
      "sortOrder": 0,
      "createTime": "",
      "updateTime": ""
    }
  ]
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[CommonResultListPlanProjectRespVO](#schemacommonresultlistplanprojectrespvo)|

# 管理后台 - 教学项目资料

## POST 创建教学项目资料（填写图片/视频 URL）

POST /teaching/plan-material/create

创建教学计划资料（填写图片/视频 URL）

> Body 请求参数

```json
{
  "id": 1,
  "planId": 1,
  "itemId": 1,
  "materialType": 1,
  "imageUrl": "https://example.com/a.png",
  "videoUrl": "https://example.com/a.mp4",
  "duration": 120,
  "title": "动作示范图",
  "description": "string",
  "sortOrder": 0
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|[PlanMaterialSaveReqVO](#schemaplanmaterialsavereqvo)| 否 |none|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": 0
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": 0
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": 0
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": 0
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": 0
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[CommonResultLong](#schemacommonresultlong)|

## POST 创建项目资料

POST /teaching/plan-material/upload

上传文件并创建教学计划资料

> Body 请求参数

```yaml
file: string

```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|planId|query|integer| 是 |训练计划id|
|materialType|query|integer| 是 |1：图片，2：视频|
|title|query|string| 否 |资料标题|
|description|query|string| 否 |资料描述|
|sortOrder|query|integer| 否 |（可以先不管）|
|duration|query|integer| 否 |（可以先不管）|
|itemId|query|integer| 是 |项目id|
|body|body|object| 否 |none|
|» file|body|string(binary)| 是 |图片或视频|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": 0
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": 0
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": 0
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": 0
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": 0
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[CommonResultLong](#schemacommonresultlong)|

## PUT 修改教学项目资料

PUT /teaching/plan-material/update

修改教学计划资料

> Body 请求参数

```json
{
  "id": 1,
  "planId": 1,
  "itemId": 1,
  "materialType": 1,
  "imageUrl": "https://example.com/a.png",
  "videoUrl": "https://example.com/a.mp4",
  "duration": 120,
  "title": "动作示范图",
  "description": "string",
  "sortOrder": 0
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|[PlanMaterialSaveReqVO](#schemaplanmaterialsavereqvo)| 否 |none|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": false
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": false
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": false
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": false
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": false
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[CommonResultBoolean](#schemacommonresultboolean)|

## GET 获取资料详细信息

GET /teaching/plan-material/get

获得教学计划资料详情

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|query|integer| 是 |资料id|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "id": 0,
    "planId": 0,
    "materialType": 0,
    "materialTypeText": "",
    "imageUrl": "",
    "videoUrl": "",
    "duration": 0,
    "title": "",
    "description": "",
    "sortOrder": 0,
    "createTime": "",
    "updateTime": ""
  }
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "id": 0,
    "planId": 0,
    "projectId": 0,
    "materialType": 0,
    "materialTypeText": "",
    "imageUrl": "",
    "videoUrl": "",
    "duration": 0,
    "title": "",
    "description": "",
    "sortOrder": 0,
    "createTime": "",
    "updateTime": ""
  }
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "id": 0,
    "planId": 0,
    "projectId": 0,
    "materialType": 0,
    "materialTypeText": "",
    "imageUrl": "",
    "videoUrl": "",
    "duration": 0,
    "title": "",
    "description": "",
    "sortOrder": 0,
    "createTime": "",
    "updateTime": ""
  }
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "id": 0,
    "planId": 0,
    "itemId": 0,
    "materialType": 0,
    "materialTypeText": "",
    "imageUrl": "",
    "videoUrl": "",
    "duration": 0,
    "title": "",
    "description": "",
    "sortOrder": 0,
    "createTime": "",
    "updateTime": ""
  }
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "id": 0,
    "planId": 0,
    "itemId": 0,
    "materialType": 0,
    "materialTypeText": "",
    "imageUrl": "",
    "videoUrl": "",
    "duration": 0,
    "title": "",
    "description": "",
    "sortOrder": 0,
    "createTime": "",
    "updateTime": ""
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[CommonResultPlanMaterialRespVO](#schemacommonresultplanmaterialrespvo)|

## GET 获得教学计划下所有资料

GET /teaching/plan-material/list-by-plan

获得某教学计划下的资料列表

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|planId|query|integer| 是 |教学计划编号|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "id": 0,
      "planId": 0,
      "materialType": 0,
      "materialTypeText": "",
      "imageUrl": "",
      "videoUrl": "",
      "duration": 0,
      "title": "",
      "description": "",
      "sortOrder": 0,
      "createTime": "",
      "updateTime": ""
    }
  ]
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "id": 0,
      "planId": 0,
      "projectId": 0,
      "materialType": 0,
      "materialTypeText": "",
      "imageUrl": "",
      "videoUrl": "",
      "duration": 0,
      "title": "",
      "description": "",
      "sortOrder": 0,
      "createTime": "",
      "updateTime": ""
    }
  ]
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "id": 0,
      "planId": 0,
      "projectId": 0,
      "materialType": 0,
      "materialTypeText": "",
      "imageUrl": "",
      "videoUrl": "",
      "duration": 0,
      "title": "",
      "description": "",
      "sortOrder": 0,
      "createTime": "",
      "updateTime": ""
    }
  ]
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "id": 0,
      "planId": 0,
      "itemId": 0,
      "materialType": 0,
      "materialTypeText": "",
      "imageUrl": "",
      "videoUrl": "",
      "duration": 0,
      "title": "",
      "description": "",
      "sortOrder": 0,
      "createTime": "",
      "updateTime": ""
    }
  ]
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "id": 0,
      "planId": 0,
      "itemId": 0,
      "materialType": 0,
      "materialTypeText": "",
      "imageUrl": "",
      "videoUrl": "",
      "duration": 0,
      "title": "",
      "description": "",
      "sortOrder": 0,
      "createTime": "",
      "updateTime": ""
    }
  ]
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[CommonResultListPlanMaterialRespVO](#schemacommonresultlistplanmaterialrespvo)|

# 管理后台 - 场地学员管理

## POST 场地导入学生

POST /venue-student/import_by_teaching_students

按teaching_student id批量导入到venue_student

> Body 请求参数

```json
{
    "venueId": 79,
    "courseId": 23,
    "teachingStudentIds": [
        49
    ]
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|[VenueStudentImportVO](#schemavenuestudentimportvo)| 否 |none|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "id": 0,
      "studentId": 0,
      "classId": 0,
      "venueId": 0,
      "trainOrder": 0,
      "createTime": "",
      "updateTime": ""
    }
  ]
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "id": 0,
      "studentId": 0,
      "courseId": 0,
      "venueId": 0,
      "trainOrder": 0,
      "createTime": "",
      "updateTime": ""
    }
  ]
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[CommonResultListVenueStudentEntity](#schemacommonresultlistvenuestudententity)|

## GET 获取场地学生

GET /venue-student/get_by_course_and_id

按id/courseId/studentId/venueId任意组合获取venue_student

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|query|integer| 否 |none|
|courseId|query|integer| 否 |none|
|studentId|query|integer| 否 |none|
|venueId|query|integer| 否 |none|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "id": 0,
      "studentId": 0,
      "classId": 0,
      "venueId": 0,
      "trainOrder": 0,
      "createTime": "",
      "updateTime": ""
    }
  ]
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "id": 0,
      "studentId": 0,
      "courseId": 0,
      "venueId": 0,
      "trainOrder": 0,
      "createTime": "",
      "updateTime": ""
    }
  ]
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[CommonResultListVenueStudentEntity](#schemacommonresultlistvenuestudententity)|

## DELETE 删除场地学生

DELETE /venue-student/delete_by_course_and_id

按id删除venue_student

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|query|integer| 是 |none|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": false
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": false
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[CommonResultBoolean](#schemacommonresultboolean)|

## PATCH 修改场地学生

PATCH /venue-student/update_by_course_and_id

按course_id和id修改venue_student

> Body 请求参数

```json
{
  "courseId": 0,
  "id": 0,
  "venueId": 0,
  "trainOrder": 0
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|[VenueStudentUpdateVO](#schemavenuestudentupdatevo)| 否 |none|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": false
}
```

```json
{
  "code": 0,
  "msg": "",
  "data": false
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[CommonResultBoolean](#schemacommonresultboolean)|

# 动作分析算法

## POST 上传视频并自动完成分析

POST /api/v1/forehand-clear/analyze-video

> Body 请求参数

```yaml
file: ""

```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|object| 是 |none|
|» file|body|string(binary)| 否 |none|

> 返回示例

> 200 Response

```json
{}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

## GET 查询任务结果

GET /api/v1/forehand-clear/results/{request_id}

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|request_id|path|string| 是 |none|

> 返回示例

> 200 Response

```json
{}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

# 数据模型

<h2 id="tocS_CommonResultLong">CommonResultLong</h2>

<a id="schemacommonresultlong"></a>
<a id="schema_CommonResultLong"></a>
<a id="tocScommonresultlong"></a>
<a id="tocscommonresultlong"></a>

```json
{
  "code": 0,
  "msg": "string",
  "data": 0
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|code|integer|false|none||错误码|
|msg|string|false|none||错误提示，用户可阅读|
|data|integer(int64)|false|none||返回数据|

<h2 id="tocS_VenueStudentEntity">VenueStudentEntity</h2>

<a id="schemavenuestudententity"></a>
<a id="schema_VenueStudentEntity"></a>
<a id="tocSvenuestudententity"></a>
<a id="tocsvenuestudententity"></a>

```json
{
  "id": 0,
  "studentId": 0,
  "courseId": 0,
  "venueId": 0,
  "trainOrder": 0,
  "createTime": "string",
  "updateTime": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|id|integer(int64)|false|none||none|
|studentId|integer(int64)|false|none||学员id|
|courseId|integer(int64)|false|none||课程id|
|venueId|integer(int64)|false|none||场地id|
|trainOrder|integer(int64)|false|none||训练出场顺序|
|createTime|string|false|none||创建时间|
|updateTime|string|false|none||更新时间|

<h2 id="tocS_PlanSaveReqVO">PlanSaveReqVO</h2>

<a id="schemaplansavereqvo"></a>
<a id="schema_PlanSaveReqVO"></a>
<a id="tocSplansavereqvo"></a>
<a id="tocsplansavereqvo"></a>

```json
{
  "id": 1,
  "courseId": 1,
  "lessonId": 1,
  "planTitle": "第3周正手高远球训练",
  "planContent": "string",
  "startTime": "string",
  "endTime": "string",
  "duration": 90,
  "planType": 1,
  "difficulty": 2,
  "status": 0,
  "teacherId": 1024,
  "teacherName": "张老师"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|id|integer(int64)|false|none||教学计划编号|
|courseId|integer(int64)|false|none||课程编号|
|lessonId|integer(int64)|false|none||课堂编号|
|planTitle|string|true|none||教学计划标题|
|planContent|string|false|none||教学计划内容/要求|
|startTime|string|false|none||开始时间|
|endTime|string|false|none||结束时间|
|duration|integer|false|none||时长（分钟）|
|planType|integer|false|none||计划类型（1-常规 2-专项 3-测试）|
|difficulty|integer|false|none||难度（1-简单 2-中等 3-困难）|
|status|integer|true|none||状态（0-未开始 1-进行中 2-已完成 3-已取消）|
|teacherId|integer(int64)|true|none||教师编号|
|teacherName|string|false|none||教师姓名|

<h2 id="tocS_PlanMaterialSaveReqVO">PlanMaterialSaveReqVO</h2>

<a id="schemaplanmaterialsavereqvo"></a>
<a id="schema_PlanMaterialSaveReqVO"></a>
<a id="tocSplanmaterialsavereqvo"></a>
<a id="tocsplanmaterialsavereqvo"></a>

```json
{
  "id": 1,
  "planId": 1,
  "itemId": 1,
  "materialType": 1,
  "imageUrl": "https://example.com/a.png",
  "videoUrl": "https://example.com/a.mp4",
  "duration": 120,
  "title": "动作示范图",
  "description": "string",
  "sortOrder": 0
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|id|integer(int64)|false|none||资料编号（修改时必填）|
|planId|integer(int64)|true|none||教学计划编号|
|itemId|integer(int64)|true|none||项目编号|
|materialType|integer|true|none||资料类型：1-图片 2-视频|
|imageUrl|string|false|none||图片地址（类型为图片时必填）|
|videoUrl|string|false|none||视频地址（类型为视频时必填）|
|duration|integer|false|none||视频时长（秒）|
|title|string|false|none||资料标题|
|description|string|false|none||说明文字|
|sortOrder|integer|false|none||排序序号|

<h2 id="tocS_PlanProjectSaveReqVO">PlanProjectSaveReqVO</h2>

<a id="schemaplanprojectsavereqvo"></a>
<a id="schema_PlanProjectSaveReqVO"></a>
<a id="tocSplanprojectsavereqvo"></a>
<a id="tocsplanprojectsavereqvo"></a>

```json
{
  "id": 1,
  "planId": 1,
  "teacherId": 1024,
  "itemName": "正手高远球",
  "itemContent": "string",
  "itemType": 1,
  "difficulty": 2,
  "duration": 20,
  "score": 100,
  "sortOrder": 1
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|id|integer(int64)|false|none||项目ID（修改时必填）|
|planId|integer(int64)|false|none||教学计划ID|
|teacherId|integer(int64)|true|none||教师编号|
|itemName|string|true|none||训练项目名称|
|itemContent|string|false|none||训练项目内容/要求|
|itemType|integer|false|none||项目类型 1-基础训练 2-强化训练 3-考核项目|
|difficulty|integer|false|none||难度 1-简单 2-中等 3-困难|
|duration|integer|false|none||训练时长（分钟）|
|score|integer|false|none||标准分值/满分|
|sortOrder|integer|false|none||排序号|

<h2 id="tocS_CommonResultListVenueStudentEntity">CommonResultListVenueStudentEntity</h2>

<a id="schemacommonresultlistvenuestudententity"></a>
<a id="schema_CommonResultListVenueStudentEntity"></a>
<a id="tocScommonresultlistvenuestudententity"></a>
<a id="tocscommonresultlistvenuestudententity"></a>

```json
{
  "code": 0,
  "msg": "string",
  "data": [
    {
      "id": 0,
      "studentId": 0,
      "courseId": 0,
      "venueId": 0,
      "trainOrder": 0,
      "createTime": "string",
      "updateTime": "string"
    }
  ]
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|code|integer|false|none||错误码|
|msg|string|false|none||错误提示，用户可阅读|
|data|[[VenueStudentEntity](#schemavenuestudententity)]|false|none||返回数据|

<h2 id="tocS_CommonResultBoolean">CommonResultBoolean</h2>

<a id="schemacommonresultboolean"></a>
<a id="schema_CommonResultBoolean"></a>
<a id="tocScommonresultboolean"></a>
<a id="tocscommonresultboolean"></a>

```json
{
  "code": 0,
  "msg": "string",
  "data": true
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|code|integer|false|none||错误码|
|msg|string|false|none||错误提示，用户可阅读|
|data|boolean|false|none||返回数据|

<h2 id="tocS_VenueStudentImportVO">VenueStudentImportVO</h2>

<a id="schemavenuestudentimportvo"></a>
<a id="schema_VenueStudentImportVO"></a>
<a id="tocSvenuestudentimportvo"></a>
<a id="tocsvenuestudentimportvo"></a>

```json
{
  "venueId": 0,
  "courseId": 0,
  "teachingStudentIds": [
    0
  ]
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|venueId|integer(int64)|false|none||场地id|
|courseId|integer(int64)|false|none||课程id（映射为class_id）|
|teachingStudentIds|[integer]|false|none||teaching_student id列表（当前系统对应training_student.id）|

<h2 id="tocS_PlanRespVO">PlanRespVO</h2>

<a id="schemaplanrespvo"></a>
<a id="schema_PlanRespVO"></a>
<a id="tocSplanrespvo"></a>
<a id="tocsplanrespvo"></a>

```json
{
  "id": 1,
  "courseId": 1,
  "lessonId": 1,
  "planTitle": "第3周正手高远球训练",
  "planContent": "string",
  "startTime": "string",
  "endTime": "string",
  "duration": 90,
  "planType": 1,
  "planTypeText": "常规",
  "difficulty": 2,
  "difficultyText": "中等",
  "status": 0,
  "statusText": "未开始",
  "teacherId": 1024,
  "teacherName": "张老师",
  "createTime": "string",
  "updateTime": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|id|integer(int64)|false|none||教学计划编号|
|courseId|integer(int64)|false|none||课程编号|
|lessonId|integer(int64)|false|none||课堂编号|
|planTitle|string|false|none||教学计划标题|
|planContent|string|false|none||教学计划内容/要求|
|startTime|string|false|none||开始时间|
|endTime|string|false|none||结束时间|
|duration|integer|false|none||时长（分钟）|
|planType|integer|false|none||计划类型（1-常规 2-专项 3-测试）|
|planTypeText|string|false|none||计划类型文本|
|difficulty|integer|false|none||难度（1-简单 2-中等 3-困难）|
|difficultyText|string|false|none||难度文本|
|status|integer|false|none||状态（0-未开始 1-进行中 2-已完成 3-已取消）|
|statusText|string|false|none||状态文本|
|teacherId|integer(int64)|false|none||教师编号|
|teacherName|string|false|none||教师姓名|
|createTime|string|false|none||创建时间|
|updateTime|string|false|none||更新时间|

<h2 id="tocS_PlanMaterialRespVO">PlanMaterialRespVO</h2>

<a id="schemaplanmaterialrespvo"></a>
<a id="schema_PlanMaterialRespVO"></a>
<a id="tocSplanmaterialrespvo"></a>
<a id="tocsplanmaterialrespvo"></a>

```json
{
  "id": 1,
  "planId": 1,
  "itemId": 1,
  "materialType": 1,
  "materialTypeText": "图片",
  "imageUrl": "string",
  "videoUrl": "string",
  "duration": 0,
  "title": "string",
  "description": "string",
  "sortOrder": 0,
  "createTime": "string",
  "updateTime": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|id|integer(int64)|false|none||资料编号|
|planId|integer(int64)|false|none||教学计划编号|
|itemId|integer(int64)|false|none||项目编号|
|materialType|integer|false|none||资料类型：1-图片 2-视频|
|materialTypeText|string|false|none||资料类型文本|
|imageUrl|string|false|none||图片地址|
|videoUrl|string|false|none||视频地址|
|duration|integer|false|none||视频时长（秒）|
|title|string|false|none||资料标题|
|description|string|false|none||说明文字|
|sortOrder|integer|false|none||排序序号|
|createTime|string|false|none||创建时间|
|updateTime|string|false|none||更新时间|

<h2 id="tocS_PlanProjectRespVO">PlanProjectRespVO</h2>

<a id="schemaplanprojectrespvo"></a>
<a id="schema_PlanProjectRespVO"></a>
<a id="tocSplanprojectrespvo"></a>
<a id="tocsplanprojectrespvo"></a>

```json
{
  "id": 1,
  "planId": 1,
  "teacherId": 1024,
  "itemName": "正手高远球",
  "itemContent": "string",
  "itemType": 1,
  "difficulty": 2,
  "duration": 20,
  "score": 100,
  "sortOrder": 1,
  "createTime": "string",
  "updateTime": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|id|integer(int64)|false|none||项目ID|
|planId|integer(int64)|false|none||教学计划ID|
|teacherId|integer(int64)|false|none||教师编号|
|itemName|string|false|none||训练项目名称|
|itemContent|string|false|none||训练项目内容/要求|
|itemType|integer|false|none||项目类型 1-基础训练 2-强化训练 3-考核项目|
|difficulty|integer|false|none||难度 1-简单 2-中等 3-困难|
|duration|integer|false|none||训练时长（分钟）|
|score|integer|false|none||标准分值/满分|
|sortOrder|integer|false|none||排序号|
|createTime|string|false|none||创建时间|
|updateTime|string|false|none||更新时间|

<h2 id="tocS_CommonResultPlanRespVO">CommonResultPlanRespVO</h2>

<a id="schemacommonresultplanrespvo"></a>
<a id="schema_CommonResultPlanRespVO"></a>
<a id="tocScommonresultplanrespvo"></a>
<a id="tocscommonresultplanrespvo"></a>

```json
{
  "code": 0,
  "msg": "string",
  "data": {
    "id": 1,
    "courseId": 1,
    "lessonId": 1,
    "planTitle": "第3周正手高远球训练",
    "planContent": "string",
    "startTime": "string",
    "endTime": "string",
    "duration": 90,
    "planType": 1,
    "planTypeText": "常规",
    "difficulty": 2,
    "difficultyText": "中等",
    "status": 0,
    "statusText": "未开始",
    "teacherId": 1024,
    "teacherName": "张老师",
    "createTime": "string",
    "updateTime": "string"
  }
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|code|integer|false|none||错误码|
|msg|string|false|none||错误提示，用户可阅读|
|data|[PlanRespVO](#schemaplanrespvo)|false|none||返回数据|

<h2 id="tocS_CommonResultListCourseRespVO">CommonResultListCourseRespVO</h2>

<a id="schemacommonresultlistcourserespvo"></a>
<a id="schema_CommonResultListCourseRespVO"></a>
<a id="tocScommonresultlistcourserespvo"></a>
<a id="tocscommonresultlistcourserespvo"></a>

```json
{
  "code": 0,
  "msg": "string",
  "data": [
    {
      "id": 1,
      "name": "羽毛球初级班",
      "teacherId": 1,
      "teacherName": "张老师",
      "semester": "2025-2026第一学期",
      "courseTime": "周一13:00-14:35",
      "courseClass": "羽毛球1班",
      "description": "本课程主要教授羽毛球基本技能",
      "attendanceWeight": 30,
      "examWeight": 70,
      "createTime": "string"
    }
  ]
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|code|integer|false|none||错误码|
|msg|string|false|none||错误提示，用户可阅读|
|data|[[CourseRespVO](#schemacourserespvo)]|false|none||返回数据|

<h2 id="tocS_CommonResultPlanMaterialRespVO">CommonResultPlanMaterialRespVO</h2>

<a id="schemacommonresultplanmaterialrespvo"></a>
<a id="schema_CommonResultPlanMaterialRespVO"></a>
<a id="tocScommonresultplanmaterialrespvo"></a>
<a id="tocscommonresultplanmaterialrespvo"></a>

```json
{
  "code": 0,
  "msg": "string",
  "data": {
    "id": 1,
    "planId": 1,
    "itemId": 1,
    "materialType": 1,
    "materialTypeText": "图片",
    "imageUrl": "string",
    "videoUrl": "string",
    "duration": 0,
    "title": "string",
    "description": "string",
    "sortOrder": 0,
    "createTime": "string",
    "updateTime": "string"
  }
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|code|integer|false|none||错误码|
|msg|string|false|none||错误提示，用户可阅读|
|data|[PlanMaterialRespVO](#schemaplanmaterialrespvo)|false|none||返回数据|

<h2 id="tocS_CommonResultPlanProjectRespVO">CommonResultPlanProjectRespVO</h2>

<a id="schemacommonresultplanprojectrespvo"></a>
<a id="schema_CommonResultPlanProjectRespVO"></a>
<a id="tocScommonresultplanprojectrespvo"></a>
<a id="tocscommonresultplanprojectrespvo"></a>

```json
{
  "code": 0,
  "msg": "string",
  "data": {
    "id": 1,
    "planId": 1,
    "teacherId": 1024,
    "itemName": "正手高远球",
    "itemContent": "string",
    "itemType": 1,
    "difficulty": 2,
    "duration": 20,
    "score": 100,
    "sortOrder": 1,
    "createTime": "string",
    "updateTime": "string"
  }
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|code|integer|false|none||错误码|
|msg|string|false|none||错误提示，用户可阅读|
|data|[PlanProjectRespVO](#schemaplanprojectrespvo)|false|none||返回数据|

<h2 id="tocS_CommonResultListPlanRespVO">CommonResultListPlanRespVO</h2>

<a id="schemacommonresultlistplanrespvo"></a>
<a id="schema_CommonResultListPlanRespVO"></a>
<a id="tocScommonresultlistplanrespvo"></a>
<a id="tocscommonresultlistplanrespvo"></a>

```json
{
  "code": 0,
  "msg": "string",
  "data": [
    {
      "id": 1,
      "courseId": 1,
      "lessonId": 1,
      "planTitle": "第3周正手高远球训练",
      "planContent": "string",
      "startTime": "string",
      "endTime": "string",
      "duration": 90,
      "planType": 1,
      "planTypeText": "常规",
      "difficulty": 2,
      "difficultyText": "中等",
      "status": 0,
      "statusText": "未开始",
      "teacherId": 1024,
      "teacherName": "张老师",
      "createTime": "string",
      "updateTime": "string"
    }
  ]
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|code|integer|false|none||错误码|
|msg|string|false|none||错误提示，用户可阅读|
|data|[[PlanRespVO](#schemaplanrespvo)]|false|none||返回数据|

<h2 id="tocS_CourseClassRespVO">CourseClassRespVO</h2>

<a id="schemacourseclassrespvo"></a>
<a id="schema_CourseClassRespVO"></a>
<a id="tocScourseclassrespvo"></a>
<a id="tocscourseclassrespvo"></a>

```json
{
  "courseId": 1,
  "classId": 1,
  "className": "羽毛球1班",
  "studentCount": 32
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|courseId|integer(int64)|false|none||课程编号|
|classId|integer(int64)|false|none||名册班级编号（对应 teaching_class_student.class_id，用于查询该班学生）|
|className|string|false|none||班级展示名称（优先课程关联班级名称，否则课程名）|
|studentCount|integer(int64)|false|none||该名册下班级的学生人数|

<h2 id="tocS_CommonResultListPlanMaterialRespVO">CommonResultListPlanMaterialRespVO</h2>

<a id="schemacommonresultlistplanmaterialrespvo"></a>
<a id="schema_CommonResultListPlanMaterialRespVO"></a>
<a id="tocScommonresultlistplanmaterialrespvo"></a>
<a id="tocscommonresultlistplanmaterialrespvo"></a>

```json
{
  "code": 0,
  "msg": "string",
  "data": [
    {
      "id": 1,
      "planId": 1,
      "itemId": 1,
      "materialType": 1,
      "materialTypeText": "图片",
      "imageUrl": "string",
      "videoUrl": "string",
      "duration": 0,
      "title": "string",
      "description": "string",
      "sortOrder": 0,
      "createTime": "string",
      "updateTime": "string"
    }
  ]
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|code|integer|false|none||错误码|
|msg|string|false|none||错误提示，用户可阅读|
|data|[[PlanMaterialRespVO](#schemaplanmaterialrespvo)]|false|none||返回数据|

<h2 id="tocS_CommonResultListPlanProjectRespVO">CommonResultListPlanProjectRespVO</h2>

<a id="schemacommonresultlistplanprojectrespvo"></a>
<a id="schema_CommonResultListPlanProjectRespVO"></a>
<a id="tocScommonresultlistplanprojectrespvo"></a>
<a id="tocscommonresultlistplanprojectrespvo"></a>

```json
{
  "code": 0,
  "msg": "string",
  "data": [
    {
      "id": 1,
      "planId": 1,
      "teacherId": 1024,
      "itemName": "正手高远球",
      "itemContent": "string",
      "itemType": 1,
      "difficulty": 2,
      "duration": 20,
      "score": 100,
      "sortOrder": 1,
      "createTime": "string",
      "updateTime": "string"
    }
  ]
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|code|integer|false|none||错误码|
|msg|string|false|none||错误提示，用户可阅读|
|data|[[PlanProjectRespVO](#schemaplanprojectrespvo)]|false|none||返回数据|

<h2 id="tocS_VenueStudentUpdateVO">VenueStudentUpdateVO</h2>

<a id="schemavenuestudentupdatevo"></a>
<a id="schema_VenueStudentUpdateVO"></a>
<a id="tocSvenuestudentupdatevo"></a>
<a id="tocsvenuestudentupdatevo"></a>

```json
{
  "courseId": 0,
  "id": 0,
  "venueId": 0,
  "trainOrder": 0
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|courseId|integer(int64)|false|none||课程id（映射为class_id）|
|id|integer(int64)|false|none||venue_student主键id|
|venueId|integer(int64)|false|none||新的场地id|
|trainOrder|integer(int64)|false|none||新的训练顺序|

<h2 id="tocS_CommonResultListCourseClassRespVO">CommonResultListCourseClassRespVO</h2>

<a id="schemacommonresultlistcourseclassrespvo"></a>
<a id="schema_CommonResultListCourseClassRespVO"></a>
<a id="tocScommonresultlistcourseclassrespvo"></a>
<a id="tocscommonresultlistcourseclassrespvo"></a>

```json
{
  "code": 0,
  "msg": "string",
  "data": [
    {
      "courseId": 1,
      "classId": 1,
      "className": "羽毛球1班",
      "studentCount": 32
    }
  ]
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|code|integer|false|none||错误码|
|msg|string|false|none||错误提示，用户可阅读|
|data|[[CourseClassRespVO](#schemacourseclassrespvo)]|false|none||返回数据|

<h2 id="tocS_ClassStudentRespVO">ClassStudentRespVO</h2>

<a id="schemaclassstudentrespvo"></a>
<a id="schema_ClassStudentRespVO"></a>
<a id="tocSclassstudentrespvo"></a>
<a id="tocsclassstudentrespvo"></a>

```json
{
  "id": 1,
  "userId": 1,
  "classId": 1,
  "courseName": "羽毛球初级班",
  "teacherName": "张老师",
  "studentNo": "2021001",
  "studentName": "张三",
  "gender": "1",
  "mobile": "13800138000",
  "enrollTime": "string",
  "createTime": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|id|integer(int64)|false|none||关联编号|
|userId|integer(int64)|false|none||用户编号|
|classId|integer(int64)|false|none||班级ID|
|courseName|string|false|none||课程名称|
|teacherName|string|false|none||授课教师|
|studentNo|string|false|none||学号|
|studentName|string|false|none||学生姓名|
|gender|string|false|none||性别|
|mobile|string|false|none||手机号|
|enrollTime|string|false|none||加入时间|
|createTime|string|false|none||创建时间|

<h2 id="tocS_CommonResultListClassStudentRespVO">CommonResultListClassStudentRespVO</h2>

<a id="schemacommonresultlistclassstudentrespvo"></a>
<a id="schema_CommonResultListClassStudentRespVO"></a>
<a id="tocScommonresultlistclassstudentrespvo"></a>
<a id="tocscommonresultlistclassstudentrespvo"></a>

```json
{
  "code": 0,
  "msg": "string",
  "data": [
    {
      "id": 1,
      "userId": 1,
      "classId": 1,
      "courseName": "羽毛球初级班",
      "teacherName": "张老师",
      "studentNo": "2021001",
      "studentName": "张三",
      "gender": "1",
      "mobile": "13800138000",
      "enrollTime": "string",
      "createTime": "string"
    }
  ]
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|code|integer|false|none||错误码|
|msg|string|false|none||错误提示，用户可阅读|
|data|[[ClassStudentRespVO](#schemaclassstudentrespvo)]|false|none||返回数据|

<h2 id="tocS_LessonRespVO">LessonRespVO</h2>

<a id="schemalessonrespvo"></a>
<a id="schema_LessonRespVO"></a>
<a id="tocSlessonrespvo"></a>
<a id="tocslessonrespvo"></a>

```json
{
  "id": 1,
  "courseId": 1,
  "courseName": "羽毛球初级班",
  "teacherName": "张老师",
  "weekIndex": 5,
  "startTime": "string",
  "endTime": "string",
  "type": 1,
  "typeText": "普通课堂",
  "status": 0,
  "statusText": "未开始",
  "createTime": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|id|integer(int64)|false|none||课堂编号|
|courseId|integer(int64)|false|none||课程编号|
|courseName|string|false|none||课程名称|
|teacherName|string|false|none||授课教师|
|weekIndex|integer|false|none||第几周|
|startTime|string|false|none||开始时间|
|endTime|string|false|none||结束时间|
|type|integer|false|none||课堂类型|
|typeText|string|false|none||课堂类型文本|
|status|integer|false|none||课堂状态|
|statusText|string|false|none||课堂状态文本|
|createTime|string|false|none||创建时间|

<h2 id="tocS_CommonResultListLessonRespVO">CommonResultListLessonRespVO</h2>

<a id="schemacommonresultlistlessonrespvo"></a>
<a id="schema_CommonResultListLessonRespVO"></a>
<a id="tocScommonresultlistlessonrespvo"></a>
<a id="tocscommonresultlistlessonrespvo"></a>

```json
{
  "code": 0,
  "msg": "string",
  "data": [
    {
      "id": 1,
      "courseId": 1,
      "courseName": "羽毛球初级班",
      "teacherName": "张老师",
      "weekIndex": 5,
      "startTime": "string",
      "endTime": "string",
      "type": 1,
      "typeText": "普通课堂",
      "status": 0,
      "statusText": "未开始",
      "createTime": "string"
    }
  ]
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|code|integer|false|none||错误码|
|msg|string|false|none||错误提示，用户可阅读|
|data|[[LessonRespVO](#schemalessonrespvo)]|false|none||返回数据|

<h2 id="tocS_CourseRespVO">CourseRespVO</h2>

<a id="schemacourserespvo"></a>
<a id="schema_CourseRespVO"></a>
<a id="tocScourserespvo"></a>
<a id="tocscourserespvo"></a>

```json
{
  "id": 1,
  "name": "羽毛球初级班",
  "teacherId": 1,
  "teacherName": "张老师",
  "semester": "2025-2026第一学期",
  "courseTime": "周一13:00-14:35",
  "courseClass": "羽毛球1班",
  "description": "本课程主要教授羽毛球基本技能",
  "attendanceWeight": 30,
  "examWeight": 70,
  "createTime": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|id|integer(int64)|false|none||课程编号|
|name|string|false|none||课程名称|
|teacherId|integer(int64)|false|none||教师编号|
|teacherName|string|false|none||教师姓名|
|semester|string|false|none||所属学期|
|courseTime|string|false|none||上课时间模板|
|courseClass|string|false|none||关联班级名称|
|description|string|false|none||课程简介|
|attendanceWeight|integer|false|none||考勤权重（占总评成绩的百分比）|
|examWeight|integer|false|none||考试权重（占总评成绩的百分比）|
|createTime|string|false|none||创建时间|

<h2 id="tocS_AuthLoginRespVO">AuthLoginRespVO</h2>

<a id="schemaauthloginrespvo"></a>
<a id="schema_AuthLoginRespVO"></a>
<a id="tocSauthloginrespvo"></a>
<a id="tocsauthloginrespvo"></a>

```json
{
  "userId": 1024,
  "accessToken": "happy",
  "refreshToken": "nice",
  "expiresTime": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|userId|integer(int64)|false|none||用户编号|
|accessToken|string|false|none||访问令牌|
|refreshToken|string|false|none||刷新令牌|
|expiresTime|string|false|none||过期时间|

<h2 id="tocS_CommonResultAuthLoginRespVO">CommonResultAuthLoginRespVO</h2>

<a id="schemacommonresultauthloginrespvo"></a>
<a id="schema_CommonResultAuthLoginRespVO"></a>
<a id="tocScommonresultauthloginrespvo"></a>
<a id="tocscommonresultauthloginrespvo"></a>

```json
{
  "code": 0,
  "msg": "string",
  "data": {
    "userId": 1024,
    "accessToken": "happy",
    "refreshToken": "nice",
    "expiresTime": "string"
  }
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|code|integer|false|none||错误码|
|msg|string|false|none||错误提示，用户可阅读|
|data|[AuthLoginRespVO](#schemaauthloginrespvo)|false|none||返回数据|

<h2 id="tocS_AuthLoginReqVO">AuthLoginReqVO</h2>

<a id="schemaauthloginreqvo"></a>
<a id="schema_AuthLoginReqVO"></a>
<a id="tocSauthloginreqvo"></a>
<a id="tocsauthloginreqvo"></a>

```json
{
  "captchaVerification": "PfcH6mgr8tpXuMWFjvW6YVaqrswIuwmWI5dsVZSg7sGpWtDCUbHuDEXl3cFB1+VvCC/rAkSwK8Fad52FSuncVg==",
  "username": "yudaoyuanma",
  "password": "buzhidao",
  "socialType": 10,
  "socialCode": "1024",
  "socialState": "9b2ffbc1-7425-4155-9894-9d5c08541d62"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|captchaVerification|string|false|none||========== 图片验证码相关 ==========<br />验证码，验证码开启时，需要传递|
|username|string|true|none||账号|
|password|string|true|none||密码|
|socialType|integer|false|none||社交平台的类型，参见 SocialTypeEnum 枚举值|
|socialCode|string|false|none||授权码|
|socialState|string|false|none||state|

<h2 id="tocS_AuthTeacherRegisterReqVO">AuthTeacherRegisterReqVO</h2>

<a id="schemaauthteacherregisterreqvo"></a>
<a id="schema_AuthTeacherRegisterReqVO"></a>
<a id="tocSauthteacherregisterreqvo"></a>
<a id="tocsauthteacherregisterreqvo"></a>

```json
{
  "username": "teacher001",
  "nickname": "张老师",
  "mobile": "13800138000",
  "password": "123456"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|username|string|true|none||用户账号|
|nickname|string|true|none||教师姓名|
|mobile|string|true|none||手机号|
|password|string|true|none||密码|

