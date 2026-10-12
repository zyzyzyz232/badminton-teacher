package cn.iocoder.yudao.module.exam.controller.admin.examscore.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Schema(description = "管理后台 - 考试成绩 Response VO")
@Data
public class ExamScoreRespVO {

    private Long id;
    private Long examId;
    private Long examItemId;
    private String itemName;
    private Integer algoType;
    private Integer maxScore;
    private Long classId;
    private Long studentId;
    private String videoUrl;
    private Integer videoDuration;
    private BigDecimal algoScore;
    private BigDecimal finalScore;
    private String comment;
    private Integer status;
    private String statusText;
    private String resultSummary;
    private String resultJson;
    private String algoRequestId;
    private Integer videoDeleted;
    private String failReason;
    private LocalDateTime aiCallbackTime;
    private LocalDateTime createTime;

}
