package cn.iocoder.yudao.module.exam.controller.admin.examitem.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

@Schema(description = "管理后台 - 考核项 Response VO")
@Data
public class ExamItemRespVO {

    @Schema(description = "考核项编号")
    private Long id;

    private Long examId;
    private Long lessonId;
    private String itemName;
    private Integer maxScore;
    private Integer weight;
    private Integer algoType;
    private Integer sortOrder;
    private LocalDateTime createTime;

}
