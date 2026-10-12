package cn.iocoder.yudao.module.exam.service.examitem;

import cn.iocoder.yudao.framework.common.util.object.BeanUtils;
import cn.iocoder.yudao.framework.mybatis.core.query.LambdaQueryWrapperX;
import cn.iocoder.yudao.module.exam.controller.admin.examitem.vo.ExamItemSaveReqVO;
import cn.iocoder.yudao.module.exam.dal.dataobject.exam.ExamDO;
import cn.iocoder.yudao.module.exam.dal.dataobject.examitem.ExamItemDO;
import cn.iocoder.yudao.module.exam.dal.dataobject.examitemmaterial.ExamItemMaterialDO;
import cn.iocoder.yudao.module.exam.dal.mysql.exam.ExamMapper;
import cn.iocoder.yudao.module.exam.dal.mysql.examitem.ExamItemMapper;
import cn.iocoder.yudao.module.exam.dal.mysql.examitemmaterial.ExamItemMaterialMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import javax.annotation.Resource;
import java.util.List;

import static cn.iocoder.yudao.framework.common.exception.util.ServiceExceptionUtil.exception;
import static cn.iocoder.yudao.module.exam.enums.ErrorCodeConstants.*;

@Service
@Validated
public class ExamItemServiceImpl implements ExamItemService {

    @Resource
    private ExamItemMapper examItemMapper;
    @Resource
    private ExamMapper examMapper;
    @Resource
    private ExamItemMaterialMapper examItemMaterialMapper;

    @Override
    public Long createExamItem(ExamItemSaveReqVO createReqVO) {
        ExamDO exam = validateExamExists(createReqVO.getExamId());
        validateAlgoType(createReqVO.getAlgoType());
        ExamItemDO item = BeanUtils.toBean(createReqVO, ExamItemDO.class);
        item.setId(null);
        item.setLessonId(exam.getLessonId());
        if (item.getSortOrder() == null) {
            item.setSortOrder(0);
        }
        examItemMapper.insert(item);
        return item.getId();
    }

    @Override
    public void updateExamItem(ExamItemSaveReqVO updateReqVO) {
        if (updateReqVO.getId() == null) {
            throw exception(EXAM_ITEM_NOT_EXISTS);
        }
        validateExamItemExists(updateReqVO.getId());
        ExamDO exam = validateExamExists(updateReqVO.getExamId());
        validateAlgoType(updateReqVO.getAlgoType());
        ExamItemDO updateObj = BeanUtils.toBean(updateReqVO, ExamItemDO.class);
        updateObj.setLessonId(exam.getLessonId());
        examItemMapper.updateById(updateObj);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteExamItem(Long id) {
        validateExamItemExists(id);
        examItemMaterialMapper.delete(new LambdaQueryWrapperX<ExamItemMaterialDO>()
                .eq(ExamItemMaterialDO::getExamItemId, id));
        examItemMapper.deleteById(id);
    }

    @Override
    public ExamItemDO getExamItem(Long id) {
        return validateExamItemExists(id);
    }

    @Override
    public List<ExamItemDO> getExamItemListByExam(Long examId) {
        return examItemMapper.selectListByExamId(examId);
    }

    private ExamDO validateExamExists(Long examId) {
        ExamDO exam = examMapper.selectById(examId);
        if (exam == null) {
            throw exception(EXAM_NOT_EXISTS);
        }
        return exam;
    }

    private ExamItemDO validateExamItemExists(Long id) {
        ExamItemDO item = examItemMapper.selectById(id);
        if (item == null) {
            throw exception(EXAM_ITEM_NOT_EXISTS);
        }
        return item;
    }

    private void validateAlgoType(Integer algoType) {
        if (algoType == null || (algoType != 1 && algoType != 2)) {
            throw exception(EXAM_ITEM_ALGO_TYPE_INVALID);
        }
    }

}
