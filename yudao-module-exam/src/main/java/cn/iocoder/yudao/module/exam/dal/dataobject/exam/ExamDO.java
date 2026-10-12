package cn.iocoder.yudao.module.exam.dal.dataobject.exam;

import lombok.*;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;

/**
 * 考试头表
 */
@TableName("teaching_exam")
@Data
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamDO extends TenantBaseDO {

    @TableId
    private Long id;
    private Long courseId;
    private Long lessonId;
    private String title;
    private Integer scoreRatio;
    /**
     * 0 配置中 / 1 可开考 / 2 进行中 / 3 已结束
     */
    private Integer status;

}
