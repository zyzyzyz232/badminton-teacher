package cn.iocoder.yudao.module.exam.framework.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 考试资料本地存储与动作分析配置。旁路环境不走现网七牛示例桶。
 */
@ConfigurationProperties(prefix = "yudao.exam")
@Data
public class ExamFileProperties {

    /**
     * 本地落盘目录
     */
    private String fileDir = "E:/badminton_new/badminton-teacher/yudao-boot-mini/file-storage";

    /**
     * 小程序可访问的资料文件 URL 前缀（不含末尾 /）
     */
    private String fileUrlPrefix = "http://10.29.108.157:48081/admin-api/teaching/exam-item-material/file";

    /**
     * 考试成绩视频 URL 前缀（不含末尾 /）
     */
    private String scoreFileUrlPrefix = "http://10.29.108.157:48081/admin-api/teaching/exam-score/file";

    /**
     * 动作片段代理 URL 前缀（不含末尾 / 与 query）
     */
    private String scoreClipUrlPrefix = "http://10.29.108.157:48081/admin-api/teaching/exam-score/algo-clip";

    private Algo algo = new Algo();

    @Data
    public static class Algo {
        private String baseUrl = "http://10.101.166.129:8000";
        private String analyzePath = "/api/v1/badminton/analyze-video";
        private String resultPath = "/api/v1/badminton/results/{requestId}";
        private String analysisType = "repeated_forehand_high_serve";
        private String callbackToken = "exam-algo-callback";
        private int connectTimeoutMillis = 15000;
        private int readTimeoutMillis = 120000;
    }

}
