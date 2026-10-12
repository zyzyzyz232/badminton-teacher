package cn.iocoder.yudao.module.exam.dal.dataobject.examscore;

import lombok.*;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import cn.iocoder.yudao.framework.tenant.core.db.TenantBaseDO;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 考试成绩
 */
@TableName("teaching_exam_score")
@Data
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamScoreDO extends TenantBaseDO {

    @TableId
    private Long id;
    private Long examId;
    private Long classId;
    /** 兼容旧表 course_id（非空时必须写入） */
    private Long courseId;
    /** 兼容旧表 lesson_id（非空时必须写入） */
    private Long lessonId;
    private Long studentId;
    private Long examItemId;
    private String videoUrl;
    private Integer videoDuration;
    private LocalDateTime aiCallbackTime;
    private BigDecimal algoScore;
    private BigDecimal finalScore;
    private String comment;
    /**
     * 0 未考 / 1 计算中 / 2 待审核 / 3 已完成 / 4 失败 / 5 缺考
     */
    private Integer status;
    private String algoRequestId;
    private String resultJson;
    private String resultSummary;
    private Integer videoDeleted;
    private String failReason;

}
