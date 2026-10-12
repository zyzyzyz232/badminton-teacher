package cn.iocoder.yudao.module.exam.controller.admin.examitemmaterial.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

@Schema(description = "管理后台 - 考核项资料 Response VO")
@Data
public class ExamItemMaterialRespVO {

    private Long id;
    private Long examItemId;
    private Integer materialType;
    private String imageUrl;
    private String videoUrl;
    private Integer duration;
    private String title;
    private String description;
    private Integer sort;
    private LocalDateTime createTime;

}
