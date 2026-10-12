package cn.iocoder.yudao.module.exam.dal.mysql.examitem;

import java.util.List;
import cn.iocoder.yudao.framework.mybatis.core.mapper.BaseMapperX;
import cn.iocoder.yudao.framework.mybatis.core.query.LambdaQueryWrapperX;
import cn.iocoder.yudao.module.exam.dal.dataobject.examitem.ExamItemDO;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ExamItemMapper extends BaseMapperX<ExamItemDO> {

    default List<ExamItemDO> selectListByExamId(Long examId) {
        return selectList(new LambdaQueryWrapperX<ExamItemDO>()
                .eq(ExamItemDO::getExamId, examId)
                .orderByAsc(ExamItemDO::getSortOrder)
                .orderByAsc(ExamItemDO::getId));
    }

}
