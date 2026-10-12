package cn.iocoder.yudao.module.exam.dal.dataobject.examitemmaterial;

import lombok.*;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;

/**
 * 考核项教学资料
 */
@TableName("teaching_exam_item_material")
@Data
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamItemMaterialDO extends TenantBaseDO {

    @TableId
    private Long id;
    private Long examItemId;
    /**
     * 1 图片，2 视频
     */
    private Integer materialType;
    private String imageUrl;
    private String videoUrl;
    private Integer duration;
    private String title;
    private String description;
    private Integer sort;

}
