package cn.iocoder.yudao.module.exam.controller.admin.examitemmaterial;

import cn.iocoder.yudao.framework.apilog.core.annotation.ApiAccessLog;
import cn.iocoder.yudao.framework.common.pojo.CommonResult;
import cn.iocoder.yudao.framework.common.util.object.BeanUtils;
import cn.iocoder.yudao.framework.tenant.core.aop.TenantIgnore;
import cn.iocoder.yudao.module.exam.controller.admin.examitemmaterial.vo.ExamItemMaterialRespVO;
import cn.iocoder.yudao.module.exam.controller.admin.examitemmaterial.vo.ExamItemMaterialSaveReqVO;
import cn.iocoder.yudao.module.exam.controller.admin.examitemmaterial.vo.ExamItemMaterialUploadRespVO;
import cn.iocoder.yudao.module.exam.service.examitemmaterial.ExamItemMaterialService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.Resource;
import javax.annotation.security.PermitAll;
import javax.validation.Valid;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static cn.iocoder.yudao.framework.common.pojo.CommonResult.success;

@Tag(name = "管理后台 - 考核项资料")
@RestController
@RequestMapping("/teaching/exam-item-material")
@Validated
public class ExamItemMaterialController {

    @Resource
    private ExamItemMaterialService examItemMaterialService;

    @PostMapping("/create")
    @Operation(summary = "创建考核项资料")
    public CommonResult<Long> createExamItemMaterial(@Valid @RequestBody ExamItemMaterialSaveReqVO createReqVO) {
        return success(examItemMaterialService.createExamItemMaterial(createReqVO));
    }

    @PutMapping("/update")
    @Operation(summary = "更新考核项资料")
    public CommonResult<Boolean> updateExamItemMaterial(@Valid @RequestBody ExamItemMaterialSaveReqVO updateReqVO) {
        examItemMaterialService.updateExamItemMaterial(updateReqVO);
        return success(true);
    }

    @DeleteMapping("/delete")
    @Operation(summary = "删除考核项资料")
    @Parameter(name = "id", description = "编号", required = true)
    public CommonResult<Boolean> deleteExamItemMaterial(@RequestParam("id") Long id) {
        examItemMaterialService.deleteExamItemMaterial(id);
        return success(true);
    }

    @GetMapping("/get")
    @Operation(summary = "获得考核项资料")
    @Parameter(name = "id", description = "编号", required = true)
    public CommonResult<ExamItemMaterialRespVO> getExamItemMaterial(@RequestParam("id") Long id) {
        return success(BeanUtils.toBean(examItemMaterialService.getExamItemMaterial(id), ExamItemMaterialRespVO.class));
    }

    @GetMapping("/list-by-item")
    @Operation(summary = "获得考核项下的资料列表")
    @Parameter(name = "examItemId", description = "考核项编号", required = true)
    public CommonResult<List<ExamItemMaterialRespVO>> getExamItemMaterialList(
            @RequestParam("examItemId") Long examItemId) {
        return success(BeanUtils.toBean(examItemMaterialService.getExamItemMaterialListByItem(examItemId),
                ExamItemMaterialRespVO.class));
    }

    @PostMapping("/upload")
    @Operation(summary = "上传考核项资料文件（本地落盘，不写计划资料表）")
    @ApiAccessLog(enable = false)
    public CommonResult<ExamItemMaterialUploadRespVO> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "materialType", required = false) Integer materialType) {
        return success(examItemMaterialService.upload(file, materialType));
    }

    @GetMapping("/file/{filename:.+}")
    @PermitAll
    @TenantIgnore
    @Operation(summary = "读取本地考试资料文件")
    public ResponseEntity<FileSystemResource> getFile(@PathVariable("filename") String filename) throws Exception {
        Path path = examItemMaterialService.getLocalFile(filename);
        if (path == null) {
            return ResponseEntity.notFound().build();
        }
        String contentType = Files.probeContentType(path);
        MediaType mediaType = contentType != null
                ? MediaType.parseMediaType(contentType)
                : MediaType.APPLICATION_OCTET_STREAM;
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .contentLength(Files.size(path))
                .body(new FileSystemResource(path));
    }

}
