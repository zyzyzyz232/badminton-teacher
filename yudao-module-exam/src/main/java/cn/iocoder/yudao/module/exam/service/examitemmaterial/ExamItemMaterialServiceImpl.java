package cn.iocoder.yudao.module.exam.service.examitemmaterial;

import cn.hutool.core.io.FileUtil;
import cn.hutool.core.io.IoUtil;
import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import cn.iocoder.yudao.framework.common.util.object.BeanUtils;
import cn.iocoder.yudao.module.exam.controller.admin.examitemmaterial.vo.ExamItemMaterialSaveReqVO;
import cn.iocoder.yudao.module.exam.controller.admin.examitemmaterial.vo.ExamItemMaterialUploadRespVO;
import cn.iocoder.yudao.module.exam.dal.dataobject.examitem.ExamItemDO;
import cn.iocoder.yudao.module.exam.dal.dataobject.examitemmaterial.ExamItemMaterialDO;
import cn.iocoder.yudao.module.exam.dal.mysql.examitem.ExamItemMapper;
import cn.iocoder.yudao.module.exam.dal.mysql.examitemmaterial.ExamItemMaterialMapper;
import cn.iocoder.yudao.module.exam.framework.config.ExamFileProperties;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.multipart.MultipartFile;
import lombok.extern.slf4j.Slf4j;

import javax.annotation.Resource;
import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import static cn.iocoder.yudao.framework.common.exception.util.ServiceExceptionUtil.exception;
import static cn.iocoder.yudao.module.exam.enums.ErrorCodeConstants.*;

@Service
@Validated
@Slf4j
public class ExamItemMaterialServiceImpl implements ExamItemMaterialService {

    @Resource
    private ExamItemMaterialMapper examItemMaterialMapper;
    @Resource
    private ExamItemMapper examItemMapper;
    @Resource
    private ExamFileProperties examFileProperties;

    @Override
    public Long createExamItemMaterial(ExamItemMaterialSaveReqVO createReqVO) {
        validateExamItemExists(createReqVO.getExamItemId());
        ExamItemMaterialDO material = BeanUtils.toBean(createReqVO, ExamItemMaterialDO.class);
        material.setId(null);
        if (material.getSort() == null) {
            material.setSort(0);
        }
        examItemMaterialMapper.insert(material);
        return material.getId();
    }

    @Override
    public void updateExamItemMaterial(ExamItemMaterialSaveReqVO updateReqVO) {
        if (updateReqVO.getId() == null) {
            throw exception(EXAM_ITEM_MATERIAL_NOT_EXISTS);
        }
        validateExamItemMaterialExists(updateReqVO.getId());
        validateExamItemExists(updateReqVO.getExamItemId());
        examItemMaterialMapper.updateById(BeanUtils.toBean(updateReqVO, ExamItemMaterialDO.class));
    }

    @Override
    public void deleteExamItemMaterial(Long id) {
        validateExamItemMaterialExists(id);
        examItemMaterialMapper.deleteById(id);
    }

    @Override
    public ExamItemMaterialDO getExamItemMaterial(Long id) {
        return validateExamItemMaterialExists(id);
    }

    @Override
    public List<ExamItemMaterialDO> getExamItemMaterialListByItem(Long examItemId) {
        return examItemMaterialMapper.selectListByExamItemId(examItemId);
    }

    @Override
    public ExamItemMaterialUploadRespVO upload(MultipartFile file, Integer materialType) {
        if (file == null || file.isEmpty()) {
            throw exception(EXAM_ITEM_MATERIAL_UPLOAD_EMPTY);
        }
        try {
            byte[] content = IoUtil.readBytes(file.getInputStream());
            File dir = new File(examFileProperties.getFileDir());
            FileUtil.mkdir(dir);
            String ext = FileUtil.extName(file.getOriginalFilename());
            String stored = IdUtil.fastSimpleUUID() + (StrUtil.isNotEmpty(ext) ? "." + ext : "");
            FileUtil.writeBytes(content, new File(dir, stored));
            String url = examFileProperties.getFileUrlPrefix() + "/" + stored;
            log.info("[upload] exam material saved file={}, url={}", stored, url);
            int type = materialType != null ? materialType : 1;
            ExamItemMaterialUploadRespVO resp = ExamItemMaterialUploadRespVO.builder()
                    .url(url)
                    .duration(null)
                    .build();
            if (type == 2) {
                resp.setVideoUrl(url);
            } else {
                resp.setImageUrl(url);
            }
            return resp;
        } catch (Exception ex) {
            log.error("[upload] 考核项资料上传失败", ex);
            throw exception(EXAM_ITEM_MATERIAL_UPLOAD_FAILED);
        }
    }

    @Override
    public Path getLocalFile(String filename) {
        if (StrUtil.isBlank(filename) || filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            return null;
        }
        Path dir = Paths.get(examFileProperties.getFileDir()).toAbsolutePath().normalize();
        Path file = dir.resolve(filename).normalize();
        if (!file.startsWith(dir) || !file.toFile().isFile()) {
            return null;
        }
        return file;
    }

    private ExamItemDO validateExamItemExists(Long examItemId) {
        ExamItemDO item = examItemMapper.selectById(examItemId);
        if (item == null) {
            throw exception(EXAM_ITEM_NOT_EXISTS);
        }
        return item;
    }

    private ExamItemMaterialDO validateExamItemMaterialExists(Long id) {
        ExamItemMaterialDO material = examItemMaterialMapper.selectById(id);
        if (material == null) {
            throw exception(EXAM_ITEM_MATERIAL_NOT_EXISTS);
        }
        return material;
    }

}
