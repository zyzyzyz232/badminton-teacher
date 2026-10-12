package cn.iocoder.yudao.module.exam.controller.admin.examscore.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.NotNull;

@Schema(description = "管理后台 - 学员缺考/重开 Request VO")
@Data
public class ExamScoreStudentReqVO {

    @NotNull(message = "考试编号不能为空")
    private Long examId;

    @NotNull(message = "学员编号不能为空")
    private Long studentId;

    private Long classId;

}
