package cn.iocoder.yudao.module.exam.enums;

import cn.iocoder.yudao.framework.common.exception.ErrorCode;

/**
 * exam 模块错误码，区间 1_220_000_000
 */
public interface ErrorCodeConstants {

    ErrorCode EXAM_NOT_EXISTS = new ErrorCode(1_220_000_000, "考试不存在");
    ErrorCode EXAM_SCORE_RATIO_INVALID = new ErrorCode(1_220_000_001, "考试占比须为 1–100");
    ErrorCode EXAM_RATIO_EXCEEDED = new ErrorCode(1_220_000_002, "考试占比超限，已占用 {}%，剩余 {}%");
    ErrorCode EXAM_LESSON_NOT_EXISTS = new ErrorCode(1_220_000_003, "关联课堂不存在");
    ErrorCode EXAM_LESSON_TYPE_INVALID = new ErrorCode(1_220_000_004, "关联课堂必须是考试课堂");
    ErrorCode EXAM_LESSON_COURSE_MISMATCH = new ErrorCode(1_220_000_005, "课堂不属于该课程");
    ErrorCode EXAM_LESSON_OCCUPIED = new ErrorCode(1_220_000_006, "该考试课堂已被其它考试占用");

    ErrorCode EXAM_ITEM_NOT_EXISTS = new ErrorCode(1_220_000_100, "考核项不存在");
    ErrorCode EXAM_ITEM_ALGO_TYPE_INVALID = new ErrorCode(1_220_000_101, "算法类型须为 1（动作分析）或 2（落点检测）");

    ErrorCode EXAM_ITEM_MATERIAL_NOT_EXISTS = new ErrorCode(1_220_000_200, "考核项资料不存在");
    ErrorCode EXAM_ITEM_MATERIAL_UPLOAD_EMPTY = new ErrorCode(1_220_000_201, "上传文件不能为空");
    ErrorCode EXAM_ITEM_MATERIAL_UPLOAD_FAILED = new ErrorCode(1_220_000_202, "教学资料上传失败，请稍后重试");

    ErrorCode EXAM_SCORE_NOT_EXISTS = new ErrorCode(1_220_000_300, "成绩记录不存在");
    ErrorCode EXAM_SCORE_STUDENT_REQUIRED = new ErrorCode(1_220_000_301, "学员编号不能为空");
    ErrorCode EXAM_SCORE_ALGO_TYPE_UNSUPPORTED = new ErrorCode(1_220_000_302, "该考核项暂未开放");
    ErrorCode EXAM_SCORE_STATUS_INVALID = new ErrorCode(1_220_000_303, "当前成绩状态不允许该操作");
    ErrorCode EXAM_SCORE_VIDEO_EMPTY = new ErrorCode(1_220_000_304, "考试视频不能为空");
    ErrorCode EXAM_SCORE_UPLOAD_FAILED = new ErrorCode(1_220_000_305, "考试视频上传失败，请稍后重试");
    ErrorCode EXAM_SCORE_RETRY_NEED_VIDEO = new ErrorCode(1_220_000_306, "原视频已删除，请重新提交");
    ErrorCode EXAM_SCORE_CALLBACK_UNAUTHORIZED = new ErrorCode(1_220_000_307, "算法回调鉴权失败");
    ErrorCode EXAM_SCORE_ALGO_NOT_CONFIGURED = new ErrorCode(1_220_000_308, "动作分析服务未配置");
    ErrorCode EXAM_SCORE_NO_ITEMS = new ErrorCode(1_220_000_309, "本场考试没有考核项");

}
