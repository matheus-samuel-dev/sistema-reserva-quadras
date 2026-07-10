package com.playspace.api.community;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {
    List<CommunityPost> findTop20ByOrderByCreatedAtDesc();
}
