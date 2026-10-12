package cn.iocoder.yudao.module.exam.dal.mysql.lesson;

import cn.iocoder.yudao.framework.mybatis.core.mapper.BaseMapperX;
import cn.iocoder.yudao.module.exam.dal.dataobject.lesson.LessonDO;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface LessonMapper extends BaseMapperX<LessonDO> {
}
