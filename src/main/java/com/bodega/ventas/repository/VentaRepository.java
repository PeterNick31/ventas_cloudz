package com.bodega.ventas.repository;

import com.bodega.ventas.model.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface VentaRepository extends JpaRepository<Venta, Long> {

    @Query("SELECT v.productoId as productoId, SUM(v.cantidad) as cantidad, " +
           "CASE WHEN CAST(SUM(v.cantidad) AS integer) < 5000 THEN 'ROJO' " +
           "     WHEN CAST(SUM(v.cantidad) AS integer) BETWEEN 5000 AND 5300 THEN 'AMARILLO' " +
           "     ELSE 'VERDE' END as estado " +
           "FROM Venta v GROUP BY v.productoId")
    List<Object[]> obtenerResumenAgrupado();

    List<Venta> findByProductoId(Long productoId);
}