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
    document.getElementById('resumenEstiloColor').addEventListener('click', () => {
        if (estiloColorChart) {
            let resumen = '<ul style="text-align: left;">';
            estiloColorChart.data.datasets.forEach((dataset) => {
                const total = dataset.data.reduce((sum, point) => sum + point.y, 0);
                resumen += `<li><strong>${dataset.label}:</strong> ${total} recomendaciones</li>`;
            });
            resumen += '</ul>';

            Swal.fire({
                title: '<h3 style="margin: 0;">Resumen de Recomendaciones por Estilo y Color</h3>',
                html: resumen,
                icon: null, // Eliminar el ícono
                confirmButtonText: 'Aceptar',
                customClass: {
                    popup: 'swal-wide',
                },
            });
        } else {
            Swal.fire({
                title: 'Error',
                text: 'No se encontraron datos para generar el resumen.',
                icon: 'error',
                confirmButtonText: 'Aceptar',
            });
        }
    });

    // Resumen para la gráfica de Likes y Favoritos
    document.getElementById('resumenLikesFavoritos').addEventListener('click', () => {
        if (likesFavoritosChart) {
            let resumen = '<ul style="text-align: left;">';
            likesFavoritosChart.data.datasets.forEach((dataset) => {
                const total = dataset.data.reduce((sum, value) => sum + value, 0);
                resumen += `<li><strong>${dataset.label}:</strong> ${total}</li>`;
            });
            resumen += '</ul>';

            Swal.fire({
                title: '<h3 style="margin: 0;">Resumen de Likes y Favoritos por Estilo y Color</h3>',
                html: resumen,
                icon: null, // Eliminar el ícono
                confirmButtonText: 'Aceptar',
                customClass: {
                    popup: 'swal-wide',
                },
            });
        } else {
            Swal.fire({
                title: 'Error',
                text: 'No se encontraron datos para generar el resumen.',
                icon: 'error',
                confirmButtonText: 'Aceptar',
            });
        }
    });

    // Función para generar el resumen de Sentimientos
    document.getElementById('resumenSentimientos').addEventListener('click', () => {
        const resumen = generarResumenSentimientos(sentimientosChart.data);

        Swal.fire({
            title: '<h3 style="margin: 0;">Resumen de Sentimientos</h3>',
            html: `<ul style="text-align: left;">${resumen.replace(/\n/g, '<br>')}</ul>`,
            icon: null, // Eliminar el ícono
            confirmButtonText: 'Aceptar',
            customClass: {
                popup: 'swal-wide',
            },
        });
    });

    // Función para generar el resumen de Compras, Ventas y Alquileres
    document.getElementById('resumenComprasVentasAlquileres').addEventListener('click', () => {
        const resumen = generarResumenComprasVentasAlquileres();

        Swal.fire({
            title: '<h3 style="margin: 0;">Resumen de Compras, Ventas y Alquileres</h3>',
            html: `<ul style="text-align: left;">${resumen.replace(/\n/g, '<br>')}</ul>`,
            icon: null, // Eliminar el ícono
            confirmButtonText: 'Aceptar',
            customClass: {
                popup: 'swal-wide',
            },
        });
    });

    // Función para generar el resumen de Ingresos y Gastos
    document.getElementById('resumenIngresosGastos').addEventListener('click', () => {
        if (ingresosGastosChart) {
            const chartData = ingresosGastosChart.data.datasets; // Obtener los datasets de la gráfica
            const labels = ingresosGastosChart.data.labels; // Obtener las etiquetas de la gráfica

            let resumen = '<ul style="text-align: left;">';
            chartData.forEach((dataset) => {
                dataset.data.forEach((value, i) => {
                    if (value > 0) {
                        resumen += `<li><strong>${labels[i]} (${dataset.label}):</strong> $${value}</li>`;
                    }
                });
            });
            resumen += '</ul>';

            Swal.fire({
                title: '<h3 style="margin: 0;">Resumen de Ingresos y Gastos</h3>',
                html: resumen,
                icon: null, // Eliminar el ícono
                confirmButtonText: 'Aceptar',
                customClass: {
                    popup: 'swal-wide',
                },
            });
        } else {
            Swal.fire({
                title: 'Error',
                text: 'No se encontraron datos para generar el resumen.',
                icon: 'error',
                confirmButtonText: 'Aceptar',
            });
        }
    });

    // Función para generar el resumen de Actividad en el Tiempo
    document.getElementById('resumenActividadTiempo').addEventListener('click', () => {
        if (actividadTiempoChart) {
            const chartData = actividadTiempoChart.data.datasets; // Obtener los datasets de la gráfica
            const labels = actividadTiempoChart.data.labels; // Obtener las etiquetas de la gráfica (meses)

            let resumen = '<ul style="text-align: left;">';
            chartData.forEach((dataset) => {
                dataset.data.forEach((value, i) => {
                    if (value > 0) {
                        resumen += `<li><strong>${dataset.label} en ${labels[i]}:</strong> ${value} transacciones</li>`;
                    }
                });
            });
            resumen += '</ul>';

            Swal.fire({
                title: '<h3 style="margin: 0;">Resumen de Actividad en el Tiempo</h3>',
                html: resumen,
                icon: null, // Eliminar el ícono
                confirmButtonText: 'Aceptar',
                customClass: {
                    popup: 'swal-wide',
                },
            });
        } else {
            Swal.fire({
                title: 'Error',
                text: 'No se encontraron datos para generar el resumen.',
                icon: 'error',
                confirmButtonText: 'Aceptar',
            });
        }
    });

    // Función para generar el resumen de Transacciones por Estado
    document.getElementById('resumenTransaccionesPorEstado').addEventListener('click', () => {
        if (transaccionesPorEstadoChart) {
            const chartData = transaccionesPorEstadoChart.data.datasets; // Obtener los datasets de la gráfica
            const labels = transaccionesPorEstadoChart.data.labels; // Obtener las etiquetas de la gráfica (estados)

            let resumen = '<ul style="text-align: left;">';
            chartData.forEach((dataset) => {
                dataset.data.forEach((value, i) => {
                    if (value > 0) {
                        resumen += `<li><strong>${dataset.label} (${labels[i]}):</strong> ${value}</li>`;
                    }
                });
            });
            resumen += '</ul>';

            Swal.fire({
                title: '<h3 style="margin: 0;">Resumen de Transacciones por Estado</h3>',
                html: resumen,
                icon: null, // Eliminar el ícono
                confirmButtonText: 'Aceptar',
                customClass: {
                    popup: 'swal-wide',
                },
            });
        } else {
            Swal.fire({
                title: 'Error',
                text: 'No se encontraron datos para generar el resumen.',
                icon: 'error',
                confirmButtonText: 'Aceptar',
            });
        }
    });

    // Función para generar el resumen de Estilos y Colores
    document.getElementById('resumenEstilosColores').addEventListener('click', () => {
        if (estilosColoresChart) {
            let resumen = '<ul style="text-align: left;">';
            estilosColoresChart.data.datasets.forEach((dataset) => {
                const total = dataset.data.reduce((sum, point) => sum + point.x, 0);
                resumen += `<li><strong>${dataset.label}:</strong> ${total}</li>`;
            });
            resumen += '</ul>';

            Swal.fire({
                title: '<h3 style="margin: 0;">Resumen de Estilos y Colores Más Solicitados</h3>',
                html: resumen,
                icon: null, // Eliminar el ícono
                confirmButtonText: 'Aceptar',
                customClass: {
                    popup: 'swal-wide',
                },
            });
        } else {
            Swal.fire({
                title: 'Error',
                text: 'No se encontraron datos para generar el resumen.',
                icon: 'error',
                confirmButtonText: 'Aceptar',
            });
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