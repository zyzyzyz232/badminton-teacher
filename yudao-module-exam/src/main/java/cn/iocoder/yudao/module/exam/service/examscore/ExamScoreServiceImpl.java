package cn.iocoder.yudao.module.exam.service.examscore;

import cn.hutool.core.io.FileUtil;
import cn.hutool.core.io.IoUtil;
import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import cn.iocoder.yudao.framework.common.util.object.BeanUtils;
import cn.iocoder.yudao.module.exam.controller.admin.examscore.vo.ExamScoreRespVO;
import cn.iocoder.yudao.module.exam.controller.admin.examscore.vo.ExamScoreReviewReqVO;
import cn.iocoder.yudao.module.exam.controller.admin.examscore.vo.ExamScoreStudentReqVO;
import cn.iocoder.yudao.module.exam.controller.admin.examscore.vo.ExamScoreSubmitRespVO;
import cn.iocoder.yudao.module.exam.dal.dataobject.exam.ExamDO;
import cn.iocoder.yudao.module.exam.dal.dataobject.examitem.ExamItemDO;
import cn.iocoder.yudao.module.exam.dal.dataobject.examscore.ExamScoreDO;
import cn.iocoder.yudao.module.exam.dal.mysql.exam.ExamMapper;
import cn.iocoder.yudao.module.exam.dal.mysql.examitem.ExamItemMapper;
import cn.iocoder.yudao.module.exam.dal.mysql.examscore.ExamScoreMapper;
import cn.iocoder.yudao.module.exam.enums.ExamScoreStatusEnum;
import cn.iocoder.yudao.module.exam.framework.algo.ExamAlgoAnalyzeResult;
import cn.iocoder.yudao.module.exam.framework.algo.ExamAlgoClient;
import cn.iocoder.yudao.module.exam.framework.config.ExamFileProperties;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.client.RestClientException;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.Resource;
import java.io.File;
import java.io.UnsupportedEncodingException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static cn.iocoder.yudao.framework.common.exception.util.ServiceExceptionUtil.exception;
import static cn.iocoder.yudao.module.exam.enums.ErrorCodeConstants.*;

@Service
@Validated
@Slf4j
public class ExamScoreServiceImpl implements ExamScoreService {

    @Resource
    private ExamScoreMapper examScoreMapper;
    @Resource
    private ExamMapper examMapper;
    @Resource
    private ExamItemMapper examItemMapper;
    @Resource
    private ExamFileProperties examFileProperties;
    @Resource
    private ExamAlgoClient examAlgoClient;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ExamScoreSubmitRespVO submitVideo(MultipartFile file, Long examId, Long examItemId, Long studentId,
                                             Long classId, Integer videoDuration) {
        if (studentId == null) {
            throw exception(EXAM_SCORE_STUDENT_REQUIRED);
        }
        if (file == null || file.isEmpty()) {
            throw exception(EXAM_SCORE_VIDEO_EMPTY);
        }
        ExamDO exam = validateExamExists(examId);
        ExamItemDO item = validateExamItem(examItemId, examId);
        if (item.getAlgoType() == null || item.getAlgoType() != 1) {
            throw exception(EXAM_SCORE_ALGO_TYPE_UNSUPPORTED);
        }
        String videoUrl = saveLocalVideo(file);
        ExamScoreDO existing = examScoreMapper.selectByStudentAndItem(studentId, examItemId);
        Long id;
        if (existing == null) {
            ExamScoreDO row = ExamScoreDO.builder()
                    .examId(exam.getId())
                    .classId(classId != null ? classId : exam.getCourseId())
                    .courseId(exam.getCourseId())
                    .lessonId(exam.getLessonId())
                    .studentId(studentId)
                    .examItemId(examItemId)
                    .videoUrl(videoUrl)
                    .videoDuration(videoDuration)
                    .status(ExamScoreStatusEnum.COMPUTING)
                    .videoDeleted(0)
                    .build();
            examScoreMapper.insert(row);
            id = row.getId();
        } else {
            if (!Integer.valueOf(1).equals(existing.getVideoDeleted())) {
                deleteLocalVideo(existing.getVideoUrl());
            }
            resetForComputing(existing.getId(), exam, classId != null ? classId : exam.getCourseId(),
                    videoUrl, videoDuration);
            id = existing.getId();
        }
        ExamScoreSubmitRespVO resp = new ExamScoreSubmitRespVO();
        resp.setId(id);
        resp.setStatus(ExamScoreStatusEnum.COMPUTING);
        resp.setStatusText(statusText(ExamScoreStatusEnum.COMPUTING));
        return resp;
    }

    @Override
    public List<ExamScoreRespVO> getScoreListByExam(Long examId) {
        validateExamExists(examId);
        List<ExamScoreDO> list = examScoreMapper.selectListByExamId(examId);
        List<ExamScoreRespVO> result = new ArrayList<>(list.size());
        for (ExamScoreDO row : list) {
            result.add(toResp(row, false));
        }
        return result;
    }

    @Override
    public ExamScoreRespVO getScore(Long id) {
        return toResp(validateScoreExists(id), true);
    }

    @Override
    public void review(ExamScoreReviewReqVO reqVO) {
        ExamScoreDO row = validateScoreExists(reqVO.getId());
        if (row.getStatus() == null
                || (row.getStatus() != ExamScoreStatusEnum.REVIEW && row.getStatus() != ExamScoreStatusEnum.DONE)) {
            throw exception(EXAM_SCORE_STATUS_INVALID);
        }
        LambdaUpdateWrapper<ExamScoreDO> uw = new LambdaUpdateWrapper<ExamScoreDO>()
                .eq(ExamScoreDO::getId, row.getId())
                .set(ExamScoreDO::getFinalScore, reqVO.getFinalScore())
                .set(ExamScoreDO::getComment, reqVO.getComment())
                .set(ExamScoreDO::getStatus, ExamScoreStatusEnum.DONE);
        examScoreMapper.update(null, uw);
    }

    @Override
    public void algoCallback(String token, String body) {
        String expected = examFileProperties.getAlgo().getCallbackToken();
        if (StrUtil.isBlank(expected) || !expected.equals(token)) {
            throw exception(EXAM_SCORE_CALLBACK_UNAUTHORIZED);
        }
        if (StrUtil.isBlank(body)) {
            throw exception(EXAM_SCORE_NOT_EXISTS);
        }
        JSONObject obj = JSONUtil.parseObj(body);
        String requestId = firstNonBlank(obj.getStr("request_id"), obj.getStr("requestId"));
        if (StrUtil.isBlank(requestId)) {
            throw exception(EXAM_SCORE_NOT_EXISTS);
        }
        ExamScoreDO row = examScoreMapper.selectByRequestId(requestId);
        if (row == null) {
            throw exception(EXAM_SCORE_NOT_EXISTS);
        }
        applyAlgoJson(row.getId(), body);
    }

    @Override
    public void retry(Long id) {
        ExamScoreDO row = validateScoreExists(id);
        if (row.getStatus() == null || row.getStatus() != ExamScoreStatusEnum.FAILED) {
            throw exception(EXAM_SCORE_STATUS_INVALID);
        }
        if (Integer.valueOf(1).equals(row.getVideoDeleted()) || StrUtil.isBlank(row.getVideoUrl())) {
            throw exception(EXAM_SCORE_RETRY_NEED_VIDEO);
        }
        ExamDO exam = validateExamExists(row.getExamId());
        resetForComputing(row.getId(), exam, row.getClassId(), row.getVideoUrl(), row.getVideoDuration());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void markAbsent(ExamScoreStudentReqVO reqVO) {
        ExamDO exam = validateExamExists(reqVO.getExamId());
        List<ExamItemDO> items = examItemMapper.selectListByExamId(exam.getId());
        if (items.isEmpty()) {
            throw exception(EXAM_SCORE_NO_ITEMS);
        }
        Long classId = reqVO.getClassId() != null ? reqVO.getClassId() : exam.getCourseId();
        for (ExamItemDO item : items) {
            ExamScoreDO existing = examScoreMapper.selectByStudentAndItem(reqVO.getStudentId(), item.getId());
            if (existing == null) {
                ExamScoreDO row = ExamScoreDO.builder()
                        .examId(exam.getId())
                        .classId(classId)
                        .courseId(exam.getCourseId())
                        .lessonId(exam.getLessonId())
                        .studentId(reqVO.getStudentId())
                        .examItemId(item.getId())
                        .status(ExamScoreStatusEnum.ABSENT)
                        .videoDeleted(0)
                        .build();
                examScoreMapper.insert(row);
            } else {
                if (!Integer.valueOf(1).equals(existing.getVideoDeleted())) {
                    deleteLocalVideo(existing.getVideoUrl());
                }
                LambdaUpdateWrapper<ExamScoreDO> uw = new LambdaUpdateWrapper<ExamScoreDO>()
                        .eq(ExamScoreDO::getId, existing.getId())
                        .set(ExamScoreDO::getExamId, exam.getId())
                        .set(ExamScoreDO::getClassId, classId)
                        .set(ExamScoreDO::getCourseId, exam.getCourseId())
                        .set(ExamScoreDO::getLessonId, exam.getLessonId())
                        .set(ExamScoreDO::getStatus, ExamScoreStatusEnum.ABSENT)
                        .set(ExamScoreDO::getAlgoScore, null)
                        .set(ExamScoreDO::getFinalScore, null)
                        .set(ExamScoreDO::getResultJson, null)
                        .set(ExamScoreDO::getResultSummary, null)
                        .set(ExamScoreDO::getAlgoRequestId, null)
                        .set(ExamScoreDO::getAiCallbackTime, null)
                        .set(ExamScoreDO::getVideoUrl, null)
                        .set(ExamScoreDO::getVideoDuration, null)
                        .set(ExamScoreDO::getVideoDeleted, 1)
                        .set(ExamScoreDO::getFailReason, null)
                        .set(ExamScoreDO::getComment, "缺考");
                examScoreMapper.update(null, uw);
            }
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void restartStudent(ExamScoreStudentReqVO reqVO) {
        validateExamExists(reqVO.getExamId());
        List<ExamScoreDO> rows = examScoreMapper.selectListByExamAndStudent(reqVO.getExamId(), reqVO.getStudentId());
        for (ExamScoreDO row : rows) {
            if (!Integer.valueOf(1).equals(row.getVideoDeleted())) {
                deleteLocalVideo(row.getVideoUrl());
            }
            LambdaUpdateWrapper<ExamScoreDO> uw = new LambdaUpdateWrapper<ExamScoreDO>()
                    .eq(ExamScoreDO::getId, row.getId())
                    .set(ExamScoreDO::getStatus, ExamScoreStatusEnum.PENDING)
                    .set(ExamScoreDO::getAlgoScore, null)
                    .set(ExamScoreDO::getFinalScore, null)
                    .set(ExamScoreDO::getResultJson, null)
                    .set(ExamScoreDO::getResultSummary, null)
                    .set(ExamScoreDO::getAlgoRequestId, null)
                    .set(ExamScoreDO::getAiCallbackTime, null)
                    .set(ExamScoreDO::getVideoUrl, null)
                    .set(ExamScoreDO::getVideoDuration, null)
                    .set(ExamScoreDO::getVideoDeleted, 0)
                    .set(ExamScoreDO::getFailReason, null)
                    .set(ExamScoreDO::getComment, null);
            examScoreMapper.update(null, uw);
        }
    }

    @Override
    public Path getLocalFile(String filename) {
        if (StrUtil.isBlank(filename) || filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            return null;
        }
        Path dir = Paths.get(examFileProperties.getFileDir()).toAbsolutePath().normalize();
        Path file = dir.resolve(filename).normalize();
        if (!file.startsWith(dir) || !file.toFile().isFile()) {
            return null;
        }
        return file;
    }

    @Override
    public ResponseEntity<byte[]> getAlgoClip(String requestId, String action, String rangeHeader) {
        try {
            ResponseEntity<byte[]> upstream = examAlgoClient.fetchClip(requestId, action, rangeHeader);
            HttpHeaders headers = new HttpHeaders();
            MediaType contentType = upstream.getHeaders().getContentType();
            headers.setContentType(contentType != null ? contentType : MediaType.parseMediaType("video/mp4"));
            headers.set(HttpHeaders.ACCEPT_RANGES, "bytes");
            if (upstream.getHeaders().getContentLength() >= 0) {
                headers.setContentLength(upstream.getHeaders().getContentLength());
            } else if (upstream.getBody() != null) {
                headers.setContentLength(upstream.getBody().length);
            }
            String contentRange = upstream.getHeaders().getFirst(HttpHeaders.CONTENT_RANGE);
            if (StrUtil.isNotBlank(contentRange)) {
                headers.set(HttpHeaders.CONTENT_RANGE, contentRange);
            }
            HttpStatus status = upstream.getStatusCode();
            return new ResponseEntity<>(upstream.getBody(), headers, status);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        } catch (RestClientException | IllegalStateException ex) {
            log.warn("[examScore] algo-clip failed: {}", ex.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
        }
    }

    @Override
    public void pollComputingScores() {
        List<ExamScoreDO> list = examScoreMapper.selectComputing(8);
        for (ExamScoreDO row : list) {
            try {
                processComputing(row);
            } catch (Exception ex) {
                log.warn("[examScore] poll row {} failed: {}", row.getId(), ex.getMessage());
            }
        }
    }

    private void processComputing(ExamScoreDO row) {
        ExamScoreDO fresh = examScoreMapper.selectById(row.getId());
        if (fresh == null || fresh.getStatus() == null || fresh.getStatus() != ExamScoreStatusEnum.COMPUTING) {
            return;
        }
        if (StrUtil.isBlank(fresh.getAlgoRequestId())) {
            enqueueAnalyze(fresh);
            return;
        }
        ExamAlgoAnalyzeResult result;
        try {
            result = examAlgoClient.getResult(fresh.getAlgoRequestId());
        } catch (Exception ex) {
            log.warn("[examScore] getResult {} : {}", fresh.getAlgoRequestId(), ex.getMessage());
            return;
        }
        String status = StrUtil.blankToDefault(result.getStatus(), "").toLowerCase();
        if ("completed".equals(status) || "success".equals(status) || "succeeded".equals(status)) {
            applyAlgoJson(fresh.getId(), result.getRawJson());
        } else if ("failed".equals(status) || "error".equals(status)) {
            markFailed(fresh.getId(), "算法分析失败");
        }
    }

    private void enqueueAnalyze(ExamScoreDO row) {
        if (!examAlgoClient.isConfigured()) {
            markFailed(row.getId(), "动作分析服务未配置");
            return;
        }
        File file = resolveLocalFile(row.getVideoUrl());
        if (file == null || !file.isFile()) {
            markFailed(row.getId(), "本地视频不存在");
            return;
        }
        try {
            ExamAlgoAnalyzeResult submitted = examAlgoClient.analyzeVideo(file);
            LambdaUpdateWrapper<ExamScoreDO> uw = new LambdaUpdateWrapper<ExamScoreDO>()
                    .eq(ExamScoreDO::getId, row.getId())
                    .eq(ExamScoreDO::getStatus, ExamScoreStatusEnum.COMPUTING)
                    .set(ExamScoreDO::getAlgoRequestId, submitted.getRequestId())
                    .set(ExamScoreDO::getFailReason, null);
            examScoreMapper.update(null, uw);
            String st = StrUtil.blankToDefault(submitted.getStatus(), "").toLowerCase();
            if ("completed".equals(st) || "success".equals(st)) {
                applyAlgoJson(row.getId(), submitted.getRawJson());
            }
        } catch (Exception ex) {
            log.warn("[examScore] analyze enqueue {} failed: {}", row.getId(), ex.getMessage());
            markFailed(row.getId(), StrUtil.maxLength(ex.getMessage(), 200));
        }
    }

    private void applyAlgoJson(Long scoreId, String rawJson) {
        ExamScoreDO row = examScoreMapper.selectById(scoreId);
        if (row == null || row.getStatus() == null || row.getStatus() != ExamScoreStatusEnum.COMPUTING) {
            return;
        }
        ExamItemDO item = examItemMapper.selectById(row.getExamItemId());
        JSONObject obj = JSONUtil.parseObj(rawJson);
        BigDecimal algoScore = extractAlgoScore(obj, item != null ? item.getMaxScore() : null);
        String summary = extractSummary(obj);
        if (!Integer.valueOf(1).equals(row.getVideoDeleted())) {
            deleteLocalVideo(row.getVideoUrl());
        }
        LambdaUpdateWrapper<ExamScoreDO> uw = new LambdaUpdateWrapper<ExamScoreDO>()
                .eq(ExamScoreDO::getId, scoreId)
                .eq(ExamScoreDO::getStatus, ExamScoreStatusEnum.COMPUTING)
                .set(ExamScoreDO::getAlgoScore, algoScore)
                .set(ExamScoreDO::getResultJson, rawJson)
                .set(ExamScoreDO::getResultSummary, summary)
                .set(ExamScoreDO::getAiCallbackTime, LocalDateTime.now())
                .set(ExamScoreDO::getStatus, ExamScoreStatusEnum.REVIEW)
                .set(ExamScoreDO::getVideoDeleted, 1)
                .set(ExamScoreDO::getVideoUrl, null)
                .set(ExamScoreDO::getFailReason, null);
        String requestId = firstNonBlank(obj.getStr("request_id"), obj.getStr("requestId"));
        if (StrUtil.isNotBlank(requestId)) {
            uw.set(ExamScoreDO::getAlgoRequestId, requestId);
        }
        examScoreMapper.update(null, uw);
    }

    private void markFailed(Long id, String reason) {
        LambdaUpdateWrapper<ExamScoreDO> uw = new LambdaUpdateWrapper<ExamScoreDO>()
                .eq(ExamScoreDO::getId, id)
                .eq(ExamScoreDO::getStatus, ExamScoreStatusEnum.COMPUTING)
                .set(ExamScoreDO::getStatus, ExamScoreStatusEnum.FAILED)
                .set(ExamScoreDO::getFailReason, StrUtil.maxLength(reason, 500));
        examScoreMapper.update(null, uw);
    }

    private void resetForComputing(Long id, ExamDO exam, Long classId, String videoUrl, Integer videoDuration) {
        LambdaUpdateWrapper<ExamScoreDO> uw = new LambdaUpdateWrapper<ExamScoreDO>()
                .eq(ExamScoreDO::getId, id)
                .set(ExamScoreDO::getExamId, exam.getId())
                .set(ExamScoreDO::getClassId, classId)
                .set(ExamScoreDO::getCourseId, exam.getCourseId())
                .set(ExamScoreDO::getLessonId, exam.getLessonId())
                .set(ExamScoreDO::getVideoUrl, videoUrl)
                .set(ExamScoreDO::getVideoDuration, videoDuration)
                .set(ExamScoreDO::getStatus, ExamScoreStatusEnum.COMPUTING)
                .set(ExamScoreDO::getAlgoScore, null)
                .set(ExamScoreDO::getFinalScore, null)
                .set(ExamScoreDO::getResultJson, null)
                .set(ExamScoreDO::getResultSummary, null)
                .set(ExamScoreDO::getAlgoRequestId, null)
                .set(ExamScoreDO::getAiCallbackTime, null)
                .set(ExamScoreDO::getVideoDeleted, 0)
                .set(ExamScoreDO::getFailReason, null)
                .set(ExamScoreDO::getComment, null);
        examScoreMapper.update(null, uw);
    }

    private String saveLocalVideo(MultipartFile file) {
        try {
            byte[] content = IoUtil.readBytes(file.getInputStream());
            File dir = new File(examFileProperties.getFileDir());
            FileUtil.mkdir(dir);
            String ext = FileUtil.extName(file.getOriginalFilename());
            if (StrUtil.isBlank(ext)) {
                ext = "mp4";
            }
            String stored = IdUtil.fastSimpleUUID() + "." + ext;
            FileUtil.writeBytes(content, new File(dir, stored));
            return StrUtil.removeSuffix(examFileProperties.getScoreFileUrlPrefix(), "/") + "/" + stored;
        } catch (Exception ex) {
            log.error("[examScore] save video failed", ex);
            throw exception(EXAM_SCORE_UPLOAD_FAILED);
        }
    }

    private void deleteLocalVideo(String videoUrl) {
        File file = resolveLocalFile(videoUrl);
        if (file != null && file.isFile()) {
            FileUtil.del(file);
        }
    }

    private File resolveLocalFile(String videoUrl) {
        if (StrUtil.isBlank(videoUrl)) {
            return null;
        }
        String filename = StrUtil.subAfter(videoUrl, "/", true);
        Path path = getLocalFile(filename);
        return path == null ? null : path.toFile();
    }

    private ExamScoreRespVO toResp(ExamScoreDO row, boolean includeJson) {
        ExamScoreRespVO vo = BeanUtils.toBean(row, ExamScoreRespVO.class);
        vo.setStatusText(statusText(row.getStatus()));
        if (!includeJson) {
            vo.setResultJson(null);
        } else {
            vo.setResultJson(rewriteClipUrls(row.getResultJson()));
        }
        ExamItemDO item = examItemMapper.selectById(row.getExamItemId());
        if (item != null) {
            vo.setItemName(item.getItemName());
            vo.setAlgoType(item.getAlgoType());
            vo.setMaxScore(item.getMaxScore());
        }
        return vo;
    }

    private String rewriteClipUrls(String rawJson) {
        if (StrUtil.isBlank(rawJson)) {
            return rawJson;
        }
        try {
            JSONObject obj = JSONUtil.parseObj(rawJson);
            JSONArray actions = obj.getJSONArray("actions");
            if (actions == null || actions.isEmpty()) {
                return rawJson;
            }
            String requestId = firstNonBlank(obj.getStr("request_id"), obj.getStr("requestId"));
            String prefix = StrUtil.removeSuffix(
                    StrUtil.blankToDefault(examFileProperties.getScoreClipUrlPrefix(), ""), "/");
            if (StrUtil.isBlank(prefix) || StrUtil.isBlank(requestId)) {
                return rawJson;
            }
            for (int i = 0; i < actions.size(); i++) {
                JSONObject action = actions.getJSONObject(i);
                if (action == null) {
                    continue;
                }
                String name = action.getStr("action");
                if (StrUtil.isBlank(name)) {
                    continue;
                }
                action.set("clip_video", prefix + "?requestId=" + urlEncode(requestId)
                        + "&action=" + urlEncode(name));
            }
            return obj.toString();
        } catch (Exception ex) {
            log.warn("[examScore] rewrite clip urls failed: {}", ex.getMessage());
            return rawJson;
        }
    }

    private static String urlEncode(String value) {
        try {
            return URLEncoder.encode(value, "UTF-8");
        } catch (UnsupportedEncodingException e) {
            return value;
        }
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (StrUtil.isNotBlank(value)) {
                return value;
            }
        }
        return null;
    }

    private ExamDO validateExamExists(Long examId) {
        ExamDO exam = examMapper.selectById(examId);
        if (exam == null) {
            throw exception(EXAM_NOT_EXISTS);
        }
        return exam;
    }

    private ExamItemDO validateExamItem(Long examItemId, Long examId) {
        ExamItemDO item = examItemMapper.selectById(examItemId);
        if (item == null) {
            throw exception(EXAM_ITEM_NOT_EXISTS);
        }
        if (examId != null && item.getExamId() != null && !item.getExamId().equals(examId)) {
            throw exception(EXAM_ITEM_NOT_EXISTS);
        }
        return item;
    }

    private ExamScoreDO validateScoreExists(Long id) {
        ExamScoreDO row = examScoreMapper.selectById(id);
        if (row == null) {
            throw exception(EXAM_SCORE_NOT_EXISTS);
        }
        return row;
    }

    private static BigDecimal extractAlgoScore(JSONObject obj, Integer maxScore) {
        Double raw = null;
        JSONObject summary = obj.getJSONObject("summary");
        if (summary != null) {
            raw = summary.getDouble("average_overall_score");
            if (raw == null) {
                raw = summary.getDouble("overall_score");
            }
        }
        if (raw == null) {
            raw = obj.getDouble("algo_score");
        }
        if (raw == null) {
            raw = 0d;
        }
        BigDecimal score = BigDecimal.valueOf(raw).setScale(2, RoundingMode.HALF_UP);
        if (score.compareTo(BigDecimal.ZERO) < 0) {
            score = BigDecimal.ZERO;
        }
        if (maxScore != null) {
            BigDecimal cap = BigDecimal.valueOf(maxScore);
            if (score.compareTo(cap) > 0) {
                score = cap;
            }
        }
        return score;
    }

    private static String extractSummary(JSONObject obj) {
        JSONObject llm = obj.getJSONObject("llm_analysis");
        if (llm != null && StrUtil.isNotBlank(llm.getStr("summary"))) {
            return StrUtil.maxLength(llm.getStr("summary"), 1000);
        }
        JSONObject summary = obj.getJSONObject("summary");
        if (summary != null) {
            Integer detected = summary.getInt("actions_detected");
            Double avg = summary.getDouble("average_overall_score");
            String text = "检测到 " + (detected != null ? detected : 0) + " 个动作";
            if (avg != null) {
                text += "，均分 " + BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP);
            }
            return text;
        }
        return StrUtil.maxLength(obj.getStr("status"), 200);
    }

    private static String statusText(Integer status) {
        if (status == null) {
            return "未考";
        }
        switch (status) {
            case ExamScoreStatusEnum.COMPUTING:
                return "计算中";
            case ExamScoreStatusEnum.REVIEW:
                return "待审核";
            case ExamScoreStatusEnum.DONE:
                return "已完成";
            case ExamScoreStatusEnum.FAILED:
                return "失败";
            case ExamScoreStatusEnum.ABSENT:
                return "缺考";
            default:
                return "未考";
        }
    }

}
