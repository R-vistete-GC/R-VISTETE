document.addEventListener('DOMContentLoaded', () => {
    console.log('Archivo dashboard.js cargado correctamente.');

    const sentimientosData = JSON.parse(document.getElementById('sentimientosData').textContent);
    console.log('Datos de sentimientos:', sentimientosData);

    const recomendacionesDataElement = document.getElementById('recomendacionesData');
    if (recomendacionesDataElement) {
        const recomendacionesData = JSON.parse(recomendacionesDataElement.textContent);
        console.log('Datos de recomendaciones:', recomendacionesData);
    } else {
        console.error('El elemento recomendacionesData no existe en el DOM.');
    }

    // Añade estas opciones comunes a todas las gráficas
    const commonOptions = { ... };
    const pieOptions = { ... };
    const barOptions = { ... };

    // Modificar la sección de Distribución de Estilos
    const estilosDistribucionCtx = document.getElementById('graficaDistribucionEstilos');
    if (estilosDistribucionCtx) {
        // Todo el bloque relacionado con estilosDistribucionChart
    }

    // Gráfica de Sentimientos
    const sentimientosCtx = document.getElementById('sentimientosChart');
    let sentimientosChart;
    if (sentimientosCtx) {
        // Todo el bloque relacionado con sentimientosChart
    }

    // Obtener datos de sentimientos
    fetch('/users/dashboard/sentimientos/')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener datos de sentimientos');
            }
            return response.json();
        })
        .then(data => {
            console.log('Datos de sentimientos recibidos:', data);
            // Aquí puedes actualizar tu gráfica con los datos
            // Por ejemplo:
            if (sentimientosChart) {
                sentimientosChart.data.datasets[0].data = [
                    data.positivos || 0,
                    data.neutros || 0,
                    data.negativos || 0
                ];
                sentimientosChart.update();
            }
        })
        .catch(error => {
            console.error('Error al cargar datos de sentimientos:', error);
        });

    // Gráfica de distribución de colores
    const coloresDistribucionCtx = document.getElementById('coloresDistribucionChart');
    if (coloresDistribucionCtx) {
        // Todo el bloque relacionado con coloresDistribucionChart
    }

    // Gráfica de recomendaciones
    const recomendacionesChartElement = document.getElementById('recomendacionesChart');
    if (recomendacionesDataElement && recomendacionesChartElement) {
        // Todo el bloque relacionado con recomendacionesChart
    }

    // Gráfica de Sentimientos en Publicaciones Interactuadas
    const ctxSentimientosInteractuados = document.getElementById('graficaSentimientosInteractuados');
    if (ctxSentimientosInteractuados) {
        // Todo el bloque relacionado con sentimientosInteractuadosChart
    }

    // Gráfica de Evolución Temporal de Sentimientos
    const ctxEvolucionSentimientos = document.getElementById('graficaEvolucionSentimientos');
    if (ctxEvolucionSentimientos) {
        // Todo el bloque relacionado con graficaEvolucionSentimientos
    }

    // Gráfica de Estilo y Color
    const estiloColorCtx = document.getElementById('graficaEstiloColor');
    if (estiloColorCtx) {
        fetch('/users/dashboard/recomendaciones-estilo-color/')
            .then(response => response.json())
            .then(data => {
                console.log('Datos recibidos para la gráfica de estilo y color:', data);

                const estilos = Object.keys(data); // Estilos como 'casual', 'formal', etc.
                const colores = Object.keys(data[estilos[0]]); // Colores como 'azul', 'negro', etc.

                // Preparar datasets para cada color
                const datasets = colores.map(color => ({
                    label: color, // Nombre del color
                    data: estilos.map(estilo => data[estilo][color]), // Valores para cada estilo
                    borderColor: getColorForLabel(color), // Asignar color a la línea
                    backgroundColor: getColorForLabel(color),
                    fill: false,
                    tension: 0.1
                }));

                // Crear la gráfica
                new Chart(estiloColorCtx, {
                    type: 'line', // Gráfica lineal
                    data: {
                        labels: estilos, // Etiquetas en el eje X (estilos)
                        datasets: datasets // Conjuntos de datos (colores)
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'top' // Posición de la leyenda
                            },
                            title: {
                                display: true,
                                text: 'Recomendaciones por Estilo y Color'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true // Comenzar el eje Y desde 0
                            }
                        }
                    }
                });
            })
            .catch(error => console.error('Error al cargar datos de estilo y color:', error));
    }

    // Función para actualizar estadísticas en tiempo real
    const actualizarEstadisticas = () => {
        fetch('/users/dashboard/data/') // Ruta para obtener datos en tiempo real
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al obtener datos de la API');
                }
                return response.json();
            })
            .then(data => {
                // Actualizar los valores en el DOM
                document.querySelector('#totalPublicaciones').textContent = data.total_publicaciones || 0;
                document.querySelector('#totalVentas').textContent = data.total_ventas || 0;
                document.querySelector('#totalAlquileres').textContent = data.total_alquileres || 0;
                document.querySelector('#totalLikes').textContent = data.total_likes || 0;
                document.querySelector('#totalFavoritos').textContent = data.total_favoritos || 0;
                document.querySelector('#totalRecomendaciones').textContent = data.total_recomendaciones || 0;
                document.querySelector('#totalCompras').textContent = data.total_compras || 0;
            })
            .catch(error => console.error('Error al actualizar estadísticas:', error));
    };

    // Llamar a la función cada 30 segundos
    setInterval(actualizarEstadisticas, 30000);

    // Llamar a la función inmediatamente al cargar la página
    actualizarEstadisticas();
});

// Función para asignar colores a las líneas
function getColorForLabel(label) {
    const colorMap = {
        'azul': '#36A2EB',
        'negro': '#000000',
        'rojo': '#FF6384',
        'verde': '#4BC0C0',
        'amarillo': '#FFCE56',
        'blanco': '#FFFFFF',
        'gris': '#808080',
        'marrón': '#A52A2A'
    };
    return colorMap[label] || '#000000';
}