package cn.iocoder.yudao.module.exam.dal.mysql.examitemmaterial;

import java.util.List;
import cn.iocoder.yudao.framework.mybatis.core.mapper.BaseMapperX;
import cn.iocoder.yudao.framework.mybatis.core.query.LambdaQueryWrapperX;
import cn.iocoder.yudao.module.exam.dal.dataobject.examitemmaterial.ExamItemMaterialDO;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ExamItemMaterialMapper extends BaseMapperX<ExamItemMaterialDO> {

    default List<ExamItemMaterialDO> selectListByExamItemId(Long examItemId) {
        return selectList(new LambdaQueryWrapperX<ExamItemMaterialDO>()
                .eq(ExamItemMaterialDO::getExamItemId, examItemId)
                .orderByAsc(ExamItemMaterialDO::getSort)
                .orderByAsc(ExamItemMaterialDO::getId));
    }

}
