package cn.iocoder.yudao.module.exam.controller.admin.examscore;

import cn.iocoder.yudao.framework.apilog.core.annotation.ApiAccessLog;
import cn.iocoder.yudao.framework.common.pojo.CommonResult;
import cn.iocoder.yudao.framework.tenant.core.aop.TenantIgnore;
import cn.iocoder.yudao.module.exam.controller.admin.examscore.vo.ExamScoreRespVO;
import cn.iocoder.yudao.module.exam.controller.admin.examscore.vo.ExamScoreReviewReqVO;
import cn.iocoder.yudao.module.exam.controller.admin.examscore.vo.ExamScoreStudentReqVO;
import cn.iocoder.yudao.module.exam.controller.admin.examscore.vo.ExamScoreSubmitRespVO;
import cn.iocoder.yudao.module.exam.service.examscore.ExamScoreService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.Resource;
import javax.annotation.security.PermitAll;
import javax.validation.Valid;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static cn.iocoder.yudao.framework.common.pojo.CommonResult.success;

@Tag(name = "管理后台 - 考试成绩")
@RestController
@RequestMapping("/teaching/exam-score")
@Validated
public class ExamScoreController {

    @Resource
    private ExamScoreService examScoreService;

    @PostMapping("/submit-video")
    @Operation(summary = "提交考核视频并入队分析")
    @ApiAccessLog(enable = false)
    public CommonResult<ExamScoreSubmitRespVO> submitVideo(
            @RequestParam("file") MultipartFile file,
            @RequestParam("examId") Long examId,
            @RequestParam("examItemId") Long examItemId,
            @RequestParam("studentId") Long studentId,
            @RequestParam(value = "classId", required = false) Long classId,
            @RequestParam(value = "videoDuration", required = false) Integer videoDuration) {
        return success(examScoreService.submitVideo(file, examId, examItemId, studentId, classId, videoDuration));
    }

    @GetMapping("/list-by-exam")
    @Operation(summary = "本场成绩列表")
    @Parameter(name = "examId", description = "考试编号", required = true)
    public CommonResult<List<ExamScoreRespVO>> listByExam(@RequestParam("examId") Long examId) {
        return success(examScoreService.getScoreListByExam(examId));
    }

    @GetMapping("/get")
    @Operation(summary = "成绩详情")
    @Parameter(name = "id", description = "成绩编号", required = true)
    public CommonResult<ExamScoreRespVO> get(@RequestParam("id") Long id) {
        return success(examScoreService.getScore(id));
    }

    @PutMapping("/review")
    @Operation(summary = "教师改分并完成")
    public CommonResult<Boolean> review(@Valid @RequestBody ExamScoreReviewReqVO reqVO) {
        examScoreService.review(reqVO);
        return success(true);
    }

    @PostMapping("/algo-callback")
    @PermitAll
    @TenantIgnore
    @Operation(summary = "算法回调（内部鉴权）")
    @ApiAccessLog(enable = false)
    public CommonResult<Boolean> algoCallback(
            @RequestHeader(value = "X-Algo-Callback-Token", required = false) String token,
            @RequestBody String body) {
        examScoreService.algoCallback(token, body);
        return success(true);
    }

    @PostMapping("/retry")
    @Operation(summary = "失败重提")
    @Parameter(name = "id", description = "成绩编号", required = true)
    public CommonResult<Boolean> retry(@RequestParam("id") Long id) {
        examScoreService.retry(id);
        return success(true);
    }

    @PostMapping("/mark-absent")
    @Operation(summary = "学员本场缺考")
    public CommonResult<Boolean> markAbsent(@Valid @RequestBody ExamScoreStudentReqVO reqVO) {
        examScoreService.markAbsent(reqVO);
        return success(true);
    }

    @PostMapping("/restart-student")
    @Operation(summary = "重新开始某学员本场考试")
    public CommonResult<Boolean> restartStudent(@Valid @RequestBody ExamScoreStudentReqVO reqVO) {
        examScoreService.restartStudent(reqVO);
        return success(true);
    }

    @GetMapping("/file/{filename:.+}")
    @PermitAll
    @TenantIgnore
    @Operation(summary = "读取本地考试视频")
    public ResponseEntity<FileSystemResource> getFile(@PathVariable("filename") String filename) throws Exception {
        Path path = examScoreService.getLocalFile(filename);
        if (path == null) {
            return ResponseEntity.notFound().build();
        }
        String contentType = Files.probeContentType(path);
        MediaType mediaType = contentType != null
                ? MediaType.parseMediaType(contentType)
                : MediaType.APPLICATION_OCTET_STREAM;
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .contentLength(Files.size(path))
                .body(new FileSystemResource(path));
    }

    @GetMapping("/algo-clip")
    @PermitAll
    @TenantIgnore
    @Operation(summary = "代理播放动作分析片段")
    @ApiAccessLog(enable = false)
    public ResponseEntity<byte[]> getAlgoClip(
            @RequestParam("requestId") String requestId,
            @RequestParam("action") String action,
            @RequestHeader(value = "Range", required = false) String range) {
        return examScoreService.getAlgoClip(requestId, action, range);
    }

}
