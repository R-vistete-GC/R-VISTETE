document.addEventListener('DOMContentLoaded', () => {
    console.log('El archivo dashboard.js se está ejecutando correctamente.');

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
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    boxWidth: 10,
                    font: {
                        size: 11
                    },
                    padding: 5
                }
            }
        },
        layout: {
            padding: {
                top: 5,
                bottom: 5
            }
        }
    };

    // Ejemplo para una gráfica circular
    const pieOptions = {
        ...commonOptions,
        aspectRatio: 1.2,
        plugins: {
            ...commonOptions.plugins
        }
    };

    // Ejemplo para una gráfica de barras
    const barOptions = {
        ...commonOptions,
        aspectRatio: 1.5,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    font: {
                        size: 10
                    }
                }
            },
            x: {
                ticks: {
                    font: {
                        size: 10
                    }
                }
            }
        }
    };

    // Gráfica de sentimientos (versión dona)
    const sentimientosCtx = document.getElementById('sentimientosChart');
    if (sentimientosCtx) {
        const ctx = sentimientosCtx.getContext('2d');
        const sentimientosChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Positivos', 'Neutros', 'Negativos'],
                datasets: [{
                    data: [40, 35, 25],
                    backgroundColor: ['#4caf50', '#ffeb3b', '#f44336'],
                }]
            },
            options: {
                ...pieOptions,
                plugins: {
                    ...pieOptions.plugins,
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.raw}%`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Gráfica de estilos preferidos
    const estilosCtx = document.getElementById('estilosChart');
    if (estilosCtx) {
        const ctx = estilosCtx.getContext('2d');
        const estilosChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Casual', 'Elegante', 'Deportivo'],
                datasets: [{
                    data: [10, 20, 30], // Reemplazar con datos dinámicos
                    backgroundColor: ['#4caf50', '#ffeb3b', '#f44336'],
                }]
            },
            options: {
                ...barOptions,
                plugins: {
                    ...barOptions.plugins,
                    title: {
                        display: false
                    }
                }
            }
        });
    } else {
        console.error('El elemento estilosChart no existe en el DOM.');
    }

    // Gráfica de distribución de estilos
    const estilosDistribucionCtx = document.getElementById('estilosDistribucionChart');
    if (estilosDistribucionCtx) {
        const ctx = estilosDistribucionCtx.getContext('2d');
        const estilosDistribucionChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Athleisure', 'Deportivo', 'Retro', 'Lujo', 'Vintage', 'Streetwear', 'Casual', 'Elegante'],
                datasets: [{
                    data: [8.3, 16.7, 8.3, 8.3, 16.7, 8.3, 16.7, 16.7],
                    backgroundColor: [
                        '#36A2EB', // Athleisure
                        '#FF6384', // Deportivo
                        '#FFCE56', // Retro
                        '#4BC0C0', // Lujo
                        '#FF9F40', // Vintage
                        '#FF6384', // Streetwear
                        '#4CAF50', // Casual
                        '#FFC107'  // Elegante
                    ]
                }]
            },
            options: {
                ...pieOptions,
                plugins: {
                    ...pieOptions.plugins,
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.raw}%`;
                            }
                        }
                    },
                    title: {
                        display: false
                    }
                }
            }
        });
    } else {
        console.error('El elemento estilosDistribucionChart no existe en el DOM.');
    }

    // Gráfica de distribución de colores
    const coloresDistribucionCtx = document.getElementById('coloresDistribucionChart');
    if (coloresDistribucionCtx) {
        const ctx = coloresDistribucionCtx.getContext('2d');
        const coloresDistribucionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Azul', 'Negro', 'Marrón', 'Rosa', 'Verde'],
                datasets: [{
                    data: [4, 1, 1, 1, 1], // Reemplazar con datos dinámicos
                    backgroundColor: ['#2196f3', '#000000', '#795548', '#e91e63', '#4caf50'],
                }]
            },
            options: {
                ...barOptions,
                plugins: {
                    ...barOptions.plugins,
                    title: {
                        display: false
                    }
                }
            }
        });
    } else {
        console.error('El elemento coloresDistribucionChart no existe en el DOM.');
    }

    // Gráfica de recomendaciones
const recomendacionesChartElement = document.getElementById('recomendacionesChart');
if (recomendacionesDataElement && recomendacionesChartElement) {
    const recomendacionesData = JSON.parse(recomendacionesDataElement.textContent);
    
    // Verificar si es un objeto o un array
    if (!Array.isArray(recomendacionesData)) {
        console.warn('recomendacionesData no es un array:', recomendacionesData);
        
        // Si es un objeto, puedes decidir:
        // 1. No mostrar la gráfica:
        // console.warn('No se puede mostrar la gráfica de recomendaciones porque los datos no son un array.');
        
        // 2. O convertir el objeto a un formato compatible para mostrar:
        const labels = Object.keys(recomendacionesData);
        const values = Object.values(recomendacionesData);
        
        const recomendacionesCtx = recomendacionesChartElement.getContext('2d');
        const recomendacionesChart = new Chart(recomendacionesCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Datos',
                    data: values,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                ...barOptions,
                plugins: {
                    ...barOptions.plugins,
                    title: {
                        display: false
                    }
                }
            }
        });
    } else {
        // Si es un array, usa el código original
        if (recomendacionesData.length === 0) {
            console.warn('No hay datos de recomendaciones para mostrar.');
        } else {
            const recomendacionesCtx = recomendacionesChartElement.getContext('2d');
            const recomendacionesChart = new Chart(recomendacionesCtx, {
                type: 'bar',
                data: {
                    labels: recomendacionesData.map(rec => rec.publicacion.titulo),
                    datasets: [{
                        label: 'Puntuación',
                        data: recomendacionesData.map(rec => rec.puntuacion),
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    ...barOptions,
                    plugins: {
                        ...barOptions.plugins,
                        title: {
                            display: false
                        }
                    }
                }
            });
        }
    }
} else {
    console.warn('No se encontró el elemento recomendacionesChart o los datos de recomendaciones.');
}
    // Configuración inicial de las gráficas
    const ctxDistribucionSentimientos = document.getElementById('graficaDistribucionSentimientos').getContext('2d');
    const ctxSentimientosInteractuados = document.getElementById('graficaSentimientosInteractuados').getContext('2d');
    const ctxEvolucionSentimientos = document.getElementById('graficaEvolucionSentimientos').getContext('2d');

    // Gráfica de Distribución de Sentimientos
    const graficaDistribucionSentimientos = new Chart(ctxDistribucionSentimientos, {
        type: 'pie',
        data: {
            labels: ['Positivos', 'Neutros', 'Negativos'],
            datasets: [{
                data: [5, 3, 2], // Datos estáticos de prueba
                backgroundColor: ['#4caf50', '#ffeb3b', '#f44336'],
            }]
        },
        options: {
            ...pieOptions,
            plugins: {
                ...pieOptions.plugins,
                title: {
                    display: false
                }
            }
        }
    });

    // Gráfica de Sentimientos en Publicaciones Interactuadas
    const graficaSentimientosInteractuados = new Chart(ctxSentimientosInteractuados, {
        type: 'bar',
        data: {
            labels: ['Positivos', 'Neutros', 'Negativos'],
            datasets: [{
                label: 'Interacciones',
                data: [0, 0, 0], // Valores iniciales
                backgroundColor: ['#4caf50', '#ffeb3b', '#f44336'],
            }]
        },
        options: {
            ...barOptions,
            plugins: {
                ...barOptions.plugins,
                title: {
                    display: false
                }
            }
        }
    });

    // Gráfica de Evolución Temporal de Sentimientos
    const graficaEvolucionSentimientos = new Chart(ctxEvolucionSentimientos, {
        type: 'line',
        data: {
            labels: [], // Fechas
            datasets: [
                {
                    label: 'Positivos',
                    data: [], // Datos positivos
                    borderColor: '#4caf50',
                    fill: false,
                },
                {
                    label: 'Neutros',
                    data: [], // Datos neutros
                    borderColor: '#ffeb3b',
                    fill: false,
                },
                {
                    label: 'Negativos',
                    data: [], // Datos negativos
                    borderColor: '#f44336',
                    fill: false,
                }
            ]
        },
        options: {
            ...commonOptions,
            plugins: {
                ...commonOptions.plugins,
                title: {
                    display: false
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    }
                },
                y: {
                    beginAtZero: true,
                }
            }
        }
    });

    // Obtener datos del backend
    fetch('/dashboard/sentimientos/')
        .then(response => response.json())
        .then(data => {
            console.log('Datos recibidos del backend:', data);
            // Actualizar Gráfica de Distribución de Sentimientos
            graficaDistribucionSentimientos.data.datasets[0].data = [
                data.comentarios.positivos,
                data.comentarios.neutros,
                data.comentarios.negativos
            ];
            graficaDistribucionSentimientos.update();

            console.log('Datos para Distribución de Sentimientos:', [
                data.comentarios.positivos,
                data.comentarios.neutros,
                data.comentarios.negativos
            ]);

            // Actualizar Gráfica de Sentimientos en Publicaciones Interactuadas
            const interactuados = data.interactuados.reduce((acc, item) => {
                acc[item.clasificacion_chatgpt] = item.total;
                return acc;
            }, { positivo: 0, neutro: 0, negativo: 0 });
            graficaSentimientosInteractuados.data.datasets[0].data = [
                interactuados.positivo,
                interactuados.neutro,
                interactuados.negativo
            ];
            graficaSentimientosInteractuados.update();

            console.log('Datos para Sentimientos Interactuados:', interactuados);

            // Actualizar Gráfica de Evolución Temporal de Sentimientos
            const fechas = [...new Set(data.evolucion.map(item => item.fecha))];
            const positivos = fechas.map(fecha => {
                const item = data.evolucion.find(e => e.fecha === fecha && e.clasificacion_chatgpt === 'positivo');
                return item ? item.total : 0;
            });
            const neutros = fechas.map(fecha => {
                const item = data.evolucion.find(e => e.fecha === fecha && e.clasificacion_chatgpt === 'neutro');
                return item ? item.total : 0;
            });
            const negativos = fechas.map(fecha => {
                const item = data.evolucion.find(e => e.fecha === fecha && e.clasificacion_chatgpt === 'negativo');
                return item ? item.total : 0;
            });

            graficaEvolucionSentimientos.data.labels = fechas; // Fechas deben ser un array de strings
            graficaEvolucionSentimientos.data.datasets[0].data = positivos; // Datos deben ser un array de números
            graficaEvolucionSentimientos.update();

            console.log('Datos para Evolución Temporal:', { fechas, positivos, neutros, negativos });
        })
        .catch(error => console.error('Error al cargar datos de sentimientos:', error));

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
                document.querySelector('#totalLikes').textContent = data.total_likes;
                document.querySelector('#totalFavoritos').textContent = data.total_favoritos;
                document.querySelector('#totalCompras').textContent = data.total_compras;
                document.querySelector('#totalAlquileres').textContent = data.total_alquileres;
                document.querySelector('#totalRecomendaciones').textContent = data.total_recomendaciones;
            })
            .catch(error => console.error('Error al actualizar estadísticas:', error));
    };

    // Llamar a la función cada 30 segundos
    setInterval(actualizarEstadisticas, 30000);

    // Llamar a la función inmediatamente al cargar la página
    actualizarEstadisticas();
});