package cn.iocoder.yudao.module.exam.controller.admin.examitemmaterial.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Schema(description = "管理后台 - 考核项资料上传结果")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamItemMaterialUploadRespVO {

    @Schema(description = "文件访问地址")
    private String url;

    @Schema(description = "图片地址（materialType=1 时填写）")
    private String imageUrl;

    @Schema(description = "视频地址（materialType=2 时填写）")
    private String videoUrl;

    @Schema(description = "时长秒")
    private Integer duration;

}
