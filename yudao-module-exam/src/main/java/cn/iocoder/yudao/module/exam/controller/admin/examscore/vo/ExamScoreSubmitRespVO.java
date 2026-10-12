package cn.iocoder.yudao.module.exam.controller.admin.examscore.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Schema(description = "管理后台 - 提交考试视频 Response VO")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamScoreSubmitRespVO {

    private Long id;
    private Integer status;
    private String statusText;

}
