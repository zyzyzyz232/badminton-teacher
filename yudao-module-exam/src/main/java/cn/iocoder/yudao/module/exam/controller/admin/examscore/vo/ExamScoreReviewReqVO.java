package cn.iocoder.yudao.module.exam.controller.admin.examscore.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Schema(description = "管理后台 - 审核考试成绩 Request VO")
@Data
public class ExamScoreReviewReqVO {

    @NotNull(message = "成绩编号不能为空")
    private Long id;

    @NotNull(message = "最终分不能为空")
    private BigDecimal finalScore;

    private String comment;

}
