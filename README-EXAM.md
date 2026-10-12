# 考试模式旁路后端（yudao-boot-mini）

从 `bandminton-system-basic` 拷出的芋道副本，**不要改现网 48080 进程**。本副本只提供考试 API，与现网共用 MySQL。

详细联调说明见教师端仓库：`badminton-teacher/docs/考试模式旁路后端与联调.md`。

## 要点

- 端口：`48081`（`application-local.yaml`）
- 模块：`yudao-module-exam`（`cn.iocoder.yudao.module.exam`，错误码 `1_220_000_xxx`）
- HTTP 前缀仍为 `/admin-api/teaching/exam*`；Controller 无 `@PreAuthorize`；考试路径 permit-all（含 `/teaching/exam-score/**`）
- DDL：`sql/mysql/teaching_exam.sql`（含 `teaching_exam_score`）
- 资料上传：本地目录 `file-storage/`，不要走 `FileApi` / 七牛示例桶
- 考核视频：`POST /teaching/exam-score/submit-video` 落盘后由旁路转发算法；成功分析后删原片
- 算法：`yudao.exam.algo`（`application-local.yaml`），小程序禁止直连 `10.101.166.129`
- 启动：`mvn -pl yudao-server -am package -DskipTests`，再  
  `java -Xms128m -Xmx512m -XX:CICompilerCount=2 -jar yudao-server/target/yudao-server.jar`  
  （本机虚拟内存紧张时不要让 JVM 默认占 8GB 堆，否则会 native OOM）
- 依赖本机 Redis；库：`10.112.149.184:3306/teaching-platform`

改上传实现后必须重新打包并停掉旧 Java 进程再启动，否则仍会执行 jar 内旧的 `FileApi.createFile`。
