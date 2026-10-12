package cn.iocoder.yudao.module.exam.service.exam;

import java.util.List;
import javax.validation.Valid;
import cn.iocoder.yudao.module.exam.controller.admin.exam.vo.ExamRespVO;
import cn.iocoder.yudao.module.exam.controller.admin.exam.vo.ExamSaveReqVO;
import cn.iocoder.yudao.module.exam.dal.dataobject.exam.ExamDO;

public interface ExamService {

    Long createExam(@Valid ExamSaveReqVO createReqVO);

    void updateExam(@Valid ExamSaveReqVO updateReqVO);

    void deleteExam(Long id);

    ExamDO getExam(Long id);

    List<ExamRespVO> getExamListByCourse(Long courseId);

}
