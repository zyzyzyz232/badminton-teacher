package cn.iocoder.yudao.module.exam.controller.admin.examitem.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Schema(description = "管理后台 - 考核项新增/修改 Request VO")
@Data
public class ExamItemSaveReqVO {

    @Schema(description = "考核项编号，更新时必填")
    private Long id;

    @Schema(description = "所属考试", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "考试编号不能为空")
    private Long examId;

    @Schema(description = "考核项名称", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "考核项名称不能为空")
    private String itemName;

    @Schema(description = "项目满分", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "满分不能为空")
    @Min(value = 1, message = "满分须大于 0")
    private Integer maxScore;

    @Schema(description = "项内权重百分比", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "权重不能为空")
    @Min(value = 0, message = "权重须为 0–100")
    @Max(value = 100, message = "权重须为 0–100")
    private Integer weight;

    @Schema(description = "算法类型：1动作分析 2落点检测", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "算法类型不能为空")
    private Integer algoType;

    @Schema(description = "排序")
    private Integer sortOrder;

}
