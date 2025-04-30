document.addEventListener('DOMContentLoaded', () => {
    console.log('Archivo dashboard.js cargado correctamente.');

    // Gráfica de Estilo y Color
    const estiloColorCtx = document.getElementById('graficaEstiloColor');
    let estiloColorChart; // Variable para almacenar la instancia de la gráfica
    let chartType = 'line'; // Tipo de gráfica inicial

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
                    data: estilos.map((estilo, index) => ({
                        x: estilo, // Usar el nombre del estilo como valor en el eje X
                        y: data[estilo][color] // Valor en el eje Y
                    })), // Datos para la gráfica de puntos
                    borderColor: getColorForLabel(color), // Asignar color a la línea
                    backgroundColor: getColorForLabel(color),
                    fill: false,
                    tension: 0.1,
                    pointRadius: 5, // Tamaño normal de los puntos
                    pointHoverRadius: 7 // Tamaño al pasar el mouse
                }));

                // Crear la gráfica
                estiloColorChart = new Chart(estiloColorCtx, {
                    type: chartType, // Gráfica inicial (línea)
                    data: {
                        labels: estilos, // Etiquetas en el eje X (estilos)
                        datasets: datasets // Conjuntos de datos (colores)
                    },
                    options: {
                        interaction: {
                            mode: 'nearest', // Interacción con el punto más cercano
                            axis: 'x', // Interacción en el eje X
                            intersect: true // Solo interactuar con puntos específicos
                        },
                        plugins: {
                            legend: {
                                position: 'top'
                            },
                            title: {
                                display: true,
                                text: 'Recomendaciones por Estilo y Color'
                            }
                        },
                        scales: {
                            x: {
                                type: 'category', // Mostrar categorías en el eje X
                                labels: estilos // Etiquetas en el eje X
                            },
                            y: {
                                beginAtZero: true // Comenzar el eje Y desde 0
                            }
                        }
                    }
                });

                // Agregar funcionalidad para alternar el tipo de gráfica
                document.getElementById('toggleChartType').addEventListener('click', () => {
                    chartType = chartType === 'line' ? 'scatter' : 'line'; // Alternar entre 'line' y 'scatter'

                    // Destruir la gráfica actual y crear una nueva
                    estiloColorChart.destroy();
                    estiloColorChart = new Chart(estiloColorCtx, {
                        type: chartType,
                        data: {
                            labels: estilos,
                            datasets: datasets
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                legend: {
                                    position: 'top'
                                },
                                title: {
                                    display: true,
                                    text: 'Recomendaciones por Estilo y Color'
                                }
                            },
                            scales: {
                                x: {
                                    type: chartType === 'scatter' ? 'category' : 'category', // Mostrar categorías en ambos casos
                                    labels: estilos // Etiquetas en el eje X
                                },
                                y: {
                                    beginAtZero: true
                                }
                            }
                        }
                    });

                    // Cambiar el texto del botón
                    document.getElementById('toggleChartType').textContent =
                        chartType === 'line' ? 'Cambiar a Gráfica de Puntos' : 'Cambiar a Gráfica de Líneas';
                });

                // Generar resumen de recomendaciones
                const resumenContainer = document.getElementById('resumenRecomendaciones');
                let resumenHTML = '<h5>Resumen de Recomendaciones</h5><ul>';
                colores.forEach(color => {
                    const total = estilos.reduce((sum, estilo) => sum + data[estilo][color], 0);
                    resumenHTML += `<li>${color}: ${total} recomendaciones</li>`;
                });
                resumenHTML += '</ul>';
                resumenContainer.innerHTML = resumenHTML;
            })
            .catch(error => console.error('Error al cargar datos de estilo y color:', error));
    }

    // Función para actualizar las recomendaciones en tiempo real
    const actualizarRecomendaciones = () => {
        fetch('/recommendations/api/')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al obtener las recomendaciones');
                }
                return response.json();
            })
            .then(data => {
                const recomendacionesContainer = document.getElementById('recomendacionesContainer');
                if (data.recomendaciones && data.recomendaciones.length > 0) {
                    let html = '';
                    data.recomendaciones.forEach(rec => {
                        html += `
                            <div class="col-md-4 mb-4">
                                <div class="card h-100 shadow-hover">
                                    <img src="${rec.imagen}" class="card-img-top" alt="${rec.titulo}" style="height: 300px; object-fit: cover;">
                                    <div class="card-body">
                                        <h5 class="card-title">${rec.titulo}</h5>
                                        <p class="card-text">Puntuación: ${rec.puntuacion}%</p>
                                        <ul>
                                            ${rec.razones.map(razon => `<li>${razon}</li>`).join('')}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                    recomendacionesContainer.innerHTML = html;
                } else {
                    recomendacionesContainer.innerHTML = `
                        <div class="alert alert-info">
                            No encontramos recomendaciones en este momento.
                        </div>
                    `;
                }
            })
            .catch(error => console.error('Error al actualizar las recomendaciones:', error));
    };

    // Llamar a la función cada 30 segundos
    setInterval(actualizarRecomendaciones, 30000);

    // Llamar a la función inmediatamente al cargar la página
    actualizarRecomendaciones();
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