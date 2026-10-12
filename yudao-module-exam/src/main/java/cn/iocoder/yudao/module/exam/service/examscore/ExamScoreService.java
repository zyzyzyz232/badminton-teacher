package cn.iocoder.yudao.module.exam.service.examscore;

import cn.iocoder.yudao.module.exam.controller.admin.examscore.vo.ExamScoreRespVO;
import cn.iocoder.yudao.module.exam.controller.admin.examscore.vo.ExamScoreReviewReqVO;
import cn.iocoder.yudao.module.exam.controller.admin.examscore.vo.ExamScoreStudentReqVO;
import cn.iocoder.yudao.module.exam.controller.admin.examscore.vo.ExamScoreSubmitRespVO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.List;

public interface ExamScoreService {

    ExamScoreSubmitRespVO submitVideo(MultipartFile file, Long examId, Long examItemId, Long studentId,
                                      Long classId, Integer videoDuration);

    List<ExamScoreRespVO> getScoreListByExam(Long examId);

    ExamScoreRespVO getScore(Long id);

    void review(ExamScoreReviewReqVO reqVO);

    void algoCallback(String token, String body);

    void retry(Long id);

    void markAbsent(ExamScoreStudentReqVO reqVO);

    void restartStudent(ExamScoreStudentReqVO reqVO);

    Path getLocalFile(String filename);

    ResponseEntity<byte[]> getAlgoClip(String requestId, String action, String rangeHeader);

    void pollComputingScores();

}
