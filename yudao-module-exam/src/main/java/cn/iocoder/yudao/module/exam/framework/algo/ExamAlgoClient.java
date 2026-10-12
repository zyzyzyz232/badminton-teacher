package cn.iocoder.yudao.module.exam.framework.algo;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import cn.iocoder.yudao.module.exam.framework.config.ExamFileProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.io.File;
import java.util.regex.Pattern;

@Slf4j
@Component
public class ExamAlgoClient {

    private static final Pattern SAFE_REQUEST_ID = Pattern.compile("^[a-zA-Z0-9_-]{8,80}$");
    private static final Pattern SAFE_ACTION = Pattern.compile("^[a-zA-Z0-9_]{3,80}$");

    private final ExamFileProperties properties;
    private final RestTemplate restTemplate;

    public ExamAlgoClient(ExamFileProperties properties) {
        this.properties = properties;
        ExamFileProperties.Algo algo = properties.getAlgo();
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(algo.getConnectTimeoutMillis());
        factory.setReadTimeout(algo.getReadTimeoutMillis());
        this.restTemplate = new RestTemplate(factory);
    }

    public boolean isConfigured() {
        return StrUtil.isNotBlank(properties.getAlgo().getBaseUrl());
    }

    public ExamAlgoAnalyzeResult analyzeVideo(File file) {
        if (!isConfigured()) {
            throw new IllegalStateException("algo base-url empty");
        }
        ExamFileProperties.Algo algo = properties.getAlgo();
        String url = StrUtil.removeSuffix(algo.getBaseUrl().trim(), "/") + algo.getAnalyzePath();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new FileSystemResource(file));
        body.add("analysis_type", algo.getAnalysisType());
        body.add("wait_for_result", "false");

        ResponseEntity<String> response;
        try {
            response = restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(body, headers), String.class);
        } catch (RestClientException e) {
            log.warn("[examAlgo] analyze failed: {}", e.getMessage());
            throw e;
        }
        String raw = response.getBody();
        if (!response.getStatusCode().is2xxSuccessful() || StrUtil.isBlank(raw)) {
            throw new IllegalStateException("algo http " + response.getStatusCode().value());
        }
        JSONObject obj = JSONUtil.parseObj(raw);
        ExamAlgoAnalyzeResult result = new ExamAlgoAnalyzeResult();
        result.setRawJson(raw);
        result.setRequestId(firstNonBlank(obj.getStr("request_id"), obj.getStr("requestId")));
        result.setStatus(obj.getStr("status"));
        if (StrUtil.isBlank(result.getRequestId())) {
            throw new IllegalStateException("algo response missing request_id");
        }
        return result;
    }

    public ExamAlgoAnalyzeResult getResult(String requestId) {
        if (!isConfigured() || StrUtil.isBlank(requestId)) {
            throw new IllegalStateException("algo not configured or empty requestId");
        }
        ExamFileProperties.Algo algo = properties.getAlgo();
        String path = StrUtil.blankToDefault(algo.getResultPath(), "/api/v1/badminton/results/{requestId}");
        String url = StrUtil.removeSuffix(algo.getBaseUrl().trim(), "/")
                + path.replace("{requestId}", requestId).replace("{request_id}", requestId);
        ResponseEntity<String> response;
        try {
            response = restTemplate.getForEntity(url, String.class);
        } catch (RestClientException e) {
            log.warn("[examAlgo] getResult failed requestId={}: {}", requestId, e.getMessage());
            throw e;
        }
        String raw = response.getBody();
        if (!response.getStatusCode().is2xxSuccessful() || StrUtil.isBlank(raw)) {
            throw new IllegalStateException("algo result http " + response.getStatusCode().value());
        }
        JSONObject obj = JSONUtil.parseObj(raw);
        ExamAlgoAnalyzeResult result = new ExamAlgoAnalyzeResult();
        result.setRawJson(raw);
        result.setRequestId(firstNonBlank(obj.getStr("request_id"), obj.getStr("requestId"), requestId));
        result.setStatus(StrUtil.blankToDefault(obj.getStr("status"), "pending"));
        return result;
    }

    public ResponseEntity<byte[]> fetchClip(String requestId, String action, String rangeHeader) {
        if (!isConfigured()) {
            throw new IllegalStateException("algo base-url empty");
        }
        if (!SAFE_REQUEST_ID.matcher(StrUtil.blankToDefault(requestId, "")).matches()
                || !SAFE_ACTION.matcher(StrUtil.blankToDefault(action, "")).matches()) {
            throw new IllegalArgumentException("invalid clip id");
        }
        String url = StrUtil.removeSuffix(properties.getAlgo().getBaseUrl().trim(), "/")
                + "/api/v1/media/" + requestId + "/actions/" + action + "/clip";
        HttpHeaders headers = new HttpHeaders();
        if (StrUtil.isNotBlank(rangeHeader)) {
            headers.set("Range", rangeHeader);
        }
        try {
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<Void>(headers), byte[].class);
        } catch (RestClientException e) {
            log.warn("[examAlgo] fetchClip failed requestId={} action={}: {}", requestId, action, e.getMessage());
            throw e;
        }
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (StrUtil.isNotBlank(value)) {
                return value;
            }
        }
        return null;
    }

}
