package com.playspace.api.modality;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SportModalityRepository extends JpaRepository<SportModality, Long> {
    Optional<SportModality> findByCode(String code);

    Optional<SportModality> findByNormalizedName(String normalizedName);

    boolean existsByCode(String code);

    boolean existsByNormalizedName(String normalizedName);

    long countByActiveTrue();

    List<SportModality> findAllByActiveTrueOrderByNameAsc();

    List<SportModality> findAllByOrderByNameAsc();
}
