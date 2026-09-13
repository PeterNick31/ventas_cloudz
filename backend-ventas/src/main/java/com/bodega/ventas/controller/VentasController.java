package com.bodega.ventas.controller;

import com.bodega.ventas.model.Venta;
import com.bodega.ventas.repository.VentaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ventas")
@CrossOrigin(origins = "${APP_CORS_ORIGINS:http://localhost:5173}")
public class VentasController {

    @Autowired
    private VentaRepository ventaRepository;

    // 1. Endpoint POST: Registrar venta diaria
    @PostMapping
    public Venta registrarVenta(@RequestBody Venta venta) {
        if (venta.getProductoId() == null || venta.getCantidad() == null || venta.getCantidad() <= 0
                || venta.getPrecioUnitario() == null || venta.getPrecioUnitario().signum() < 0) {
            throw new IllegalArgumentException(
                    "productoId, cantidad positiva y precioUnitario no negativo son obligatorios");
        }
        if (venta.getFecha() == null) {
            venta.setFecha(LocalDateTime.now());
        }
        return ventaRepository.save(venta);
    }

    // 2. Endpoint GET: Resumen consolidado por producto para el Semáforo
    @GetMapping
    public List<Map<String, Object>> obtenerTodasLasVentas() {
        List<Object[]> resultados = ventaRepository.obtenerResumenAgrupado();
        List<Map<String, Object>> respuesta = new ArrayList<>();

        for (Object[] fila : resultados) {
            Map<String, Object> map = new HashMap<>();
            map.put("productoId", fila[0]);
            map.put("cantidad", fila[1]);
            map.put("estado", fila[2]);
            respuesta.add(map);
        }
        return respuesta;
    }

    // 3. Endpoint GET: Consultar historial de ventas por producto
    @GetMapping("/{productoId}")
    public List<Venta> obtenerHistorialPorProducto(@PathVariable Long productoId) {
        return ventaRepository.findByProductoId(productoId);
    }

}
