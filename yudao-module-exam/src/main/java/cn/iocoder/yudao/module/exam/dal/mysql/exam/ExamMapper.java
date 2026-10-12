package cn.iocoder.yudao.module.exam.dal.mysql.exam;

import java.util.List;
import cn.iocoder.yudao.framework.mybatis.core.mapper.BaseMapperX;
import cn.iocoder.yudao.framework.mybatis.core.query.LambdaQueryWrapperX;
import cn.iocoder.yudao.module.exam.dal.dataobject.exam.ExamDO;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ExamMapper extends BaseMapperX<ExamDO> {

    default List<ExamDO> selectListByCourseId(Long courseId) {
        return selectList(new LambdaQueryWrapperX<ExamDO>()
                .eq(ExamDO::getCourseId, courseId)
                .orderByDesc(ExamDO::getId));
    }

    default ExamDO selectByLessonId(Long lessonId) {
        return selectOne(ExamDO::getLessonId, lessonId);
    }

}
