package cn.iocoder.yudao.module.exam.dal.dataobject.examitem;

import lombok.*;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;

/**
 * 考试考核项
 */
@TableName("teaching_exam_item")
@Data
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamItemDO extends TenantBaseDO {

    @TableId
    private Long id;
    private Long examId;
    private Long lessonId;
    private String itemName;
    private Integer maxScore;
    private Integer weight;
    /**
     * 1 动作分析，2 落点检测
     */
    private Integer algoType;
    private Integer sortOrder;

}
