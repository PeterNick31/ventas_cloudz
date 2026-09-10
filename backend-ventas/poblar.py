import random
from datetime import datetime, timedelta
import psycopg2

try:
    # Conexión a la base de datos local postgres-ventas
    conn = psycopg2.connect(
        host="localhost",
        port=5432,
        database="db_ventas",
        user="postgres",
        password="secret",
    )
    cursor = conn.cursor()

    print("Creando tablas en PostgreSQL...")

    # Tabla 1: Pedidos a Proveedores
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS pedidos_proveedor (
            id SERIAL PRIMARY KEY,
            proveedor_id INT NOT NULL,
            fecha_pedido DATE NOT NULL,
            monto_total DECIMAL(10,2) NOT NULL
        );
    """
    )

    # Tabla 2: Ventas Diarias (Relacionada con pedidos)
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS ventas_diarias (
            id SERIAL PRIMARY KEY,
            producto_id INT NOT NULL,
            cantidad INT NOT NULL,
            precio_unitario DECIMAL(8,2) NOT NULL,
            fecha TIMESTAMP NOT NULL,
            pedido_id INT REFERENCES pedidos_proveedor(id)
        );
    """
    )

    conn.commit()

    print("Insertando registro base en pedidos_proveedor...")
    cursor.execute(
        "INSERT INTO pedidos_proveedor (proveedor_id, fecha_pedido, monto_total) VALUES (%s, %s, %s) RETURNING id;",
        (1, "2026-01-01", 1500.00),
    )
    pedido_id = cursor.fetchone()[0]

    print("Generando 20,000 registros ficticios para ventas_diarias...")
    ventas = []
    fecha_base = datetime.now()

    for _ in range(20000):
        producto_id = random.randint(1, 50)
        cantidad = random.randint(1, 12)
        precio = round(random.uniform(2.5, 80.0), 2)
        fecha = fecha_base - timedelta(days=random.randint(0, 180))
        ventas.append((producto_id, cantidad, precio, fecha, pedido_id))

    # Inserción masiva optimizada
    cursor.executemany(
        """
        INSERT INTO ventas_diarias (producto_id, cantidad, precio_unitario, fecha, pedido_id)
        VALUES (%s, %s, %s, %s, %s);
    """,
        ventas,
    )

    conn.commit()
    print("¡Éxito! Se insertaron 20,000 registros en ventas_diarias.")

except Exception as e:
    print(f"Error al conectar o insertar datos: {e}")
finally:
    if "cursor" in locals():
        cursor.close()
    if "conn" in locals():
        conn.close()