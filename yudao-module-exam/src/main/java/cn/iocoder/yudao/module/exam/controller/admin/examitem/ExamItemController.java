package cn.iocoder.yudao.module.exam.controller.admin.examitem;

import cn.iocoder.yudao.framework.common.pojo.CommonResult;
import cn.iocoder.yudao.framework.common.util.object.BeanUtils;
import cn.iocoder.yudao.module.exam.controller.admin.examitem.vo.ExamItemRespVO;
import cn.iocoder.yudao.module.exam.controller.admin.examitem.vo.ExamItemSaveReqVO;
import cn.iocoder.yudao.module.exam.service.examitem.ExamItemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.validation.Valid;
import java.util.List;

import static cn.iocoder.yudao.framework.common.pojo.CommonResult.success;

@Tag(name = "管理后台 - 考试考核项")
@RestController
@RequestMapping("/teaching/exam-item")
@Validated
public class ExamItemController {

    @Resource
    private ExamItemService examItemService;

    @PostMapping("/create")
    @Operation(summary = "创建考核项")
    public CommonResult<Long> createExamItem(@Valid @RequestBody ExamItemSaveReqVO createReqVO) {
        return success(examItemService.createExamItem(createReqVO));
    }

    @PutMapping("/update")
    @Operation(summary = "更新考核项")
    public CommonResult<Boolean> updateExamItem(@Valid @RequestBody ExamItemSaveReqVO updateReqVO) {
        examItemService.updateExamItem(updateReqVO);
        return success(true);
    }

    @DeleteMapping("/delete")
    @Operation(summary = "删除考核项")
    @Parameter(name = "id", description = "编号", required = true)
    public CommonResult<Boolean> deleteExamItem(@RequestParam("id") Long id) {
        examItemService.deleteExamItem(id);
        return success(true);
    }

    @GetMapping("/get")
    @Operation(summary = "获得考核项")
    @Parameter(name = "id", description = "编号", required = true)
    public CommonResult<ExamItemRespVO> getExamItem(@RequestParam("id") Long id) {
        return success(BeanUtils.toBean(examItemService.getExamItem(id), ExamItemRespVO.class));
    }

    @GetMapping("/list-by-exam")
    @Operation(summary = "获得考试下的考核项列表")
    @Parameter(name = "examId", description = "考试编号", required = true)
    public CommonResult<List<ExamItemRespVO>> getExamItemListByExam(@RequestParam("examId") Long examId) {
        return success(BeanUtils.toBean(examItemService.getExamItemListByExam(examId), ExamItemRespVO.class));
    }

}
