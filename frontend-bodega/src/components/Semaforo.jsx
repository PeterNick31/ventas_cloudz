import React, { useEffect, useState } from 'react';

export default function Semaforo() {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8082/ventas')
      .then((res) => res.json())
      .then((data) => setProductos(data))
      .catch((err) => console.error('Error al cargar ventas:', err));
  }, []);

  const getBadgesByCantidad = (cantidad) => {
    // Umbrales adaptados al volumen de los 20,000 registros (rango aprox. 2200 - 2900)
    if (cantidad < 2400) {
      return { color: '#ef4444', text: 'Baja Rotación (Alerta)' };
    } else if (cantidad >= 2400 && cantidad <= 2700) {
      return { color: '#eab308', text: 'Rotación Media' };
    } else {
      return { color: '#22c55e', text: 'Alta Rotación (Top Ventas)' };
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
        📊 Semáforo de Ventas - Rotación de Productos
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
        {productos.map((prod) => {
          const badge = getBadgesByCantidad(prod.cantidad);
          return (
            <div
              key={prod.productoId}
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: '0 0 8px 0' }}>
                Producto #{prod.productoId}
              </h3>
              
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 12px 0' }}>
                Ventas Acumuladas: <strong style={{ color: '#111827' }}>{prod.cantidad}</strong>
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: badge.color,
                    display: 'inline-block'
                  }}
                ></span>
                <span style={{ fontSize: '12px', fontWeight: '500', color: '#4b5563' }}>
                  {badge.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}