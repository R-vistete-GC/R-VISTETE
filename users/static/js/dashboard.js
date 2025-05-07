// Variable global para almacenar la instancia de la gráfica
let ingresosGastosChart;
let transaccionesPorEstadoChart;

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
                    pointRadius: 8, // Tamaño normal de los puntos
                    pointHoverRadius: 12 // Tamaño al pasar el mouse
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
                            },
                            tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.8)', // Fondo del tooltip
                                titleFont: {
                                    size: 16, // Tamaño de fuente del título
                                    weight: 'bold'
                                },
                                bodyFont: {
                                    size: 14 // Tamaño de fuente del cuerpo
                                },
                                padding: 15, // Espaciado interno del tooltip
                                boxPadding: 10, // Espaciado entre el contenido y el borde
                                callbacks: {
                                    // Personalizar el contenido del tooltip
                                    afterBody: function (tooltipItems) {
                                        const estilo = tooltipItems[0].label; // Estilo actual
                                        let resumen = 'Resumen de Recomendaciones:\n';
                                        colores.forEach(color => {
                                            const total = data[estilo][color];
                                            if (total > 0) {
                                                resumen += `${color}: ${total} recomendaciones\n`;
                                            }
                                        });
                                        return resumen;
                                    }
                                }
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
                                },
                                tooltip: {
                                    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Fondo del tooltip
                                    titleFont: {
                                        size: 16, // Tamaño de fuente del título
                                        weight: 'bold'
                                    },
                                    bodyFont: {
                                        size: 14 // Tamaño de fuente del cuerpo
                                    },
                                    padding: 15, // Espaciado interno del tooltip
                                    boxPadding: 10, // Espaciado entre el contenido y el borde
                                    callbacks: {
                                        afterBody: function (tooltipItems) {
                                            const estilo = tooltipItems[0].label; // Estilo actual
                                            let resumen = 'Resumen de Recomendaciones:\n';
                                            colores.forEach(color => {
                                                const total = data[estilo][color];
                                                if (total > 0) {
                                                    resumen += `${color}: ${total} recomendaciones\n`;
                                                }
                                            });
                                            return resumen;
                                        }
                                    }
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
            })
            .catch(error => console.error('Error al cargar datos de estilo y color:', error));
    }

    // Gráfica de Estilos y Colores
    const estilosColoresCtx = document.getElementById('graficaEstilosColores');
    let estilosColoresChart; // Variable para almacenar la instancia de la gráfica

    if (estilosColoresCtx) {
        fetch('/users/dashboard/estilos-colores/')
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error('Error al cargar datos de estilos y colores:', data.error);
                    return;
                }

                // Procesar los datos para la gráfica
                const puntos = data.data.map(item => ({
                    x: item.cantidad, // Cantidad en el eje X
                    y: item.estilo, // Estilo en el eje Y
                    color: item.color, // Color para el tooltip
                    tipo: item.tipo, // Tipo de transacción para el título del tooltip
                }));

                // Crear la gráfica de puntos
                estilosColoresChart = new Chart(estilosColoresCtx, {
                    type: 'scatter', // Gráfica de puntos
                    data: {
                        datasets: [
                            {
                                label: 'Ventas',
                                data: puntos.filter(p => p.tipo === 'venta'),
                                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                                borderColor: '#FF6384',
                                borderWidth: 1,
                            },
                            {
                                label: 'Compras',
                                data: puntos.filter(p => p.tipo === 'compra'),
                                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                                borderColor: '#36A2EB',
                                borderWidth: 1,
                            },
                            {
                                label: 'Alquileres',
                                data: puntos.filter(p => p.tipo === 'alquiler'),
                                backgroundColor: 'rgba(255, 206, 86, 0.6)',
                                borderColor: '#FFCE56',
                                borderWidth: 1,
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            title: {
                                display: true,
                                text: 'Estilos y Colores Más Solicitados',
                            },
                            tooltip: {
                                callbacks: {
                                    title: function (tooltipItems) {
                                        // Mostrar el tipo de transacción como título
                                        const punto = tooltipItems[0].raw;
                                        return `${punto.tipo.charAt(0).toUpperCase() + punto.tipo.slice(1)}`; // Capitalizar
                                    },
                                    label: function (context) {
                                        // Mostrar el color y la cantidad en el tooltip
                                        const punto = context.raw;
                                        return `Color: "${punto.color}", Cantidad: ${punto.x}`;
                                    },
                                },
                            },
                        },
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: 'Cantidad',
                                },
                                beginAtZero: true,
                            },
                            y: {
                                type: 'category',
                                title: {
                                    display: true,
                                    text: 'Estilos',
                                },
                            },
                        },
                    },
                });
            })
            .catch(error => console.error('Error al cargar datos de estilos y colores:', error));
    }

    // Gráfica de Likes y Favoritos por Estilo y Color
    const likesFavoritosCtx = document.getElementById('graficaLikesFavoritos');
    let likesFavoritosChart; // Variable para almacenar la instancia de la gráfica

    if (likesFavoritosCtx) {
        fetch('/users/dashboard/likes-favoritos-estilo-color/')
            .then(response => response.json())
            .then(data => {
                console.log('Datos recibidos para la gráfica de likes y favoritos:', data);

                const estilos = Object.keys(data); // Estilos como 'casual', 'formal', etc.
                const colores = Object.keys(data[estilos[0]]); // Colores como 'azul', 'negro', etc.

                // Preparar datasets para likes y favoritos
                const datasets = colores.map(color => ({
                    label: `Likes (${color})`,
                    data: estilos.map(estilo => data[estilo][color].likes),
                    backgroundColor: getColorForLabel(color),
                    stack: 'likes'
                })).concat(colores.map(color => ({
                    label: `Favoritos (${color})`,
                    data: estilos.map(estilo => data[estilo][color].favoritos),
                    backgroundColor: getColorForLabel(color, true), // Colores más claros para favoritos
                    stack: 'favoritos'
                })));

                // Crear la gráfica
                likesFavoritosChart = new Chart(likesFavoritosCtx, {
                    type: 'bar',
                    data: {
                        labels: estilos, // Etiquetas en el eje X (estilos)
                        datasets: datasets // Conjuntos de datos (likes y favoritos)
                    },
                    options: {
                        plugins: {
                            legend: {
                                position: 'top'
                            },
                            title: {
                                display: true,
                                text: 'Distribución de Likes y Favoritos por Estilo y Color'
                            }
                        },
                        responsive: true,
                        scales: {
                            x: {
                                stacked: true // Apilar las barras en el eje X
                            },
                            y: {
                                stacked: true, // Apilar las barras en el eje Y
                                beginAtZero: true // Comenzar desde 0
                            }
                        }
                    }
                });
            })
            .catch(error => console.error('Error al cargar datos de likes y favoritos:', error));
    }

    // Gráfica de Sentimientos en Comentarios
    const sentimientosCtx = document.getElementById('graficaSentimientos');
    let sentimientosChart; // Variable para almacenar la instancia de la gráfica

    if (sentimientosCtx) {
        fetch('/users/dashboard/comentarios-sentimientos-usuario/')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const sentimientos = data.data;

                    // Crear la gráfica de barras
                    sentimientosChart = new Chart(sentimientosCtx, {
                        type: 'bar', // Cambiar a 'line' si prefieres una gráfica de líneas
                        data: {
                            labels: ['Positivos', 'Neutros', 'Negativos'],
                            datasets: [{
                                label: 'Cantidad de Comentarios',
                                data: [sentimientos.positivo, sentimientos.neutro, sentimientos.negativo],
                                backgroundColor: ['#28a745', '#ffc107', '#dc3545'], // Colores para las barras
                                borderColor: ['#28a745', '#ffc107', '#dc3545'], // Bordes de las barras
                                borderWidth: 1
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false, // Permitir ajustar el tamaño
                            plugins: {
                                legend: {
                                    display: false // Ocultar la leyenda
                                },
                                title: {
                                    display: true,
                                    text: 'Distribución de Sentimientos en Comentarios'
                                }
                            },
                            scales: {
                                x: {
                                    title: {
                                        display: true,
                                        text: 'Sentimientos'
                                    }
                                },
                                y: {
                                    beginAtZero: true,
                                    title: {
                                        display: true,
                                        text: 'Cantidad'
                                    }
                                }
                            }
                        }
                    });
                } else {
                    console.error('Error al cargar datos de sentimientos:', data.error);
                }
            })
            .catch(error => console.error('Error al cargar datos de sentimientos:', error));
    }

    // Gráfica de Compras, Ventas y Alquileres
    const comprasVentasAlquileresCtx = document.getElementById('graficaComprasVentasAlquileres');
    if (comprasVentasAlquileresCtx) {
        // Obtener los valores de las cards desde los atributos data-*
        const totalCompras = comprasVentasAlquileresCtx.getAttribute('data-compras');
        const totalVentas = comprasVentasAlquileresCtx.getAttribute('data-ventas');
        const totalAlquileres = comprasVentasAlquileresCtx.getAttribute('data-alquileres');

        // Crear la gráfica de barras
        new Chart(comprasVentasAlquileresCtx, {
            type: 'bar',
            data: {
                labels: ['Compras', 'Ventas', 'Alquileres'], // Etiquetas en el eje X
                datasets: [{
                    label: 'Cantidad',
                    data: [totalCompras, totalVentas, totalAlquileres], // Usar los valores de las cards
                    backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56'], // Colores de las barras
                    borderColor: ['#36A2EB', '#FF6384', '#FFCE56'], // Bordes de las barras
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false // Ocultar la leyenda
                    },
                    title: {
                        display: true,
                        text: 'Comparación de Compras, Ventas y Alquileres'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Tipo de Transacción'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Cantidad'
                        }
                    }
                }
            }
        });
    }

    // Gráfica de Actividad en el Tiempo
    const actividadTiempoCtx = document.getElementById('graficaActividadTiempo');
    let actividadTiempoChart; // Variable para almacenar la instancia de la gráfica

    if (actividadTiempoCtx) {
        fetch('/users/dashboard/actividad-tiempo/')
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error('Error al cargar datos de actividad en el tiempo:', data.error);
                    return;

                }

                const mesesCompras = data.compras.map(item => item.mes);
                const totalesCompras = data.compras.map(item => item.total);

                const mesesVentas = data.ventas.map(item => item.mes);
                const totalesVentas = data.ventas.map(item => item.total);

                const mesesAlquileres = data.alquileres.map(item => item.mes);
                const totalesAlquileres = data.alquileres.map(item => item.total);

                const mesesUnicos = [...new Set([...mesesCompras, ...mesesVentas, ...mesesAlquileres])];

                actividadTiempoChart = new Chart(actividadTiempoCtx, {
                    type: 'line',
                    data: {
                        labels: mesesUnicos,
                        datasets: [
                            {
                                label: 'Compras',
                                data: mesesUnicos.map(mes => totalesCompras[mesesCompras.indexOf(mes)] || 0),
                                borderColor: '#36A2EB',
                                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                                tension: 0.4,
                                pointStyle: 'circle',
                                pointRadius: 5,
                                pointBackgroundColor: '#36A2EB',
                                fill: false,
                            },
                            {
                                label: 'Ventas',
                                data: mesesUnicos.map(mes => totalesVentas[mesesVentas.indexOf(mes)] || 0),
                                borderColor: '#FF6384',
                                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                                tension: 0.4,
                                pointStyle: 'triangle',
                                pointRadius: 5,
                                pointBackgroundColor: '#FF6384',
                                fill: false,
                            },
                            {
                                label: 'Alquileres',
                                data: mesesUnicos.map(mes => totalesAlquileres[mesesAlquileres.indexOf(mes)] || 0),
                                borderColor: '#FFCE56',
                                backgroundColor: 'rgba(255, 206, 86, 0.2)',
                                tension: 0.4,
                                pointStyle: 'rect',
                                pointRadius: 5,
                                pointBackgroundColor: '#FFCE56',
                                fill: false,
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            title: {
                                display: true,
                                text: 'Actividad en el Tiempo',
                            },
                        },
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: 'Meses',
                                },
                            },
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Cantidad de Transacciones',
                                },
                            },
                        },
                    },
                });
            })
            .catch(error => console.error('Error al cargar datos de actividad en el tiempo:', error));
    }

    // Gráfica de Transacciones por Estado
    const transaccionesPorEstadoCtx = document.getElementById('graficaTransaccionesPorEstado');

    if (transaccionesPorEstadoCtx) {
        fetch('/users/dashboard/transacciones-por-estado/')
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error('Error al cargar datos de transacciones por estado:', data.error);
                    return;
                }

                // Procesar los datos para la gráfica
                const estadosCompras = ['pendiente', 'entregado']; // Estados posibles para compras
                const estadosVentas = ['pendiente', 'completada', 'cancelada']; // Estados posibles para ventas
                const estadosAlquileres = ['activo', 'reservado', 'completado']; // Estados posibles para alquileres

                const compras = estadosCompras.map(estado => {
                    const compra = data.compras.find(item => item.estado === estado);
                    return compra ? compra.total : 0;
                });
                const ventas = estadosVentas.map(estado => {
                    const venta = data.ventas.find(item => item.estado === estado);
                    return venta ? venta.total : 0;
                });
                const alquileres = estadosAlquileres.map(estado => {
                    const alquiler = data.alquileres.find(item => item.estado === estado);
                    return alquiler ? alquiler.total : 0;
                });

                // Crear la gráfica y almacenar la instancia
                transaccionesPorEstadoChart = new Chart(transaccionesPorEstadoCtx, {
                    type: 'bar',
                    data: {
                        labels: [...estadosCompras, ...estadosVentas, ...estadosAlquileres], // Etiquetas en el eje X
                        datasets: [
                            {
                                label: 'Compras',
                                data: [...compras, ...Array(estadosVentas.length).fill(0), ...Array(estadosAlquileres.length).fill(0)],
                                backgroundColor: '#36A2EB',
                            },
                            {
                                label: 'Ventas',
                                data: [...Array(estadosCompras.length).fill(0), ...ventas, ...Array(estadosAlquileres.length).fill(0)],
                                backgroundColor: '#FF6384',
                            },
                            {
                                label: 'Alquileres',
                                data: [...Array(estadosCompras.length).fill(0), ...Array(estadosVentas.length).fill(0), ...alquileres],
                                backgroundColor: '#FFCE56',
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            title: {
                                display: true,
                                text: 'Transacciones por Estado',
                            },
                        },
                        scales: {
                            x: {
                                stacked: true, // Apilar las barras en el eje X
                                title: {
                                    display: true,
                                    text: 'Estados',
                                },
                            },
                            y: {
                                stacked: true, // Apilar las barras en el eje Y
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Cantidad',
                                },
                            },
                        },
                    },
                });
            })
            .catch(error => console.error('Error al cargar datos de transacciones por estado:', error));
    }

    // Gráfica de Ingresos y Gastos
    const ingresosGastosCtx = document.getElementById('graficaIngresosGastos');

    if (ingresosGastosCtx) {
        fetch('/users/dashboard/ingresos-gastos/')
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error('Error al cargar datos de ingresos y gastos:', data.error);
                    return;
                }

                const ingresosVentas = data.ingresos_ventas;
                const ingresosAlquileres = data.ingresos_alquileres;
                const gastosCompras = data.gastos_compras;

                // Crear la gráfica y almacenar la instancia
                ingresosGastosChart = new Chart(ingresosGastosCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Ingresos por Ventas', 'Ingresos por Alquileres', 'Gastos en Compras'],
                        datasets: [
                            {
                                label: 'Ingresos',
                                data: [ingresosVentas, ingresosAlquileres, 0],
                                backgroundColor: '#4CAF50',
                            },
                            {
                                label: 'Gastos',
                                data: [0, 0, gastosCompras],
                                backgroundColor: '#FF5722',
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        indexAxis: 'y',
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            title: {
                                display: true,
                                text: 'Comparación de Ingresos y Gastos',
                            },
                        },
                        scales: {
                            x: {
                                stacked: true,
                                title: {
                                    display: true,
                                    text: 'Monto Total ($)',
                                },
                            },
                            y: {
                                stacked: true,
                                title: {
                                    display: true,
                                    text: 'Categorías',
                                },
                            },
                        },
                    },
                });
            })
            .catch(error => console.error('Error al cargar datos de ingresos y gastos:', error));
    }

    // Función para actualizar las recomendaciones en tiempo real
    const actualizarRecomendaciones = () => {
        fetch('/users/dashboard/recomendaciones-estilo-color/')
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

    // Resumen para la gráfica de Estilo y Color
    document.getElementById('resumenEstiloColor').addEventListener('click', (event) => {
        event.preventDefault();
        if (estiloColorChart) {
            // Generar el resumen
            let resumenText = '';
            estiloColorChart.data.datasets.forEach((dataset) => {
                const total = dataset.data.reduce((sum, point) => sum + point.y, 0);
                resumenText += `${dataset.label}: ${total} recomendaciones\n`;
            });

            mostrarResumenEInterpretacion('Recomendaciones por Estilo y Color', resumenText, 'EstiloColor');
        }
    });

    // Resumen para la gráfica de Likes y Favoritos
    document.getElementById('resumenLikesFavoritos').addEventListener('click', (event) => {
        event.preventDefault(); // Prevenir el comportamiento predeterminado del botón

        if (likesFavoritosChart) {
            let resumen = '<ul style="text-align: left;">';
            likesFavoritosChart.data.datasets.forEach((dataset) => {
                const total = dataset.data.reduce((sum, value) => sum + value, 0);
                resumen += `<li><strong>${dataset.label}:</strong> ${total}</li>`;
            });
            resumen += '</ul>';

            mostrarResumenEInterpretacion('Likes y Favoritos por Estilo y Color', resumen, 'LikesFavoritos');
        } else {
            Swal.fire({
                title: 'Error',
                text: 'No se encontraron datos para generar el resumen.',
                icon: 'error',
                showConfirmButton: false,
                showCloseButton: true,
            });
        }
    });

    // Función para generar el resumen de Sentimientos
    document.getElementById('resumenSentimientos').addEventListener('click', (event) => {
        event.preventDefault(); // Prevenir el comportamiento predeterminado del botón

        const resumen = generarResumenSentimientos(sentimientosChart.data);

        mostrarResumenEInterpretacion('Sentimientos', resumen, 'Sentimientos');

        if (sentimientosChart) {
            const datos = obtenerDatosSentimientos(sentimientosChart);
            mostrarInterpretacionAI('sentimientos', datos, 'graficaSentimientos');
        }
    });

    // Función para generar el resumen de Compras, Ventas y Alquileres
    document.getElementById('resumenComprasVentasAlquileres').addEventListener('click', (event) => {
        event.preventDefault(); // Prevenir el comportamiento predeterminado del botón

        const resumen = generarResumenComprasVentasAlquileres();

        mostrarResumenEInterpretacion('Compras, Ventas y Alquileres', resumen, 'ComprasVentasAlquileres');
    });

    // Función para generar el resumen de Ingresos y Gastos
    document.getElementById('resumenIngresosGastos').addEventListener('click', (event) => {
        event.preventDefault(); // Prevenir el comportamiento predeterminado del botón

        if (ingresosGastosChart) {
            const chartData = ingresosGastosChart.data.datasets;
            const labels = ingresosGastosChart.data.labels;

            let resumen = '<ul style="text-align: left;">';
            chartData.forEach((dataset) => {
                dataset.data.forEach((value, i) => {
                    if (value > 0) {
                        resumen += `<li><strong>${labels[i]} (${dataset.label}):</strong> $${value}</li>`;
                    }
                });
            });
            resumen += '</ul>';

            mostrarResumenEInterpretacion('Ingresos y Gastos', resumen, 'IngresosGastos');
        } else {
            Swal.fire({
                title: 'Error',
                text: 'No se encontraron datos para generar el resumen.',
                icon: 'error',
                showConfirmButton: false,
                showCloseButton: true,
            });
        }
    });

   
  
   

    // Likes y Favoritos
    document.getElementById('resumenLikesFavoritos').addEventListener('click', (event) => {
        event.preventDefault();
        if (likesFavoritosChart) {
            let resumenText = '';
            likesFavoritosChart.data.datasets.forEach((dataset) => {
                const total = dataset.data.reduce((sum, value) => sum + value, 0);
                resumenText += `${dataset.label}: ${total}\n`;
            });

            mostrarResumenEInterpretacion('Likes y Favoritos', resumenText, 'LikesFavoritos');
        }
    });

    // Sentimientos
    document.getElementById('resumenSentimientos').addEventListener('click', (event) => {
        event.preventDefault();
        if (sentimientosChart) {
            let resumenText = '';
            const datos = sentimientosChart.data.datasets[0].data;
            resumenText += `Comentarios Positivos: ${datos[0]}\n`;
            resumenText += `Comentarios Neutros: ${datos[1]}\n`;
            resumenText += `Comentarios Negativos: ${datos[2]}`;

            mostrarResumenEInterpretacion('Sentimientos', resumenText, 'Sentimientos');
        }
    });

    // Compras, Ventas y Alquileres
    document.getElementById('resumenComprasVentasAlquileres').addEventListener('click', (event) => {
        event.preventDefault();
        const compras = comprasVentasAlquileresCtx.getAttribute('data-compras');
        const ventas = comprasVentasAlquileresCtx.getAttribute('data-ventas');
        const alquileres = comprasVentasAlquileresCtx.getAttribute('data-alquileres');
        
        const resumenText = `Compras: ${compras}\nVentas: ${ventas}\nAlquileres: ${alquileres}`;

        mostrarResumenEInterpretacion('Compras, Ventas y Alquileres', resumenText, 'ComprasVentasAlquileres');
    });

    // Ingresos y Gastos
    document.getElementById('resumenIngresosGastos').addEventListener('click', (event) => {
        event.preventDefault();
        if (ingresosGastosChart) {
            let resumenText = '';
            ingresosGastosChart.data.datasets.forEach((dataset, index) => {
                const datos = dataset.data;
                if (index === 0) {
                    resumenText += `Ingresos por Ventas: $${datos[0]}\n`;
                    resumenText += `Ingresos por Alquileres: $${datos[1]}\n`;
                } else {
                    resumenText += `Gastos en Compras: $${datos[2]}`;
                }
            });

            mostrarResumenEInterpretacion('Ingresos y Gastos', resumenText, 'IngresosGastos');
        }
    });

// Event Listener para Actividad en el Tiempo
    document.getElementById('resumenActividadTiempo').addEventListener('click', (event) => {
        event.preventDefault();
        if (actividadTiempoChart) {
            const datasets = actividadTiempoChart.data.datasets;
            const labels = actividadTiempoChart.data.labels;
            
            let resumenText = 'Resumen de actividad por período:\n';
            datasets.forEach(dataset => {
                const total = dataset.data.reduce((a, b) => a + b, 0);
                resumenText += `${dataset.label}: ${total} transacciones\n`;
                
                // Añadir detalles por período
                dataset.data.forEach((valor, index) => {
                    if (valor > 0) {
                        resumenText += `- ${labels[index]}: ${valor}\n`;
                    }
                });
            });

            mostrarResumenEInterpretacion('Actividad en el Tiempo', resumenText, 'ActividadTiempo');
        }
    });

    // Event Listener para Transacciones por Estado
    document.getElementById('resumenTransaccionesPorEstado').addEventListener('click', (event) => {
        event.preventDefault();
        if (transaccionesPorEstadoChart) {
            const datasets = transaccionesPorEstadoChart.data.datasets;
            const labels = transaccionesPorEstadoChart.data.labels;
            
            let resumenText = 'Resumen de transacciones por estado:\n';
            datasets.forEach(dataset => {
                resumenText += `${dataset.label}:\n`;
                dataset.data.forEach((valor, index) => {
                    if (valor > 0) {
                        resumenText += `- ${labels[index]}: ${valor}\n`;
                    }
                });
            });

            mostrarResumenEInterpretacion('Transacciones por Estado', resumenText, 'TransaccionesEstado');
        }
    });

    // Event Listener para Estilos y Colores Más Solicitados
    document.getElementById('resumenEstilosColores').addEventListener('click', (event) => {
        event.preventDefault();
        if (estilosColoresChart) {
            const datasets = estilosColoresChart.data.datasets;
            
            let resumenText = 'Resumen de estilos y colores más solicitados:\n';
            datasets.forEach(dataset => {
                const total = dataset.data.reduce((sum, point) => sum + (point.x || 0), 0);
                resumenText += `${dataset.label}:\n`;
                dataset.data.forEach(point => {
                    if (point.x > 0) {
                        resumenText += `- ${point.y}: ${point.x} solicitudes\n`;
                    }
                });
                resumenText += `Total: ${total} solicitudes\n`;
            });

            mostrarResumenEInterpretacion('Estilos y Colores', resumenText, 'EstilosColores');
        }
    });

    const kmeansCtx = document.getElementById('graficaKMeans');
    let kmeansChart;

    if (kmeansCtx) {
        fetch('/users/dashboard/kmeans-analysis/')
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error('Error:', data.error);
                    return;
                }

                const colors = ['#FF6384', '#36A2EB', '#FFCE56'];
                const datasets = data.clusters.map((cluster, i) => ({
                    label: `Grupo ${i + 1}`,
                    data: data.features[i],
                    backgroundColor: colors[i],
                }));

                kmeansChart = new Chart(kmeansCtx, {
                    type: 'scatter',
                    data: {
                        datasets: datasets
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            title: {
                                display: true,
                                text: 'Análisis de Patrones de Comportamiento'
                            }
                        },
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: 'Actividad de Compra'
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Interacción Social'
                                }
                            }
                        }
                    }
                });
            })
            .catch(error => console.error('Error:', error));
    }

    // Añadir el event listener para el resumen
    document.getElementById('resumenKMeans').addEventListener('click', (event) => {
        event.preventDefault();
        if (kmeansChart) {
            const resumenText = generateKMeansAnalysis(kmeansChart.data);
            mostrarResumenEInterpretacion('Análisis de Patrones', resumenText, 'KMeans');
        }
    });

});

    // Función para asignar colores a las líneas
function getColorForLabel(label, isLight = false) {
    const colorMap = {
        'azul': isLight ? '#A8D5F2' : '#36A2EB',
        'negro': isLight ? '#666666' : '#000000',
        'rojo': isLight ? '#FFB3C1' : '#FF6384',
        'verde': isLight ? '#A8E6CF' : '#4BC0C0',
        'amarillo': isLight ? '#FFF5BA' : '#FFCE56',
        'blanco': isLight ? '#F0F0F0' : '#FFFFFF',
        'gris': isLight ? '#C0C0C0' : '#808080',
        'marrón': isLight ? '#D2B48C' : '#A52A2A'
    };
    return colorMap[label] || (isLight ? '#CCCCCC' : '#000000');
}

// Función para generar el resumen de la gráfica de Estilo y Color
function generarResumenEstiloColor(datasets) {
    let resumen = 'Resumen de Recomendaciones por Estilo y Color:\n';
    datasets.forEach(dataset => {
        const total = dataset.data.reduce((sum, point) => sum + point.y, 0);
        resumen += `- ${dataset.label}: ${total} recomendaciones\n`;
    });
    return resumen;
}

// Función para generar el resumen de la gráfica de Likes y Favoritos
function generarResumenLikesFavoritos(datasets) {
    let resumen = 'Resumen de Likes y Favoritos por Estilo y Color:\n';
    datasets.forEach(dataset => {
        const total = dataset.data.reduce((sum, value) => sum + value, 0);
        resumen += `- ${dataset.label}: ${total}\n`;
    });
    return resumen;
}

// Función para generar el resumen de Sentimientos
function generarResumenSentimientos(data) {
    return `Resumen de Sentimientos:\n- Positivos: ${data.datasets[0].data[0]}\n- Neutros: ${data.datasets[0].data[1]}\n- Negativos: ${data.datasets[0].data[2]}`;
}

// Función para generar el resumen de Compras, Ventas y Alquileres
function generarResumenComprasVentasAlquileres() {
    const compras = document.getElementById('graficaComprasVentasAlquileres').getAttribute('data-compras');
    const ventas = document.getElementById('graficaComprasVentasAlquileres').getAttribute('data-ventas');
    const alquileres = document.getElementById('graficaComprasVentasAlquileres').getAttribute('data-alquileres');
    return `Resumen de Compras, Ventas y Alquileres:\n- Compras: ${compras}\n- Ventas: ${ventas}\n- Alquileres: ${alquileres}`;
}

// Función para generar el resumen de Ingresos y Gastos
function generarResumenIngresosGastos() {
    return 'Resumen de Ingresos y Gastos:\n- Ingresos por Ventas: $X\n- Ingresos por Alquileres: $Y\n- Gastos en Compras: $Z';
}

// Función para generar el resumen de Actividad en el Tiempo
function generarResumenActividadTiempo() {
    return 'Resumen de Actividad en el Tiempo:\n- Compras: X\n- Ventas: Y\n- Alquileres: Z';
}

// Función para generar el resumen de Transacciones por Estado
function generarResumenTransaccionesPorEstado() {
    return 'Resumen de Transacciones por Estado:\n- Pendientes: X\n- Completadas: Y\n- Canceladas: Z';
}

// Función para generar el resumen de Estilos y Colores
function generarResumenEstilosColores(datasets) {
    let resumen = 'Resumen de Estilos y Colores Más Solicitados:\n';
    datasets.forEach(dataset => {
        const total = dataset.data.reduce((sum, point) => sum + point.x, 0);
        resumen += `- ${dataset.label}: ${total}\n`;
    });
    return resumen;
}



// Modificar los event listeners existentes para incluir la interpretación
document.getElementById('resumenEstiloColor').addEventListener('click', (event) => {
    event.preventDefault();
    if (estiloColorChart) {
        const datos = obtenerDatosEstiloColor(estiloColorChart);
        mostrarResumen('Resumen de Estilo y Color', datos);
        mostrarInterpretacionAI('estiloColor', datos, 'graficaEstiloColor');
    }
});

// Hacer lo mismo para los otros botones de resumen
document.getElementById('resumenSentimientos').addEventListener('click', (event) => {
    event.preventDefault();
    if (sentimientosChart) {
        const datos = obtenerDatosSentimientos(sentimientosChart);
        mostrarResumen('Resumen de Sentimientos', datos);
        mostrarInterpretacionAI('sentimientos', datos, 'graficaSentimientos');
    }
});

// Función auxiliar para obtener datos de la gráfica en formato adecuado
function obtenerDatosEstiloColor(chart) {
    return {
        labels: chart.data.labels,
        datasets: chart.data.datasets.map(ds => ({
            label: ds.label,
            data: ds.data
        }))
    };
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function mostrarInterpretacionAI(chartType, resumenData) {    
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    // Asegurarse de que los datos están en el formato correcto
    let formattedData = resumenData;
    
    // Verificar si es una de las tres últimas gráficas
    if (['ActividadTiempo', 'TransaccionesEstado', 'EstilosColores'].includes(chartType)) {
        formattedData = resumenData.split('\n')
            .filter(line => line.trim())
            .reduce((acc, line) => {
                const [key, value] = line.split(':').map(str => str.trim());
                if (key && value) {
                    acc[key] = value;
                }
                return acc;
            }, {});
    }

    fetch('/users/dashboard/interpret-chart/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify({
            chartType: chartType,
            data: formattedData
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }
        return response.json();
    })
    .then(result => {
        if (result.interpretation) {
            const sweetAlert = document.querySelector('.swal2-shown');
            if (sweetAlert) {
                // Verificar si ya existe una interpretación
                const existingInterpretation = sweetAlert.querySelector('.interpretacion-ai');
                if (!existingInterpretation) {
                    const interpretacionHtml = `
                        <div class="interpretacion-ai mt-3" style="border-top: 1px solid #eee; padding-top: 15px; margin-top: 15px;">
                            <h6 style="color: #28a745;"><i class="fas fa-robot"></i> Análisis AI:</h6>
                            <p style="text-align: left;">${result.interpretation}</p>
                        </div>
                    `;
                    const contenedorResumen = sweetAlert.querySelector('.swal2-html-container');
                    contenedorResumen.innerHTML += interpretacionHtml;
                }
            }
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo generar la interpretación',
            showConfirmButton: false,
            timer: 3000
        });
    });
}

function mostrarResumenEInterpretacion(titulo, resumenText, chartType) {
    // Mostrar el resumen
    Swal.fire({
        title: `Resumen de ${titulo}`,
        html: `<ul style="text-align: left;">${resumenText.split('\n').map(line => `<li>${line.trim()}</li>`).join('')}</ul>`,
        showConfirmButton: false,
        showCloseButton: true,
        didOpen: () => {
            // Llamar a mostrarInterpretacionAI inmediatamente después de que se abra el modal
            mostrarInterpretacionAI(chartType, resumenText);
        }
    });
}

function generateKMeansAnalysis(data) {
    let resumenText = 'Análisis de Patrones de Comportamiento:\n';
    data.datasets.forEach((dataset, index) => {
        resumenText += `Grupo ${index + 1}: ${dataset.data.length} elementos\n`;
    });
    return resumenText;
}
