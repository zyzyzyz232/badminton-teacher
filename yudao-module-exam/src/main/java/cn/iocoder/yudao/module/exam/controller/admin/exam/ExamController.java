package cn.iocoder.yudao.module.exam.controller.admin.exam;

import cn.iocoder.yudao.framework.common.pojo.CommonResult;
import cn.iocoder.yudao.framework.common.util.object.BeanUtils;
import cn.iocoder.yudao.module.exam.controller.admin.exam.vo.ExamRespVO;
import cn.iocoder.yudao.module.exam.controller.admin.exam.vo.ExamSaveReqVO;
import cn.iocoder.yudao.module.exam.dal.dataobject.exam.ExamDO;
import cn.iocoder.yudao.module.exam.dal.dataobject.lesson.LessonDO;
import cn.iocoder.yudao.module.exam.dal.mysql.lesson.LessonMapper;
import cn.iocoder.yudao.module.exam.service.exam.ExamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.validation.Valid;
import java.util.List;

import static cn.iocoder.yudao.framework.common.pojo.CommonResult.success;

@Tag(name = "管理后台 - 考试")
@RestController
@RequestMapping("/teaching/exam")
@Validated
public class ExamController {

    @Resource
    private ExamService examService;
    @Resource
    private LessonMapper lessonMapper;

    @PostMapping("/create")
    @Operation(summary = "创建考试")
    public CommonResult<Long> createExam(@Valid @RequestBody ExamSaveReqVO createReqVO) {
        return success(examService.createExam(createReqVO));
    }

    @PutMapping("/update")
    @Operation(summary = "更新考试")
    public CommonResult<Boolean> updateExam(@Valid @RequestBody ExamSaveReqVO updateReqVO) {
        examService.updateExam(updateReqVO);
        return success(true);
    }

    @DeleteMapping("/delete")
    @Operation(summary = "删除考试")
    @Parameter(name = "id", description = "编号", required = true)
    public CommonResult<Boolean> deleteExam(@RequestParam("id") Long id) {
        examService.deleteExam(id);
        return success(true);
    }

    @GetMapping("/get")
    @Operation(summary = "获得考试")
    @Parameter(name = "id", description = "编号", required = true)
    public CommonResult<ExamRespVO> getExam(@RequestParam("id") Long id) {
        return success(toRespVO(examService.getExam(id)));
    }

    @GetMapping("/list-by-course")
    @Operation(summary = "获得课程下的考试列表")
    @Parameter(name = "courseId", description = "课程编号", required = true)
    public CommonResult<List<ExamRespVO>> getExamListByCourse(@RequestParam("courseId") Long courseId) {
        return success(examService.getExamListByCourse(courseId));
    }

    private ExamRespVO toRespVO(ExamDO exam) {
        ExamRespVO vo = BeanUtils.toBean(exam, ExamRespVO.class);
        vo.setExamId(exam.getId());
        LessonDO lesson = lessonMapper.selectById(exam.getLessonId());
        if (lesson != null && lesson.getWeekIndex() != null) {
            vo.setWeekIndex(lesson.getWeekIndex());
            vo.setLessonWeekIndex(lesson.getWeekIndex());
        }
        return vo;
    }

}
