package com.playspace.api.community;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PartnerAdRepository extends JpaRepository<PartnerAd, Long> {
    List<PartnerAd> findTop20ByOrderByCreatedAtDesc();
}
