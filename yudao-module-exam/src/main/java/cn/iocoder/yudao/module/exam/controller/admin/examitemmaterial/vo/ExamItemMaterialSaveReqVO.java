package cn.iocoder.yudao.module.exam.controller.admin.examitemmaterial.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.NotNull;

@Schema(description = "管理后台 - 考核项资料新增/修改 Request VO")
@Data
public class ExamItemMaterialSaveReqVO {

    @Schema(description = "资料编号，更新时必填")
    private Long id;

    @Schema(description = "考核项编号", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "考核项编号不能为空")
    private Long examItemId;

    @Schema(description = "1 图片 2 视频", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "资料类型不能为空")
    private Integer materialType;

    private String imageUrl;
    private String videoUrl;
    private Integer duration;
    private String title;
    private String description;
    private Integer sort;

}
