package cn.iocoder.yudao.module.exam.service.examscore;

import cn.iocoder.yudao.framework.tenant.core.util.TenantUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;

@Slf4j
@Component
public class ExamScorePollJob {

    private static final long DEFAULT_TENANT_ID = 1L;

    @Resource
    private ExamScoreService examScoreService;

    @Scheduled(fixedDelay = 5000L, initialDelay = 8000L)
    public void poll() {
        try {
            TenantUtils.execute(DEFAULT_TENANT_ID, () -> examScoreService.pollComputingScores());
        } catch (Exception ex) {
            log.warn("[examScore] poll job failed: {}", ex.getMessage());
        }
    }

}
