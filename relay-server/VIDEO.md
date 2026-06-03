# 视频无法播放排查

## 现象

- `npm run test:media` 显示 `HTTP 200 application/json`
- 大屏 PROBE 显示 `代理 OK HTTP 200 application/json`
- 播放报错 `MEDIA_ERR_SRC_NOT_SUPPORTED`

## 原因

后台返回的是 **CommonResult JSON**（例如 `code:404 请求地址不存在`），不是 `video/mp4` 流。  
当前 `videoUrl` 形如：

`http://10.112.189.54:48080/plan-materials/videos/...`

经测试，该路径在 48080 上 **没有可用的文件下载接口**（带 Token 仍返回 JSON 404）。

## 中继侧（已修复）

`media-proxy` 会拒绝 `application/json` 响应，返回 **502** 并附带后台 `msg`，便于调试。

## 后台需修复（任选其一）

1. **Nginx / Spring 静态映射**  
   将 `/plan-materials/**` 映射到实际上传目录，并允许带 `Authorization` 访问。

2. **提供下载 API**（推荐）  
   例如 `GET /admin-api/teaching/plan-material/download?id={materialId}` 返回文件流。

3. **修正 upload 返回的 videoUrl**  
   改为可访问的 infra/file 地址或 CDN 地址。

## 自测命令

```bash
# 应返回 video/mp4 或 application/octet-stream，不能是 application/json
curl.exe -H "Authorization: Bearer <token>" -H "Tenant-Id: 1" ^
  "http://10.112.189.54:48080/plan-materials/videos/....mp4"

cd relay-server
npm run test:media -- "<videoUrl>" <token>
```
