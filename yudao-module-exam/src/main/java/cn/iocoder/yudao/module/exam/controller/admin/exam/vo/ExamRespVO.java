package cn.iocoder.yudao.module.exam.controller.admin.exam.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

@Schema(description = "管理后台 - 考试 Response VO")
@Data
public class ExamRespVO {

    @Schema(description = "考试编号")
    private Long id;

    @Schema(description = "考试编号（兼容前端 examId）")
    private Long examId;

    @Schema(description = "所属课程")
    private Long courseId;

    @Schema(description = "考试课堂编号")
    private Long lessonId;

    @Schema(description = "考试标题")
    private String title;

    @Schema(description = "本场占比")
    private Integer scoreRatio;

    @Schema(description = "状态：0配置中 1可开考 2进行中 3已结束")
    private Integer status;

    @Schema(description = "关联课堂周次")
    private Integer weekIndex;

    @Schema(description = "关联课堂周次（兼容前端 lessonWeekIndex）")
    private Integer lessonWeekIndex;

    private LocalDateTime createTime;

}
