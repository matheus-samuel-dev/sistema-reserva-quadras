package com.playspace.api.settings;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlatformSettingsRepository extends JpaRepository<PlatformSettings, Long> {
    Optional<PlatformSettings> findFirstByOrderByIdAsc();
}
