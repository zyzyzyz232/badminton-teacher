package cn.iocoder.yudao.module.exam.framework.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(ExamFileProperties.class)
@EnableScheduling
public class ExamFileConfiguration {
}
