package cn.iocoder.yudao.module.exam.dal.dataobject.lesson;

import lombok.*;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;

/**
 * 只读映射现网 teaching_lesson，用于校验考试课堂。
 */
@TableName("teaching_lesson")
@Data
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class LessonDO extends TenantBaseDO {

    @TableId
    private Long id;
    private Long courseId;
    /**
     * 2 表示考试课堂
     */
    private Integer type;
    private Integer weekIndex;

}
