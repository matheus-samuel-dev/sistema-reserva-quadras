package com.playspace.api.community;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChampionshipRepository extends JpaRepository<Championship, Long> {
    List<Championship> findTop12ByOrderByStartDateAsc();
}
