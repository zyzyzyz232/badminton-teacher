package cn.iocoder.yudao.module.exam.service.examitemmaterial;

import java.util.List;
import javax.validation.Valid;
import cn.iocoder.yudao.module.exam.controller.admin.examitemmaterial.vo.ExamItemMaterialSaveReqVO;
import cn.iocoder.yudao.module.exam.controller.admin.examitemmaterial.vo.ExamItemMaterialUploadRespVO;
import cn.iocoder.yudao.module.exam.dal.dataobject.examitemmaterial.ExamItemMaterialDO;
import org.springframework.web.multipart.MultipartFile;

public interface ExamItemMaterialService {

    Long createExamItemMaterial(@Valid ExamItemMaterialSaveReqVO createReqVO);

    void updateExamItemMaterial(@Valid ExamItemMaterialSaveReqVO updateReqVO);

    void deleteExamItemMaterial(Long id);

    ExamItemMaterialDO getExamItemMaterial(Long id);

    List<ExamItemMaterialDO> getExamItemMaterialListByItem(Long examItemId);

    ExamItemMaterialUploadRespVO upload(MultipartFile file, Integer materialType);

    /**
     * 读取本地考试资料文件，路径非法或不存在时返回 null
     */
    java.nio.file.Path getLocalFile(String filename);

}
