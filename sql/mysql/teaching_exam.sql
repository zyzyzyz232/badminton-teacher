-- exam mode phase-1 DDL for teaching-platform
-- teaching_exam_item already exists (lesson_id only); ALTER adds exam_id.

CREATE TABLE IF NOT EXISTS `teaching_exam` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'exam id',
  `course_id` bigint NOT NULL COMMENT 'course id',
  `lesson_id` bigint NOT NULL COMMENT 'exam lesson id, type=2',
  `title` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'title',
  `score_ratio` int NOT NULL COMMENT 'score ratio 1-100',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '0 config 1 ready 2 running 3 finished',
  `creator` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'creator',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'create time',
  `updater` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'updater',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'update time',
  `deleted` tinyint NOT NULL DEFAULT '0' COMMENT 'deleted',
  `tenant_id` bigint NOT NULL DEFAULT '0' COMMENT 'tenant',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_teaching_exam_lesson` (`lesson_id`,`deleted`,`tenant_id`) USING BTREE,
  KEY `idx_teaching_exam_course` (`course_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='exam header';

ALTER TABLE `teaching_exam_item`
  ADD COLUMN `exam_id` bigint NULL COMMENT 'exam id' AFTER `id`,
  ADD COLUMN `algo_type` tinyint NOT NULL DEFAULT 1 COMMENT '1 action 2 landing' AFTER `weight`,
  ADD COLUMN `sort_order` int NOT NULL DEFAULT 0 COMMENT 'sort' AFTER `algo_type`,
  MODIFY COLUMN `lesson_id` bigint NULL COMMENT 'lesson id redundant';

ALTER TABLE `teaching_exam_item`
  ADD INDEX `idx_teaching_exam_item_exam` (`exam_id`);

CREATE TABLE IF NOT EXISTS `teaching_exam_item_material` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'id',
  `exam_item_id` bigint NOT NULL COMMENT 'exam item id',
  `material_type` tinyint NOT NULL COMMENT '1 image 2 video',
  `image_url` varchar(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'image url',
  `video_url` varchar(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'video url',
  `duration` int DEFAULT NULL COMMENT 'duration sec',
  `title` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'title',
  `description` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'description',
  `sort` int NOT NULL DEFAULT '0' COMMENT 'sort',
  `creator` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'creator',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'create time',
  `updater` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'updater',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'update time',
  `deleted` tinyint NOT NULL DEFAULT '0' COMMENT 'deleted',
  `tenant_id` bigint NOT NULL DEFAULT '0' COMMENT 'tenant',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_exam_item_material_item` (`exam_item_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='exam item material';

-- phase-3 exam score
CREATE TABLE IF NOT EXISTS `teaching_exam_score` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'score id',
  `exam_id` bigint DEFAULT NULL COMMENT 'exam id',
  `class_id` bigint DEFAULT NULL COMMENT 'class id',
  `student_id` bigint NOT NULL COMMENT 'system_users.id',
  `exam_item_id` bigint NOT NULL COMMENT 'exam item id',
  `video_url` varchar(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'exam video url',
  `video_duration` int DEFAULT NULL COMMENT 'duration sec',
  `ai_callback_time` datetime DEFAULT NULL COMMENT 'algo callback time',
  `algo_score` decimal(5,2) DEFAULT NULL COMMENT 'AI score',
  `final_score` decimal(5,2) DEFAULT NULL COMMENT 'teacher score',
  `comment` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'teacher comment',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '0 pending 1 computing 2 review 3 done 4 fail 5 absent',
  `algo_request_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'algo request id',
  `result_json` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'raw algo json',
  `result_summary` varchar(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'algo summary',
  `video_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '1 deleted original video',
  `fail_reason` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'fail reason',
  `creator` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'creator',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'create time',
  `updater` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'updater',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'update time',
  `deleted` tinyint NOT NULL DEFAULT '0' COMMENT 'deleted',
  `tenant_id` bigint NOT NULL DEFAULT '0' COMMENT 'tenant',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_exam_score_exam` (`exam_id`) USING BTREE,
  KEY `idx_exam_score_student_item` (`student_id`,`exam_item_id`) USING BTREE,
  KEY `idx_exam_score_request` (`algo_request_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='exam score';

-- If teaching_exam_score already existed (course_id/lesson_id only), add:
-- ALTER TABLE teaching_exam_score ADD COLUMN exam_id bigint NULL AFTER id;
-- ALTER TABLE teaching_exam_score ADD COLUMN class_id bigint NULL AFTER exam_id;
-- ALTER TABLE teaching_exam_score ADD COLUMN algo_request_id varchar(64) NULL AFTER status;
-- ALTER TABLE teaching_exam_score ADD COLUMN result_json mediumtext AFTER algo_request_id;
-- ALTER TABLE teaching_exam_score ADD COLUMN result_summary varchar(1024) NULL AFTER result_json;
-- ALTER TABLE teaching_exam_score ADD COLUMN video_deleted tinyint NOT NULL DEFAULT 0 AFTER result_summary;
-- ALTER TABLE teaching_exam_score ADD COLUMN fail_reason varchar(512) NULL AFTER video_deleted;
-- ALTER TABLE teaching_exam_score ADD INDEX idx_exam_score_exam (exam_id);
-- ALTER TABLE teaching_exam_score ADD INDEX idx_exam_score_student_item (student_id, exam_item_id);
-- ALTER TABLE teaching_exam_score ADD INDEX idx_exam_score_request (algo_request_id);


