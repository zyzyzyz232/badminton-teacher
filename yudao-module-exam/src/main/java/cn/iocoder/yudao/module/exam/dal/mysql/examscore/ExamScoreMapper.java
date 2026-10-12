package cn.iocoder.yudao.module.exam.dal.mysql.examscore;

import java.util.List;
import cn.iocoder.yudao.framework.mybatis.core.mapper.BaseMapperX;
import cn.iocoder.yudao.framework.mybatis.core.query.LambdaQueryWrapperX;
import cn.iocoder.yudao.module.exam.dal.dataobject.examscore.ExamScoreDO;
import cn.iocoder.yudao.module.exam.enums.ExamScoreStatusEnum;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ExamScoreMapper extends BaseMapperX<ExamScoreDO> {

    default List<ExamScoreDO> selectListByExamId(Long examId) {
        return selectList(new LambdaQueryWrapperX<ExamScoreDO>()
                .eq(ExamScoreDO::getExamId, examId)
                .orderByAsc(ExamScoreDO::getExamItemId)
                .orderByAsc(ExamScoreDO::getStudentId)
                .orderByAsc(ExamScoreDO::getId));
    }

    default List<ExamScoreDO> selectListByExamAndStudent(Long examId, Long studentId) {
        return selectList(new LambdaQueryWrapperX<ExamScoreDO>()
                .eq(ExamScoreDO::getExamId, examId)
                .eq(ExamScoreDO::getStudentId, studentId)
                .orderByAsc(ExamScoreDO::getExamItemId));
    }

    default ExamScoreDO selectByStudentAndItem(Long studentId, Long examItemId) {
        return selectOne(new LambdaQueryWrapperX<ExamScoreDO>()
                .eq(ExamScoreDO::getStudentId, studentId)
                .eq(ExamScoreDO::getExamItemId, examItemId)
                .last("LIMIT 1"));
    }

    default ExamScoreDO selectByRequestId(String requestId) {
        return selectOne(new LambdaQueryWrapperX<ExamScoreDO>()
                .eq(ExamScoreDO::getAlgoRequestId, requestId)
                .last("LIMIT 1"));
    }

    default List<ExamScoreDO> selectComputing(int limit) {
        return selectList(new LambdaQueryWrapperX<ExamScoreDO>()
                .eq(ExamScoreDO::getStatus, ExamScoreStatusEnum.COMPUTING)
                .orderByAsc(ExamScoreDO::getId)
                .last("LIMIT " + Math.max(1, limit)));
    }

}
