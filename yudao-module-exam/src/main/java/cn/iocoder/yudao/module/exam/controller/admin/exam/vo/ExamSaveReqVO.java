package cn.iocoder.yudao.module.exam.controller.admin.exam.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Schema(description = "管理后台 - 考试新增/修改 Request VO")
@Data
public class ExamSaveReqVO {

    @Schema(description = "考试编号，更新时必填")
    private Long id;

    @Schema(description = "所属课程", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "课程编号不能为空")
    private Long courseId;

    @Schema(description = "考试课堂编号", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "课堂编号不能为空")
    private Long lessonId;

    @Schema(description = "考试标题", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "考试标题不能为空")
    private String title;

    @Schema(description = "本场占比 1-100", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "考试占比不能为空")
    @Min(value = 1, message = "考试占比须为 1–100")
    @Max(value = 100, message = "考试占比须为 1–100")
    private Integer scoreRatio;

    @Schema(description = "状态：0配置中 1可开考 2进行中 3已结束")
    private Integer status;

}
