package cn.iocoder.yudao.module.exam.service.exam;

import cn.iocoder.yudao.framework.common.util.object.BeanUtils;
import cn.iocoder.yudao.module.exam.controller.admin.exam.vo.ExamRespVO;
import cn.iocoder.yudao.module.exam.controller.admin.exam.vo.ExamSaveReqVO;
import cn.iocoder.yudao.framework.mybatis.core.query.LambdaQueryWrapperX;
import cn.iocoder.yudao.module.exam.dal.dataobject.exam.ExamDO;
import cn.iocoder.yudao.module.exam.dal.dataobject.examitem.ExamItemDO;
import cn.iocoder.yudao.module.exam.dal.dataobject.examitemmaterial.ExamItemMaterialDO;
import cn.iocoder.yudao.module.exam.dal.dataobject.lesson.LessonDO;
import cn.iocoder.yudao.module.exam.dal.mysql.exam.ExamMapper;
import cn.iocoder.yudao.module.exam.dal.mysql.examitem.ExamItemMapper;
import cn.iocoder.yudao.module.exam.dal.mysql.examitemmaterial.ExamItemMaterialMapper;
import cn.iocoder.yudao.module.exam.dal.mysql.lesson.LessonMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.List;

import static cn.iocoder.yudao.framework.common.exception.util.ServiceExceptionUtil.exception;
import static cn.iocoder.yudao.module.exam.enums.ErrorCodeConstants.*;

@Service
@Validated
public class ExamServiceImpl implements ExamService {

    private static final int LESSON_TYPE_EXAM = 2;

    @Resource
    private ExamMapper examMapper;
    @Resource
    private ExamItemMapper examItemMapper;
    @Resource
    private ExamItemMaterialMapper examItemMaterialMapper;
    @Resource
    private LessonMapper lessonMapper;

    @Override
    public Long createExam(ExamSaveReqVO createReqVO) {
        validateLesson(createReqVO.getCourseId(), createReqVO.getLessonId(), null);
        validateScoreRatio(createReqVO.getCourseId(), createReqVO.getScoreRatio(), null);
        ExamDO exam = BeanUtils.toBean(createReqVO, ExamDO.class);
        exam.setId(null);
        if (exam.getStatus() == null) {
            exam.setStatus(0);
        }
        examMapper.insert(exam);
        return exam.getId();
    }

    @Override
    public void updateExam(ExamSaveReqVO updateReqVO) {
        if (updateReqVO.getId() == null) {
            throw exception(EXAM_NOT_EXISTS);
        }
        ExamDO db = validateExamExists(updateReqVO.getId());
        Long courseId = updateReqVO.getCourseId() != null ? updateReqVO.getCourseId() : db.getCourseId();
        Long lessonId = updateReqVO.getLessonId() != null ? updateReqVO.getLessonId() : db.getLessonId();
        Integer scoreRatio = updateReqVO.getScoreRatio() != null ? updateReqVO.getScoreRatio() : db.getScoreRatio();
        validateLesson(courseId, lessonId, db.getId());
        validateScoreRatio(courseId, scoreRatio, db.getId());
        ExamDO updateObj = BeanUtils.toBean(updateReqVO, ExamDO.class);
        examMapper.updateById(updateObj);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteExam(Long id) {
        validateExamExists(id);
        List<ExamItemDO> items = examItemMapper.selectListByExamId(id);
        for (ExamItemDO item : items) {
            examItemMaterialMapper.delete(new LambdaQueryWrapperX<ExamItemMaterialDO>()
                    .eq(ExamItemMaterialDO::getExamItemId, item.getId()));
            examItemMapper.deleteById(item.getId());
        }
        examMapper.deleteById(id);
    }

    @Override
    public ExamDO getExam(Long id) {
        return validateExamExists(id);
    }

    @Override
    public List<ExamRespVO> getExamListByCourse(Long courseId) {
        List<ExamDO> list = examMapper.selectListByCourseId(courseId);
        List<ExamRespVO> result = new ArrayList<>(list.size());
        for (ExamDO exam : list) {
            ExamRespVO vo = BeanUtils.toBean(exam, ExamRespVO.class);
            vo.setExamId(exam.getId());
            LessonDO lesson = lessonMapper.selectById(exam.getLessonId());
            if (lesson != null && lesson.getWeekIndex() != null) {
                vo.setWeekIndex(lesson.getWeekIndex());
                vo.setLessonWeekIndex(lesson.getWeekIndex());
            }
            result.add(vo);
        }
        return result;
    }

    private ExamDO validateExamExists(Long id) {
        ExamDO exam = examMapper.selectById(id);
        if (exam == null) {
            throw exception(EXAM_NOT_EXISTS);
        }
        return exam;
    }

    private void validateLesson(Long courseId, Long lessonId, Long excludeExamId) {
        LessonDO lesson = lessonMapper.selectById(lessonId);
        if (lesson == null) {
            throw exception(EXAM_LESSON_NOT_EXISTS);
        }
        if (lesson.getType() == null || lesson.getType() != LESSON_TYPE_EXAM) {
            throw exception(EXAM_LESSON_TYPE_INVALID);
        }
        if (lesson.getCourseId() != null && !lesson.getCourseId().equals(courseId)) {
            throw exception(EXAM_LESSON_COURSE_MISMATCH);
        }
        ExamDO occupied = examMapper.selectByLessonId(lessonId);
        if (occupied != null && (excludeExamId == null || !occupied.getId().equals(excludeExamId))) {
            throw exception(EXAM_LESSON_OCCUPIED);
        }
    }

    private void validateScoreRatio(Long courseId, Integer scoreRatio, Long excludeExamId) {
        if (scoreRatio == null || scoreRatio < 1 || scoreRatio > 100) {
            throw exception(EXAM_SCORE_RATIO_INVALID);
        }
        int used = 0;
        for (ExamDO exam : examMapper.selectListByCourseId(courseId)) {
            if (excludeExamId != null && excludeExamId.equals(exam.getId())) {
                continue;
            }
            if (exam.getScoreRatio() != null && exam.getScoreRatio() > 0) {
                used += exam.getScoreRatio();
            }
        }
        int remaining = Math.max(0, 100 - used);
        if (scoreRatio > remaining) {
            throw exception(EXAM_RATIO_EXCEEDED, used, remaining);
        }
    }

}
