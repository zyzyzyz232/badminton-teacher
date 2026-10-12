package cn.iocoder.yudao.module.exam.service.examitem;

import java.util.List;
import javax.validation.Valid;
import cn.iocoder.yudao.module.exam.controller.admin.examitem.vo.ExamItemSaveReqVO;
import cn.iocoder.yudao.module.exam.dal.dataobject.examitem.ExamItemDO;

public interface ExamItemService {

    Long createExamItem(@Valid ExamItemSaveReqVO createReqVO);

    void updateExamItem(@Valid ExamItemSaveReqVO updateReqVO);

    void deleteExamItem(Long id);

    ExamItemDO getExamItem(Long id);

    List<ExamItemDO> getExamItemListByExam(Long examId);

}
